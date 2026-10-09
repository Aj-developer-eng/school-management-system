<?php

namespace App\Http\Controllers;

use App\Enums\RoleEnum;
use App\Models\Attendance;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentParent;
use App\Models\Teacher;
use App\Models\TeacherSubjectAssignment;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isSuperAdmin = $user->hasRole(RoleEnum::SuperAdmin->value);
        $teacher = Teacher::where('user_id', $user->id)->first();

        $assignments = TeacherSubjectAssignment::with([
            'schoolClass:id,name',
            'teacher.user:id,name',
        ])
            ->when(! $isSuperAdmin, function ($q) use ($teacher): void {
                $q->where('teacher_id', $teacher?->id);
            })
            ->whereNull('deleted_at')
            ->orderBy('school_class_id')
            ->get();

        return Inertia::render('Attendance/Index', [
            'assignments' => $assignments,
            'isSuperAdmin' => $isSuperAdmin,
        ]);
    }

    public function show(Request $request, TeacherSubjectAssignment $assignment)
    {
        $user = $request->user();
        $isSuperAdmin = $user->hasRole(RoleEnum::SuperAdmin->value);
        $teacher = Teacher::where('user_id', $user->id)->first();

        if (! $isSuperAdmin && $assignment->teacher_id !== $teacher?->id) {
            abort(403);
        }

        $date = $request->input('date', today()->toDateString());
        // The model's date cast stores full datetimes (Y-m-d H:i:s), so the
        // lookup must bind the same format — a plain Y-m-d string never
        // matches existing rows on SQLite.
        $attendanceDate = Carbon::parse($date)->startOfDay();

        $assignment->load(['schoolClass:id,name']);

        // Use the assignment's own session; omit the session filter entirely
        // so attendance can be viewed/recorded regardless of the active session.
        $sessionId = $assignment->academic_session_id;

        $students = StudentEnrollment::with(['student.user:id,name'])
            ->when($sessionId, function ($q) use ($sessionId): void {
                $q->where('academic_session_id', $sessionId);
            })
            ->where('school_class_id', $assignment->school_class_id)
            ->whereNull('deleted_at')
            ->orderBy('roll_number')
            ->get()
            ->map(function ($enrollment) use ($assignment, $attendanceDate) {
                $attendance = Attendance::where('student_id', $enrollment->student_id)
                    ->where('teacher_subject_assignment_id', $assignment->id)
                    ->where('attendance_date', $attendanceDate)
                    ->first();

                return [
                    'enrollment_id' => $enrollment->id,
                    'student_id' => $enrollment->student_id,
                    'roll_number' => $enrollment->roll_number,
                    'name' => $enrollment->student?->user?->name,
                    'status' => $attendance?->status ?? 'present',
                    'remarks' => $attendance?->remarks,
                    'has_record' => (bool) $attendance,
                ];
            });

        return Inertia::render('Attendance/Show', [
            'assignment' => $assignment,
            'students' => $students,
            'date' => $date,
        ]);
    }

    public function store(Request $request, TeacherSubjectAssignment $assignment)
    {
        $user = $request->user();
        $isSuperAdmin = $user->hasRole(RoleEnum::SuperAdmin->value);
        $teacher = Teacher::where('user_id', $user->id)->first();

        if (! $isSuperAdmin && $assignment->teacher_id !== $teacher?->id) {
            abort(403);
        }

        // Use the assignment's own session; omit session restriction so
        // attendance is not limited to the active session.
        $sessionId = $assignment->academic_session_id;

        $validated = $request->validate([
            'attendance_date' => ['required', 'date'],
            'records' => ['required', 'array'],
            'records.*.student_id' => ['required', 'exists:students,id'],
            'records.*.status' => ['required', 'in:present,absent,late,excused'],
            'records.*.remarks' => ['nullable', 'string', 'max:500'],
        ]);

        $date = $validated['attendance_date'];
        // The model's date cast stores full datetimes (Y-m-d H:i:s), so the
        // updateOrCreate lookup must bind the same format — otherwise a
        // plain Y-m-d string never matches the existing row and a re-save
        // trips the uniq_attendance_per_day unique constraint.
        $attendanceDate = Carbon::parse($date)->startOfDay();

        foreach ($validated['records'] as $record) {
            Attendance::updateOrCreate(
                [
                    'student_id' => $record['student_id'],
                    'teacher_subject_assignment_id' => $assignment->id,
                    'attendance_date' => $attendanceDate,
                ],
                [
                    'academic_session_id' => $sessionId,
                    'school_class_id' => $assignment->school_class_id,
                    'recorded_by' => $user->id,
                    'status' => $record['status'],
                    'remarks' => $record['remarks'] ?? null,
                ]
            );
        }

        ActivityLogService::custom('Attendance', 'recorded', "Recorded attendance for {$assignment->schoolClass?->name} on {$date}");

        return redirect()->back()->with('success', 'Attendance saved successfully.');
    }

    public function report(Request $request): Response
    {
        $user = $request->user();

        // Attendance reporting is permission-gated for every role; parents and
        // students get a scoped (own/children) view, while teachers only see
        // attendance tied to their own assignments.
        if (! $user->can('attendances.view')) {
            abort(403);
        }

        $scopedStudentIds = $this->scopedStudentIds($user);
        $scopedAssignments = $this->scopedAssignments($user);

        // Teachers are scoped to the assignments they own (soft-deleted ones
        // included so historical attendance is not lost); the class filter is
        // limited to the classes they are currently assigned to.
        $scopedAssignmentIds = null;
        $scopedClassIds = null;

        if ($scopedAssignments !== null) {
            $scopedAssignmentIds = $scopedAssignments->pluck('id');
            $scopedClassIds = $scopedAssignments->reject->trashed()->pluck('school_class_id')->unique()->values();
        }

        $classes = SchoolClass::where('is_active', true)
            ->when($scopedClassIds, function ($q) use ($scopedClassIds): void {
                $q->whereIn('id', $scopedClassIds);
            })
            ->orderBy('level')
            ->pluck('name', 'id');

        $query = Attendance::query()
            ->with([
                'student.user:id,name',
                'schoolClass:id,name',
                'assignment.teacher.user:id,name',
            ])
            ->when($scopedStudentIds, function ($q) use ($scopedStudentIds): void {
                $q->whereIn('student_id', $scopedStudentIds);
            })
            ->when($scopedAssignmentIds, function ($q) use ($scopedAssignmentIds): void {
                $q->whereIn('teacher_subject_assignment_id', $scopedAssignmentIds);
            });

        if ($request->filled('class_id')) {
            $query->where('school_class_id', $request->input('class_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('attendance_date', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('attendance_date', '<=', $request->input('date_to'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $records = $query->orderBy('attendance_date', 'desc')
            ->orderBy('student_id')
            ->paginate(50)
            ->withQueryString();

        $summary = [
            'total' => $query->count(),
            'present' => (clone $query)->where('status', 'present')->count(),
            'absent' => (clone $query)->where('status', 'absent')->count(),
            'late' => (clone $query)->where('status', 'late')->count(),
            'excused' => (clone $query)->where('status', 'excused')->count(),
        ];

        return Inertia::render('Attendance/Report', [
            'records' => $records,
            'summary' => $summary,
            'classes' => $classes,
            'filters' => $request->only(['class_id', 'date_from', 'date_to', 'status']),
            'isScoped' => $scopedStudentIds !== null,
            'scopedToTeacher' => $scopedAssignments !== null,
        ]);
    }

    /**
     * Return the assignments the current user is allowed to view attendance for.
     * Teachers are scoped to their own assignments — soft-deleted ones included
     * so attendance they recorded earlier stays visible. Other staff roles are
     * not scoped (null). A teacher without a linked Teacher record is scoped to
     * nothing.
     *
     * @return Collection<int, TeacherSubjectAssignment>|null
     */
    private function scopedAssignments(User $user): ?Collection
    {
        if (! $user->hasRole(RoleEnum::Teacher->value)) {
            return null;
        }

        $teacher = Teacher::where('user_id', $user->id)->first();

        if (! $teacher) {
            return collect();
        }

        return $teacher->assignments()
            ->withTrashed()
            ->get(['id', 'school_class_id', 'deleted_at']);
    }

    /**
     * Return the student IDs the current user is allowed to view attendance for.
     * Parents are scoped to their children; students to themselves.
     * Returns null for staff roles (no scoping — they see everything).
     */
    private function scopedStudentIds(User $user): ?Collection
    {
        if ($user->hasRole(RoleEnum::Parent->value)) {
            $parent = StudentParent::where('user_id', $user->id)->first();

            return $parent?->students()->pluck('students.id') ?? collect();
        }

        if ($user->hasRole(RoleEnum::Student->value)) {
            $student = Student::where('user_id', $user->id)->first();

            return $student ? collect([$student->id]) : collect();
        }

        return null;
    }

    public function studentDetail(Request $request, Student $student): Response
    {
        $user = $request->user();

        // Permission-gated for every role; parents/students may only view
        // themselves or their children.
        if (! $user->can('attendances.view')) {
            abort(403);
        }

        $scopedStudentIds = $this->scopedStudentIds($user);
        if ($scopedStudentIds !== null && ! $scopedStudentIds->contains($student->id)) {
            abort(403);
        }

        $student->load('user:id,name');

        $records = Attendance::with([
            'schoolClass:id,name',
            'assignment.teacher.user:id,name',
            'recorder:id,name',
        ])
            ->where('student_id', $student->id)
            ->when($request->filled('date_from'), function ($q) use ($request): void {
                $q->where('attendance_date', '>=', $request->input('date_from'));
            })
            ->when($request->filled('date_to'), function ($q) use ($request): void {
                $q->where('attendance_date', '<=', $request->input('date_to'));
            })
            ->orderBy('attendance_date', 'desc')
            ->get()
            ->map(function ($r) {
                return [
                    'id' => $r->id,
                    'date' => $r->attendance_date->format('Y-m-d'),
                    'day' => $r->attendance_date->format('l'),
                    'status' => $r->status,
                    'remarks' => $r->remarks,
                    'class' => $r->schoolClass?->name,
                    'teacher' => $r->assignment?->teacher?->user?->name,
                    'recorded_by' => $r->recorder?->name,
                    'created_at' => $r->created_at?->format('Y-m-d H:i'),
                ];
            });

        $summary = [
            'total' => $records->count(),
            'present' => $records->where('status', 'present')->count(),
            'absent' => $records->where('status', 'absent')->count(),
            'late' => $records->where('status', 'late')->count(),
            'excused' => $records->where('status', 'excused')->count(),
        ];

        return Inertia::render('Attendance/StudentDetail', [
            'student' => [
                'id' => $student->id,
                'name' => $student->user?->name,
                'admission_number' => $student->admission_number,
            ],
            'records' => $records,
            'summary' => $summary,
            'filters' => $request->only(['date_from', 'date_to']),
        ]);
    }
}
