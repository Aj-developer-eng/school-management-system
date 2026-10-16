<?php

namespace Tests\Feature;

use App\Enums\GenderEnum;
use App\Enums\RoleEnum;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\StudentEnrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class StudentSectionOptionalTest extends TestCase
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

    public function test_create_student_without_section_id_stores_null_section(): void
    {
        $payload = $this->studentPayload();
        unset($payload['section_id']);

        $this->actingAs($this->admin)
            ->post(route('students.store'), $payload)
            ->assertRedirect(route('students.index'))
            ->assertSessionHasNoErrors();

        $this->assertNull(StudentEnrollment::query()->firstOrFail()->section_id);
    }

    public function test_create_student_with_empty_section_string_stores_null_section(): void
    {
        // The untouched form submits section_id as an empty string, which the
        // empty-string-to-null middleware normalizes before validation.
        $this->actingAs($this->admin)
            ->post(route('students.store'), [...$this->studentPayload(), 'section_id' => ''])
            ->assertRedirect(route('students.index'))
            ->assertSessionHasNoErrors();

        $this->assertNull(StudentEnrollment::query()->firstOrFail()->section_id);
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
}