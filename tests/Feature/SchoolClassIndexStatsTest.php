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

class SchoolClassIndexStatsTest extends TestCase
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

    public function test_classes_index_exposes_overview_stats_for_the_tiles(): void
    {
        $grade5 = SchoolClass::create(['name' => 'Grade 5', 'code' => 'G5', 'is_active' => true]);
        $grade6 = SchoolClass::create(['name' => 'Grade 6', 'code' => 'G6', 'is_active' => true]);
        SchoolClass::create(['name' => 'Playgroup', 'code' => 'PG', 'is_active' => false]);

        // Two students enrolled in the active session count…
        $this->enroll($grade5, 'ADM-001');
        $this->enroll($grade6, 'ADM-002');

        // …a student from another session must not be counted…
        $pastSession = AcademicSession::create([
            'name' => '2025-2026',
            'start_date' => now()->subYear()->startOfYear(),
            'end_date' => now()->subYear()->endOfYear(),
            'is_active' => false,
        ]);
        $this->enroll($grade5, 'ADM-003', $pastSession);

        // …and neither must a soft-deleted enrollment.
        $deleted = $this->enroll($grade5, 'ADM-004');
        $deleted->delete();

        $this->actingAs($this->makeSuperAdmin())
            ->get(route('classes.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Academic/Class/Index')
                ->where('stats.total', 3)
                ->where('stats.active', 2)
                ->where('stats.inactive', 1)
                ->where('stats.students', 2)
            );
    }

    private function enroll(SchoolClass $class, string $admissionNumber, ?AcademicSession $session = null): StudentEnrollment
    {
        $user = User::factory()->create();
        $student = Student::create([
            'user_id' => $user->id,
            'admission_number' => $admissionNumber,
            'admission_date' => now()->toDateString(),
            'gender' => GenderEnum::Male->value,
            'is_active' => true,
        ]);

        return StudentEnrollment::create([
            'student_id' => $student->id,
            'academic_session_id' => ($session ?? $this->session)->id,
            'school_class_id' => $class->id,
            'enrolled_on' => now()->toDateString(),
            'status' => 'active',
        ]);
    }

    private function makeSuperAdmin(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Role::findOrCreate(RoleEnum::SuperAdmin->value, 'web'));

        return $user;
    }
}
