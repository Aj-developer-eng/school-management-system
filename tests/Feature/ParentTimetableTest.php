<?php

namespace Tests\Feature;

use App\Enums\RoleEnum;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentParent;
use App\Models\Teacher;
use App\Models\TeacherSubjectAssignment;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ParentTimetableTest extends TestCase
{
    use RefreshDatabase;

    private AcademicSession $session;

    private SchoolClass $class;

    private Teacher $teacher;

    private Student $student;

    private User $parentUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);

        $this->session = AcademicSession::create([
            'name' => '2026-2027',
            'start_date' => now()->startOfYear(),
            'end_date' => now()->endOfYear(),
            'is_active' => true,
        ]);

        $this->class = SchoolClass::create([
            'name' => 'Grade 5',
            'code' => 'G5',
            'level' => 5,
            'is_active' => true,
        ]);

        $teacherUser = User::factory()->create();
        $teacherUser->assignRole(Role::findOrCreate(RoleEnum::Teacher->value, 'web'));

        $this->teacher = Teacher::create([
            'user_id' => $teacherUser->id,
            'employee_code' => 'EMP-'.$teacherUser->id,
        ]);

        $this->enrollStudent();
    }

    public function test_parent_timetable_shows_the_slots_of_the_child_class(): void
    {
        $this->makeAssignment('08:00', '09:00');
        $this->makeAssignment('09:00', '10:00');

        $this->actingAs($this->parentUser)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->where('dashboardType', 'parent')
                ->has('timetable', 2)
                ->where('timetable.0.class', 'Grade 5')
                ->where('timetable.0.start_time', '08:00')
                ->where('timetable.1.start_time', '09:00')
            );
    }

    public function test_parent_timetable_excludes_other_classes(): void
    {
        $otherClass = SchoolClass::create([
            'name' => 'Grade 6',
            'code' => 'G6',
            'level' => 6,
            'is_active' => true,
        ]);

        $this->makeAssignment('08:00', '09:00');
        $this->makeAssignment('09:00', '10:00', $otherClass->id);

        $this->actingAs($this->parentUser)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('timetable', 1)
                ->where('timetable.0.class', 'Grade 5')
            );
    }

    public function test_parent_without_enrolled_children_sees_no_timetable(): void
    {
        $this->makeAssignment('08:00', '09:00');

        $lonelyParent = User::factory()->create();
        $lonelyParent->assignRole(Role::findOrCreate(RoleEnum::Parent->value, 'web'));
        StudentParent::create(['user_id' => $lonelyParent->id, 'is_active' => true]);

        $this->actingAs($lonelyParent)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('dashboardType', 'parent')
                ->has('timetable', 0)
            );
    }

    private function makeAssignment(
        string $startTime,
        string $endTime,
        ?int $classId = null,
    ): TeacherSubjectAssignment {
        return TeacherSubjectAssignment::create([
            'teacher_id' => $this->teacher->id,
            'academic_session_id' => $this->session->id,
            'school_class_id' => $classId ?? $this->class->id,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'days_of_week' => [1],
        ]);
    }

    private function enrollStudent(): void
    {
        $this->student = Student::create([
            'user_id' => User::factory()->create()->id,
            'admission_number' => 'ADM-001',
            'admission_date' => now()->toDateString(),
        ]);

        StudentEnrollment::create([
            'student_id' => $this->student->id,
            'academic_session_id' => $this->session->id,
            'school_class_id' => $this->class->id,
            'roll_number' => '1',
            'enrolled_on' => now()->toDateString(),
        ]);

        $this->parentUser = User::factory()->create();
        $this->parentUser->assignRole(Role::findOrCreate(RoleEnum::Parent->value, 'web'));

        $parent = StudentParent::create([
            'user_id' => $this->parentUser->id,
            'is_active' => true,
        ]);

        $parent->students()->attach($this->student->id, [
            'guardian_type' => 'Father',
            'is_primary_contact' => true,
        ]);
    }
}
