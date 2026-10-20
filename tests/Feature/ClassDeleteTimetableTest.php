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

class ClassDeleteTimetableTest extends TestCase
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

        $this->teacher = Teacher::create([
            'user_id' => $teacherUser->id,
            'employee_code' => 'EMP-'.$teacherUser->id,
        ]);

        $this->superAdmin = User::factory()->create();
        $this->superAdmin->assignRole(Role::findOrCreate(RoleEnum::SuperAdmin->value, 'web'));
    }

    public function test_weekly_timetable_only_lists_classes_that_are_not_deleted(): void
    {
        $this->makeAssignment('08:00', '09:00', $this->class);

        // Orphaned assignment: the class is soft-deleted while its assignment
        // row survives (data written before the cascade existed). It must not
        // reach the Weekly Timetable.
        $this->makeAssignment('10:00', '11:00', $this->otherClass);
        $this->otherClass->delete();

        $this->actingAs($this->superAdmin)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('timetable', 1)
                ->where('timetable.0.class', 'Grade 5')
                ->where('timetable.0.start_time', '08:00')
            );
    }

    public function test_deleting_a_class_removes_its_entries_from_the_weekly_timetable(): void
    {
        $this->makeAssignment('08:00', '09:00', $this->class);
        $this->makeAssignment('10:00', '11:00', $this->otherClass);

        $this->actingAs($this->superAdmin)
            ->delete(route('classes.destroy', $this->otherClass))
            ->assertRedirect(route('classes.index'));

        // The class's assignments are soft-deleted together with the class …
        $this->assertSoftDeleted('teacher_subject_assignments', [
            'school_class_id' => $this->otherClass->id,
        ]);

        // … so the Weekly Timetable keeps only the class that still exists.
        $this->actingAs($this->superAdmin)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('timetable', 1)
                ->where('timetable.0.class', 'Grade 5')
                ->where('timetable.0.start_time', '08:00')
            );
    }

    public function test_deleting_every_class_leaves_an_empty_weekly_timetable(): void
    {
        $this->makeAssignment('08:00', '09:00', $this->class);

        $this->actingAs($this->superAdmin)
            ->delete(route('classes.destroy', $this->class))
            ->assertRedirect(route('classes.index'));

        $this->actingAs($this->superAdmin)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('timetable', 0)
            );
    }

    private function makeAssignment(
        string $startTime,
        string $endTime,
        SchoolClass $class,
    ): TeacherSubjectAssignment {
        return TeacherSubjectAssignment::create([
            'teacher_id' => $this->teacher->id,
            'academic_session_id' => $this->session->id,
            'school_class_id' => $class->id,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'days_of_week' => [1],
        ]);
    }
}
