<?php

namespace App\Http\Controllers;

use App\Http\Requests\AcademicSession\StoreRequest;
use App\Http\Requests\AcademicSession\UpdateRequest;
use App\Models\AcademicSession;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AcademicSessionController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(AcademicSession::class);
    }

    public function index(Request $request): Response
    {
        $sessions = AcademicSession::query()
            ->when($request->search, function ($query, $search): void {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderByDesc('start_date')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Academic/Session/Index', [
            'sessions' => $sessions,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Academic/Session/Form');
    }

    public function store(StoreRequest $request): RedirectResponse
    {
        AcademicSession::create($request->validated());

        return redirect()->route('academic-sessions.index')
            ->with('success', 'Category session created successfully.');
    }

    public function edit(AcademicSession $academicSession): Response
    {
        return Inertia::render('Academic/Session/Form', [
            'session' => [
                ...$academicSession->toArray(),
                'start_date' => $academicSession->start_date?->format('Y-m-d'),
                'end_date' => $academicSession->end_date?->format('Y-m-d'),
            ],
        ]);
    }

    public function update(UpdateRequest $request, AcademicSession $academicSession): RedirectResponse
    {
        $academicSession->update($request->validated());

        return redirect()->route('academic-sessions.index')
            ->with('success', 'Category session updated successfully.');
    }

    /**
     * Activate or deactivate several category sessions in one go from the
     * index page checkboxes. Multiple sessions can be active simultaneously.
     */
    public function bulkActivation(Request $request): RedirectResponse
    {
        $this->authorize('bulkUpdate', AcademicSession::class);

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:academic_sessions,id'],
            'action' => ['required', 'in:activate,deactivate'],
        ]);

        AcademicSession::whereIn('id', $validated['ids'])
            ->update(['is_active' => $validated['action'] === 'activate']);

        return redirect()->route('academic-sessions.index')
            ->with('success', ucfirst($validated['action']).'d '.count($validated['ids']).' category session(s).');
    }

    public function destroy(AcademicSession $academicSession): RedirectResponse
    {
        $academicSession->delete();

        return redirect()->route('academic-sessions.index')
            ->with('success', 'Category session deleted successfully.');
    }
}
