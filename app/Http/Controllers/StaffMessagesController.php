<?php

namespace App\Http\Controllers;

use App\Enums\RoleEnum;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StaffMessagesController extends Controller
{
    /**
     * List all parent-teacher conversations in the school for staff.
     */
    public function index(Request $request): Response
    {
        abort_unless($request->user()->can('teacher-parent.chat'), 403);

        $user = $request->user();

        $unreadMessageCount = Message::where('recipient_id', $user->id)
            ->whereNull('read_at')
            ->whereNull('deleted_at')
            ->count();

        $parentIds = User::role(RoleEnum::Parent->value)->pluck('id')->toArray();
        $teacherIds = User::role(RoleEnum::Teacher->value)->pluck('id')->toArray();

        // Get all distinct parent-teacher pairs that have exchanged messages school-wide.
        $pairs = Message::whereNull('deleted_at')
            ->where(function ($q) use ($parentIds, $teacherIds) {
                $q->whereIn('sender_id', $parentIds)
                    ->whereIn('recipient_id', $teacherIds);
            })
            ->orWhere(function ($q) use ($parentIds, $teacherIds) {
                $q->whereIn('sender_id', $teacherIds)
                    ->whereIn('recipient_id', $parentIds);
            })
            ->selectRaw('LEAST(sender_id, recipient_id) as user_one, GREATEST(sender_id, recipient_id) as user_two, MAX(created_at) as last_message_at')
            ->groupBy('user_one', 'user_two')
            ->get();

        $conversations = $pairs->map(function ($pair) use ($user, $parentIds, $teacherIds): array {
            $userOne = User::with('roles')->find($pair->user_one);
            $userTwo = User::with('roles')->find($pair->user_two);

            if (!$userOne || !$userTwo) {
                return [];
            }

            $parent = in_array($userOne->id, $parentIds) ? $userOne : $userTwo;
            $teacher = in_array($userOne->id, $teacherIds) ? $userOne : $userTwo;

            if (!$parent || !$teacher) {
                return [];
            }

            $lastMessage = Message::between($parent->id, $teacher->id)
                ->whereNull('deleted_at')
                ->latest('created_at')
                ->first();

            return [
                'teacher_id' => $teacher->id,
                'teacher_name' => $teacher->name,
                'parent_id' => $parent->id,
                'parent_name' => $parent->name,
                'user_id' => $teacher->id,
                'user_name' => $teacher->name . ' ↔ ' . $parent->name,
                'user_role' => 'Teacher ↔ Parent',
                'last_message' => $lastMessage ? [
                    'body' => $lastMessage->body,
                    'created_at' => $lastMessage->created_at,
                    'is_mine' => $lastMessage->sender_id === $user->id,
                ] : null,
                'unread_count' => Message::where('recipient_id', $user->id)
                    ->whereNull('read_at')
                    ->whereNull('deleted_at')
                    ->whereIn('sender_id', [$parent->id, $teacher->id])
                    ->count(),
            ];
        })->filter()->sortByDesc(fn ($c) => $c['last_message']?->created_at ?? '1970-01-01')
         ->values()->all();

        return Inertia::render('StaffMessages/Index', [
            'conversations' => $conversations,
            'unreadCount' => $unreadMessageCount,
        ]);
    }

    /**
     * Show the conversation between the staff user and another user,
     * or any parent-teacher conversation school-wide when {parent} is provided.
     */
    public function show(Request $request, User $user, ?User $parent = null): Response
    {
        abort_unless($request->user()->can('teacher-parent.chat'), 403);

        $staff = $request->user();
        $viewOnly = false;

        if ($parent) {
            // School-wide parent-teacher conversation view.
            $teacher = $user;
            abort_unless($teacher, 404);
            abort_unless($parent, 404);

            $isTeacher = $teacher->roles->contains('name', RoleEnum::Teacher->value);
            $isParent = $parent->roles->contains('name', RoleEnum::Parent->value);
            $isTeacherParent = $parent->roles->contains('name', RoleEnum::Teacher->value);
            $isParentTeacher = $teacher->roles->contains('name', RoleEnum::Parent->value);

            if (!($isTeacher && $isParent) && !($isParentTeacher && $isTeacherParent)) {
                abort(404);
            }

            $viewOnly = $staff->id !== $teacher->id && $staff->id !== $parent->id;

            $otherUser = [
                'id' => $teacher->id,
                'name' => $teacher->name . ' ↔ ' . $parent->name,
                'role' => 'Teacher ↔ Parent',
                'parentId' => $parent->id,
            ];

            $messages = Message::between($teacher->id, $parent->id)
                ->whereNull('deleted_at')
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
        } else {
            // Direct staff-to-user conversation (existing behavior).
            if ($staff->id === $user->id) {
                abort(404);
            }

            $otherUser = User::with(['teacher', 'studentParent'])->find($user->id);
            abort_unless($otherUser, 404);

            Message::where('sender_id', $user->id)
                ->where('recipient_id', $staff->id)
                ->whereNull('read_at')
                ->update(['read_at' => now()]);

            Message::where('sender_id', $staff->id)
                ->where('recipient_id', $user->id)
                ->whereNull('read_at')
                ->update(['read_at' => now()]);

            $messages = Message::between($staff->id, $user->id)
                ->whereNull('deleted_at')
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

            $otherUser = [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->roles->first()?->name ?? 'User',
                'parentId' => null,
            ];
        }

        return Inertia::render('StaffChat/Index', [
            'otherUser' => $otherUser,
            'messages' => $messages,
            'viewOnly' => $viewOnly,
        ]);
    }

    /**
     * Send a message from the staff user to another user.
     */
    public function store(Request $request, User $user, ?User $parent = null): RedirectResponse
    {
        abort_unless($request->user()->can('teacher-parent.chat'), 403);

        $staff = $request->user();
        $recipient = null;

        if ($parent) {
            // School-wide view: staff can send only if they are a participant.
            if ($staff->id === $user->id) {
                $recipient = $parent;
            } elseif ($staff->id === $parent->id) {
                $recipient = $user;
            } else {
                return redirect()
                    ->route('staff.messages.thread', ['user' => $user->id, 'parent' => $parent->id])
                    ->with('error', 'You cannot send messages in this conversation.');
            }
        } else {
            // Direct conversation: staff sends to $user.
            if ($staff->id === $user->id) {
                abort(404);
            }
            $recipient = $user;
        }

        $validated = $request->validate([
            'body' => 'required|string|max:4000',
        ]);

        Message::create([
            'sender_id' => $staff->id,
            'recipient_id' => $recipient->id,
            'body' => $validated['body'],
        ]);

        $params = ['user' => $user->id];
        if ($parent) {
            $params['parent'] = $parent->id;
        }

        return redirect()->route('staff.messages.thread', $params)
            ->with('success', 'Message sent.');
    }
}