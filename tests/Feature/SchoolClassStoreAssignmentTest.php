<?php

namespace Tests\Feature;

use App\Enums\RoleEnum;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TeacherSubjectAssignment;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SchoolClassStoreAssignmentTest extends TestCase
{
    use RefreshDatabase;

    private AcademicSession $session;

    private Subject $subject;

    private Teacher $teacher;

    private User $admin;

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

        $this->subject = Subject::create([
            'name' => 'Mathematics',
            'code' => 'MATH',
            'is_active' => true,
        ]);

        $teacherUser = User::factory()->create();
        $this->teacher = Teacher::create([
            'user_id' => $teacherUser->id,
            'employee_code' => 'EMP-001',
            'is_active' => true,
        ]);

        $this->admin = User::factory()->create();
        $this->admin->assignRole(Role::findOrCreate(RoleEnum::SuperAdmin->value, 'web'));
    }

    public function test_the_class_create_page_exposes_the_assignment_form_props(): void
    {
        $this->actingAs($this->admin)
            ->get(route('classes.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Academic/Class/Form')
                ->where('can_create_assignment', true)
                ->where('active_session_id', $this->session->id)
                ->where('teachers.0.id', $this->teacher->id)
                ->where('subjects.'.$this->subject->id, 'Mathematics')
            );
    }

    public function test_creating_a_class_can_also_create_a_subject_assignment(): void
    {
        $this->actingAs($this->admin)
            ->post(route('classes.store'), [
                'name' => 'Grade 7',
                'description' => 'New grade',
                'active_from_session_id' => $this->session->id,
                'is_active' => 1,
                'create_assignment' => 1,
                'teacher_id' => $this->teacher->id,
                'academic_session_id' => $this->session->id,
                'subject_id' => $this->subject->id,
                'start_time' => '08:30',
                'end_time' => '09:00',
                'days_of_week' => [1, 2, 3],
            ])
            ->assertRedirect(route('classes.index'))
            ->assertSessionHas('success');

        $class = SchoolClass::query()->where('name', 'Grade 7')->firstOrFail();
        $assignment = TeacherSubjectAssignment::query()->firstOrFail();

        // The assignment is bound to the class that was just created and has no
        // section yet - sections only exist after the class does.
        $this->assertSame($class->id, $assignment->school_class_id);
        $this->assertSame($this->teacher->id, $assignment->teacher_id);
        $this->assertSame($this->session->id, $assignment->academic_session_id);
        $this->assertSame($this->subject->id, $assignment->subject_id);
        $this->assertNull($assignment->section_id);
        $this->assertSame('08:30', $assignment->start_time->format('H:i'));
        $this->assertSame('09:00', $assignment->end_time->format('H:i'));
        $this->assertSame([1, 2, 3], $assignment->days_of_week);

        // The assigned subject is linked to the brand new class automatically,
        // since the class_subject pivot is empty on creation.
        $this->assertDatabaseHas('class_subject', [
            'school_class_id' => $class->id,
            'subject_id' => $this->subject->id,
        ]);
        $this->assertTrue($class->subjects->contains($this->subject));
    }

    public function test_assignment_fields_are_required_when_the_toggle_is_on(): void
    {
        $this->actingAs($this->admin)
            ->post(route('classes.store'), [
                'name' => 'Grade 8',
                'is_active' => 1,
                'create_assignment' => 1,
            ])
            ->assertSessionHasErrors(['teacher_id', 'academic_session_id', 'subject_id']);

        // Nothing is persisted when the assignment part is incomplete.
        $this->assertDatabaseCount('school_classes', 0);
        $this->assertDatabaseCount('teacher_subject_assignments', 0);
    }

    public function test_no_assignment_is_created_when_the_toggle_is_off(): void
    {
        $this->actingAs($this->admin)
            ->post(route('classes.store'), [
                'name' => 'Grade 9',
                'is_active' => 1,
                'create_assignment' => 0,
                // Stray assignment payload must be ignored entirely.
                'teacher_id' => $this->teacher->id,
                'academic_session_id' => $this->session->id,
                'subject_id' => $this->subject->id,
            ])
            ->assertRedirect(route('classes.index'))
            ->assertSessionHas('success');

        $this->assertDatabaseHas('school_classes', ['name' => 'Grade 9']);
        $this->assertDatabaseCount('teacher_subject_assignments', 0);
    }

    public function test_the_assignment_section_requires_the_teacher_assignments_permission(): void
    {
        $user = User::factory()->create();
        $role = Role::findOrCreate('Class Manager Only', 'web');
        $role->givePermissionTo(Permission::findOrCreate('classes.create', 'web'));
        $user->assignRole($role);

        $this->actingAs($user)
            ->post(route('classes.store'), [
                'name' => 'Grade 10',
                'is_active' => 1,
                'create_assignment' => 1,
                'teacher_id' => $this->teacher->id,
                'academic_session_id' => $this->session->id,
                'subject_id' => $this->subject->id,
            ])
            ->assertForbidden();

        $this->assertDatabaseCount('school_classes', 0);
        $this->assertDatabaseCount('teacher_subject_assignments', 0);
    }
}
