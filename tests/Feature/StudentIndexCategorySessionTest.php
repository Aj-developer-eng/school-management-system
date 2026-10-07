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
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class StudentIndexCategorySessionTest extends TestCase
{
    use RefreshDatabase;

    private AcademicSession $session;

    private SchoolClass $classA;

    private SchoolClass $classB;

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

        $this->admin = User::factory()->create();
        $this->admin->assignRole(Role::findOrCreate(RoleEnum::SuperAdmin->value, 'web'));
    }

    /**
     * The "Category Session" column on /students reads
     * enrollments[].academic_session.name — Eloquent snake-cases relation keys
     * on serialization, so this pins that contract down.
     */
    public function test_the_students_index_exposes_the_category_session_for_each_enrollment(): void
    {
        $this->makeStudentWithClasses([$this->classA->id, $this->classB->id]);

        $this->actingAs($this->admin)
            ->get(route('students.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Student/Index')
                ->has('students.data.0.enrollments', 2)
                // Two class enrollments in the same session both resolve to it.
                ->where('students.data.0.enrollments.0.academic_session.name', '2026-2027')
                ->where('students.data.0.enrollments.1.academic_session.name', '2026-2027')
            );
    }

    public function test_a_student_with_no_enrollments_exposes_an_empty_session_list(): void
    {
        Student::create([
            'user_id' => User::factory()->create()->id,
            'admission_number' => 'ADM-999',
            'admission_date' => now()->toDateString(),
        ]);

        $this->actingAs($this->admin)
            ->get(route('students.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Student/Index')
                ->has('students.data.0.enrollments', 0)
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
}
