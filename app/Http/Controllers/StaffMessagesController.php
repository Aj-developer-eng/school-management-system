<?php

namespace App\Http\Controllers;

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

        // Get all distinct users the staff user has messaged or been messaged by.
        $userIds = Message::where('recipient_id', $user->id)
            ->whereNull('deleted_at')
            ->distinct()
            ->pluck('sender_id')
            ->merge(
                Message::where('sender_id', $user->id)
                    ->whereNull('deleted_at')
                    ->distinct()
                    ->pluck('recipient_id')
            )->unique();

        $conversations = $userIds->map(function ($otherUserId) use ($user): array {
            $otherUser = User::with('teacher')->find($otherUserId);
            if (!$otherUser) {
                return [];
            }

            $lastMessage = Message::where(function ($q) use ($otherUserId, $user) {
                $q->where('sender_id', $otherUserId)->where('recipient_id', $user->id);
            })->orWhere(function ($q) use ($otherUserId, $user) {
                $q->where('sender_id', $user->id)->where('recipient_id', $otherUserId);
            })
                ->whereNull('deleted_at')
                ->latest('created_at')
                ->first();

            return [
                'user_id' => $otherUserId,
                'user_name' => $otherUser->name,
                'user_email' => $otherUser->email,
                'user_role' => $otherUser->roles->first()?->name ?? 'User',
                'last_message' => $lastMessage ? [
                    'body' => $lastMessage->body,
                    'created_at' => $lastMessage->created_at,
                    'is_mine' => $lastMessage->sender_id === $user->id,
                ] : null,
                'unread_count' => Message::where('sender_id', $otherUserId)
                    ->where('recipient_id', $user->id)
                    ->whereNull('read_at')
                    ->whereNull('deleted_at')
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
     * Show the conversation between the staff user and another user.
     */
    public function show(Request $request, User $user): Response
    {
        abort_unless($request->user()->can('teacher-parent.chat'), 403);

        $staff = $request->user();

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

        return Inertia::render('StaffChat/Index', [
            'otherUser' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->roles->first()?->name ?? 'User',
            ],
            'messages' => $messages,
        ]);
    }

    /**
     * Send a message from the staff user to another user.
     */
    public function store(Request $request, User $user): RedirectResponse
    {
        abort_unless($request->user()->can('teacher-parent.chat'), 403);

        $staff = $request->user();

        if ($staff->id === $user->id) {
            abort(404);
        }

        $validated = $request->validate([
            'body' => 'required|string|max:4000',
        ]);

        Message::create([
            'sender_id' => $staff->id,
            'recipient_id' => $user->id,
            'body' => $validated['body'],
        ]);

        return redirect()->route('staff.messages.thread', $user->id)
            ->with('success', 'Message sent.');
    }
}