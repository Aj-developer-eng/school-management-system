<?php

namespace App\Http\Controllers;

use App\Enums\RoleEnum;
use App\Http\Requests\ParentChat\StoreMessageRequest;
use App\Models\Message;
use App\Models\StudentParent;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ParentMessagesController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->can('teacher-parent.chat'), 403);

        $user = $request->user();

        $parent = StudentParent::where('user_id', $user->id)->first();
        abort_unless($parent, 404);

        $unreadMessageCount = Message::where('recipient_id', $user->id)
            ->whereNull('read_at')
            ->whereNull('deleted_at')
            ->count();

        $teacherIds = Message::where('recipient_id', $user->id)
            ->whereNull('deleted_at')
            ->distinct()
            ->pluck('sender_id');

        $teacherIds = $teacherIds->merge(
            Message::where('sender_id', $user->id)
                ->whereNull('deleted_at')
                ->distinct()
                ->pluck('recipient_id')
        )->unique();

        $conversations = $teacherIds->map(function ($teacherId) use ($user): array {
            $teacher = User::find($teacherId);
            if (!$teacher) {
                return [];
            }

            $lastMessage = Message::where(function ($q) use ($teacherId, $user) {
                $q->where('sender_id', $teacherId)->where('recipient_id', $user->id);
            })->orWhere(function ($q) use ($teacherId, $user) {
                $q->where('sender_id', $user->id)->where('recipient_id', $teacherId);
            })
                ->whereNull('deleted_at')
                ->latest('created_at')
                ->first();

            return [
                'teacher_id' => $teacherId,
                'teacher_name' => $teacher->name,
                'last_message' => $lastMessage ? [
                    'body' => $lastMessage->body,
                    'created_at' => $lastMessage->created_at,
                    'is_mine' => $lastMessage->sender_id === $user->id,
                ] : null,
                'unread_count' => Message::where('sender_id', $teacherId)
                    ->where('recipient_id', $user->id)
                    ->whereNull('read_at')
                    ->whereNull('deleted_at')
                    ->count(),
                'child' => null,
            ];
        })->filter()->sortByDesc(fn ($c) => $c['last_message']?->created_at ?? '1970-01-01')
         ->values()->all();

        return Inertia::render('ParentMessages/Index', [
            'conversations' => $conversations,
            'unreadCount' => $unreadMessageCount,
        ]);
    }

    /**
     * Show the chat between the parent and another user (teacher, super admin, etc.).
     */
    public function show(Request $request, User $teacher): Response
    {
        abort_unless($request->user()->can('teacher-parent.chat'), 403);

        $user = $request->user();

        $parent = StudentParent::where('user_id', $user->id)->first();
        abort_unless($parent, 404);

        // The other party may be a teacher or another role (e.g. super admin).
        // Only parent-teacher conversations have a student/class context.
        $teacherRecord = \App\Models\Teacher::where('user_id', $teacher->id)->whereNull('deleted_at')->first();

        $schoolClass = null;
        $child = null;

        if ($teacherRecord) {
            $child = $parent->students()
                ->whereHas('enrollments', function ($q) use ($teacherRecord): void {
                    $q->whereHas('teacherSubjectAssignments', function ($sq) use ($teacherRecord): void {
                        $sq->where('teacher_id', $teacherRecord->id)
                            ->whereNull('deleted_at');
                    })
                    ->whereNull('deleted_at');
                })
                ->with('user:id,name', 'enrollments.schoolClass:id,name')
                ->first();

            $schoolClass = $child?->enrollments
                ->filter(fn ($e) => $e->schoolClass)
                ->first()
                ?->schoolClass;
        }

        $teacherId = $teacher->id;
        $parentId = $user->id;

        Message::where('sender_id', $teacherId)
            ->where('recipient_id', $parentId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        Message::where('sender_id', $parentId)
            ->where('recipient_id', $teacherId)
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

        return Inertia::render('ParentChat/Index', [
            'schoolClass' => $schoolClass,
            'student' => $child ? [
                'id' => $child->id,
                'name' => $child->name,
                'admission_number' => $child->admission_number,
            ] : null,
            'parent' => [
                'id' => $parentId,
                'name' => $user->name,
                'phone' => $user->phone,
                'email' => $user->email,
            ],
            'teacher' => [
                'id' => $teacherId,
                'name' => $teacher->name,
            ],
            'isParent' => true,
            'messages' => $messages,
        ]);
    }

    /**
     * Send a message from the parent to the teacher.
     */
    public function store(StoreMessageRequest $request, User $teacher): RedirectResponse
    {
        abort_unless($request->user()->can('teacher-parent.chat'), 403);

        $user = $request->user();

        $parent = StudentParent::where('user_id', $user->id)->first();
        abort_unless($parent, 404);

        Message::create([
            'sender_id' => $user->id,
            'recipient_id' => $teacher->id,
            'body' => $request->validated()['body'],
        ]);

        return redirect()->route('parent.messages.teacher', $teacher->id)
            ->with('success', 'Message sent.');
    }
}