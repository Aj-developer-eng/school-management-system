<?php

namespace App\Http\Controllers;

use App\Http\Requests\SchoolClass\StoreRequest;
use App\Http\Requests\SchoolClass\UpdateRequest;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SchoolClassController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(SchoolClass::class, 'school_class');
    }

    public function index(Request $request): Response
    {
        $classes = SchoolClass::query()
            ->with('activeFromSession')
            ->when($request->search, function ($query, $search): void {
                $query->where(function ($q) use ($search): void {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->orderBy('level')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Academic/Class/Index', [
            'classes' => $classes,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Academic/Class/Form', [
            'sessions' => AcademicSession::orderByDesc('start_date')->pluck('name', 'id'),
        ]);
    }

    public function store(StoreRequest $request): \Illuminate\Http\RedirectResponse
    {
        SchoolClass::create($request->validated());

        return redirect()->route('classes.index')
            ->with('success', 'Class created successfully.');
    }

    public function edit(SchoolClass $schoolClass): Response
    {
        return Inertia::render('Academic/Class/Form', [
            'class' => $schoolClass,
            'sessions' => AcademicSession::orderByDesc('start_date')->pluck('name', 'id'),
        ]);
    }

    public function update(UpdateRequest $request, SchoolClass $schoolClass): \Illuminate\Http\RedirectResponse
    {
        $schoolClass->update($request->validated());

        return redirect()->route('classes.index')
            ->with('success', 'Class updated successfully.');
    }

    public function destroy(SchoolClass $schoolClass): \Illuminate\Http\RedirectResponse
    {
        $schoolClass->delete();

        return redirect()->route('classes.index')
            ->with('success', 'Class deleted successfully.');
    }
}
