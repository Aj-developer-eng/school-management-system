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
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TeacherSubjectAssignment;
use App\Models\Test;
use App\Models\TestResult;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
