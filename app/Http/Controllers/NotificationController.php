<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function markAsRead(Request $request, Notification $notification): RedirectResponse
    {
        if ($notification->user_id !== $request->user()->id) {
            abort(403);
        }

        NotificationService::markAsRead($notification->id, $request->user());

        return redirect()->back();
    }

    public function markAllAsRead(Request $request): RedirectResponse
    {
        NotificationService::markAllAsRead($request->user());

        return redirect()->back();
    }
}
