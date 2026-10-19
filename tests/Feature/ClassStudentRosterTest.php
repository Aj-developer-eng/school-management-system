<?php

namespace Tests\Feature;

use App\Enums\PermissionEnum;
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

class ClassStudentRosterTest extends TestCase
{
    use RefreshDatabase;

    private AcademicSession $session;

    private AcademicSession $previousSession;

    private SchoolClass $class;

    private User $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);

        $this->previousSession = AcademicSession::create([
            'name' => '2025-2026',
            'start_date' => now()->subYear()->startOfYear(),
            'end_date' => now()->subYear()->endOfYear(),
            'is_active' => false,
        ]);

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

        $this->superAdmin = User::factory()->create();
        $this->superAdmin->assignRole(Role::findOrCreate(RoleEnum::SuperAdmin->value, 'web'));
    }

    public function test_index_exposes_the_active_session_roster_and_addable_students(): void
    {
        $enrolled = $this->makeStudent('Alice');
        $otherSession = $this->makeStudent('Bob');
        $available = $this->makeStudent('Charlie');

        $this->makeEnrollment($enrolled);
        $this->makeEnrollment($otherSession, null, $this->previousSession);

        $this->actingAs($this->superAdmin)
            ->get(route('classes.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Academic/Class/Index')
                ->has('classes.data', 1)
                ->where('classes.data.0.students_count', 1)
                ->has('classes.data.0.students_list', 1)
                ->where('classes.data.0.students_list.0.student_id', $enrolled->id)
                // Bob is only enrolled for the previous session, so he is not
                // on the active-session roster but can still be added.
                ->has('classes.data.0.students_addable', 2)
                ->where('classes.data.0.students_addable.0.id', $otherSession->id)
                ->where('classes.data.0.students_addable.1.id', $available->id)
            );
    }

    public function test_roster_management_is_hidden_from_users_without_students_update(): void
    {
        $this->makeEnrollment($this->makeStudent('Alice'));

        $viewer = $this->makeUserWithPermissions([PermissionEnum::ViewClasses->value]);

        $this->actingAs($viewer)
            ->get(route('classes.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Academic/Class/Index')
                // The roster stays visible read-only, but no add candidates
                // are sent to users who cannot manage enrollments.
                ->has('classes.data.0.students_list', 1)
                ->has('classes.data.0.students_addable', 0)
            );
    }

    public function test_attaching_a_student_enrolls_them_for_the_active_session(): void
    {
        $student = $this->makeStudent('Alice');

        $this->actingAs($this->superAdmin)
            ->post(route('classes.students.attach', $this->class), [
                'student_id' => $student->id,
            ])
            ->assertRedirect();

        $enrollment = StudentEnrollment::sole();

        $this->assertSame($student->id, $enrollment->student_id);
        $this->assertSame($this->session->id, $enrollment->academic_session_id);
        $this->assertSame($this->class->id, $enrollment->school_class_id);
        $this->assertNull($enrollment->deleted_at);
        $this->assertSame('active', $enrollment->status);

        // The roster on /classes now shows the student for the active session.
        $this->actingAs($this->superAdmin)
            ->get(route('classes.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('classes.data.0.students_count', 1)
                ->where('classes.data.0.students_list.0.student_id', $student->id)
            );
    }

    public function test_attaching_restores_a_previously_detached_enrollment(): void
    {
        $student = $this->makeStudent('Alice');
        $this->makeEnrollment($student)->delete();

        $this->actingAs($this->superAdmin)
            ->post(route('classes.students.attach', $this->class), ['student_id' => $student->id])
            ->assertRedirect();

        // The unique (student, session, class) key includes soft-deleted rows,
        // so the original enrollment is restored rather than duplicated.
        $this->assertSame(1, StudentEnrollment::withTrashed()->count());
        $this->assertSame(1, StudentEnrollment::count());
        $this->assertNull(StudentEnrollment::sole()->deleted_at);

        // Attaching an already-enrolled student again is a harmless no-op.
        $this->actingAs($this->superAdmin)
            ->post(route('classes.students.attach', $this->class), ['student_id' => $student->id])
            ->assertRedirect();

        $this->assertSame(1, StudentEnrollment::withTrashed()->count());
    }

    public function test_detaching_soft_deletes_the_enrollment_and_updates_the_roster(): void
    {
        $student = $this->makeStudent('Alice');
        $this->makeEnrollment($student);

        $this->actingAs($this->superAdmin)
            ->delete(route('classes.students.detach', [$this->class, $student]))
            ->assertRedirect();

        // The row is soft-deleted so the enrollment history is preserved.
        $this->assertSame(0, StudentEnrollment::count());
        $this->assertSame(1, StudentEnrollment::withTrashed()->count());

        $this->actingAs($this->superAdmin)
            ->get(route('classes.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('classes.data.0.students_count', 0)
                ->has('classes.data.0.students_list', 0)
                // The student becomes addable again.
                ->has('classes.data.0.students_addable', 1)
                ->where('classes.data.0.students_addable.0.id', $student->id)
            );
    }

    public function test_attaching_rejects_inactive_students(): void
    {
        $student = $this->makeStudent('Alice');
        $student->update(['is_active' => false]);

        $this->actingAs($this->superAdmin)
            ->from(route('classes.index'))
            ->post(route('classes.students.attach', $this->class), ['student_id' => $student->id])
            ->assertSessionHasErrors('student_id');

        $this->assertSame(0, StudentEnrollment::count());
    }

    public function test_attaching_requires_an_active_academic_session(): void
    {
        $student = $this->makeStudent('Alice');
        $this->session->update(['is_active' => false]);

        $this->actingAs($this->superAdmin)
            ->post(route('classes.students.attach', $this->class), ['student_id' => $student->id])
            ->assertSessionHasErrors('student_id');

        $this->assertSame(0, StudentEnrollment::count());
    }

    public function test_attach_and_detach_are_forbidden_without_students_update(): void
    {
        $student = $this->makeStudent('Alice');
        $this->makeEnrollment($student);

        $viewer = $this->makeUserWithPermissions([PermissionEnum::ViewClasses->value]);

        $this->actingAs($viewer)
            ->post(route('classes.students.attach', $this->class), ['student_id' => $student->id])
            ->assertForbidden();

        $this->actingAs($viewer)
            ->delete(route('classes.students.detach', [$this->class, $student]))
            ->assertForbidden();

        $this->assertSame(1, StudentEnrollment::count());
    }

    private function makeUserWithPermissions(array $permissions): User
    {
        $user = User::factory()->create();
        $role = Role::findOrCreate('Roster Viewer '.$user->id, 'web');
        $role->syncPermissions($permissions);
        $user->assignRole($role);

        return $user;
    }

    private function makeStudent(string $name): Student
    {
        $user = User::factory()->create(['name' => $name]);

        return Student::create([
            'user_id' => $user->id,
            'admission_number' => 'STU-'.$user->id,
            'admission_date' => now()->toDateString(),
        ]);
    }

    private function makeEnrollment(
        Student $student,
        ?SchoolClass $class = null,
        ?AcademicSession $session = null,
    ): StudentEnrollment {
        return StudentEnrollment::create([
            'student_id' => $student->id,
            'academic_session_id' => ($session ?? $this->session)->id,
            'school_class_id' => ($class ?? $this->class)->id,
        ]);
    }
}
