<?php

namespace App\Http\Controllers;

use App\Http\Requests\Classwork\StoreRequest;
use App\Http\Requests\Classwork\UpdateRequest;
use App\Models\Classwork;
use App\Models\SchoolClass;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClassworkController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Classwork::class, 'classwork');
    }

    public function index(Request $request, SchoolClass $schoolClass): Response
    {
        $this->authorize('viewAny', Classwork::class);

        $classworks = $schoolClass->classworks()
            ->with('creator:id,name')
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Academic/Class/Classwork/Index', [
            'classworks' => $classworks,
            'classId' => $schoolClass->id,
            'classTitle' => $schoolClass->name,
        ]);
    }

    public function store(StoreRequest $request, SchoolClass $schoolClass): RedirectResponse
    {
        $validated = $request->validated();

        $classwork = $schoolClass->classworks()->create([
            'school_class_id' => $schoolClass->id,
            'type' => $validated['type'],
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
            'status' => $validated['status'] ?? 'published',
            'created_by' => $request->user()->id,
        ]);

        ActivityLogService::custom('Classwork', 'created', "Created classwork: {$classwork->title}");

        return redirect()->route('classes.classwork.index', $schoolClass->id)
            ->with('success', 'Classwork created successfully.');
    }

    public function update(UpdateRequest $request, SchoolClass $schoolClass, Classwork $classwork): RedirectResponse
    {
        $this->authorize('update', $classwork);

        $validated = $request->validated();

        $classwork->update([
            'type' => $validated['type'] ?? $classwork->type,
            'title' => $validated['title'] ?? $classwork->title,
            'description' => $validated['description'] ?? $classwork->description,
            'due_date' => $validated['due_date'] ?? $classwork->due_date,
            'status' => $validated['status'] ?? $classwork->status,
        ]);

        ActivityLogService::custom('Classwork', 'updated', "Updated classwork: {$classwork->title}");

        return redirect()->route('classes.classwork.index', $schoolClass->id)
            ->with('success', 'Classwork updated successfully.');
    }

    public function destroy(SchoolClass $schoolClass, Classwork $classwork): RedirectResponse
    {
        $this->authorize('delete', $classwork);

        $title = $classwork->title;
        $classwork->delete();

        ActivityLogService::custom('Classwork', 'deleted', "Deleted classwork: {$title}");

        return redirect()->route('classes.classwork.index', $schoolClass->id)
            ->with('success', 'Classwork deleted successfully.');
    }

    public function takeOnlineClass(Request $request, SchoolClass $schoolClass): RedirectResponse
    {
        if (! $request->user()->can('online-classes.take')) {
            abort(403, 'You are not authorized to take this online class.');
        }

        $onlineClass = $schoolClass->onlineClasses()
            ->active()
            ->whereNull('disabled_at')
            ->whereNotNull('meeting_link')
            ->latest('scheduled_at')
            ->first();

        if (! $onlineClass) {
            return back()->with('error', 'No active online class is scheduled for this class.');
        }

        return redirect()->away($onlineClass->meeting_link);
    }
}
