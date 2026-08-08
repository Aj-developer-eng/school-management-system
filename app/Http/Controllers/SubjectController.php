<?php

namespace App\Http\Controllers;

use App\Http\Requests\Subject\StoreRequest;
use App\Http\Requests\Subject\UpdateRequest;
use App\Models\SchoolClass;
use App\Models\Subject;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubjectController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Subject::class);
    }

    public function index(Request $request): Response
    {
        $subjects = Subject::query()
            ->with('schoolClasses')
            ->when($request->search, function ($query, $search): void {
                $query->where(function ($q) use ($search): void {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Academic/Subject/Index', [
            'subjects' => $subjects,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Academic/Subject/Form', [
            'classes' => SchoolClass::where('is_active', true)->orderBy('level')->pluck('name', 'id'),
        ]);
    }

    public function store(StoreRequest $request): \Illuminate\Http\RedirectResponse
    {
        $subject = Subject::create($request->safe()->except('school_class_ids'));
        $subject->schoolClasses()->sync($request->input('school_class_ids', []));

        return redirect()->route('subjects.index')
            ->with('success', 'Subject created successfully.');
    }

    public function edit(Subject $subject): Response
    {
        $subject->load('schoolClasses');

        return Inertia::render('Academic/Subject/Form', [
            'subject' => $subject,
            'classes' => SchoolClass::where('is_active', true)->orderBy('level')->pluck('name', 'id'),
        ]);
    }

    public function update(UpdateRequest $request, Subject $subject): \Illuminate\Http\RedirectResponse
    {
        $subject->update($request->safe()->except('school_class_ids'));
        $subject->schoolClasses()->sync($request->input('school_class_ids', []));

        return redirect()->route('subjects.index')
            ->with('success', 'Subject updated successfully.');
    }

    public function destroy(Subject $subject): \Illuminate\Http\RedirectResponse
    {
        $subject->delete();

        return redirect()->route('subjects.index')
            ->with('success', 'Subject deleted successfully.');
    }
}
