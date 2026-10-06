<?php

namespace Tests\Feature;

use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use App\Models\AcademicSession;
use App\Models\Attendance;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\TeacherSubjectAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AttendanceReportScopingTest extends TestCase
{
    use RefreshDatabase;

    private AcademicSession $session;

    protected function setUp(): void
    {
        parent::setUp();

        $this->session = AcademicSession::create([
            'name' => '2026-2027',
            'start_date' => now()->startOfYear(),
            'end_date' => now()->endOfYear(),
            'is_active' => true,
        ]);
    }

    public function test_teacher_only_sees_attendance_of_their_own_assignments(): void
    {
        [$teacherUser, $teacher] = $this->makeTeacher();
        [$otherUser, $otherTeacher] = $this->makeTeacher();

        $ownAssignment = $this->makeAssignment($teacher, 'Grade 5', 'G5', 5);
        $otherAssignment = $this->makeAssignment($otherTeacher, 'Grade 9', 'G9', 9);

        $ownRecord = $this->recordAttendance($ownAssignment, 'ADM-001', $teacherUser, 'present');
        $this->recordAttendance($otherAssignment, 'ADM-002', $otherUser, 'absent');

        $response = $this->actingAs($teacherUser)->get(route('attendance.report'));

        $response->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Attendance/Report')
            ->has('records.data', 1)
            ->where('records.data.0.id', $ownRecord->id)
            ->where('summary.total', 1)
            ->where('summary.present', 1)
            ->where('summary.absent', 0)
            ->where('scopedToTeacher', true)
            ->where('isScoped', false)
        );
    }

    public function test_teacher_class_filter_only_lists_their_own_classes(): void
    {
        [$teacherUser, $teacher] = $this->makeTeacher();
        [, $otherTeacher] = $this->makeTeacher();

        $ownAssignment = $this->makeAssignment($teacher, 'Grade 5', 'G5', 5);
        $this->makeAssignment($otherTeacher, 'Grade 9', 'G9', 9);

        $response = $this->actingAs($teacherUser)->get(route('attendance.report'));

        $response->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('classes', 1)
            ->where('classes.'.$ownAssignment->school_class_id, 'Grade 5')
        );
    }

    public function test_teacher_still_sees_attendance_of_their_soft_deleted_assignments(): void
    {
        [$teacherUser, $teacher] = $this->makeTeacher();

        $assignment = $this->makeAssignment($teacher, 'Grade 5', 'G5', 5);
        $record = $this->recordAttendance($assignment, 'ADM-001', $teacherUser, 'late');

        $assignment->delete();

        $response = $this->actingAs($teacherUser)->get(route('attendance.report'));

        $response->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('records.data', 1)
            ->where('records.data.0.id', $record->id)
            ->where('summary.total', 1)
            ->where('summary.late', 1)
        );
    }

    public function test_teacher_without_a_teacher_record_sees_no_attendance(): void
    {
        [$otherUser, $otherTeacher] = $this->makeTeacher();
        $assignment = $this->makeAssignment($otherTeacher, 'Grade 5', 'G5', 5);
        $this->recordAttendance($assignment, 'ADM-001', $otherUser, 'present');

        $user = User::factory()->create();
        $user->assignRole(Role::findOrCreate(RoleEnum::Teacher->value, 'web'));
        $user->givePermissionTo(PermissionEnum::ViewAttendances->value);

        $response = $this->actingAs($user)->get(route('attendance.report'));

        $response->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('records.data', 0)
            ->where('summary.total', 0)
            ->where('scopedToTeacher', true)
        );
    }

    public function test_other_roles_still_see_every_record(): void
    {
        [$teacherUser, $teacher] = $this->makeTeacher();
        [$otherUser, $otherTeacher] = $this->makeTeacher();

        $ownAssignment = $this->makeAssignment($teacher, 'Grade 5', 'G5', 5);
        $otherAssignment = $this->makeAssignment($otherTeacher, 'Grade 9', 'G9', 9);

        $this->recordAttendance($ownAssignment, 'ADM-001', $teacherUser, 'present');
        $this->recordAttendance($otherAssignment, 'ADM-002', $otherUser, 'absent');

        $user = User::factory()->create();
        $user->assignRole(Role::findOrCreate(RoleEnum::SuperAdmin->value, 'web'));

        $response = $this->actingAs($user)->get(route('attendance.report'));

        $response->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('records.data', 2)
            ->where('summary.total', 2)
            ->where('scopedToTeacher', false)
        );
    }

    /**
     * @return array{0: User, 1: Teacher}
     */
    private function makeTeacher(): array
    {
        $user = User::factory()->create();
        $user->assignRole(Role::findOrCreate(RoleEnum::Teacher->value, 'web'));
        $user->givePermissionTo(PermissionEnum::ViewAttendances->value);

        $teacher = Teacher::create([
            'user_id' => $user->id,
            'employee_code' => 'EMP-'.$user->id,
        ]);

        return [$user, $teacher];
    }

    private function makeAssignment(
        Teacher $teacher,
        string $className,
        string $classCode,
        int $level,
    ): TeacherSubjectAssignment {
        $class = SchoolClass::create([
            'name' => $className,
            'code' => $classCode,
            'level' => $level,
            'is_active' => true,
        ]);

        return TeacherSubjectAssignment::create([
            'teacher_id' => $teacher->id,
            'academic_session_id' => $this->session->id,
            'school_class_id' => $class->id,
        ]);
    }

    private function recordAttendance(
        TeacherSubjectAssignment $assignment,
        string $admissionNumber,
        User $recorder,
        string $status,
    ): Attendance {
        $student = Student::create([
            'user_id' => User::factory()->create()->id,
            'admission_number' => $admissionNumber,
            'admission_date' => now()->toDateString(),
        ]);

        return Attendance::create([
            'student_id' => $student->id,
            'teacher_subject_assignment_id' => $assignment->id,
            'academic_session_id' => $assignment->academic_session_id,
            'school_class_id' => $assignment->school_class_id,
            'recorded_by' => $recorder->id,
            'attendance_date' => today()->toDateString(),
            'status' => $status,
        ]);
    }
}
