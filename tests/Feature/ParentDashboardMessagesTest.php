<?php

namespace Tests\Feature;

use App\Enums\RoleEnum;
use App\Models\AcademicSession;
use App\Models\Message;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentParent;
use App\Models\Teacher;
use App\Models\TeacherSubjectAssignment;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ParentDashboardMessagesTest extends TestCase
{
    use RefreshDatabase;

    private AcademicSession $session;
    private SchoolClass $class;
    private Teacher $teacher;
    private User $teacherUser;
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

        $this->teacherUser = User::factory()->create();
        $this->teacherUser->assignRole(Role::findOrCreate(RoleEnum::Teacher->value, 'web'));

        $this->teacher = Teacher::create([
            'user_id' => $this->teacherUser->id,
            'employee_code' => 'EMP-' . $this->teacherUser->id,
        ]);

        $this->enrollStudent();
    }

    public function test_teacher_initiated_message_appears_on_parent_dashboard(): void
    {
        // Teacher sends a message to the parent (recipient_id = parent's user id)
        Message::create([
            'sender_id' => $this->teacherUser->id,
            'recipient_id' => $this->parentUser->id,
            'body' => 'Hello from the teacher',
        ]);

        $this->actingAs($this->parentUser)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->where('dashboardType', 'parent')
                ->where('unreadMessageCount', 1)
                ->has('recentConversations', 1)
                ->where('recentConversations.0.teacher_id', $this->teacherUser->id)
                ->where('recentConversations.0.teacher_name', $this->teacherUser->name)
                ->where('recentConversations.0.last_message.body', 'Hello from the teacher')
                ->where('recentConversations.0.unread_count', 1)
            );
    }

    public function test_parent_initiated_message_appears_on_parent_dashboard(): void
    {
        // Parent sends a message to the teacher (sender_id = parent's user id)
        Message::create([
            'sender_id' => $this->parentUser->id,
            'recipient_id' => $this->teacherUser->id,
            'body' => 'Hello from the parent',
        ]);

        $this->actingAs($this->parentUser)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->where('dashboardType', 'parent')
                ->where('unreadMessageCount', 0)
                ->has('recentConversations', 1)
                ->where('recentConversations.0.teacher_id', $this->teacherUser->id)
                ->where('recentConversations.0.last_message.body', 'Hello from the parent')
                ->where('recentConversations.0.last_message.is_mine', true)
            );
    }

    public function test_parent_without_messages_sees_empty_conversations(): void
    {
        $this->actingAs($this->parentUser)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->where('dashboardType', 'parent')
                ->where('unreadMessageCount', 0)
                ->has('recentConversations', 0)
            );
    }

    public function test_user_teacher_relationship_is_resolvable(): void
    {
        // Verify the inverse relationship exists so User::with('teacher') works
        $user = User::with('teacher')->find($this->teacherUser->id);

        $this->assertNotNull($user);
        $this->assertNotNull($user->teacher);
        $this->assertEquals($this->teacher->id, $user->teacher->id);
    }

    public function test_teacher_can_access_chat_page_without_undefined_method_error(): void
    {
        // Teacher must have a subject assignment to the class for the chat page
        TeacherSubjectAssignment::create([
            'teacher_id' => $this->teacher->id,
            'academic_session_id' => $this->session->id,
            'school_class_id' => $this->class->id,
            'start_time' => '08:00',
            'end_time' => '09:00',
            'days_of_week' => [1],
        ]);

        $this->actingAs($this->teacherUser)
            ->get(route('classes.students.chat', [$this->class->id, $this->student->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ParentChat/Index')
                ->where('isParent', false)
            );
    }

    public function test_parent_can_access_chat_page(): void
    {
        // Teacher must have a subject assignment to the class for the chat page
        TeacherSubjectAssignment::create([
            'teacher_id' => $this->teacher->id,
            'academic_session_id' => $this->session->id,
            'school_class_id' => $this->class->id,
            'start_time' => '08:00',
            'end_time' => '09:00',
            'days_of_week' => [1],
        ]);

        $this->actingAs($this->parentUser)
            ->get(route('classes.students.chat', [$this->class->id, $this->student->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ParentChat/Index')
                ->where('isParent', true)
            );
    }

    public function test_parent_can_access_per_teacher_chat_page(): void
    {
        // Teacher must have a subject assignment to the class for the chat page
        TeacherSubjectAssignment::create([
            'teacher_id' => $this->teacher->id,
            'academic_session_id' => $this->session->id,
            'school_class_id' => $this->class->id,
            'start_time' => '08:00',
            'end_time' => '09:00',
            'days_of_week' => [1],
        ]);

        // Parent accessing the per-teacher chat page exercises
        // StudentEnrollment::teacherSubjectAssignments() via ParentMessagesController::show
        $this->actingAs($this->parentUser)
            ->get(route('parent.messages.teacher', $this->teacherUser->id))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ParentChat/Index')
                ->where('isParent', true)
            );
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
