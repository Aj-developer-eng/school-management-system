<?php

namespace App\Http\Controllers;

use App\Enums\RoleEnum;
use App\Models\SpecialRequest;
use App\Models\StudentParent;
use App\Models\Teacher;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SpecialRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if ($user->hasRole(RoleEnum::SuperAdmin->value) || $user->hasRole(RoleEnum::Principal->value)) {
            $requests = SpecialRequest::with([
                'parent.user:id,name',
                'student.user:id,name',
                'assignee:id,name',
            ])
                ->when($request->filled('status'), function ($q) use ($request): void {
                    $q->where('status', $request->input('status'));
                })
                ->when($request->filled('priority'), function ($q) use ($request): void {
                    $q->where('priority', $request->input('priority'));
                })
                ->latest()
                ->paginate(20)
                ->withQueryString();

            $stats = [
                'total' => SpecialRequest::count(),
                'pending' => SpecialRequest::where('status', 'pending')->count(),
                'in_progress' => SpecialRequest::where('status', 'in_progress')->count(),
                'resolved' => SpecialRequest::where('status', 'resolved')->count(),
                'closed' => SpecialRequest::where('status', 'closed')->count(),
            ];

            return Inertia::render('SpecialRequests/Index', [
                'requests' => $requests,
                'stats' => $stats,
                'filters' => $request->only(['status', 'priority']),
                'role' => 'admin',
            ]);
        }

        if ($user->hasRole(RoleEnum::Teacher->value)) {
            $requests = SpecialRequest::with([
                'parent.user:id,name',
                'student.user:id,name',
                'assignee:id,name',
            ])
                ->where('assigned_to', $user->id)
                ->when($request->filled('status'), function ($q) use ($request): void {
                    $q->where('status', $request->input('status'));
                })
                ->latest()
                ->paginate(20)
                ->withQueryString();

            $stats = [
                'total' => SpecialRequest::where('assigned_to', $user->id)->count(),
                'pending' => SpecialRequest::where('assigned_to', $user->id)->where('status', 'pending')->count(),
                'in_progress' => SpecialRequest::where('assigned_to', $user->id)->where('status', 'in_progress')->count(),
                'resolved' => SpecialRequest::where('assigned_to', $user->id)->where('status', 'resolved')->count(),
                'closed' => SpecialRequest::where('assigned_to', $user->id)->where('status', 'closed')->count(),
            ];

            return Inertia::render('SpecialRequests/Index', [
                'requests' => $requests,
                'stats' => $stats,
                'filters' => $request->only(['status']),
                'role' => 'teacher',
            ]);
        }

        // Parent
        $parent = StudentParent::where('user_id', $user->id)->first();

        $requests = SpecialRequest::with([
            'student.user:id,name',
            'assignee:id,name',
        ])
            ->where('parent_id', $parent?->id)
            ->when($request->filled('status'), function ($q) use ($request): void {
                $q->where('status', $request->input('status'));
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $stats = [
            'total' => SpecialRequest::where('parent_id', $parent?->id)->count(),
            'pending' => SpecialRequest::where('parent_id', $parent?->id)->where('status', 'pending')->count(),
            'in_progress' => SpecialRequest::where('parent_id', $parent?->id)->where('status', 'in_progress')->count(),
            'resolved' => SpecialRequest::where('parent_id', $parent?->id)->where('status', 'resolved')->count(),
            'closed' => SpecialRequest::where('parent_id', $parent?->id)->where('status', 'closed')->count(),
        ];

        return Inertia::render('SpecialRequests/Index', [
            'requests' => $requests,
            'stats' => $stats,
            'filters' => $request->only(['status']),
            'role' => 'parent',
        ]);
    }

    public function create(Request $request): Response
    {
        $user = $request->user();
        $parent = StudentParent::where('user_id', $user->id)->first();

        $children = $parent?->students()
            ->with(['user:id,name'])
            ->whereNull('students.deleted_at')
            ->get()
            ->map(function ($s) {
                return ['id' => $s->id, 'name' => $s->user?->name];
            }) ?? collect();

        $recipients = collect();

        $superAdmins = User::whereHas('roles', function ($q): void {
            $q->where('name', RoleEnum::SuperAdmin->value);
        })->select('id', 'name')->get();

        foreach ($superAdmins as $admin) {
            $recipients->push(['id' => $admin->id, 'name' => $admin->name, 'type' => 'admin']);
        }

        $teachers = Teacher::with('user:id,name')->whereNull('deleted_at')->get();
        foreach ($teachers as $teacher) {
            $recipients->push(['id' => $teacher->user_id, 'name' => $teacher->user?->name ?? 'Teacher', 'type' => 'teacher']);
        }

        return Inertia::render('SpecialRequests/Create', [
            'children' => $children,
            'recipients' => $recipients,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $parent = StudentParent::where('user_id', $user->id)->first();

        $validated = $request->validate([
            'student_id' => ['nullable', 'exists:students,id'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'subject' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:5000'],
            'request_type' => ['required', 'in:general,leave,complaint,meeting,fee,other'],
            'priority' => ['required', 'in:low,normal,high,urgent'],
        ]);

        SpecialRequest::create([
            'parent_id' => $parent?->id,
            'student_id' => $validated['student_id'],
            'assigned_to' => $validated['assigned_to'] ?? null,
            'subject' => $validated['subject'],
            'body' => $validated['body'],
            'request_type' => $validated['request_type'],
            'priority' => $validated['priority'],
            'status' => 'pending',
        ]);

        ActivityLogService::custom('Special Requests', 'submitted', "Submitted request: {$validated['subject']}");

        return redirect()->route('special-requests.index')->with('success', 'Request submitted successfully.');
    }

    public function show(Request $request, SpecialRequest $special_request): Response
    {
        $user = $request->user();
        $this->authorizeAccess($user, $special_request);

        $special_request->load([
            'parent.user:id,name',
            'student.user:id,name',
            'assignee:id,name',
        ]);

        $canRespond = $user->hasRole(RoleEnum::SuperAdmin->value)
            || $user->hasRole(RoleEnum::Principal->value)
            || ($special_request->assigned_to === $user->id);

        return Inertia::render('SpecialRequests/Show', [
            'specialRequest' => $special_request,
            'canRespond' => $canRespond,
        ]);
    }

    public function respond(Request $request, SpecialRequest $special_request)
    {
        $user = $request->user();
        $this->authorizeAccess($user, $special_request);

        if (!$user->hasRole(RoleEnum::SuperAdmin->value) && !$user->hasRole(RoleEnum::Principal->value) && $special_request->assigned_to !== $user->id) {
            abort(403);
        }

        $validated = $request->validate([
            'status' => ['required', 'in:pending,in_progress,resolved,closed'],
            'admin_response' => ['nullable', 'string', 'max:5000'],
        ]);

        $special_request->update([
            'status' => $validated['status'],
            'admin_response' => $validated['admin_response'] ?? $special_request->admin_response,
            'assigned_to' => $special_request->assigned_to ?? $user->id,
            'responded_at' => $special_request->responded_at ?? now(),
        ]);

        ActivityLogService::custom('Special Requests', 'responded', "Responded to request: {$special_request->subject}");

        return redirect()->back()->with('success', 'Response saved successfully.');
    }

    private function authorizeAccess(User $user, SpecialRequest $specialRequest): void
    {
        if ($user->hasRole(RoleEnum::SuperAdmin->value) || $user->hasRole(RoleEnum::Principal->value)) {
            return;
        }

        if ($user->hasRole(RoleEnum::Parent->value)) {
            $parent = StudentParent::where('user_id', $user->id)->first();
            if ($specialRequest->parent_id !== $parent?->id) {
                abort(403);
            }
            return;
        }

        if ($user->hasRole(RoleEnum::Teacher->value)) {
            if ($specialRequest->assigned_to !== $user->id) {
                abort(403);
            }
            return;
        }

        abort(403);
    }
}
