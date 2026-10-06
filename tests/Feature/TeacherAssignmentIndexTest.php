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

    private function makeAssignment(?string $startTime, ?string $endTime): TeacherSubjectAssignment
    {
        return TeacherSubjectAssignment::create([
            'teacher_id' => $this->teacher->id,
            'academic_session_id' => $this->session->id,
            'school_class_id' => $this->class->id,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'days_of_week' => [1],
        ]);
    }
}
