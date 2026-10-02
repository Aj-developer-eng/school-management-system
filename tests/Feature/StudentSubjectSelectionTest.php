<?php

namespace Tests\Feature;

use App\Enums\GenderEnum;
use App\Enums\RoleEnum;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class StudentSubjectSelectionTest extends TestCase
{
    use RefreshDatabase;

    private AcademicSession $session;

    private SchoolClass $class;

    private Section $section;

    private User $admin;

    private Subject $mathematics;

    private Subject $physics;

    private Subject $chemistry;

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

        // StudentService assigns this role when a student account is created.
        Role::findOrCreate(RoleEnum::Student->value, 'web');

        $this->mathematics = $this->makeSubject('Mathematics', 'MATH');
        $this->physics = $this->makeSubject('Physics', 'PHY');
        $this->chemistry = $this->makeSubject('Chemistry', 'CHEM', ['is_active' => false]);

        // Only Mathematics and Physics are offered to the class.
        $this->class->subjects()->sync([$this->mathematics->id, $this->physics->id]);
    }

    public function test_student_form_lists_active_subjects_with_class_mapping(): void
    {
        $this->actingAs($this->admin)
            ->get(route('students.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Student/Form')
                ->has('subjects', 2)
                ->where('subjects.0.name', 'Mathematics')
                ->where('subjects.0.code', 'MATH')
                ->where('subjects.0.school_class_ids', [$this->class->id])
                ->where('subjects.1.name', 'Physics')
                ->has('selected_subject_ids', 0)
            );
    }

    public function test_student_is_created_with_selected_subjects(): void
    {
        $this->actingAs($this->admin)
            ->post(route('students.store'), [
                ...$this->studentPayload(),
                'subject_ids' => [$this->mathematics->id, $this->physics->id],
            ])
            ->assertRedirect(route('students.index'));

        $student = Student::query()->latest('id')->firstOrFail();

        $this->assertEqualsCanonicalizing(
            [$this->mathematics->id, $this->physics->id],
            $student->subjects()->pluck('subjects.id')->all(),
        );
    }

    public function test_subject_selection_is_optional_when_creating_a_student(): void
    {
        $this->actingAs($this->admin)
            ->post(route('students.store'), $this->studentPayload())
            ->assertRedirect(route('students.index'));

        $student = Student::query()->latest('id')->firstOrFail();

        $this->assertCount(0, $student->subjects);
    }

    public function test_updating_a_student_syncs_the_subject_selection(): void
    {
        $this->actingAs($this->admin)->post(route('students.store'), [
            ...$this->studentPayload(),
            'subject_ids' => [$this->mathematics->id, $this->physics->id],
        ]);

        $student = Student::query()->latest('id')->firstOrFail();

        $this->actingAs($this->admin)->put(route('students.update', $student), [
            ...$this->studentPayload(),
            'name' => 'Updated Student',
            'subject_ids' => [$this->physics->id],
        ])->assertRedirect(route('students.index'));

        $this->assertSame([$this->physics->id], $student->fresh()->subjects()->pluck('subjects.id')->all());
    }

    public function test_student_edit_form_prefills_the_saved_subjects(): void
    {
        $this->actingAs($this->admin)->post(route('students.store'), [
            ...$this->studentPayload(),
            'subject_ids' => [$this->physics->id],
        ]);

        $student = Student::query()->latest('id')->firstOrFail();

        $this->actingAs($this->admin)
            ->get(route('students.edit', $student))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Student/Form')
                ->where('selected_subject_ids', [$this->physics->id])
            );
    }

    public function test_student_show_page_lists_the_student_subjects(): void
    {
        $this->actingAs($this->admin)->post(route('students.store'), [
            ...$this->studentPayload(),
            'subject_ids' => [$this->physics->id, $this->mathematics->id],
        ]);

        $student = Student::query()->latest('id')->firstOrFail();

        $this->actingAs($this->admin)
            ->get(route('students.show', $student))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Student/Show')
                ->has('student.subjects', 2)
                // Sorted by name, not by the order they were submitted in.
                ->where('student.subjects.0.name', 'Mathematics')
                ->where('student.subjects.0.code', 'MATH')
                ->where('student.subjects.1.name', 'Physics')
                ->where('student.subjects.1.code', 'PHY')
            );
    }

    public function test_student_show_page_lists_only_the_students_own_subjects(): void
    {
        $this->actingAs($this->admin)->post(route('students.store'), [
            ...$this->studentPayload(),
            'subject_ids' => [$this->mathematics->id],
        ]);

        $student = Student::query()->latest('id')->firstOrFail();

        // Chemistry belongs to the class but not to this student, and Physics is
        // assigned to nobody — neither may leak onto the page.
        $this->actingAs($this->admin)
            ->get(route('students.show', $student))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('student.subjects', 1)
                ->where('student.subjects.0.name', 'Mathematics')
            );
    }

    public function test_student_show_page_reports_no_subjects_when_none_are_assigned(): void
    {
        $this->actingAs($this->admin)->post(route('students.store'), $this->studentPayload());

        $student = Student::query()->latest('id')->firstOrFail();

        $this->actingAs($this->admin)
            ->get(route('students.show', $student))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('student.subjects', 0)
            );
    }

    public function test_unknown_subject_id_is_rejected(): void
    {
        $this->actingAs($this->admin)
            ->post(route('students.store'), [
                ...$this->studentPayload(),
                'subject_ids' => [99999],
            ])
            ->assertSessionHasErrors('subject_ids.0');

        $this->assertDatabaseCount('students', 0);
        $this->assertDatabaseCount('student_subject', 0);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function makeSubject(string $name, string $code, array $attributes = []): Subject
    {
        return Subject::create([
            'name' => $name,
            'code' => $code,
            'is_active' => true,
            ...$attributes,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function studentPayload(): array
    {
        return [
            'name' => 'Ali Khan',
            'email' => null,
            'phone' => '03001234567',
            'admission_date' => now()->toDateString(),
            'date_of_birth' => now()->subYears(10)->toDateString(),
            'gender' => GenderEnum::Male->value,
            'blood_group' => 'O+',
            'religion' => 'Islam',
            'nationality' => 'Pakistani',
            'cnic_bform' => '35202-1234567-1',
            'address' => '123 Test Street',
            'previous_school' => null,
            'medical_notes' => 'None',
            'academic_session_id' => $this->session->id,
            'school_class_id' => $this->class->id,
            'section_id' => $this->section->id,
            'roll_number' => '1',
            'enrolled_on' => now()->toDateString(),
        ];
    }
}
