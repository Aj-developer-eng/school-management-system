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

class TestClassFilterTest extends TestCase
{
    use RefreshDatabase;

    private AcademicSession $session;

    protected function setUp(): void
    {
        parent::setUp();

        $this->session = AcademicSession::create([
            'name' => '2026-2027',
            'start_date' => now()->startOfYear(),
            'end_date' => now()->endOfYear(),
            'is_active' => true,
        ]);
    }

    public function test_index_lists_all_active_classes_for_super_admin(): void
    {
        $user = $this->makeSuperAdmin();

        $gradeFive = $this->makeClass('Grade 5', 'G5', 5);
        $this->makeClass('Grade 9', 'G9', 9);
        $this->makeClass('Retired Class', 'RC', 10, isActive: false);

        $this->actingAs($user)
            ->get(route('tests.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Test/Index')
                ->has('classes', 2)
                ->where('classes.'.$gradeFive->id, 'Grade 5')
                ->missing('filters.school_class_id')
            );
    }

    public function test_index_filters_tests_by_class(): void
    {
        $user = $this->makeSuperAdmin();

        $gradeFive = $this->makeClass('Grade 5', 'G5', 5);
        $gradeNine = $this->makeClass('Grade 9', 'G9', 9);

        $gradeFiveTest = $this->makeTest($gradeFive, 'Quiz One');
        $this->makeTest($gradeNine, 'Quiz Two');

        $this->actingAs($user)
            ->get(route('tests.index', ['school_class_id' => $gradeFive->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('tests.data', 1)
                ->where('tests.data.0.id', $gradeFiveTest->id)
                ->where('filters.school_class_id', (string) $gradeFive->id)
            );
    }

    public function test_class_filter_combines_with_the_search_term(): void
    {
        $user = $this->makeSuperAdmin();

        $gradeFive = $this->makeClass('Grade 5', 'G5', 5);
        $gradeNine = $this->makeClass('Grade 9', 'G9', 9);

        $matching = $this->makeTest($gradeFive, 'Math Quiz');
        $this->makeTest($gradeFive, 'Science Quiz');
        $this->makeTest($gradeNine, 'Math Quiz');

        $this->actingAs($user)
            ->get(route('tests.index', [
                'school_class_id' => $gradeFive->id,
                'search' => 'Math',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('tests.data', 1)
                ->where('tests.data.0.id', $matching->id)
            );
    }

    public function test_teacher_class_filter_only_lists_their_own_classes(): void
    {
        [$teacherUser, $teacher] = $this->makeTeacher();

        $ownClass = $this->makeClass('Grade 5', 'G5', 5);
        $otherClass = $this->makeClass('Grade 9', 'G9', 9);

        $this->makeAssignment($teacher, $ownClass);
        $this->makeAssignment($teacher, $otherClass);

        $this->actingAs($teacherUser)
            ->get(route('tests.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('classes', 2)
                ->where('classes.'.$ownClass->id, 'Grade 5')
            );
    }

    private function makeSuperAdmin(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Role::findOrCreate(RoleEnum::SuperAdmin->value, 'web'));

        return $user;
    }

    /**
     * @return array{0: User, 1: Teacher}
     */
    private function makeTeacher(): array
    {
        $user = User::factory()->create();
        $user->assignRole(Role::findOrCreate(RoleEnum::Teacher->value, 'web'));

        $teacher = Teacher::create([
            'user_id' => $user->id,
            'employee_code' => 'EMP-'.$user->id,
        ]);

        return [$user, $teacher];
    }

    private function makeClass(string $name, string $code, int $level, bool $isActive = true): SchoolClass
    {
        return SchoolClass::create([
            'name' => $name,
            'code' => $code,
            'level' => $level,
            'is_active' => $isActive,
        ]);
    }

    private function makeAssignment(Teacher $teacher, SchoolClass $schoolClass): TeacherSubjectAssignment
    {
        return TeacherSubjectAssignment::create([
            'teacher_id' => $teacher->id,
            'academic_session_id' => $this->session->id,
            'school_class_id' => $schoolClass->id,
        ]);
    }

    private function makeTest(SchoolClass $schoolClass, string $title): Test
    {
        $teacher = Teacher::create([
            'user_id' => User::factory()->create()->id,
            'employee_code' => 'EMP-'.$schoolClass->id.'-'.uniqid(),
        ]);

        $assignment = TeacherSubjectAssignment::create([
            'teacher_id' => $teacher->id,
            'academic_session_id' => $this->session->id,
            'school_class_id' => $schoolClass->id,
        ]);

        return Test::create([
            'teacher_subject_assignment_id' => $assignment->id,
            'teacher_id' => $teacher->id,
            'academic_session_id' => $this->session->id,
            'school_class_id' => $schoolClass->id,
            'title' => $title,
            'test_type' => TestTypeEnum::Quiz,
            'test_date' => now()->toDateString(),
            'total_marks' => 100,
            'passing_marks' => 40,
            'status' => TestStatusEnum::Announced,
        ]);
    }
}
