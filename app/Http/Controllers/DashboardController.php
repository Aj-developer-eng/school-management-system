<?php

namespace App\Http\Controllers;

use App\Enums\AssignmentStatusEnum;
use App\Enums\InvoiceStatusEnum;
use App\Enums\RoleEnum;
use App\Models\AcademicSession;
use App\Models\Attendance;
use App\Models\FeeInvoice;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentParent;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TeacherAssignmentLog;
use App\Models\TeacherSubjectAssignment;
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

        return $this->staffDashboard($user);
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
            'sections' => Section::where('is_active', true)->count(),
            'subjects' => Subject::where('is_active', true)->count(),
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

        $assignmentOverview = TeacherSubjectAssignment::with(['teacher.user:id,name', 'schoolClass:id,name', 'section:id,name', 'subject:id,name'])
            ->whereNull('deleted_at')
            ->when($activeSession, function ($q) use ($activeSession): void {
                $q->where('academic_session_id', $activeSession->id);
            })
            ->orderBy('school_class_id')
            ->orderBy('subject_id')
            ->get();

        $assignmentStats = [
            'total' => $assignmentOverview->count(),
            'pending' => $assignmentOverview->where('status', AssignmentStatusEnum::Pending)->count(),
            'started' => $assignmentOverview->where('status', AssignmentStatusEnum::Started)->count(),
            'completed' => $assignmentOverview->where('status', AssignmentStatusEnum::Completed)->count(),
        ];

        $quickActions = $this->quickActions($user);
// dd('default dashboard');
        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'enrollmentsByClass' => $enrollmentsByClass,
            'quickActions' => $quickActions,
            'assignmentOverview' => $assignmentOverview,
            'assignmentStats' => $assignmentStats,
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
        $feeSummary = [
            'total_invoiced' => 0,
            'total_paid' => 0,
            'total_outstanding' => 0,
            'unpaid_count' => 0,
        ];

        if ($parent) {
            $children = $parent->students()
                ->with(['user:id,name', 'enrollments' => function ($q) use ($activeSession): void {
                    $q->with(['schoolClass:id,name', 'section:id,name', 'academicSession:id,name'])
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
                    'section:id,name',
                    'subject:id,name',
                    'assignment.teacher.user:id,name',
                ])
                    ->whereIn('student_id', $studentIds)
                    ->whereDate('attendance_date', today()->toDateString())
                    ->orderBy('student_id')
                    ->get();
            }
        }

        return Inertia::render('Dashboard', [
            'dashboardType' => 'parent',
            'parent' => $parent ? ['id' => $parent->id, 'occupation' => $parent->occupation] : null,
            'children' => $children,
            'invoices' => $invoices,
            'feeSummary' => $feeSummary,
            'todayAttendance' => $todayAttendance,
            'activeSession' => $activeSession?->name,
        ]);
    }

    private function studentDashboard(User $user): Response
    {
        $student = Student::where('user_id', $user->id)->first();
        $activeSession = AcademicSession::active()->first();

        $enrollment = null;
        $invoices = collect();

        if ($student) {
            $enrollment = StudentEnrollment::with(['schoolClass:id,name', 'section:id,name', 'academicSession:id,name'])
                ->where('student_id', $student->id)
                ->where('academic_session_id', $activeSession?->id)
                ->whereNull('deleted_at')
                ->latest('enrolled_on')
                ->first();

            $invoices = FeeInvoice::with(['feeStructure:id,name'])
                ->where('student_id', $student->id)
                ->whereNull('deleted_at')
                ->orderByDesc('issue_date')
                ->limit(10)
                ->get();
        }

        return Inertia::render('Dashboard', [
            'dashboardType' => 'student',
            'student' => $student ? ['id' => $student->id, 'admission_number' => $student->admission_number] : null,
            'enrollment' => $enrollment,
            'invoices' => $invoices,
            'activeSession' => $activeSession?->name,
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
                'section:id,name',
                'subject:id,name',
                'academicSession:id,name',
            ])
                ->where('teacher_id', $teacher->id)
                ->whereNull('deleted_at')
                ->when($activeSession, function ($q) use ($activeSession): void {
                    $q->where('academic_session_id', $activeSession->id);
                })
                ->orderBy('school_class_id')
                ->orderBy('subject_id')
                ->get();

            $stats = [
                'total_assignments' => $assignments->count(),
                'pending' => $assignments->where('status', AssignmentStatusEnum::Pending)->count(),
                'started' => $assignments->where('status', AssignmentStatusEnum::Started)->count(),
                'completed' => $assignments->where('status', AssignmentStatusEnum::Completed)->count(),
            ];
        }

        return Inertia::render('Dashboard', [
            'dashboardType' => 'teacher',
            'teacher' => $teacher ? ['id' => $teacher->id, 'employee_code' => $teacher->employee_code] : null,
            'assignments' => $assignments,
            'assignmentStats' => $stats,
            'activeSession' => $activeSession?->name,
        ]);
    }

    public function startAssignment(Request $request, TeacherSubjectAssignment $assignment)
    {
        $assignment->update([
            'status' => AssignmentStatusEnum::Started,
            'started_at' => now(),
        ]);

        $this->logAssignmentEvent($assignment, 'started', $request->user());

        ActivityLogService::custom('Teacher Assignments', 'started', "Started assignment: {$assignment->schoolClass?->name} - {$assignment->subject?->name}");

        return redirect()->back()->with('success', 'Class marked as started.');
    }

    public function completeAssignment(Request $request, TeacherSubjectAssignment $assignment)
    {
        $assignment->update([
            'status' => AssignmentStatusEnum::Completed,
            'completed_at' => now(),
        ]);

        $this->logAssignmentEvent($assignment, 'completed', $request->user());

        ActivityLogService::custom('Teacher Assignments', 'completed', "Completed assignment: {$assignment->schoolClass?->name} - {$assignment->subject?->name}");

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

        ActivityLogService::custom('Teacher Assignments', 'reset', "Reset assignment: {$assignment->schoolClass?->name} - {$assignment->subject?->name}");

        return redirect()->back()->with('success', 'Assignment reset to pending.');
    }

    private function logAssignmentEvent(TeacherSubjectAssignment $assignment, string $action, User $user): void
    {
        TeacherAssignmentLog::create([
            'teacher_subject_assignment_id' => $assignment->id,
            'teacher_id' => $assignment->teacher_id,
            'academic_session_id' => $assignment->academic_session_id,
            'school_class_id' => $assignment->school_class_id,
            'section_id' => $assignment->section_id,
            'subject_id' => $assignment->subject_id,
            'action' => $action,
            'log_date' => today(),
            'occurred_at' => now(),
            'created_by' => $user->id,
        ]);
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

        if ($user->can('subjects.create')) {
            $actions[] = ['label' => 'New Subject', 'route' => 'subjects.create', 'icon' => 'FlaskConical'];
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
