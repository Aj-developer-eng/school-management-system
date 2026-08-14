<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Collection;

class NotificationService
{
    /**
     * Send a notification to a single user.
     *
     * @param  array{type: string, title: string, message?: ?string, link?: ?string}  $data
     */
    public static function send(User $user, array $data): Notification
    {
        return Notification::create([
            'user_id' => $user->id,
            'type' => $data['type'],
            'title' => $data['title'],
            'message' => $data['message'] ?? null,
            'link' => $data['link'] ?? null,
        ]);
    }

    /**
     * Send a notification to multiple users.
     *
     * @param  Collection<int, User>  $users
     * @param  array{type: string, title: string, message?: ?string, link?: ?string}  $data
     */
    public static function sendToMany(Collection $users, array $data): void
    {
        foreach ($users as $user) {
            self::send($user, $data);
        }
    }

    /**
     * Send a notification to all users with a given role.
     *
     * @param  array{type: string, title: string, message?: ?string, link?: ?string}  $data
     */
    public static function sendToRole(string $role, array $data): void
    {
        $users = User::role($role)->get();
        self::sendToMany($users, $data);
    }

    /**
     * Send a notification to all super admins (users with the Super Admin role).
     *
     * @param  array{type: string, title: string, message?: ?string, link?: ?string}  $data
     */
    public static function sendToAdmins(array $data): void
    {
        self::sendToRole('Super Admin', $data);
    }

    /**
     * Get unread notifications for a user.
     *
     * @return Collection<int, Notification>
     */
    public static function unreadFor(User $user): Collection
    {
        return Notification::where('user_id', $user->id)
            ->unread()
            ->latest()
            ->get();
    }

    /**
     * Get recent notifications for a user (default 10).
     *
     * @return Collection<int, Notification>
     */
    public static function recentFor(User $user, int $limit = 10): Collection
    {
        return Notification::where('user_id', $user->id)
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Mark a notification as read.
     */
    public static function markAsRead(int $notificationId, User $user): void
    {
        Notification::where('id', $notificationId)
            ->where('user_id', $user->id)
            ->unread()
            ->update(['read_at' => now()]);
    }

    /**
     * Mark all notifications as read for a user.
     */
    public static function markAllAsRead(User $user): void
    {
        Notification::where('user_id', $user->id)
            ->unread()
            ->update(['read_at' => now()]);
    }
}
