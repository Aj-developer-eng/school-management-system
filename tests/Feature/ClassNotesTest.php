<?php

namespace Tests\Feature;

use App\Enums\RoleEnum;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentParent;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ClassNotesTest extends TestCase
{
    use RefreshDatabase;

    private AcademicSession $session;

    private SchoolClass $class;

    private User $superAdmin;

    private User $teacher;

    private User $parentUser;

    private Student $student;

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

        $this->superAdmin = User::factory()->create();
        $this->superAdmin->assignRole(Role::findOrCreate(RoleEnum::SuperAdmin->value, 'web'));

        // The teacher can view classes but holds none of the notes permissions.
        $this->teacher = User::factory()->create();
        $this->teacher->assignRole(Role::findOrCreate(RoleEnum::Teacher->value, 'web'));

        $this->enrollChild();
    }

    public function test_a_user_without_the_permission_cannot_add_a_note(): void
    {
        $this->actingAs($this->teacher)
            ->post(route('classes.notes.store', $this->class->id), [
                'body' => 'Half day on Friday.',
            ])
            ->assertForbidden();

        $this->assertDatabaseCount('class_notes', 0);
    }

    public function test_a_note_can_be_added_to_a_class(): void
    {
        $this->actingAs($this->superAdmin)
            ->post(route('classes.notes.store', $this->class->id), [
                'body' => 'Half day on Friday.',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('class_notes', [
            'school_class_id' => $this->class->id,
            'body' => 'Half day on Friday.',
            'created_by' => $this->superAdmin->id,
        ]);
    }

    public function test_adding_a_note_requires_a_body(): void
    {
        $this->actingAs($this->superAdmin)
            ->post(route('classes.notes.store', $this->class->id), [])
            ->assertSessionHasErrors('body');

        $this->assertDatabaseCount('class_notes', 0);
    }

    public function test_the_classes_index_exposes_notes_newest_first(): void
    {
        $this->class->notes()->create(['body' => 'Older note.']);
        $this->class->notes()->create(['body' => 'Newer note.']);

        $this->actingAs($this->superAdmin)
            ->get(route('classes.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Academic/Class/Index')
                ->has('classes.data.0.notes', 2)
                ->where('classes.data.0.notes.0.body', 'Newer note.')
                ->where('classes.data.0.notes.1.body', 'Older note.')
            );
    }

    public function test_the_classes_index_hides_notes_from_users_without_the_view_permission(): void
    {
        $this->class->notes()->create(['body' => 'Sensitive note.']);

        $this->actingAs($this->teacher)
            ->get(route('classes.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Academic/Class/Index')
                ->missing('classes.data.0.notes')
            );
    }

    public function test_a_user_without_the_view_permission_cannot_open_the_class_notes_page(): void
    {
        $this->actingAs($this->teacher)
            ->get(route('class-notes.index'))
            ->assertForbidden();
    }

    public function test_a_parent_sees_the_notes_of_their_childrens_classes(): void
    {
        $this->class->notes()->create(['body' => 'Parent-teacher meeting next week.']);

        $this->actingAs($this->parentUser)
            ->get(route('class-notes.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ClassNote/Index')
                ->has('notes.data', 1)
                ->where('notes.data.0.body', 'Parent-teacher meeting next week.')
                ->where('notes.data.0.school_class.name', 'Grade 5')
            );
    }

    public function test_a_parent_does_not_see_notes_from_other_classes(): void
    {
        $this->class->notes()->create(['body' => 'For Grade 5 only.']);

        $otherClass = SchoolClass::create([
            'name' => 'Grade 6',
            'code' => 'G6',
            'level' => 6,
            'is_active' => true,
        ]);
        $otherClass->notes()->create(['body' => 'For Grade 6 only.']);

        $this->actingAs($this->parentUser)
            ->get(route('class-notes.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ClassNote/Index')
                ->has('notes.data', 1)
                ->where('notes.data.0.body', 'For Grade 5 only.')
            );
    }

    public function test_a_parent_without_enrolled_children_sees_no_notes(): void
    {
        $this->class->notes()->create(['body' => 'For Grade 5 only.']);

        $lonelyParent = User::factory()->create();
        $lonelyParent->assignRole(Role::findOrCreate(RoleEnum::Parent->value, 'web'));
        StudentParent::create(['user_id' => $lonelyParent->id, 'is_active' => true]);

        $this->actingAs($lonelyParent)
            ->get(route('class-notes.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ClassNote/Index')
                ->has('notes.data', 0)
            );
    }

    public function test_the_parent_role_holds_the_view_notes_permission(): void
    {
        $this->assertTrue($this->parentUser->can('classes.view-notes'));
    }

    private function enrollChild(): void
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
