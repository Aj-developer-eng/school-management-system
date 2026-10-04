<?php

namespace Tests\Feature;

use App\Enums\RoleEnum;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentParent;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TeacherSubjectAssignment;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ParentTimetableTest extends TestCase
{
    use RefreshDatabase;

    private AcademicSession $session;

    private SchoolClass $class;

    private Section $section;

    private Teacher $teacher;

    private Subject $mathematics;

    private Subject $chemistry;

    private Student $student;

    private User $parentUser;

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

        $teacherUser = User::factory()->create();
        $teacherUser->assignRole(Role::findOrCreate(RoleEnum::Teacher->value, 'web'));

        $this->teacher = Teacher::create([
            'user_id' => $teacherUser->id,
            'employee_code' => 'EMP-'.$teacherUser->id,
        ]);

        $this->mathematics = $this->makeSubject('Mathematics', 'MATH');
        $this->chemistry = $this->makeSubject('Chemistry', 'CHEM');

        // Only Mathematics is offered to the class.
        $this->class->subjects()->sync([$this->mathematics->id]);

        $this->enrollStudent();
    }

    public function test_parent_timetable_only_shows_slots_for_the_subjects_of_the_child_class(): void
    {
        $this->makeAssignment($this->mathematics, '08:00', '09:00');
        // Chemistry is not mapped to the child's class, so it must not appear.
        $this->makeAssignment($this->chemistry, '09:00', '10:00');

        $this->actingAs($this->parentUser)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->where('dashboardType', 'parent')
                ->has('timetable', 1)
                ->where('timetable.0.class', 'Grade 5')
                ->where('timetable.0.subject', 'Mathematics')
                ->where('timetable.0.start_time', '08:00')
            );
    }

    public function test_parent_timetable_honours_the_child_own_subject_selection(): void
    {
        // The child only studies Chemistry, which the class does not offer.
        $this->student->subjects()->sync([$this->chemistry->id]);

        $this->makeAssignment($this->mathematics, '08:00', '09:00');
        $this->makeAssignment($this->chemistry, '09:00', '10:00');

        $this->actingAs($this->parentUser)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('timetable', 1)
                ->where('timetable.0.subject', 'Chemistry')
            );
    }

    public function test_parent_timetable_excludes_other_classes_and_sections(): void
    {
        $otherClass = SchoolClass::create([
            'name' => 'Grade 6',
            'code' => 'G6',
            'level' => 6,
            'is_active' => true,
        ]);
        $otherClass->subjects()->sync([$this->mathematics->id]);

        $otherSection = Section::create([
            'name' => 'B',
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
        ]);

        $this->makeAssignment($this->mathematics, '08:00', '09:00');
        $this->makeAssignment($this->mathematics, '09:00', '10:00', $otherClass->id, $otherSection->id);

        $this->actingAs($this->parentUser)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('timetable', 1)
                ->where('timetable.0.class', 'Grade 5')
                ->where('timetable.0.section', 'A')
            );
    }

    public function test_parent_without_enrolled_children_sees_no_timetable(): void
    {
        $this->makeAssignment($this->mathematics, '08:00', '09:00');

        $lonelyParent = User::factory()->create();
        $lonelyParent->assignRole(Role::findOrCreate(RoleEnum::Parent->value, 'web'));
        StudentParent::create(['user_id' => $lonelyParent->id, 'is_active' => true]);

        $this->actingAs($lonelyParent)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('dashboardType', 'parent')
                ->has('timetable', 0)
            );
    }

    private function makeSubject(string $name, string $code): Subject
    {
        return Subject::create([
            'name' => $name,
            'code' => $code,
            'is_active' => true,
        ]);
    }

    private function makeAssignment(
        Subject $subject,
        string $startTime,
        string $endTime,
        ?int $classId = null,
        ?int $sectionId = null,
    ): TeacherSubjectAssignment {
        return TeacherSubjectAssignment::create([
            'teacher_id' => $this->teacher->id,
            'academic_session_id' => $this->session->id,
            'school_class_id' => $classId ?? $this->class->id,
            'section_id' => $sectionId ?? $this->section->id,
            'subject_id' => $subject->id,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'days_of_week' => [1],
        ]);
    }

    private function enrollStudent(): void
    {
        $this->student = Student::create([
            'user_id' => User::factory()->create()->id,
            'admission_number' => 'ADM-001',
            'admission_date' => now()->toDateString(),
        ]);

        StudentEnrollment::create([
            'student_id' => $this->student->id,
            'academic_session_id' => $this->session->id,
            'school_class_id' => $this->class->id,
            'section_id' => $this->section->id,
            'roll_number' => '1',
            'enrolled_on' => now()->toDateString(),
        ]);

        $this->parentUser = User::factory()->create();
        $this->parentUser->assignRole(Role::findOrCreate(RoleEnum::Parent->value, 'web'));

        $parent = StudentParent::create([
            'user_id' => $this->parentUser->id,
            'is_active' => true,
        ]);

        $parent->students()->attach($this->student->id, [
            'guardian_type' => 'Father',
            'is_primary_contact' => true,
        ]);
    }
}
