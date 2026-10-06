<?php

namespace Tests\Feature;

use App\Enums\RoleEnum;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class StudentMultiClassEnrollmentTest extends TestCase
{
    use RefreshDatabase;

    private AcademicSession $session;

    private SchoolClass $classA;

    private SchoolClass $classB;

    private SchoolClass $classC;

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

        $this->classA = $this->makeClass('Class A', 'CA', 1);
        $this->classB = $this->makeClass('Class B', 'CB', 2);
        $this->classC = $this->makeClass('Class C', 'CC', 3);

        $this->admin = User::factory()->create();
        $this->admin->assignRole(Role::findOrCreate(RoleEnum::SuperAdmin->value, 'web'));
    }

    public function test_a_student_can_be_enrolled_in_multiple_classes_at_once(): void
    {
        $this->actingAs($this->admin)
            ->post(route('students.store'), $this->payload([
                'school_class_ids' => [$this->classA->id, $this->classB->id],
            ]))
            ->assertRedirect(route('students.index'));

        $student = Student::latest('id')->firstOrFail();
        $classIds = $student->enrollments()
            ->where('academic_session_id', $this->session->id)
            ->pluck('school_class_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $this->assertEqualsCanonicalizing([$this->classA->id, $this->classB->id], $classIds);
    }

    public function test_duplicate_class_ids_are_rejected_by_validation(): void
    {
        $this->actingAs($this->admin)
            ->post(route('students.store'), $this->payload([
                'school_class_ids' => [$this->classA->id, $this->classA->id],
            ]))
            ->assertSessionHasErrors('school_class_ids.1');

        $this->assertSame(0, Student::count());
    }

    public function test_at_least_one_class_is_required(): void
    {
        $this->actingAs($this->admin)
            ->post(route('students.store'), $this->payload([
                'school_class_ids' => [],
            ]))
            ->assertSessionHasErrors('school_class_ids');
    }

    public function test_updating_the_class_selection_reconciles_the_enrollments(): void
    {
        $student = $this->makeStudentWithClasses([$this->classA->id, $this->classB->id]);

        $this->actingAs($this->admin)
            ->put(route('students.update', $student), $this->payload([
                'school_class_ids' => [$this->classB->id, $this->classC->id],
            ], $student))
            ->assertRedirect(route('students.index'));

        $kept = $student->enrollments()
            ->where('academic_session_id', $this->session->id)
            ->pluck('school_class_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $this->assertEqualsCanonicalizing([$this->classB->id, $this->classC->id], $kept);

        // The unselected class is soft-deleted, not hard-deleted.
        $this->assertSoftDeleted('student_enrollments', [
            'student_id' => $student->id,
            'school_class_id' => $this->classA->id,
        ]);
    }

    public function test_the_students_index_lists_every_enrolled_class(): void
    {
        $this->makeStudentWithClasses([$this->classA->id, $this->classB->id]);

        $this->actingAs($this->admin)
            ->get(route('students.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Student/Index')
                ->has('students.data.0.enrollments', 2)
            );
    }

    /**
     * @param  list<int>  $classIds
     */
    private function makeStudentWithClasses(array $classIds): Student
    {
        $student = Student::create([
            'user_id' => User::factory()->create()->id,
            'admission_number' => 'ADM-'.str_pad((string) Student::count(), 3, '0', STR_PAD_LEFT),
            'admission_date' => now()->toDateString(),
        ]);

        foreach ($classIds as $classId) {
            StudentEnrollment::create([
                'student_id' => $student->id,
                'academic_session_id' => $this->session->id,
                'school_class_id' => $classId,
                'roll_number' => '1',
                'enrolled_on' => now()->toDateString(),
                'status' => 'active',
            ]);
        }

        return $student;
    }

    private function makeClass(string $name, string $code, int $level): SchoolClass
    {
        return SchoolClass::create([
            'name' => $name,
            'code' => $code,
            'level' => $level,
            'is_active' => true,
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = [], ?Student $student = null): array
    {
        return array_merge([
            'name' => $student?->user?->name ?? 'Ali Khan',
            'email' => $student?->user?->email ?? 'ali.multi@example.test',
            'phone' => '0300-0000000',
            'admission_date' => now()->toDateString(),
            'date_of_birth' => now()->subYears(10)->toDateString(),
            'gender' => 'male',
            'cnic_bform' => '31301-0000000-0',
            'address' => '12 Test Street, Lahore',
            'medical_notes' => 'None',
            'academic_session_id' => $this->session->id,
            'school_class_ids' => [$this->classA->id],
            'roll_number' => '1',
            'enrolled_on' => now()->toDateString(),
        ], $overrides);
    }
}