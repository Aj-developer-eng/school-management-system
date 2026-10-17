<?php

namespace Tests\Feature;

use App\Enums\GenderEnum;
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

class StudentIndexStatsTest extends TestCase
{
    use RefreshDatabase;

    private AcademicSession $session;

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
    }

    public function test_students_index_exposes_overview_stats_for_the_tiles(): void
    {
        SchoolClass::create(['name' => 'Grade 5', 'code' => 'G5', 'is_active' => true]);

        // Two active students enrolled in the active session count…
        $this->createStudent('ADM-001', isActive: true, enrollIn: $this->session);
        $this->createStudent('ADM-002', isActive: true, enrollIn: $this->session);

        // …an inactive student enrolled only in a past session counts
        // towards Total/Inactive but not towards Enrolled…
        $pastSession = AcademicSession::create([
            'name' => '2025-2026',
            'start_date' => now()->subYear()->startOfYear(),
            'end_date' => now()->subYear()->endOfYear(),
            'is_active' => false,
        ]);
        $this->createStudent('ADM-003', isActive: false, enrollIn: $pastSession);

        // …and a soft-deleted enrollment must not be counted as enrolled.
        $this->createStudent('ADM-004', isActive: true, enrollIn: $this->session, deleteEnrollment: true);

        // A soft-deleted student must not appear in the totals at all.
        $trashed = $this->createStudent('ADM-005', isActive: true);
        $trashed->delete();

        $this->actingAs($this->makeSuperAdmin())
            ->get(route('students.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Student/Index')
                ->where('stats.total', 4)
                ->where('stats.active', 3)
                ->where('stats.inactive', 1)
                ->where('stats.enrolled', 2)
            );
    }

    private function createStudent(
        string $admissionNumber,
        bool $isActive = true,
        ?AcademicSession $enrollIn = null,
        bool $deleteEnrollment = false,
    ): Student {
        $user = User::factory()->create();
        $student = Student::create([
            'user_id' => $user->id,
            'admission_number' => $admissionNumber,
            'admission_date' => now()->toDateString(),
            'gender' => GenderEnum::Male->value,
            'is_active' => $isActive,
        ]);

        if ($enrollIn !== null) {
            $class = SchoolClass::where('code', 'G5')->firstOrFail();
            $enrollment = StudentEnrollment::create([
                'student_id' => $student->id,
                'academic_session_id' => $enrollIn->id,
                'school_class_id' => $class->id,
                'enrolled_on' => now()->toDateString(),
                'status' => 'active',
            ]);

            if ($deleteEnrollment) {
                $enrollment->delete();
            }
        }

        return $student;
    }

    private function makeSuperAdmin(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Role::findOrCreate(RoleEnum::SuperAdmin->value, 'web'));

        return $user;
    }
}