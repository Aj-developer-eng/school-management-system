<?php

namespace Tests\Feature;

use App\Enums\GenderEnum;
use App\Enums\RoleEnum;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\Subject;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SubjectIndexStatsTest extends TestCase
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

    public function test_subjects_index_exposes_overview_stats_for_the_tiles(): void
    {
        $math = Subject::create(['name' => 'Mathematics', 'code' => 'MATH', 'is_active' => true]);
        Subject::create(['name' => 'Science', 'code' => 'SCI', 'is_active' => true]);
        Subject::create(['name' => 'Art', 'code' => 'ART', 'is_active' => false]);

        // A soft-deleted subject must not be counted.
        Subject::create(['name' => 'Music', 'code' => 'MUS', 'is_active' => true])->delete();

        // Only Mathematics is mapped to a class, so only its class's
        // enrollments can contribute to the Students tile.
        $grade5 = SchoolClass::create(['name' => 'Grade 5', 'code' => 'G5', 'is_active' => true]);
        $math->schoolClasses()->attach($grade5->id);

        // Two students enrolled in the active session count…
        $this->enroll($grade5, 'ADM-001');
        $this->enroll($grade5, 'ADM-002');

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
            ->get(route('subjects.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Academic/Subject/Index')
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