<?php

namespace App\Http\Controllers;

use App\Enums\AssignmentStatusEnum;
use App\Enums\InvoiceStatusEnum;
use App\Enums\RoleEnum;
use App\Enums\TestStatusEnum;
use App\Models\AcademicSession;
use App\Models\Attendance;
use App\Models\FeeInvoice;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentParent;
use App\Models\Teacher;
use App\Models\TeacherAssignmentLog;
use App\Models\TeacherSubjectAssignment;
use App\Models\TestResult;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        if ($user->hasRole(RoleEnum::Parent->value)) {
            return $this->parentDashboard($user);
        }

        if ($user->hasRole(RoleEnum::Student->value)) {
            return $this->studentDashboard($user);
        }

        if ($user->hasRole(RoleEnum::Teacher->value)) {
            return $this->teacherDashboard($user);
        }

        if ($user->hasAnyRole(RoleEnum::staffRoles())) {
            return $this->staffDashboard($user);
        }

        return $this->defaultDashboard($user);
    }

    private function defaultDashboard(User $user): Response
    {
        return Inertia::render('Dashboard', [
            'dashboardType' => 'empty',
        ]);
    }

    private function staffDashboard(User $user): Response
    {
        $activeSession = AcademicSession::active()->first()
            ?? AcademicSession::latest('start_date')->first();

        $stats = [
            'students' => Student::count(),
            'teachers' => Teacher::where('is_active', true)->count(),
            'parents' => StudentParent::where('is_active', true)->count(),
            'classes' => SchoolClass::where('is_active', true)->count(),
            'active_session' => $activeSession?->name,
        ];

        $enrollmentsByClass = $activeSession
            ? DB::table('student_enrollments')
                ->join('school_classes', 'student_enrollments.school_class_id', '=', 'school_classes.id')
                ->where('student_enrollments.academic_session_id', $activeSession->id)
                ->whereNull('student_enrollments.deleted_at')
                ->select('school_classes.name as label', DB::raw('count(*) as value'))
                ->groupBy('school_classes.id', 'school_classes.name')
                ->orderBy('school_classes.level')
                ->get()
            : collect();

        $assignmentOverview = TeacherSubjectAssignment::with(['teacher.user:id,name', 'schoolClass:id,name'])
            ->whereNull('deleted_at')
            ->when($activeSession, function ($q) use ($activeSession): void {
                $q->where('academic_session_id', $activeSession->id);
            })
            ->orderBy('school_class_id')
            ->get();

        $assignmentStats = [
            'total' => $assignmentOverview->count(),
            'pending' => $assignmentOverview->where('status', AssignmentStatusEnum::Pending)->count(),
            'started' => $assignmentOverview->where('status', AssignmentStatusEnum::Started)->count(),
            'completed' => $assignmentOverview->where('status', AssignmentStatusEnum::Completed)->count(),
        ];

        $invoiceQuery = FeeInvoice::query()->whereNull('deleted_at');
        $invoiceStatusStats = [
            'paid' => (clone $invoiceQuery)->where('status', InvoiceStatusEnum::Paid->value)->count(),
            'partial' => (clone $invoiceQuery)->where('status', InvoiceStatusEnum::Partial->value)->count(),
            'unpaid' => (clone $invoiceQuery)->where('status', InvoiceStatusEnum::Unpaid->value)->count(),
            'cancelled' => (clone $invoiceQuery)->where('status', InvoiceStatusEnum::Cancelled->value)->count(),
        ];
        $invoiceStatusStats['total'] = array_sum($invoiceStatusStats);

        $invoiceReferences = (clone $invoiceQuery)
            ->with(['student.user:id,name', 'feeStructure:id,name'])
            ->orderByDesc('issue_date')
            ->orderByDesc('id')
            ->limit(8)
            ->get(['id', 'invoice_number', 'status', 'total_amount', 'balance', 'student_id', 'fee_structure_id']);

        // Weekly timetable from class (teacher) assignments.
        $timetable = $this->buildTimetable($activeSession);

        $quickActions = $this->quickActions($user);

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'enrollmentsByClass' => $enrollmentsByClass,
            'quickActions' => $quickActions,
            'assignmentOverview' => $assignmentOverview,
            'assignmentStats' => $assignmentStats,
            'invoiceStatusStats' => $invoiceStatusStats,
            'invoiceReferences' => $invoiceReferences,
            'timetable' => $timetable,
            'dashboardType' => 'staff',
        ]);
    }

    private function parentDashboard(User $user): Response
    {
        $parent = StudentParent::where('user_id', $user->id)->first();
        $activeSession = AcademicSession::active()->first();

        $children = collect();
        $invoices = collect();
        $todayAttendance = collect();
        $testResults = collect();
        $feeSummary = [
            'total_invoiced' => 0,
            'total_paid' => 0,
            'total_outstanding' => 0,
            'unpaid_count' => 0,
        ];

        if ($parent) {
            $children = $parent->students()
                ->with(['user:id,name', 'enrollments' => function ($q) use ($activeSession): void {
                    $q->with(['schoolClass:id,name', 'academicSession:id,name'])
                        ->where('academic_session_id', $activeSession?->id)
                        ->whereNull('deleted_at')
                        ->latest('enrolled_on');
                }])
                ->whereNull('students.deleted_at')
                ->get();

            $studentIds = $children->pluck('id');

            if ($studentIds->isNotEmpty()) {
                $invoices = FeeInvoice::with(['student.user:id,name', 'feeStructure:id,name', 'academicSession:id,name'])
                    ->whereIn('student_id', $studentIds)
                    ->whereNull('deleted_at')
                    ->orderByDesc('issue_date')
                    ->limit(10)
                    ->get();

                $feeSummary = [
                    'total_invoiced' => (float) FeeInvoice::whereIn('student_id', $studentIds)->whereNull('deleted_at')->sum('total_amount'),
                    'total_paid' => (float) FeeInvoice::whereIn('student_id', $studentIds)->whereNull('deleted_at')->sum('paid_amount'),
                    'total_outstanding' => (float) FeeInvoice::whereIn('student_id', $studentIds)
                        ->whereNull('deleted_at')
                        ->whereNotIn('status', [InvoiceStatusEnum::Paid->value, InvoiceStatusEnum::Cancelled->value])
                        ->sum('balance'),
                    'unpaid_count' => FeeInvoice::whereIn('student_id', $studentIds)
                        ->whereNull('deleted_at')
                        ->whereNotIn('status', [InvoiceStatusEnum::Paid->value, InvoiceStatusEnum::Cancelled->value])
                        ->count(),
                ];

                $todayAttendance = Attendance::with([
                    'student.user:id,name',
                    'schoolClass:id,name',
                    'assignment.teacher.user:id,name',
                ])
                    ->whereIn('student_id', $studentIds)
                    ->whereDate('attendance_date', today()->toDateString())
                    ->orderBy('student_id')
                    ->get();

                // Published test results for the children. Parents do not see
                // "not applicable" entries.
                $testResults = TestResult::with([
                    'test:id,title,test_date,school_class_id,total_marks',
                    'test.schoolClass:id,name',
                    'student.user:id,name',
                ])
                    ->whereIn('student_id', $studentIds)
                    ->whereNull('deleted_at')
                    ->where('is_not_applicable', false)
                    ->whereHas('test', function ($q): void {
                        $q->where('status', TestStatusEnum::ResultsPublished->value)
                            ->whereNull('deleted_at');
                    })
                    ->orderByDesc('id')
                    ->limit(10)
                    ->get()
                    ->map(fn (TestResult $result): array => [
                        'id' => $result->id,
                        'test_id' => $result->test_id,
                        'test_title' => $result->test?->title,
                        'test_date' => $result->test?->test_date?->toDateString(),
                        'school_class' => $result->test?->schoolClass?->name,
                        'total_marks' => $result->test?->total_marks !== null ? (float) $result->test->total_marks : null,
                        'student' => $result->student?->user?->name,
                        'marks_obtained' => $result->marks_obtained !== null ? (float) $result->marks_obtained : null,
                        'grade' => $result->grade,
                        'is_absent' => (bool) $result->is_absent,
                        'is_not_applicable' => (bool) $result->is_not_applicable,
                        'remarks' => $result->remarks,
                    ])
                    ->values();
            }
        }

        // The weekly timetable covers the classes the children are enrolled in.
        $classIds = $children
            ->flatMap(fn (Student $child) => $child->enrollments)
            ->filter(fn ($enrollment) => $enrollment->school_class_id)
            ->pluck('school_class_id')
            ->unique()
            ->values()
            ->all();

        return Inertia::render('Dashboard', [
            'dashboardType' => 'parent',
            'parent' => $parent ? ['id' => $parent->id, 'occupation' => $parent->occupation] : null,
            'children' => $children,
            'invoices' => $invoices,
            'feeSummary' => $feeSummary,
            'todayAttendance' => $todayAttendance,
            'testResults' => $testResults,
            'activeSession' => $activeSession?->name,
            // No enrolled children means no scope: an empty timetable is safer
            // than falling back to the whole school's assignments.
            'timetable' => $classIds === []
                ? []
                : $this->buildTimetable($activeSession, null, $classIds),
        ]);
    }

    private function studentDashboard(User $user): Response
    {
        $student = Student::where('user_id', $user->id)->first();
        $activeSession = AcademicSession::active()->first();

        $enrollments = collect();
        $invoices = collect();

        if ($student) {
            $enrollments = StudentEnrollment::with(['schoolClass:id,name', 'academicSession:id,name'])
                ->where('student_id', $student->id)
                ->where('academic_session_id', $activeSession?->id)
                ->whereNull('deleted_at')
                ->orderBy('id')
                ->get();

            $invoices = FeeInvoice::with(['feeStructure:id,name'])
                ->where('student_id', $student->id)
                ->whereNull('deleted_at')
                ->orderByDesc('issue_date')
                ->limit(10)
                ->get();
        }

        $classIds = $enrollments
            ->pluck('school_class_id')
            ->filter()
            ->unique()
            ->values()
            ->all();

        return Inertia::render('Dashboard', [
            'dashboardType' => 'student',
            'student' => $student ? ['id' => $student->id, 'admission_number' => $student->admission_number] : null,
            'enrollments' => $enrollments,
            'invoices' => $invoices,
            'activeSession' => $activeSession?->name,
            'timetable' => $this->buildTimetable($activeSession, null, $classIds),
        ]);
    }

    private function teacherDashboard(User $user): Response
    {
        $teacher = Teacher::where('user_id', $user->id)->first();
        $activeSession = AcademicSession::active()->first();

        $assignments = collect();
        $stats = [
            'total_assignments' => 0,
            'pending' => 0,
            'started' => 0,
            'completed' => 0,
        ];

        if ($teacher) {
            $assignments = TeacherSubjectAssignment::with([
                'schoolClass:id,name',
                'academicSession:id,name',
            ])
                ->where('teacher_id', $teacher->id)
                ->whereNull('deleted_at')
                ->when($activeSession, function ($q) use ($activeSession): void {
                    $q->where('academic_session_id', $activeSession->id);
                })
                ->orderBy('school_class_id')
                ->get();

            $stats = [
                'total_assignments' => $assignments->count(),
                'pending' => $assignments->where('status', AssignmentStatusEnum::Pending)->count(),
                'started' => $assignments->where('status', AssignmentStatusEnum::Started)->count(),
                'completed' => $assignments->where('status', AssignmentStatusEnum::Completed)->count(),
            ];
        }

        $timetable = $teacher
            ? $this->buildTimetable($activeSession, $teacher->id)
            : [];

        return Inertia::render('Dashboard', [
            'dashboardType' => 'teacher',
            'teacher' => $teacher ? ['id' => $teacher->id, 'employee_code' => $teacher->employee_code] : null,
            'assignments' => $assignments,
            'assignmentStats' => $stats,
            'activeSession' => $activeSession?->name,
            'timetable' => $timetable,
        ]);
    }

    public function startAssignment(Request $request, TeacherSubjectAssignment $assignment)
    {
        $assignment->update([
            'status' => AssignmentStatusEnum::Started,
            'started_at' => now(),
        ]);

        $this->logAssignmentEvent($assignment, 'started', $request->user());

        ActivityLogService::custom('Teacher Assignments', 'started', "Started assignment: {$assignment->schoolClass?->name}");

        return redirect()->back()->with('success', 'Class marked as started.');
    }

    public function completeAssignment(Request $request, TeacherSubjectAssignment $assignment)
    {
        $assignment->update([
            'status' => AssignmentStatusEnum::Completed,
            'completed_at' => now(),
        ]);

        $this->logAssignmentEvent($assignment, 'completed', $request->user());

        ActivityLogService::custom('Teacher Assignments', 'completed', "Completed assignment: {$assignment->schoolClass?->name}");

        return redirect()->back()->with('success', 'Class marked as completed.');
    }

    public function resetAssignment(Request $request, TeacherSubjectAssignment $assignment)
    {
        $assignment->update([
            'status' => AssignmentStatusEnum::Pending,
            'started_at' => null,
            'completed_at' => null,
        ]);

        $this->logAssignmentEvent($assignment, 'reset', $request->user());

        ActivityLogService::custom('Teacher Assignments', 'reset', "Reset assignment: {$assignment->schoolClass?->name}");

        return redirect()->back()->with('success', 'Assignment reset to pending.');
    }

    private function logAssignmentEvent(TeacherSubjectAssignment $assignment, string $action, User $user): void
    {
        TeacherAssignmentLog::create([
            'teacher_subject_assignment_id' => $assignment->id,
            'teacher_id' => $assignment->teacher_id,
            'academic_session_id' => $assignment->academic_session_id,
            'school_class_id' => $assignment->school_class_id,
            'action' => $action,
            'log_date' => today(),
            'occurred_at' => now(),
            'created_by' => $user->id,
        ]);
    }

    /**
     * Build the weekly timetable entries.
     *
     * @param  array<int, int>  $classIds  restrict the timetable to these classes
     */
    private function buildTimetable(?AcademicSession $activeSession, ?int $teacherId = null, array $classIds = []): array
    {
        $timetableDays = [
            1 => 'Monday', 2 => 'Tuesday', 3 => 'Wednesday',
            4 => 'Thursday', 5 => 'Friday', 6 => 'Saturday', 7 => 'Sunday',
        ];

        $query = TeacherSubjectAssignment::query()
            ->with(['teacher.user:id,name', 'schoolClass:id,name'])
            ->whereNull('deleted_at')
            ->orderBy('start_time');

        if ($teacherId !== null) {
            $query->where('teacher_id', $teacherId);
        }

        if ($classIds !== []) {
            $query->whereIn('school_class_id', $classIds);
        }

        return $query->get()
            ->flatMap(function (TeacherSubjectAssignment $assignment) use ($timetableDays): array {
                // One timetable entry per selected day; assignments without days become "Unscheduled".
                $days = collect($assignment->days_of_week ?? [])
                    ->filter(fn ($day) => is_numeric($day) && $day >= 1 && $day <= 7)
                    ->map(fn ($day) => (int) $day)
                    ->unique()
                    ->values();

                if ($days->isEmpty()) {
                    $days = collect([0]);
                }

                return $days->map(fn (int $day): array => [
                    'id' => $assignment->id,
                    'key' => $assignment->id.'-'.$day,
                    'day' => $day,
                    'day_label' => $timetableDays[$day] ?? 'Unscheduled',
                    'start_time' => $assignment->start_time?->format('H:i'),
                    'end_time' => $assignment->end_time?->format('H:i'),
                    'teacher' => $assignment->teacher?->user?->name,
                    'class' => $assignment->schoolClass?->name,
                ])->all();
            })
            ->sortBy(fn (array $entry): int => $entry['day'])
            ->values()
            ->all();
    }

    private function quickActions(User $user): array
    {
        $actions = [];

        if ($user->can('students.create')) {
            $actions[] = ['label' => 'Admit Student', 'route' => 'students.create', 'icon' => 'UserPlus'];
        }

        if ($user->can('teachers.create')) {
            $actions[] = ['label' => 'Add Teacher', 'route' => 'teachers.create', 'icon' => 'GraduationCap'];
        }

        if ($user->can('parents.create')) {
            $actions[] = ['label' => 'Add Parent', 'route' => 'parents.create', 'icon' => 'Users'];
        }

        if ($user->can('classes.create')) {
            $actions[] = ['label' => 'New Class', 'route' => 'classes.create', 'icon' => 'BookOpen'];
        }

        if ($user->can('school-settings.update')) {
            $actions[] = ['label' => 'School Settings', 'route' => 'school-settings.edit', 'icon' => 'Settings'];
        }

        if ($user->can('academic-sessions.create')) {
            $actions[] = ['label' => 'Academic Session', 'route' => 'academic-sessions.create', 'icon' => 'Calendar'];
        }

        return $actions;
    }
}
