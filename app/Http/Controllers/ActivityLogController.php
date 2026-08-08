<?php

namespace App\Http\Controllers;

use App\Enums\RoleEnum;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (!$user->hasRole(RoleEnum::SuperAdmin->value)) {
            abort(403);
        }

        $query = ActivityLog::with('user:id,name,email')
            ->when($request->filled('module'), function ($q) use ($request): void {
                $q->where('module', $request->input('module'));
            })
            ->when($request->filled('action'), function ($q) use ($request): void {
                $q->where('action', $request->input('action'));
            })
            ->when($request->filled('user_id'), function ($q) use ($request): void {
                $q->where('user_id', $request->input('user_id'));
            })
            ->when($request->filled('date_from'), function ($q) use ($request): void {
                $q->whereDate('created_at', '>=', $request->input('date_from'));
            })
            ->when($request->filled('date_to'), function ($q) use ($request): void {
                $q->whereDate('created_at', '<=', $request->input('date_to'));
            })
            ->when($request->filled('search'), function ($q) use ($request): void {
                $q->where('description', 'like', "%{$request->input('search')}%");
            });

        $logs = $query->latest()->paginate(25)->withQueryString();

        $modules = ActivityLog::distinct()->pluck('module')->sort()->values();
        $actions = ActivityLog::distinct()->pluck('action')->sort()->values();

        $stats = [
            'total' => ActivityLog::count(),
            'today' => ActivityLog::whereDate('created_at', today())->count(),
            'this_week' => ActivityLog::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
            'unique_users' => ActivityLog::distinct()->count('user_id'),
        ];

        return Inertia::render('ActivityLogs/Index', [
            'logs' => $logs,
            'stats' => $stats,
            'modules' => $modules,
            'actions' => $actions,
            'filters' => $request->only(['module', 'action', 'user_id', 'date_from', 'date_to', 'search']),
        ]);
    }
}
