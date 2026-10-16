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

class StudentRollNumberTest extends TestCase
{
    use RefreshDatabase;

    private AcademicSession $session;

    private SchoolClass $class;

    private SchoolClass $otherClass;

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
            'is_active' => true,
        ]);

        $this->otherClass = SchoolClass::create([
            'name' => 'Grade 6',
            'code' => 'G6',
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
    }

    public function test_roll_number_is_auto_generated_on_create_and_submitted_value_is_ignored(): void
    {
        $this->actingAs($this->admin)
            ->post(route('students.store'), [
                ...$this->studentPayload(),
                // A tampered client value must not survive server-side generation.
                'roll_number' => '999',
            ])
            ->assertRedirect(route('students.index'));

        $student = Student::query()->latest('id')->firstOrFail();

        $this->assertSame('1', $student->enrollments()->first()->roll_number);
    }

    public function test_roll_numbers_increment_per_class_and_stay_unique(): void
    {
        $this->actingAs($this->admin)->post(route('students.store'), $this->studentPayload())
            ->assertRedirect(route('students.index'));

        $this->actingAs($this->admin)->post(route('students.store'), $this->studentPayload())
            ->assertRedirect(route('students.index'));

        $rollNumbers = StudentEnrollment::query()->pluck('roll_number')->sort()->values()->all();

        $this->assertSame(['1', '2'], $rollNumbers);
    }

    public function test_roll_numbers_are_scoped_per_class(): void
    {
        $this->actingAs($this->admin)->post(route('students.store'), $this->studentPayload())
            ->assertRedirect(route('students.index'));

        $this->actingAs($this->admin)
            ->post(route('students.store'), [
                ...$this->studentPayload(),
                'school_class_id' => $this->otherClass->id,
                'section_id' => null,
            ])
            ->assertRedirect(route('students.index'));

        $this->assertSame(
            '1',
            StudentEnrollment::query()
                ->where('school_class_id', $this->otherClass->id)
                ->value('roll_number'),
        );
    }

    public function test_generation_skips_legacy_roll_numbers_already_in_use(): void
    {
        // A legacy manual entry occupies "1" without ever touching the counter.
        $this->enrollStudent('SCH-LEGACY-1', '1');

        $this->actingAs($this->admin)->post(route('students.store'), $this->studentPayload())
            ->assertRedirect(route('students.index'));

        $student = Student::query()->latest('id')->firstOrFail();

        $this->assertSame('2', $student->enrollments()->first()->roll_number);
    }

    public function test_next_roll_number_preview_returns_the_next_value_without_consuming_it(): void
    {
        $uri = route('students.next-roll-number', [
            'academic_session_id' => $this->session->id,
            'school_class_id' => $this->class->id,
        ]);

        $this->actingAs($this->admin)->get($uri)->assertOk()->assertJson(['roll_number' => '1']);
        $this->actingAs($this->admin)->get($uri)->assertOk()->assertJson(['roll_number' => '1']);

        // The preview must not consume a number: the stored student gets "1".
        $this->actingAs($this->admin)->post(route('students.store'), $this->studentPayload())
            ->assertRedirect(route('students.index'));

        $student = Student::query()->latest('id')->firstOrFail();

        $this->assertSame('1', $student->enrollments()->first()->roll_number);
    }

    public function test_next_roll_number_requires_create_permission(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('students.next-roll-number', [
                'academic_session_id' => $this->session->id,
                'school_class_id' => $this->class->id,
            ]))
            ->assertForbidden();
    }

    public function test_update_rejects_duplicate_roll_number_within_the_same_class_and_session(): void
    {
        $this->actingAs($this->admin)->post(route('students.store'), $this->studentPayload())
            ->assertRedirect(route('students.index'));

        $this->actingAs($this->admin)->post(route('students.store'), $this->studentPayload())
            ->assertRedirect(route('students.index'));

        [, $second] = Student::query()->with('user')->orderBy('id')->get();

        $this->actingAs($this->admin)
            ->put(route('students.update', $second), $this->updatePayload($second, ['roll_number' => '1']))
            ->assertSessionHasErrors('roll_number');
    }

    public function test_update_allows_keeping_the_existing_roll_number(): void
    {
        $this->actingAs($this->admin)->post(route('students.store'), $this->studentPayload())
            ->assertRedirect(route('students.index'));

        $student = Student::query()->latest('id')->firstOrFail();

        $this->actingAs($this->admin)
            ->put(route('students.update', $student), $this->updatePayload($student, ['roll_number' => '1']))
            ->assertRedirect(route('students.index'));

        $this->assertSame('1', $student->enrollments()->first()->roll_number);
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
            'enrolled_on' => now()->toDateString(),
        ];
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function updatePayload(Student $student, array $overrides = []): array
    {
        return [
            ...$this->studentPayload(),
            'name' => $student->user->name,
            'email' => $student->user->email,
            ...$overrides,
        ];
    }
}

