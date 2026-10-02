<?php

namespace Tests\Feature;

use App\Enums\GenderEnum;
use App\Enums\RoleEnum;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SectionStudentsListTest extends TestCase
{
    use RefreshDatabase;

    private AcademicSession $session;

    private SchoolClass $class;

    private Section $section;

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
            'level' => 5,
            'is_active' => true,
        ]);

        $this->section = Section::create([
            'name' => 'A',
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
        ]);

        $this->admin = User::factory()->create();
        $this->admin->assignRole(Role::findOrCreate(RoleEnum::SuperAdmin->value, 'web'));
    }

    public function test_it_lists_the_students_enrolled_in_the_section(): void
    {
        $ali = $this->enrollStudent('Ali Khan', 'ADM-001', '1');
        $sara = $this->enrollStudent('Sara Ahmed', 'ADM-002', '2');

        // A student enrolled in another section must not show up.
        $otherSection = Section::create([
            'name' => 'B',
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
        ]);
        $this->enrollStudent('Hidden Student', 'ADM-003', '1', $otherSection);

        $this->actingAs($this->admin)
            ->getJson(route('sections.students', $this->section))
            ->assertOk()
            ->assertJsonPath('section.id', $this->section->id)
            ->assertJsonPath('total', 2)
            ->assertJsonPath('students.0.name', 'Ali Khan')
            ->assertJsonPath('students.0.roll_number', '1')
            ->assertJsonPath('students.0.admission_number', 'ADM-001')
            ->assertJsonPath('students.1.name', 'Sara Ahmed')
            ->assertJsonCount(2, 'students');

        $this->assertEqualsCanonicalizing(
            [$ali->id, $sara->id],
            $this->section->enrollments()->pluck('student_id')->all(),
        );
    }

    public function test_it_returns_an_empty_list_for_a_section_without_students(): void
    {
        $this->actingAs($this->admin)
            ->getJson(route('sections.students', $this->section))
            ->assertOk()
            ->assertJsonPath('total', 0)
            ->assertJsonCount(0, 'students');
    }

    public function test_it_can_search_the_enrolled_students(): void
    {
        $this->enrollStudent('Ali Khan', 'ADM-001', '1');
        $this->enrollStudent('Sara Ahmed', 'ADM-002', '2');

        $this->actingAs($this->admin)
            ->getJson(route('sections.students', [$this->section, 'search' => 'Sara']))
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('students.0.name', 'Sara Ahmed');
    }

    public function test_it_requires_authentication(): void
    {
        $this->getJson(route('sections.students', $this->section))
            ->assertUnauthorized();
    }

    public function test_section_index_exposes_the_enrollment_count(): void
    {
        $this->enrollStudent('Ali Khan', 'ADM-001', '1');

        $this->actingAs($this->admin)
            ->get(route('sections.index', ['school_class_id' => $this->class->id]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Academic/Section/Index')
                ->where('sections.data.0.enrollments_count', 1)
            );
    }

    private function enrollStudent(string $name, string $admissionNumber, string $rollNumber, ?Section $section = null): Student
    {
        $user = User::factory()->create(['name' => $name]);
        $student = Student::create([
            'user_id' => $user->id,
            'admission_number' => $admissionNumber,
            'admission_date' => now()->toDateString(),
            'gender' => GenderEnum::Male->value,
            'is_active' => true,
        ]);

        StudentEnrollment::create([
            'student_id' => $student->id,
            'academic_session_id' => $this->session->id,
            'school_class_id' => $this->class->id,
            'section_id' => ($section ?? $this->section)->id,
            'roll_number' => $rollNumber,
            'enrolled_on' => now()->toDateString(),
            'status' => 'active',
        ]);

        return $student;
    }
}
