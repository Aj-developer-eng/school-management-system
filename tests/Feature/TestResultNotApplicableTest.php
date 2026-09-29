<?php

namespace Tests\Feature;

use App\Enums\RoleEnum;
use App\Enums\TestStatusEnum;
use App\Enums\TestTypeEnum;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentParent;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TeacherSubjectAssignment;
use App\Models\Test;
use App\Models\TestResult;
use App\Models\User;
use App\Services\SchoolSettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TestResultNotApplicableTest extends TestCase
{
    use RefreshDatabase;

    private AcademicSession $session;

    private User $teacherUser;

    private Teacher $teacher;

    private SchoolClass $class;

    private Section $section;

    private Test $test;

    protected function setUp(): void
    {
        parent::setUp();

        $this->session = AcademicSession::create([
            'name' => '2026-2027',
            'start_date' => now()->startOfYear(),
            'end_date' => now()->endOfYear(),
            'is_active' => true,
        ]);

        $this->teacherUser = User::factory()->create();
        $this->teacherUser->assignRole(Role::findOrCreate(RoleEnum::Teacher->value, 'web'));

        $this->teacher = Teacher::create([
            'user_id' => $this->teacherUser->id,
            'employee_code' => 'EMP-'.$this->teacherUser->id,
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

        $subject = Subject::create([
            'name' => 'Mathematics',
            'code' => 'MATH',
            'is_active' => true,
        ]);

        $assignment = TeacherSubjectAssignment::create([
            'teacher_id' => $this->teacher->id,
            'academic_session_id' => $this->session->id,
            'school_class_id' => $this->class->id,
            'section_id' => $this->section->id,
            'subject_id' => $subject->id,
        ]);

        $this->test = Test::create([
            'teacher_subject_assignment_id' => $assignment->id,
            'teacher_id' => $this->teacher->id,
            'academic_session_id' => $this->session->id,
            'school_class_id' => $this->class->id,
            'section_id' => $this->section->id,
            'subject_id' => $subject->id,
            'title' => 'Mid Term Mathematics',
            'test_type' => TestTypeEnum::MidTerm,
            'test_date' => now()->toDateString(),
            'total_marks' => 100,
            'passing_marks' => 40,
            'status' => TestStatusEnum::Conducted,
        ]);
    }

    public function test_not_applicable_result_is_saved_without_marks_or_grade(): void
    {
        $student = $this->enrollStudent('ADM-001', '1');

        $this->actingAs($this->teacherUser)
            ->post(route('tests.results.store', $this->test), [
                'results' => [
                    [
                        'student_id' => $student->id,
                        'marks_obtained' => '',
                        'is_absent' => false,
                        'is_not_applicable' => true,
                        'remarks' => 'Exempted',
                    ],
                ],
            ])
            ->assertRedirect();

        $result = TestResult::where('student_id', $student->id)->firstOrFail();

        $this->assertTrue($result->is_not_applicable);
        $this->assertFalse($result->is_absent);
        $this->assertNull($result->marks_obtained);
        $this->assertNull($result->grade);
        $this->assertSame('Exempted', $result->remarks);
    }

    public function test_not_applicable_takes_precedence_over_absent(): void
    {
        $student = $this->enrollStudent('ADM-002', '2');

        $this->actingAs($this->teacherUser)
            ->post(route('tests.results.store', $this->test), [
                'results' => [
                    [
                        'student_id' => $student->id,
                        'marks_obtained' => 75,
                        'is_absent' => true,
                        'is_not_applicable' => true,
                        'remarks' => '',
                    ],
                ],
            ])
            ->assertRedirect();

        $result = TestResult::where('student_id', $student->id)->firstOrFail();

        $this->assertTrue($result->is_not_applicable);
        $this->assertFalse($result->is_absent);
        $this->assertNull($result->marks_obtained);
        $this->assertNull($result->grade);
    }

    public function test_results_can_mix_not_applicable_absent_and_graded_students(): void
    {
        $exempt = $this->enrollStudent('ADM-010', '1');
        $absent = $this->enrollStudent('ADM-011', '2');
        $present = $this->enrollStudent('ADM-012', '3');

        $this->actingAs($this->teacherUser)
            ->post(route('tests.results.store', $this->test), [
                'results' => [
                    [
                        'student_id' => $exempt->id,
                        'marks_obtained' => '',
                        'is_absent' => false,
                        'is_not_applicable' => true,
                        'remarks' => '',
                    ],
                    [
                        'student_id' => $absent->id,
                        'marks_obtained' => '',
                        'is_absent' => true,
                        'is_not_applicable' => false,
                        'remarks' => '',
                    ],
                    [
                        'student_id' => $present->id,
                        'marks_obtained' => 82,
                        'is_absent' => false,
                        'is_not_applicable' => false,
                        'remarks' => '',
                    ],
                ],
            ])
            ->assertRedirect();

        $exemptResult = TestResult::where('student_id', $exempt->id)->firstOrFail();
        $absentResult = TestResult::where('student_id', $absent->id)->firstOrFail();
        $presentResult = TestResult::where('student_id', $present->id)->firstOrFail();

        $this->assertTrue($exemptResult->is_not_applicable);
        $this->assertFalse($exemptResult->is_absent);

        $this->assertFalse($absentResult->is_not_applicable);
        $this->assertTrue($absentResult->is_absent);
        $this->assertNull($absentResult->marks_obtained);

        $this->assertFalse($presentResult->is_not_applicable);
        $this->assertFalse($presentResult->is_absent);
        $this->assertEquals(82, $presentResult->marks_obtained);
        $this->assertSame('A', $presentResult->grade);
    }

    public function test_is_not_applicable_must_be_boolean(): void
    {
        $student = $this->enrollStudent('ADM-020', '1');

        $this->actingAs($this->teacherUser)
            ->post(route('tests.results.store', $this->test), [
                'results' => [
                    [
                        'student_id' => $student->id,
                        'marks_obtained' => 50,
                        'is_absent' => false,
                        'is_not_applicable' => 'maybe',
                    ],
                ],
            ])
            ->assertSessionHasErrors('results.0.is_not_applicable');

        $this->assertDatabaseCount('test_results', 0);
    }

    public function test_parent_does_not_see_not_applicable_result_on_test_page(): void
    {
        $student = $this->enrollStudent('ADM-030', '1');
        $parentUser = $this->makeParent($student);

        $this->publishNotApplicableResult($student);

        $this->actingAs($parentUser)
            ->get(route('tests.show', $this->test))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Test/Show')
                ->has('students', 0)
            );
    }

    public function test_teacher_still_sees_not_applicable_result_on_test_page(): void
    {
        $student = $this->enrollStudent('ADM-029', '1');

        $this->publishNotApplicableResult($student);

        $this->actingAs($this->teacherUser)
            ->get(route('tests.show', $this->test))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Test/Show')
                ->has('students', 1)
                ->where('students.0.id', $student->id)
                ->where('students.0.result.is_not_applicable', true)
            );
    }

    public function test_parent_does_not_see_results_when_the_test_has_no_subject(): void
    {
        $student = $this->enrollStudent('ADM-033', '1');
        $parentUser = $this->makeParent($student);

        $this->publishNotApplicableResult($student);

        // The subject is removed, so the test is no longer associated with one.
        $this->test->subject->delete();

        $this->actingAs($parentUser)
            ->get(route('tests.show', $this->test))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Test/Show')
                ->has('students', 0)
                ->where('test.subject', null)
            );
    }

    public function test_parent_still_sees_absent_and_graded_results(): void
    {
        $student = $this->enrollStudent('ADM-034', '1');
        $parentUser = $this->makeParent($student);

        $this->publishNotApplicableResult($student);

        $absentTest = $this->makeTestWithStatus(TestStatusEnum::ResultsPublished, 'Class Test Physics');
        TestResult::create([
            'test_id' => $absentTest->id,
            'student_id' => $student->id,
            'is_absent' => true,
        ]);

        $this->actingAs($parentUser)
            ->get(route('tests.show', $absentTest))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Test/Show')
                ->has('students', 1)
                ->where('students.0.result.is_absent', true)
            );
    }

    public function test_parent_dashboard_hides_not_applicable_result(): void
    {
        $student = $this->enrollStudent('ADM-031', '1');
        $parentUser = $this->makeParent($student);

        $this->publishNotApplicableResult($student);

        $this->actingAs($parentUser)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->where('dashboardType', 'parent')
                ->has('testResults', 0)
            );
    }

    public function test_parent_dashboard_lists_graded_and_absent_results(): void
    {
        $student = $this->enrollStudent('ADM-035', '1');
        $parentUser = $this->makeParent($student);

        $gradedTest = $this->makeTestWithStatus(TestStatusEnum::ResultsPublished, 'Class Test Chemistry');
        TestResult::create([
            'test_id' => $gradedTest->id,
            'student_id' => $student->id,
            'marks_obtained' => 82,
            'grade' => 'A',
        ]);

        $absentTest = $this->makeTestWithStatus(TestStatusEnum::ResultsPublished, 'Class Test Physics');
        TestResult::create([
            'test_id' => $absentTest->id,
            'student_id' => $student->id,
            'is_absent' => true,
        ]);

        $this->actingAs($parentUser)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('testResults', 2)
            );
    }

    public function test_parent_dashboard_hides_results_for_tests_without_a_subject(): void
    {
        $student = $this->enrollStudent('ADM-036', '1');
        $parentUser = $this->makeParent($student);

        $this->publishNotApplicableResult($student);

        $gradedTest = $this->makeTestWithStatus(TestStatusEnum::ResultsPublished, 'Class Test Chemistry');
        TestResult::create([
            'test_id' => $gradedTest->id,
            'student_id' => $student->id,
            'marks_obtained' => 70,
            'grade' => 'B',
        ]);

        $gradedTest->subject->delete();

        $this->actingAs($parentUser)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('testResults', 0)
            );
    }

    public function test_parent_dashboard_hides_unpublished_test_results(): void
    {
        $student = $this->enrollStudent('ADM-032', '1');
        $parentUser = $this->makeParent($student);

        TestResult::create([
            'test_id' => $this->test->id,
            'student_id' => $student->id,
            'is_not_applicable' => true,
        ]);

        $this->actingAs($parentUser)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('testResults', 0)
            );
    }

    public function test_student_pdf_view_lists_test_results_with_statuses(): void
    {
        $student = $this->enrollStudent('ADM-040', '1');

        $this->publishNotApplicableResult($student);

        $absentTest = $this->makeTestWithStatus(TestStatusEnum::Conducted, 'Class Test Physics');
        TestResult::create([
            'test_id' => $absentTest->id,
            'student_id' => $student->id,
            'is_absent' => true,
        ]);

        $student->load(['user', 'enrollments', 'parents.user', 'invoices']);

        $testResults = TestResult::with([
            'test.subject:id,name',
            'test.schoolClass:id,name',
            'test.section:id,name',
        ])
            ->where('student_id', $student->id)
            ->get();

        $html = view('pdf.student-record', [
            'student' => $student,
            'school' => app(SchoolSettingsService::class)->get(),
            'logoBase64' => null,
            'testResults' => $testResults,
        ])->render();

        $this->assertStringContainsString('Test Results', $html);
        $this->assertStringContainsString('Mid Term Mathematics', $html);
        $this->assertStringContainsString('Not Applicable', $html);
        $this->assertStringContainsString('Class Test Physics', $html);
        $this->assertStringContainsString('Absent', $html);
    }

    public function test_student_pdf_downloads_with_test_results_section(): void
    {
        $admin = $this->makeSuperAdmin();
        $student = $this->enrollStudent('ADM-041', '1');

        $this->publishNotApplicableResult($student);

        $gradedTest = $this->makeTestWithStatus(TestStatusEnum::ResultsPublished, 'Class Test Chemistry');
        TestResult::create([
            'test_id' => $gradedTest->id,
            'student_id' => $student->id,
            'marks_obtained' => 82,
            'grade' => 'A',
        ]);

        $response = $this->actingAs($admin)->get(route('students.pdf', $student));

        $response->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $response->headers->get('content-type'));

        // A student without any test results still renders (empty-state branch).
        $studentWithoutResults = $this->enrollStudent('ADM-042', '2');

        $this->actingAs($admin)
            ->get(route('students.pdf', $studentWithoutResults))
            ->assertOk();
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

    private function makeParent(Student $student): User
    {
        $parentUser = User::factory()->create();
        $parentUser->assignRole(Role::findOrCreate(RoleEnum::Parent->value, 'web'));

        $parent = StudentParent::create([
            'user_id' => $parentUser->id,
            'is_active' => true,
        ]);

        $parent->students()->attach($student->id, [
            'guardian_type' => 'Father',
            'is_primary_contact' => true,
        ]);

        return $parentUser;
    }

    private function publishNotApplicableResult(Student $student): TestResult
    {
        $this->test->update([
            'status' => TestStatusEnum::ResultsPublished,
            'results_published_at' => now(),
        ]);

        return TestResult::create([
            'test_id' => $this->test->id,
            'student_id' => $student->id,
            'is_not_applicable' => true,
            'remarks' => 'Exempted',
        ]);
    }

    private function makeTestWithStatus(TestStatusEnum $status, string $title): Test
    {
        return Test::create([
            'teacher_subject_assignment_id' => $this->test->teacher_subject_assignment_id,
            'teacher_id' => $this->test->teacher_id,
            'academic_session_id' => $this->test->academic_session_id,
            'school_class_id' => $this->test->school_class_id,
            'section_id' => $this->test->section_id,
            'subject_id' => $this->test->subject_id,
            'title' => $title,
            'test_type' => TestTypeEnum::ClassTest,
            'test_date' => now()->subDay()->toDateString(),
            'total_marks' => 100,
            'passing_marks' => 40,
            'status' => $status,
        ]);
    }

    private function makeSuperAdmin(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Role::findOrCreate(RoleEnum::SuperAdmin->value, 'web'));

        return $user;
    }
}
