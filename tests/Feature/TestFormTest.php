<?php

namespace Tests\Feature;

use App\Enums\RoleEnum;
use App\Enums\TestStatusEnum;
use App\Enums\TestTypeEnum;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Teacher;
use App\Models\TeacherSubjectAssignment;
use App\Models\Test;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TestFormTest extends TestCase
{
    use RefreshDatabase;

    private AcademicSession $session;

    private User $teacherUser;

    private Teacher $teacher;

    protected function setUp(): void
    {
        parent::setUp();

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
    }

    public function test_create_form_labels_the_class_dropdown_with_class_and_time(): void
    {
        $assignment = $this->makeAssignment('Grade 5', [
            'start_time' => '08:00',
            'end_time' => '09:30',
        ]);

        $this->actingAs($this->teacherUser)
            ->get(route('tests.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Test/Form')
                ->has('assignments', 1)
                ->where('assignments.0.id', $assignment->id)
                ->where('assignments.0.label', 'Grade 5 · 08:00 – 09:30')
                ->where('assignments.0.school_class_id', $assignment->school_class_id)
            );
    }

    public function test_create_form_falls_back_to_the_class_name_when_no_time_is_set(): void
    {
        $this->makeAssignment('Grade 5');

        $this->actingAs($this->teacherUser)
            ->get(route('tests.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Test/Form')
                ->has('assignments', 1)
                ->where('assignments.0.label', 'Grade 5')
            );
    }

    public function test_edit_form_uses_the_same_labelled_options(): void
    {
        $assignment = $this->makeAssignment('Grade 5', [
            'start_time' => '10:00',
            'end_time' => '11:00',
        ]);

        $test = Test::create([
            'teacher_subject_assignment_id' => $assignment->id,
            'teacher_id' => $this->teacher->id,
            'academic_session_id' => $this->session->id,
            'school_class_id' => $assignment->school_class_id,
            'title' => 'Quiz One',
            'test_type' => TestTypeEnum::Quiz,
            'test_date' => now()->toDateString(),
            'total_marks' => 100,
            'passing_marks' => 40,
            'status' => TestStatusEnum::Announced,
        ]);

        $this->actingAs($this->teacherUser)
            ->get(route('tests.edit', $test))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Test/Form')
                ->where('test.id', $test->id)
                ->has('assignments', 1)
                ->where('assignments.0.label', 'Grade 5 · 10:00 – 11:00')
            );
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function makeAssignment(string $className, array $overrides = []): TeacherSubjectAssignment
    {
        $class = SchoolClass::create([
            'name' => $className,
            'code' => 'G'.SchoolClass::count(),
            'level' => SchoolClass::count() + 1,
            'is_active' => true,
        ]);

        return TeacherSubjectAssignment::create(array_merge([
            'teacher_id' => $this->teacher->id,
            'academic_session_id' => $this->session->id,
            'school_class_id' => $class->id,
        ], $overrides));
    }
}
