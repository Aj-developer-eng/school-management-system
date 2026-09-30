<?php

namespace Tests\Feature;

use App\Enums\RoleEnum;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentParent;
use App\Models\Subject;
use App\Models\SubjectNote;
use App\Models\Teacher;
use App\Models\TeacherSubjectAssignment;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SubjectNoteTest extends TestCase
{
    use RefreshDatabase;

    private AcademicSession $session;

    private User $teacherUser;

    private Teacher $teacher;

    private SchoolClass $class;

    private Section $section;

    private Subject $subject;

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

        $this->teacherUser = User::factory()->create();
        $this->teacherUser->assignRole(Role::findOrCreate(RoleEnum::Teacher->value, 'web'));

        $this->teacher = Teacher::create([
            'user_id' => $this->teacherUser->id,
            'employee_code' => 'EMP-'.$this->teacherUser->id,
        ]);

        $this->class = SchoolClass::create([
            'name' => 'Grade 5',
            'code' => 'G5',
            'level' => 5,
            'is_active' => true,
        ]);

        $this->section = Section::create([
            'name' => 'A',
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
        ]);

        $this->subject = Subject::create([
            'name' => 'Mathematics',
            'code' => 'MATH',
            'is_active' => true,
        ]);

        // The subject is offered by the class and taught by the teacher.
        $this->class->subjects()->sync([$this->subject->id]);

        TeacherSubjectAssignment::create([
            'teacher_id' => $this->teacher->id,
            'academic_session_id' => $this->session->id,
            'school_class_id' => $this->class->id,
            'section_id' => $this->section->id,
            'subject_id' => $this->subject->id,
        ]);

        $this->student = $this->enrollStudent('ADM-001', '1');
        $this->parentUser = $this->makeParent($this->student);
    }

    public function test_teacher_can_add_a_note_and_parents_are_notified(): void
    {
        $this->actingAs($this->teacherUser)
            ->post(route('subjects.notes.store', $this->subject), [
                'note' => 'Covered Chapter 4 — fractions and decimals.',
                'note_date' => now()->toDateString(),
                'is_active' => true,
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('subject_notes', [
            'subject_id' => $this->subject->id,
            'teacher_id' => $this->teacher->id,
            'note' => 'Covered Chapter 4 — fractions and decimals.',
            'is_active' => true,
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->parentUser->id,
            'type' => 'subject_note',
        ]);
    }

    public function test_note_requires_a_body_and_date(): void
    {
        $this->actingAs($this->teacherUser)
            ->post(route('subjects.notes.store', $this->subject), [])
            ->assertSessionHasErrors(['note', 'note_date']);

        $this->assertDatabaseCount('subject_notes', 0);
    }

    public function test_inactive_note_is_saved_without_notifying_parents(): void
    {
        $this->actingAs($this->teacherUser)
            ->post(route('subjects.notes.store', $this->subject), [
                'note' => 'Draft note, not shared yet.',
                'note_date' => now()->toDateString(),
                'is_active' => false,
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('subject_notes', [
            'subject_id' => $this->subject->id,
            'is_active' => false,
        ]);

        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_teacher_cannot_add_a_note_for_a_subject_they_do_not_teach(): void
    {
        $otherSubject = Subject::create([
            'name' => 'Physics',
            'code' => 'PHY',
            'is_active' => true,
        ]);

        $this->actingAs($this->teacherUser)
            ->post(route('subjects.notes.store', $otherSubject), [
                'note' => 'Should not be allowed.',
                'note_date' => now()->toDateString(),
                'is_active' => true,
            ])
            ->assertForbidden();

        $this->assertDatabaseCount('subject_notes', 0);
        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_super_admin_can_add_a_note_for_any_subject_without_being_a_teacher(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(Role::findOrCreate(RoleEnum::SuperAdmin->value, 'web'));

        $this->actingAs($admin)
            ->post(route('subjects.notes.store', $this->subject), [
                'note' => 'Revision session for the whole class.',
                'note_date' => now()->toDateString(),
                'is_active' => true,
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        // Super Admin has no teacher profile, so the note stays unattributed.
        $this->assertDatabaseHas('subject_notes', [
            'subject_id' => $this->subject->id,
            'teacher_id' => null,
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->parentUser->id,
            'type' => 'subject_note',
        ]);
    }

    public function test_role_without_the_permission_cannot_add_a_note(): void
    {
        $accountant = User::factory()->create();
        $accountant->assignRole(Role::findOrCreate(RoleEnum::Accountant->value, 'web'));

        $this->actingAs($accountant)
            ->post(route('subjects.notes.store', $this->subject), [
                'note' => 'Should not be allowed.',
                'note_date' => now()->toDateString(),
                'is_active' => true,
            ])
            ->assertForbidden();

        $this->assertDatabaseCount('subject_notes', 0);
    }

    public function test_teacher_can_toggle_a_note_between_active_and_inactive(): void
    {
        $note = $this->makeNote(true);

        $this->actingAs($this->teacherUser)
            ->patch(route('subject-notes.toggle-active', $note))
            ->assertRedirect();

        $this->assertFalse($note->fresh()->is_active);

        $this->actingAs($this->teacherUser)
            ->patch(route('subject-notes.toggle-active', $note))
            ->assertRedirect();

        $this->assertTrue($note->fresh()->is_active);
    }

    public function test_teacher_can_delete_a_note(): void
    {
        $note = $this->makeNote(true);

        $this->actingAs($this->teacherUser)
            ->delete(route('subject-notes.destroy', $note))
            ->assertRedirect();

        $this->assertSoftDeleted('subject_notes', ['id' => $note->id]);
    }

    public function test_parent_dashboard_lists_active_notes_and_hides_inactive_ones(): void
    {
        $active = $this->makeNote(true, 'Fractions were covered today.');
        $this->makeNote(false, 'Draft, not shared.');

        $this->actingAs($this->parentUser)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('classNotes', 1)
                ->where('classNotes.0.id', $active->id)
                ->where('classNotes.0.subject', 'Mathematics')
                ->where('classNotes.0.note', 'Fractions were covered today.')
                ->where('classNotes.0.teacher', $this->teacherUser->name)
            );
    }

    public function test_parent_dashboard_omits_notes_for_subjects_the_child_does_not_take(): void
    {
        $unmapped = Subject::create([
            'name' => 'Chemistry',
            'code' => 'CHEM',
            'is_active' => true,
        ]);

        $this->actingAs($this->teacherUser)
            ->post(route('subjects.notes.store', $this->subject), [
                'note' => 'Seen by parents.',
                'note_date' => now()->toDateString(),
                'is_active' => true,
            ]);

        // Chemistry is not mapped to the child's class.
        SubjectNote::create([
            'subject_id' => $unmapped->id,
            'teacher_id' => $this->teacher->id,
            'academic_session_id' => $this->session->id,
            'note' => 'Not for this child.',
            'note_date' => now()->toDateString(),
            'is_active' => true,
        ]);

        $this->actingAs($this->parentUser)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('classNotes', 1)
                ->where('classNotes.0.subject', 'Mathematics')
            );
    }

    public function test_subjects_index_shares_the_notes_of_each_subject(): void
    {
        $this->makeNote(true, 'Fractions were covered today.');

        $this->actingAs($this->teacherUser)
            ->get(route('subjects.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Academic/Subject/Index')
                ->has('subjects.data', 1)
                ->has('subjects.data.0.notes', 1)
                ->where('subjects.data.0.notes.0.note', 'Fractions were covered today.')
                ->where('subjects.data.0.notes.0.teacher.user.name', $this->teacherUser->name)
            );
    }

    public function test_note_is_notified_to_every_parent_of_the_class(): void
    {
        $secondStudent = $this->enrollStudent('ADM-002', '2');
        $secondParentUser = $this->makeParent($secondStudent);

        $this->actingAs($this->teacherUser)
            ->post(route('subjects.notes.store', $this->subject), [
                'note' => 'Class-wide announcement.',
                'note_date' => now()->toDateString(),
                'is_active' => true,
            ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->parentUser->id,
            'type' => 'subject_note',
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $secondParentUser->id,
            'type' => 'subject_note',
        ]);
    }

    private function enrollStudent(string $admissionNumber, string $rollNumber): Student
    {
        $student = Student::create([
            'user_id' => User::factory()->create()->id,
            'admission_number' => $admissionNumber,
            'admission_date' => now()->toDateString(),
        ]);

        StudentEnrollment::create([
            'student_id' => $student->id,
            'academic_session_id' => $this->session->id,
            'school_class_id' => $this->class->id,
            'section_id' => $this->section->id,
            'roll_number' => $rollNumber,
            'enrolled_on' => now()->toDateString(),
        ]);

        return $student;
    }

    private function makeParent(Student $student): User
    {
        $parentUser = User::factory()->create();
        $parentUser->assignRole(Role::findOrCreate(RoleEnum::Parent->value, 'web'));

        $parent = StudentParent::create([
            'user_id' => $parentUser->id,
            'is_active' => true,
        ]);

        $parent->students()->attach($student->id, [
            'guardian_type' => 'Father',
            'is_primary_contact' => true,
        ]);

        return $parentUser;
    }

    private function makeNote(bool $isActive, string $body = 'Covered today\'s lesson.'): SubjectNote
    {
        return SubjectNote::create([
            'subject_id' => $this->subject->id,
            'teacher_id' => $this->teacher->id,
            'academic_session_id' => $this->session->id,
            'note' => $body,
            'note_date' => now()->toDateString(),
            'is_active' => $isActive,
        ]);
    }
}
