<?php

namespace App\Http\Controllers;

use App\Http\Requests\Section\StoreRequest;
use App\Http\Requests\Section\UpdateRequest;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Section;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SectionController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Section::class);
    }

    public function index(Request $request): Response
    {
        $sections = Section::query()
            ->with(['schoolClass', 'academicSession'])
            ->when($request->search, function ($query, $search): void {
                $query->where('name', 'like', "%{$search}%");
            })
            ->when($request->academic_session_id, function ($query, $id): void {
                $query->where('academic_session_id', $id);
            })
            ->when($request->school_class_id, function ($query, $id): void {
                $query->where('school_class_id', $id);
            })
            ->orderBy('academic_session_id', 'desc')
            ->orderBy('school_class_id')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Academic/Section/Index', [
            'sections' => $sections,
            'filters' => $request->only(['search', 'academic_session_id', 'school_class_id']),
            'sessions' => AcademicSession::orderByDesc('start_date')->pluck('name', 'id'),
            'classes' => SchoolClass::where('is_active', true)->orderBy('level')->pluck('name', 'id'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Academic/Section/Form', [
            'sessions' => AcademicSession::orderByDesc('start_date')->pluck('name', 'id'),
            'classes' => SchoolClass::where('is_active', true)->orderBy('level')->pluck('name', 'id'),
        ]);
    }

    public function store(StoreRequest $request): \Illuminate\Http\RedirectResponse
    {
        Section::create($request->validated());

        return redirect()->route('sections.index')
            ->with('success', 'Section created successfully.');
    }

    public function edit(Section $section): Response
    {
        return Inertia::render('Academic/Section/Form', [
            'section' => $section,
            'sessions' => AcademicSession::orderByDesc('start_date')->pluck('name', 'id'),
            'classes' => SchoolClass::where('is_active', true)->orderBy('level')->pluck('name', 'id'),
        ]);
    }

    public function update(UpdateRequest $request, Section $section): \Illuminate\Http\RedirectResponse
    {
        $section->update($request->validated());

        return redirect()->route('sections.index')
            ->with('success', 'Section updated successfully.');
    }

    public function destroy(Section $section): \Illuminate\Http\RedirectResponse
    {
        $section->delete();

        return redirect()->route('sections.index')
            ->with('success', 'Section deleted successfully.');
    }
}
