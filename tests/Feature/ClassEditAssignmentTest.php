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

/**
 * Regression coverage for editing a class at /classes/{id}/edit.
 *
 * The class form carries an optional teacher-assignment section. The bugs
 * these tests guard against are:
 *
 *  - editing a class created a *second* assignment row instead of updating
 *    the one the form had pre-filled;
 *  - the assignment could be dragged into another academic session because
 *    the session was sent from the browser;
 *  - a crafted payload could update an assignment belonging to another class.
 */
class ClassEditAssignmentTest extends TestCase
{
    use RefreshDatabase;

    private AcademicSession $activeSession;

    private AcademicSession $previousSession;

    private Teacher $teacher;

    private Teacher $otherTeacher;

    private SchoolClass $schoolClass;

    private User $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);

        // The active session is the newest one; the previous session is only
        // used by assignments that were created in an earlier year.
        $this->activeSession = AcademicSession::create([
            'name' => '2026-2027',
            'start_date' => now()->startOfYear(),
            'end_date' => now()->endOfYear(),
            'is_active' => true,
        ]);

        $this->previousSession = AcademicSession::create([
            'name' => '2025-2026',
            'start_date' => now()->subYear()->startOfYear(),
            'end_date' => now()->subYear()->endOfYear(),
            'is_active' => false,
        ]);

        $this->teacher = $this->makeTeacher('Alpha Teacher');
        $this->otherTeacher = $this->makeTeacher('Beta Teacher');

        $this->schoolClass = SchoolClass::create([
            'name' => 'Grade 6',
            'code' => 'G6',
            'level' => 6,
            'active_from_session_id' => $this->activeSession->id,
            'is_active' => true,
        ]);

        $this->superAdmin = User::factory()->create();
        $this->superAdmin->assignRole(Role::findOrCreate(RoleEnum::SuperAdmin->value, 'web'));
    }

    private function makeTeacher(string $name = 'Teacher'): Teacher
    {
        $user = User::factory()->create(['name' => $name]);
        $user->assignRole(Role::findOrCreate(RoleEnum::Teacher->value, 'web'));

        return Teacher::create([
            'user_id' => $user->id,
            'employee_code' => 'EMP-'.$user->id,
            'is_active' => true,
        ]);
    }

    public function test_class_edit_form_exposes_the_existing_assignments(): void
    {
        $assignment = TeacherSubjectAssignment::create([
            'teacher_id' => $this->teacher->id,
            'academic_session_id' => $this->activeSession->id,
            'school_class_id' => $this->schoolClass->id,
            'start_time' => '08:00',
            'end_time' => '09:00',
            'days_of_week' => [1, 3],
        ]);

        $this->actingAs($this->superAdmin)
            ->get(route('classes.edit', $this->schoolClass))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Academic/Class/Form')
                ->where('can_assign', true)
                ->has('assignments', 1)
                ->where('assignments.0.id', $assignment->id)
                ->where('assignments.0.teacher_id', $this->teacher->id)
                ->where('assignments.0.academic_session_id', $this->activeSession->id)
                ->where('assignments.0.start_time', '08:00')
                ->where('assignments.0.end_time', '09:00')
                ->where('assignments.0.days_of_week', [1, 3])
            );
    }

    public function test_editing_an_existing_assignment_updates_it_in_place(): void
    {
        $assignment = TeacherSubjectAssignment::create([
            'teacher_id' => $this->teacher->id,
            'academic_session_id' => $this->activeSession->id,
            'school_class_id' => $this->schoolClass->id,
            'start_time' => '08:00',
            'end_time' => '09:00',
            'days_of_week' => [1],
        ]);

        $this->actingAs($this->superAdmin)
            ->put(route('classes.update', $this->schoolClass), [
                'name' => 'Grade 6',
                'code' => 'G6',
                'is_active' => true,
                'assignment' => [
                    'id' => $assignment->id,
                    'teacher_id' => $this->otherTeacher->id,
                    'start_time' => '10:00',
                    'end_time' => '11:00',
                    'days_of_week' => [2, 4],
                ],
            ])
            ->assertRedirect(route('classes.index'));

        // No second row may be created next to the edited one.
        $this->assertSame(1, TeacherSubjectAssignment::count());

        $assignment->refresh();

        $this->assertSame($this->otherTeacher->id, $assignment->teacher_id);
        $this->assertSame($this->schoolClass->id, $assignment->school_class_id);
        $this->assertSame('10:00', $assignment->start_time->format('H:i'));
        $this->assertSame('11:00', $assignment->end_time->format('H:i'));
        $this->assertEquals([2, 4], $assignment->days_of_week);
    }

    public function test_an_edited_assignment_keeps_its_academic_session(): void
    {
        $assignment = TeacherSubjectAssignment::create([
            'teacher_id' => $this->teacher->id,
            'academic_session_id' => $this->previousSession->id,
            'school_class_id' => $this->schoolClass->id,
            'start_time' => '08:00',
            'end_time' => '09:00',
        ]);

        $this->actingAs($this->superAdmin)
            ->put(route('classes.update', $this->schoolClass), [
                'name' => 'Grade 6',
                'code' => 'G6',
                'is_active' => true,
                'assignment' => [
                    'id' => $assignment->id,
                    'teacher_id' => $this->teacher->id,
                    'start_time' => '11:00',
                    'end_time' => '12:00',
                ],
            ])
            ->assertRedirect(route('classes.index'));

        $assignment->refresh();

        // The session is no longer picked in the browser, so an assignment
        // must stay in the session it already belongs to.
        $this->assertSame($this->previousSession->id, $assignment->academic_session_id);
        $this->assertSame('11:00', $assignment->start_time->format('H:i'));
    }

    public function test_an_assignment_of_another_class_cannot_be_updated(): void
    {
        $otherClass = SchoolClass::create([
            'name' => 'Grade 7',
            'code' => 'G7',
            'level' => 7,
            'is_active' => true,
        ]);

        $foreignAssignment = TeacherSubjectAssignment::create([
            'teacher_id' => $this->teacher->id,
            'academic_session_id' => $this->activeSession->id,
            'school_class_id' => $otherClass->id,
            'start_time' => '08:00',
            'end_time' => '09:00',
        ]);

        $this->actingAs($this->superAdmin)
            ->put(route('classes.update', $this->schoolClass), [
                'name' => 'Grade 6',
                'code' => 'G6',
                'is_active' => true,
                'assignment' => [
                    'id' => $foreignAssignment->id,
                    'teacher_id' => $this->otherTeacher->id,
                    'start_time' => '10:00',
                    'end_time' => '11:00',
                ],
            ])
            ->assertRedirect(route('classes.index'));

        $foreignAssignment->refresh();

        // The foreign row is untouched: the id is scoped to the class being
        // edited, so a crafted payload can never modify another class's row.
        $this->assertSame($this->teacher->id, $foreignAssignment->teacher_id);
        $this->assertSame($otherClass->id, $foreignAssignment->school_class_id);
        $this->assertSame('08:00', $foreignAssignment->start_time->format('H:i'));
        $this->assertSame('09:00', $foreignAssignment->end_time->format('H:i'));

        // The only other assignment is a brand new row owned by the class that
        // was actually edited, never a copy of the foreign one.
        $this->assertSame(2, TeacherSubjectAssignment::count());

        $own = TeacherSubjectAssignment::where('school_class_id', $this->schoolClass->id)->sole();

        $this->assertNotSame($foreignAssignment->id, $own->id);
        $this->assertSame($this->otherTeacher->id, $own->teacher_id);
    }

    public function test_a_missing_assignment_id_reuses_the_matching_record(): void
    {
        $assignment = TeacherSubjectAssignment::create([
            'teacher_id' => $this->teacher->id,
            'academic_session_id' => $this->activeSession->id,
            'school_class_id' => $this->schoolClass->id,
            'start_time' => '08:00',
            'end_time' => '09:00',
        ]);

        // No id is sent (the fallback path): the existing class/session/teacher
        // record is reused instead of a duplicate being created.
        $this->actingAs($this->superAdmin)
            ->put(route('classes.update', $this->schoolClass), [
                'name' => 'Grade 6',
                'code' => 'G6',
                'is_active' => true,
                'assignment' => [
                    'teacher_id' => $this->teacher->id,
                    'start_time' => '10:00',
                    'end_time' => '11:00',
                ],
            ])
            ->assertRedirect(route('classes.index'));

        $this->assertSame(1, TeacherSubjectAssignment::count());

        $assignment->refresh();

        $this->assertSame('10:00', $assignment->start_time->format('H:i'));
        $this->assertSame('11:00', $assignment->end_time->format('H:i'));
    }

    public function test_a_missing_assignment_id_reuses_an_assignment_from_an_earlier_session(): void
    {
        $assignment = TeacherSubjectAssignment::create([
            'teacher_id' => $this->teacher->id,
            'academic_session_id' => $this->previousSession->id,
            'school_class_id' => $this->schoolClass->id,
            'start_time' => '08:00',
            'end_time' => '09:00',
        ]);

        // No id is sent and the class/teacher already has an assignment in
        // an earlier session: that row is reused instead of a second one
        // being created for the active session.
        $this->actingAs($this->superAdmin)
            ->put(route('classes.update', $this->schoolClass), [
                'name' => 'Grade 6',
                'code' => 'G6',
                'is_active' => true,
                'assignment' => [
                    'teacher_id' => $this->teacher->id,
                    'start_time' => '10:00',
                    'end_time' => '11:00',
                ],
            ])
            ->assertRedirect(route('classes.index'));

        $this->assertSame(1, TeacherSubjectAssignment::count());

        $assignment->refresh();

        $this->assertSame('10:00', $assignment->start_time->format('H:i'));
        $this->assertSame($this->previousSession->id, $assignment->academic_session_id);
    }

    public function test_a_submitted_session_cannot_move_an_assignment(): void
    {
        $assignment = TeacherSubjectAssignment::create([
            'teacher_id' => $this->teacher->id,
            'academic_session_id' => $this->previousSession->id,
            'school_class_id' => $this->schoolClass->id,
            'start_time' => '08:00',
            'end_time' => '09:00',
        ]);

        // The session is resolved on the server, so a crafted payload cannot
        // drag the assignment into another academic session.
        $this->actingAs($this->superAdmin)
            ->put(route('classes.update', $this->schoolClass), [
                'name' => 'Grade 6',
                'code' => 'G6',
                'is_active' => true,
                'assignment' => [
                    'id' => $assignment->id,
                    'teacher_id' => $this->teacher->id,
                    'academic_session_id' => $this->activeSession->id,
                    'start_time' => '10:00',
                    'end_time' => '11:00',
                ],
            ])
            ->assertRedirect(route('classes.index'));

        $assignment->refresh();

        $this->assertSame($this->previousSession->id, $assignment->academic_session_id);
        $this->assertSame(1, TeacherSubjectAssignment::count());
    }

    public function test_an_inactive_assigned_teacher_stays_available_in_the_edit_form(): void
    {
        $this->teacher->update(['is_active' => false]);

        TeacherSubjectAssignment::create([
            'teacher_id' => $this->teacher->id,
            'academic_session_id' => $this->activeSession->id,
            'school_class_id' => $this->schoolClass->id,
            'start_time' => '08:00',
            'end_time' => '09:00',
        ]);

        $this->actingAs($this->superAdmin)
            ->get(route('classes.edit', $this->schoolClass))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('teachers', 2)
                ->where('teachers.0.id', $this->teacher->id)
                ->where('teachers.1.id', $this->otherTeacher->id)
            );
    }

    public function test_a_user_without_assignment_permission_cannot_alter_assignments(): void
    {
        $assignment = TeacherSubjectAssignment::create([
            'teacher_id' => $this->teacher->id,
            'academic_session_id' => $this->activeSession->id,
            'school_class_id' => $this->schoolClass->id,
            'start_time' => '08:00',
            'end_time' => '09:00',
        ]);

        $user = User::factory()->create();
        $role = Role::findOrCreate('Class Editor', 'web');
        $role->syncPermissions([PermissionEnum::UpdateClasses->value]);
        $user->assignRole($role);

        $this->actingAs($user)
            ->get(route('classes.edit', $this->schoolClass))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('can_assign', false)
                ->where('teachers', [])
            );

        // A crafted payload must update the class but never the assignment.
        $this->actingAs($user)
            ->put(route('classes.update', $this->schoolClass), [
                'name' => 'Grade 6 Renamed',
                'code' => 'G6',
                'is_active' => true,
                'assignment' => [
                    'id' => $assignment->id,
                    'teacher_id' => $this->otherTeacher->id,
                    'start_time' => '10:00',
                    'end_time' => '11:00',
                ],
            ])
            ->assertRedirect(route('classes.index'));

        $assignment->refresh();

        $this->assertSame($this->teacher->id, $assignment->teacher_id);
        $this->assertSame('08:00', $assignment->start_time->format('H:i'));
        $this->assertSame(1, TeacherSubjectAssignment::count());
        $this->assertDatabaseHas('school_classes', ['code' => 'G6', 'name' => 'Grade 6 Renamed']);
    }
}
