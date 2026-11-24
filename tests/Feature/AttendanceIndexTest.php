<?php

namespace Tests\Feature;

use App\Enums\RoleEnum;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Teacher;
use App\Models\TeacherSubjectAssignment;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AttendanceIndexTest extends TestCase
{
    use RefreshDatabase;

    private AcademicSession $session;

    private SchoolClass $class;

    private SchoolClass $otherClass;

    private Teacher $teacher;

    private User $superAdmin;

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

        $this->otherClass = SchoolClass::create([
            'name' => 'Grade 6',
            'code' => 'G6',
            'level' => 6,
            'is_active' => true,
        ]);

        $teacherUser = User::factory()->create();
        $teacherUser->assignRole(Role::findOrCreate(RoleEnum::Teacher->value, 'web'));
        $teacherUser->givePermissionTo('attendances.view');

        $this->teacher = Teacher::create([
            'user_id' => $teacherUser->id,
            'employee_code' => 'EMP-'.$teacherUser->id,
        ]);

        $this->superAdmin = User::factory()->create();
        $this->superAdmin->assignRole(Role::findOrCreate(RoleEnum::SuperAdmin->value, 'web'));
    }

    public function test_attendance_index_shows_assignments_of_deleted_classes_to_super_admin(): void
    {
        $this->makeAssignment($this->class);
        $this->makeAssignment($this->otherClass);

        $this->otherClass->delete();

        // A soft-deleted class still renders on the attendance index for a
        // super admin so it can be reviewed or re-attended.
        $this->actingAs($this->superAdmin)
            ->get(route('attendance.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Attendance/Index')
                ->has('assignments', 2)
                ->where('assignments.0.school_class.name', 'Grade 5')
                ->where('assignments.1.school_class.name', 'Grade 6')
                ->where('isSuperAdmin', true)
            );
    }

    public function test_teacher_attendance_index_only_renders_their_own_live_assignments(): void
    {
        $otherUser = User::factory()->create();
        $otherUser->assignRole(Role::findOrCreate(RoleEnum::Teacher->value, 'web'));
        $otherTeacher = Teacher::create([
            'user_id' => $otherUser->id,
            'employee_code' => 'EMP-'.$otherUser->id,
        ]);

        $teacherUser = $this->teacher->user;

        $this->makeAssignment($this->class, $this->teacher);
        // Another teacher's class stays hidden …
        $this->makeAssignment($this->otherClass, $otherTeacher);
        // … and the teacher's own deleted class is hidden too.
        $thirdClass = SchoolClass::create([
            'name' => 'Grade 7',
            'code' => 'G7',
            'level' => 7,
            'is_active' => true,
        ]);
        $this->makeAssignment($thirdClass);
        $thirdClass->delete();

        $this->actingAs($teacherUser)
            ->get(route('attendance.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Attendance/Index')
                ->has('assignments', 1)
                ->where('assignments.0.school_class_id', $this->class->id)
                ->where('assignments.0.school_class.name', 'Grade 5')
                ->where('isSuperAdmin', false)
            );
    }

    public function test_deleting_a_class_still_renders_on_attendance_index_for_super_admin(): void
    {
        $this->makeAssignment($this->class);
        $this->makeAssignment($this->otherClass);

        $this->actingAs($this->superAdmin)
            ->delete(route('classes.destroy', $this->otherClass))
            ->assertRedirect(route('classes.index'));

        // The class and its assignments are soft-deleted together …
        $this->assertSoftDeleted('teacher_subject_assignments', [
            'school_class_id' => $this->otherClass->id,
        ]);

        // … but super admins still see both classes on the attendance index.
        $this->actingAs($this->superAdmin)
            ->get(route('attendance.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Attendance/Index')
                ->has('assignments', 2)
                ->where('assignments.0.school_class.name', 'Grade 5')
                ->where('assignments.1.school_class.name', 'Grade 6')
            );
    }

    private function makeAssignment(
        SchoolClass $class,
        ?Teacher $teacher = null,
    ): TeacherSubjectAssignment {
        return TeacherSubjectAssignment::create([
            'teacher_id' => ($teacher ?? $this->teacher)->id,
            'academic_session_id' => $this->session->id,
            'school_class_id' => $class->id,
        ]);
    }
}