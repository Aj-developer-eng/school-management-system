<?php

namespace Tests\Feature;

use App\Enums\PermissionEnum;
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

class ClassCreateAssignmentTest extends TestCase
{
    use RefreshDatabase;

    private AcademicSession $session;

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

        $teacherUser = User::factory()->create();
        $teacherUser->assignRole(Role::findOrCreate(RoleEnum::Teacher->value, 'web'));

        $this->teacher = Teacher::create([
            'user_id' => $teacherUser->id,
            'employee_code' => 'EMP-'.$teacherUser->id,
        ]);

        $this->superAdmin = User::factory()->create();
        $this->superAdmin->assignRole(Role::findOrCreate(RoleEnum::SuperAdmin->value, 'web'));
    }

    public function test_class_create_form_exposes_the_optional_assignment_props(): void
    {
        $this->actingAs($this->superAdmin)
            ->get(route('classes.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Academic/Class/Form')
                ->where('can_assign', true)
                ->has('teachers', 1)
                ->where('teachers.0.id', $this->teacher->id)
            );
    }

    public function test_creating_a_class_with_a_teacher_stores_the_assignment(): void
    {
        $this->actingAs($this->superAdmin)
            ->post(route('classes.store'), [
                'name' => 'Grade 6',
                'code' => 'G6',
                'active_from_session_id' => $this->session->id,
                'is_active' => true,
                'assignment' => [
                    'teacher_id' => $this->teacher->id,
                    'academic_session_id' => $this->session->id,
                    'start_time' => '08:00',
                    'end_time' => '09:00',
                    'days_of_week' => [1, 3],
                ],
            ])
            ->assertRedirect(route('classes.index'));

        $class = SchoolClass::where('code', 'G6')->firstOrFail();
        $assignment = TeacherSubjectAssignment::sole();

        $this->assertSame($class->id, $assignment->school_class_id);
        $this->assertSame($this->teacher->id, $assignment->teacher_id);
        $this->assertSame($this->session->id, $assignment->academic_session_id);
        $this->assertSame('08:00', $assignment->start_time->format('H:i'));
        $this->assertSame('09:00', $assignment->end_time->format('H:i'));
        $this->assertEquals([1, 3], $assignment->days_of_week);
        $this->assertSame('pending', $assignment->status->value);
    }

    public function test_assignment_session_defaults_to_the_active_session_when_not_submitted(): void
    {
        $this->actingAs($this->superAdmin)
            ->post(route('classes.store'), [
                'name' => 'Grade 7',
                'code' => 'G7',
                'is_active' => true,
                'assignment' => [
                    'teacher_id' => $this->teacher->id,
                ],
            ])
            ->assertRedirect(route('classes.index'));

        $assignment = TeacherSubjectAssignment::sole();

        $this->assertSame($this->session->id, $assignment->academic_session_id);
        $this->assertNull($assignment->start_time);
        $this->assertEquals([], $assignment->days_of_week);
    }

    public function test_creating_a_class_without_a_teacher_skips_the_assignment(): void
    {
        $this->actingAs($this->superAdmin)
            ->post(route('classes.store'), [
                'name' => 'Grade 8',
                'code' => 'G8',
                'is_active' => true,
                'assignment' => [
                    'academic_session_id' => $this->session->id,
                ],
            ])
            ->assertRedirect(route('classes.index'));

        $this->assertDatabaseHas('school_classes', ['code' => 'G8']);
        $this->assertSame(0, TeacherSubjectAssignment::count());
    }

    public function test_assignment_details_without_a_teacher_fail_validation(): void
    {
        $this->actingAs($this->superAdmin)
            ->post(route('classes.store'), [
                'name' => 'Grade 9',
                'code' => 'G9',
                'is_active' => true,
                'assignment' => [
                    'start_time' => '08:00',
                ],
            ])
            ->assertSessionHasErrors('assignment.teacher_id');

        $this->assertSame(0, SchoolClass::count());
        $this->assertSame(0, TeacherSubjectAssignment::count());
    }

    public function test_end_time_must_be_after_or_equal_to_the_start_time(): void
    {
        $this->actingAs($this->superAdmin)
            ->post(route('classes.store'), [
                'name' => 'Grade 10',
                'code' => 'G10',
                'is_active' => true,
                'assignment' => [
                    'teacher_id' => $this->teacher->id,
                    'academic_session_id' => $this->session->id,
                    'start_time' => '09:00',
                    'end_time' => '08:00',
                ],
            ])
            ->assertSessionHasErrors('assignment.end_time');

        $this->assertSame(0, SchoolClass::count());
        $this->assertSame(0, TeacherSubjectAssignment::count());
    }

    public function test_user_without_teacher_assignment_permission_cannot_create_an_assignment(): void
    {
        $user = User::factory()->create();
        $role = Role::findOrCreate('Class Creator', 'web');
        $role->syncPermissions([PermissionEnum::CreateClasses->value]);
        $user->assignRole($role);

        $this->actingAs($user)
            ->get(route('classes.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Academic/Class/Form')
                ->where('can_assign', false)
                ->where('teachers', [])
            );

        // A crafted payload must still create the class but never the assignment.
        $this->actingAs($user)
            ->post(route('classes.store'), [
                'name' => 'Grade 11',
                'code' => 'G11',
                'is_active' => true,
                'assignment' => [
                    'teacher_id' => $this->teacher->id,
                    'academic_session_id' => $this->session->id,
                    'start_time' => '08:00',
                    'end_time' => '09:00',
                ],
            ])
            ->assertRedirect(route('classes.index'));

        $this->assertDatabaseHas('school_classes', ['code' => 'G11']);
        $this->assertSame(0, TeacherSubjectAssignment::count());
    }
}
