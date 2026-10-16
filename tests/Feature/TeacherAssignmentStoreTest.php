<?php

namespace Tests\Feature;

use App\Enums\RoleEnum;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TeacherSubjectAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TeacherAssignmentStoreTest extends TestCase
{
    use RefreshDatabase;

    private AcademicSession $session;

    private SchoolClass $class;

    private Section $section;

    private Subject $subject;

    private Teacher $teacher;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->session = AcademicSession::create([
            'name' => '2026-2027',
            'start_date' => now()->startOfYear(),
            'end_date' => now()->endOfYear(),
            'is_active' => true,
        ]);

        $this->class = SchoolClass::create([
            'name' => 'Grade 5',
            'code' => 'G5',
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

        // Only Mathematics is offered to the class.
        $this->class->subjects()->sync([$this->subject->id]);

        $teacherUser = User::factory()->create();
        $this->teacher = Teacher::create([
            'user_id' => $teacherUser->id,
            'employee_code' => 'EMP-001',
            'is_active' => true,
        ]);

        $this->admin = User::factory()->create();
        $this->admin->assignRole(Role::findOrCreate(RoleEnum::SuperAdmin->value, 'web'));
    }

    public function test_the_section_column_is_nullable(): void
    {
        // The form labels the section "Section (Optional)" and both form requests
        // validate it as `nullable`, so the physical schema must agree - otherwise
        // saving an assignment without a section blows up with a 1048 constraint
        // violation instead of a validation error.
        $column = collect(Schema::getColumns('teacher_subject_assignments'))
            ->firstWhere('name', 'section_id');

        $this->assertNotNull($column);
        $this->assertTrue($column['nullable']);
    }

    public function test_an_assignment_can_be_created_without_a_section(): void
    {
        $this->actingAs($this->admin)
            ->post(route('teacher-assignments.store'), [
                ...$this->assignmentPayload(),
                'section_id' => null,
            ])
            ->assertRedirect(route('teacher-assignments.index'))
            ->assertSessionHas('success');

        $assignment = TeacherSubjectAssignment::query()->latest('id')->firstOrFail();

        $this->assertNull($assignment->section_id);
        $this->assertSame($this->teacher->id, $assignment->teacher_id);
        $this->assertSame($this->subject->id, $assignment->subject_id);
    }

    public function test_an_assignment_can_still_be_created_with_a_section(): void
    {
        $this->actingAs($this->admin)
            ->post(route('teacher-assignments.store'), $this->assignmentPayload())
            ->assertRedirect(route('teacher-assignments.index'))
            ->assertSessionHas('success');

        $assignment = TeacherSubjectAssignment::query()->latest('id')->firstOrFail();

        $this->assertSame($this->section->id, $assignment->section_id);
    }

    public function test_the_section_must_belong_to_the_selected_class_and_session(): void
    {
        $otherClass = SchoolClass::create([
            'name' => 'Grade 6',
            'code' => 'G6',
            'is_active' => true,
        ]);

        $foreignSection = Section::create([
            'name' => 'B',
            'school_class_id' => $otherClass->id,
            'academic_session_id' => $this->session->id,
        ]);

        $this->actingAs($this->admin)
            ->post(route('teacher-assignments.store'), [
                ...$this->assignmentPayload(),
                'section_id' => $foreignSection->id,
            ])
            ->assertSessionHasErrors('section_id');

        $this->assertDatabaseCount('teacher_subject_assignments', 0);
    }

    /**
     * @return array<string, mixed>
     */
    private function assignmentPayload(): array
    {
        return [
            'teacher_id' => $this->teacher->id,
            'academic_session_id' => $this->session->id,
            'school_class_id' => $this->class->id,
            'section_id' => $this->section->id,
            'subject_id' => $this->subject->id,
            'start_time' => '08:30',
            'end_time' => '09:00',
            'days_of_week' => [1, 2, 3, 4, 5],
        ];
    }
}
