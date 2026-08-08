<?php

namespace App\Http\Controllers;

use App\Enums\RoleEnum;
use App\Models\AcademicSession;
use App\Models\Attendance;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\Teacher;
use App\Models\TeacherSubjectAssignment;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $teacher = Teacher::where('user_id', $user->id)->first();
        $activeSession = AcademicSession::active()->first();

        $assignments = TeacherSubjectAssignment::with([
            'schoolClass:id,name',
            'section:id,name',
            'subject:id,name',
        ])
            ->where('teacher_id', $teacher?->id)
            ->whereNull('deleted_at')
            ->when($activeSession, function ($q) use ($activeSession): void {
                $q->where('academic_session_id', $activeSession->id);
            })
            ->orderBy('school_class_id')
            ->get();

        return Inertia::render('Attendance/Index', [
            'assignments' => $assignments,
            'activeSession' => $activeSession?->name,
        ]);
    }

    public function show(Request $request, TeacherSubjectAssignment $assignment)
    {
        $user = $request->user();
        $teacher = Teacher::where('user_id', $user->id)->first();

        if ($assignment->teacher_id !== $teacher?->id) {
            abort(403);
        }

        $activeSession = AcademicSession::active()->first();
        $date = $request->input('date', today()->toDateString());

        $assignment->load(['schoolClass:id,name', 'section:id,name', 'subject:id,name']);

        $students = StudentEnrollment::with(['student.user:id,name'])
            ->where('academic_session_id', $activeSession?->id)
            ->where('school_class_id', $assignment->school_class_id)
            ->when($assignment->section_id, function ($q) use ($assignment): void {
                $q->where('section_id', $assignment->section_id);
            })
            ->whereNull('deleted_at')
            ->orderBy('roll_number')
            ->get()
            ->map(function ($enrollment) use ($assignment, $date) {
                $attendance = Attendance::where('student_id', $enrollment->student_id)
                    ->where('teacher_subject_assignment_id', $assignment->id)
                    ->where('attendance_date', $date)
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
            'activeSession' => $activeSession?->name,
        ]);
    }

    public function store(Request $request, TeacherSubjectAssignment $assignment)
    {
        $user = $request->user();
        $teacher = Teacher::where('user_id', $user->id)->first();

        if ($assignment->teacher_id !== $teacher?->id) {
            abort(403);
        }

        $activeSession = AcademicSession::active()->first();

        $validated = $request->validate([
            'attendance_date' => ['required', 'date'],
            'records' => ['required', 'array'],
            'records.*.student_id' => ['required', 'exists:students,id'],
            'records.*.status' => ['required', 'in:present,absent,late,excused'],
            'records.*.remarks' => ['nullable', 'string', 'max:500'],
        ]);

        $date = $validated['attendance_date'];

        foreach ($validated['records'] as $record) {
            Attendance::updateOrCreate(
                [
                    'student_id' => $record['student_id'],
                    'teacher_subject_assignment_id' => $assignment->id,
                    'attendance_date' => $date,
                ],
                [
                    'academic_session_id' => $activeSession?->id,
                    'school_class_id' => $assignment->school_class_id,
                    'section_id' => $assignment->section_id,
                    'subject_id' => $assignment->subject_id,
                    'recorded_by' => $user->id,
                    'status' => $record['status'],
                    'remarks' => $record['remarks'] ?? null,
                ]
            );
        }

        ActivityLogService::custom('Attendance', 'recorded', "Recorded attendance for {$assignment->schoolClass?->name} - {$assignment->subject?->name} on {$date}");

        return redirect()->back()->with('success', 'Attendance saved successfully.');
    }

    public function report(Request $request): Response
    {
        $activeSession = AcademicSession::active()->first();

        $classes = \App\Models\SchoolClass::where('is_active', true)
            ->orderBy('level')
            ->pluck('name', 'id');

        $query = Attendance::query()
            ->with([
                'student.user:id,name',
                'schoolClass:id,name',
                'section:id,name',
                'subject:id,name',
                'assignment.teacher.user:id,name',
            ])
            ->when($activeSession, function ($q) use ($activeSession): void {
                $q->where('academic_session_id', $activeSession->id);
            });

        if ($request->filled('class_id')) {
            $query->where('school_class_id', $request->input('class_id'));
        }

        if ($request->filled('date_from')) {
            $query->where('attendance_date', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->where('attendance_date', '<=', $request->input('date_to'));
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
            'activeSession' => $activeSession?->name,
        ]);
    }

    public function studentDetail(Request $request, Student $student): Response
    {
        $activeSession = AcademicSession::active()->first();

        $student->load('user:id,name');

        $records = Attendance::with([
            'schoolClass:id,name',
            'section:id,name',
            'subject:id,name',
            'assignment.teacher.user:id,name',
            'recorder:id,name',
        ])
            ->where('student_id', $student->id)
            ->when($activeSession, function ($q) use ($activeSession): void {
                $q->where('academic_session_id', $activeSession->id);
            })
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
                    'section' => $r->section?->name,
                    'subject' => $r->subject?->name,
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
            'activeSession' => $activeSession?->name,
        ]);
    }
}
