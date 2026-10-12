<?php

namespace Tests\Feature;

use App\Enums\RoleEnum;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Teacher;
use App\Models\TeacherSubjectAssignment;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TeacherAssignmentIndexTest extends TestCase
{
    use RefreshDatabase;

    private AcademicSession $session;

    private SchoolClass $class;

    private Teacher $teacher;

    private User $teacherUser;

    private User $superAdmin;

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
        $this->teacherUser = $teacherUser;

        $this->superAdmin = User::factory()->create();
        $this->superAdmin->assignRole(Role::findOrCreate(RoleEnum::SuperAdmin->value, 'web'));
    }

    public function test_super_admin_can_view_the_teacher_assignments_index(): void
    {
        $this->actingAs($this->superAdmin)
            ->get(route('teacher-assignments.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Teacher/Assignment/Index'));
    }

    public function test_assignments_are_sorted_by_class_time_so_rows_can_be_grouped(): void
    {
        $this->makeAssignment('14:00', '15:00');
        $this->makeAssignment('08:00', '09:00');
        $this->makeAssignment(null, null);
        $this->makeAssignment('08:00', '08:45');

        $this->actingAs($this->superAdmin)
            ->get(route('teacher-assignments.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Teacher/Assignment/Index')
                ->has('assignments.data', 4)
                ->where('assignments.data.0.start_time', '08:00')
                ->where('assignments.data.0.end_time', '08:45')
                ->where('assignments.data.1.start_time', '08:00')
                ->where('assignments.data.1.end_time', '09:00')
                ->where('assignments.data.2.start_time', '14:00')
                ->where('assignments.data.3.start_time', null)
            );
    }

    public function test_teacher_only_sees_class_assignments_for_themselves(): void
    {
        $otherClass = SchoolClass::create([
            'name' => 'Grade 9',
            'code' => 'G9',
            'level' => 9,
            'is_active' => true,
        ]);
        $otherTeacher = $this->makeTeacher('Unrelated Teacher');

        $this->makeAssignment('08:00', '09:00');
        $this->makeAssignment('10:00', '11:00', $otherTeacher, $otherClass);

        $this->actingAs($this->teacherUser)
            ->get(route('teacher-assignments.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Teacher/Assignment/Index')
                ->has('assignments.data', 1)
                ->where('assignments.data.0.teacher.id', $this->teacher->id)
                ->where('assignments.data.0.school_class.name', 'Grade 5')
            );
    }

    public function test_super_admin_sees_class_assignments_for_every_teacher(): void
    {
        $otherTeacher = $this->makeTeacher('Unrelated Teacher');

        $this->makeAssignment('08:00', '09:00');
        $this->makeAssignment('10:00', '11:00', $otherTeacher);

        $this->actingAs($this->superAdmin)
            ->get(route('teacher-assignments.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Teacher/Assignment/Index')
                ->has('assignments.data', 2)
            );
    }

    public function test_search_cannot_surface_other_teachers_assignments_for_a_scoped_teacher(): void
    {
        $otherClass = SchoolClass::create([
            'name' => 'Grade 9',
            'code' => 'G9',
            'level' => 9,
            'is_active' => true,
        ]);
        $otherTeacher = $this->makeTeacher('Unrelated Teacher');

        $this->makeAssignment('08:00', '09:00');
        $this->makeAssignment('10:00', '11:00', $otherTeacher, $otherClass);

        // Searching another teacher's class name or teacher name must not leak their rows.
        $this->actingAs($this->teacherUser)
            ->get(route('teacher-assignments.index', ['search' => 'Grade 9']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('assignments.data', 0));

        $this->actingAs($this->teacherUser)
            ->get(route('teacher-assignments.index', ['search' => 'Unrelated']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('assignments.data', 0));

        // Unscoped staff can still find the same rows by class and teacher name.
        $this->actingAs($this->superAdmin)
            ->get(route('teacher-assignments.index', ['search' => 'Grade 9']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('assignments.data', 1)
                ->where('assignments.data.0.school_class.name', 'Grade 9')
            );

        $this->actingAs($this->superAdmin)
            ->get(route('teacher-assignments.index', ['search' => 'Unrelated']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('assignments.data', 1));
    }

    public function test_teacher_without_a_teacher_record_sees_no_assignments(): void
    {
        $this->makeAssignment('08:00', '09:00');

        $userWithoutTeacherRecord = User::factory()->create();
        $userWithoutTeacherRecord->assignRole(Role::findOrCreate(RoleEnum::Teacher->value, 'web'));

        $this->actingAs($userWithoutTeacherRecord)
            ->get(route('teacher-assignments.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Teacher/Assignment/Index')
                ->has('assignments.data', 0)
            );
    }

    private function makeTeacher(string $name): Teacher
    {
        $user = User::factory()->create(['name' => $name]);
        $user->assignRole(Role::findOrCreate(RoleEnum::Teacher->value, 'web'));

        return Teacher::create([
            'user_id' => $user->id,
            'employee_code' => 'EMP-'.$user->id,
        ]);
    }

    private function makeAssignment(
        ?string $startTime,
        ?string $endTime,
        ?Teacher $teacher = null,
        ?SchoolClass $class = null,
    ): TeacherSubjectAssignment {
        return TeacherSubjectAssignment::create([
            'teacher_id' => ($teacher ?? $this->teacher)->id,
            'academic_session_id' => $this->session->id,
            'school_class_id' => ($class ?? $this->class)->id,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'days_of_week' => [1],
        ]);
    }
}
