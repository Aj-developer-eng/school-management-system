<?php

namespace App\Http\Controllers;

use App\Enums\RoleEnum;
use App\Http\Requests\ParentChat\StoreMessageRequest;
use App\Models\Message;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentParent;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ParentChatController extends Controller
{
    /**
     * Show the conversation between the logged-in user and the other party.
     *
     * When accessed by a teacher: shows chat with the primary parent of the
     * given student (who must be enrolled in the class).
     *
     * When accessed by a parent: shows chat with the teacher for their child
     * in the given class.
     *
     * Gated by the `teacher-parent.chat` permission.
     */
    public function index(Request $request, SchoolClass $schoolClass, Student $student): Response
    {
        $user = $request->user();
        abort_unless($user->can('teacher-parent.chat'), 403);

        $this->verifyStudentInClass($schoolClass, $student);

        if ($user->hasRole(RoleEnum::Parent->value)) {
            $parent = StudentParent::where('user_id', $user->id)
                ->whereHas('students', fn ($q) => $q->where('students.id', $student->id))
                ->first();
            abort_unless($parent, 403);

            $parentId = $user->id;

            $teacher = Teacher::whereHas('teacherSubjectAssignments', fn ($q) => $q
                ->where('school_class_id', $schoolClass->id)
                ->whereNull('deleted_at')
            )->first();
            abort_unless($teacher?->user, 404);

            $teacherId = $teacher->user->id;
        } else {
            $parent = $this->primaryParent($student);
            abort_unless($parent?->user, 404);

            $teacherId = $user->id;
            $parentId = $parent->user->id;
        }

        Message::where('sender_id', $parentId)
            ->where('recipient_id', $teacherId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        Message::where('sender_id', $teacherId)
            ->where('recipient_id', $parentId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $messages = Message::between($teacherId, $parentId)
            ->with(['sender:id,name', 'recipient:id,name'])
            ->orderBy('created_at')
            ->get()
            ->map(fn ($message) => [
                'id' => $message->id,
                'body' => $message->body,
                'sender_id' => $message->sender_id,
                'sender_name' => $message->sender?->name,
                'created_at' => $message->created_at,
                'read_at' => $message->read_at,
            ])->values()->all();

        $isParent = $user->hasRole(RoleEnum::Parent->value);
        // Staff (incl. Super Admin) can always send in parent-teacher chat
        $canSend = true;

        return Inertia::render('ParentChat/Index', [
            'schoolClass' => $schoolClass,
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'admission_number' => $student->admission_number,
            ],
            'parent' => [
                'id' => $parentId,
                'name' => $isParent ? $user->name : ($parent?->user?->name ?? ''),
                'phone' => $isParent ? $user->phone : ($parent?->user?->phone ?? ''),
                'email' => $isParent ? $user->email : ($parent?->user?->email ?? ''),
            ],
            'teacher' => [
                'id' => $teacherId,
                'name' => User::find($teacherId)?->name ?? '',
            ],
            'isParent' => $isParent,
            'canSend' => $canSend,
            'messages' => $messages,
        ]);
    }

    /**
     * Send a message between the logged-in user and the other party.
     */
    public function store(StoreMessageRequest $request, SchoolClass $schoolClass, Student $student): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user->can('teacher-parent.chat'), 403);

        $this->verifyStudentInClass($schoolClass, $student);

        if ($user->hasRole(RoleEnum::Parent->value)) {
            $parent = StudentParent::where('user_id', $user->id)
                ->whereHas('students', fn ($q) => $q->where('students.id', $student->id))
                ->first();
            abort_unless($parent, 403);

            $senderId = $user->id;

            $teacher = Teacher::whereHas('teacherSubjectAssignments', fn ($q) => $q
                ->where('school_class_id', $schoolClass->id)
                ->whereNull('deleted_at')
            )->first();
            abort_unless($teacher?->user, 404);

            $recipientId = $teacher->user->id;
        } else {
            $parent = $this->primaryParent($student);
            abort_unless($parent?->user, 404);

            $senderId = $user->id;
            $recipientId = $parent->user->id;
        }

        Message::create([
            'sender_id' => $senderId,
            'recipient_id' => $recipientId,
            'body' => $request->validated()['body'],
        ]);

        return redirect()->route('classes.students.chat', [$schoolClass->id, $student->id])
            ->with('success', 'Message sent.');
    }

    private function verifyStudentInClass(SchoolClass $schoolClass, Student $student): void
    {
        $enrolled = StudentEnrollment::where('school_class_id', $schoolClass->id)
            ->where('student_id', $student->id)
            ->whereNull('deleted_at')
            ->exists();

        abort_unless($enrolled, 404);
    }

    /**
     * Return the primary-contact parent of the student, falling back to any
     * linked parent.
     */
    private function primaryParent(Student $student): ?StudentParent
    {
        $parents = $student->parents()
            ->with('user:id,name,email,phone')
            ->get();

        return $parents->first(fn ($parent) => (bool) $parent->pivot->is_primary_contact)
            ?? $parents->first();
    }

    /**
     * Show the parent's conversations with teachers of their children.
     * Gated by the `parent.chat` permission (or simply parent role).
     */
    public function parentIndex(Request $request): Response
    {
        abort_unless($request->user()->can('parent.chat'), 403);

        $parent = StudentParent::where('user_id', $request->user()->id)->first();
        abort_unless($parent, 404);

        $children = $parent->students()
            ->with(['user:id,name', 'enrollments' => function ($q): void {
                $q->whereNull('deleted_at')->latest('enrolled_on');
            }])
            ->whereNull('students.deleted_at')
            ->get();

        $studentIds = $children->pluck('id');

        if ($studentIds->isEmpty()) {
            return Inertia::render('ParentMessages/Index', [
                'conversations' => [],
                'unreadCount' => 0,
            ]);
        }

        // Get distinct teachers the parent has messaged with (as recipient)
        $teacherIds = Message::whereIn('recipient_id', $parent->user->id)
            ->whereNull('deleted_at')
            ->distinct()
            ->pluck('sender_id');

        // Also include teachers who messaged the parent (as sender)
        $teacherIds = $teacherIds->concat(
            Message::whereIn('sender_id', $parent->user->id)
                ->whereNull('deleted_at')
                ->distinct()
                ->pluck('recipient_id')
        )->unique();

        $conversations = collect();

        foreach ($teacherIds as $teacherId) {
            $teacher = \App\Models\User::with('teacher')->find($teacherId);
            if (!$teacher || !$teacher->teacher) continue;

            // Find which child connects this teacher to the parent
            $connectedChild = null;
            foreach ($children as $child) {
                $enrollment = $child->enrollments->first();
                if ($enrollment && $enrollment->schoolClass) {
                    $assignment = \App\Models\TeacherSubjectAssignment::where('school_class_id', $enrollment->schoolClass->id)
                        ->where('teacher_id', $teacher->teacher->id)
                        ->whereNull('deleted_at')
                        ->first();
                    if ($assignment) {
                        $connectedChild = $child;
                        break;
                    }
                }
            }

            $lastMessage = Message::where(function ($q) use ($teacherId, $parent) {
                $q->where('sender_id', $teacherId)->where('recipient_id', $parent->user->id);
            })->orWhere(function ($q) use ($teacherId, $parent) {
                $q->where('sender_id', $parent->user->id)->where('recipient_id', $teacherId);
            })
                ->whereNull('deleted_at')
                ->latest('created_at')
                ->first();

            $unreadCount = Message::where('sender_id', $teacherId)
                ->where('recipient_id', $parent->user->id)
                ->whereNull('read_at')
                ->whereNull('deleted_at')
                ->count();

            $conversations->push([
                'teacher_id' => $teacherId,
                'teacher_name' => $teacher->name,
                'child' => $connectedChild ? [
                    'id' => $connectedChild->id,
                    'name' => $connectedChild->user->name,
                    'admission_number' => $connectedChild->admission_number,
                ] : null,
                'last_message' => $lastMessage ? [
                    'body' => $lastMessage->body,
                    'created_at' => $lastMessage->created_at,
                    'is_mine' => $lastMessage->sender_id === $parent->user->id,
                ] : null,
                'unread_count' => $unreadCount,
            ]);
        }

        $conversations = $conversations->sortByDesc(fn ($c) => $c['last_message']?->created_at ?? '1970-01-01')
            ->values();

        $totalUnread = $conversations->sum('unread_count');

        return Inertia::render('ParentMessages/Index', [
            'conversations' => $conversations,
            'unreadCount' => $totalUnread,
        ]);
    }
}
