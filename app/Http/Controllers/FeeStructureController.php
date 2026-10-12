<?php

namespace App\Http\Controllers;

use App\Http\Requests\FeeStructure\StoreRequest;
use App\Http\Requests\FeeStructure\UpdateRequest;
use App\Models\AcademicSession;
use App\Models\FeeStructure;
use App\Models\SchoolClass;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class FeeStructureController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(FeeStructure::class, 'fee_structure');
    }

    public function index(Request $request): Response
    {
        $feeStructures = FeeStructure::query()
            ->with(['academicSession', 'schoolClass'])
            ->when($request->search, function ($query, $search): void {
                $query->where(function ($q) use ($search): void {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('fee_type', 'like', "%{$search}%");
                });
            })
            ->when($request->academic_session_id, function ($query, $sessionId): void {
                $query->where('academic_session_id', $sessionId);
            })
            ->when($request->school_class_id, function ($query, $classId): void {
                $query->where('school_class_id', $classId);
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Fee/Structure/Index', [
            'feeStructures' => $feeStructures,
            'filters' => $request->only(['search', 'academic_session_id', 'school_class_id']),
            'academicSessions' => AcademicSession::orderByDesc('start_date')->pluck('name', 'id'),
            'classes' => SchoolClass::where('is_active', true)->orderBy('level')->pluck('name', 'id'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Fee/Structure/Form', [
            'academicSessions' => AcademicSession::orderByDesc('start_date')->get(['id', 'name', 'is_active']),
            'classes' => $this->classOptions(),
        ]);
    }

    public function store(StoreRequest $request): \Illuminate\Http\RedirectResponse
    {
        FeeStructure::create($request->validated());

        return redirect()->route('fee-structures.index')
            ->with('success', 'Fee structure created successfully.');
    }

    public function edit(FeeStructure $feeStructure): Response
    {
        return Inertia::render('Fee/Structure/Form', [
            'feeStructure' => $feeStructure,
            'academicSessions' => AcademicSession::orderByDesc('start_date')->get(['id', 'name', 'is_active']),
            'classes' => $this->classOptions(),
        ]);
    }

    public function update(UpdateRequest $request, FeeStructure $feeStructure): \Illuminate\Http\RedirectResponse
    {
        $feeStructure->update($request->validated());

        return redirect()->route('fee-structures.index')
            ->with('success', 'Fee structure updated successfully.');
    }

    public function destroy(FeeStructure $feeStructure): \Illuminate\Http\RedirectResponse
    {
        $feeStructure->delete();

        return redirect()->route('fee-structures.index')
            ->with('success', 'Fee structure deleted successfully.');
    }

    /**
     * Options for the searchable class picker on the create/edit form.
     * `keywords` lets the picker match on the class code as well as the name shown in the label.
     *
     * @return Collection<int, array{value: int, label: string, keywords: string}>
     */
    private function classOptions(): Collection
    {
        return SchoolClass::where('is_active', true)
            ->orderBy('level')
            ->get(['id', 'name', 'code'])
            ->map(fn (SchoolClass $class): array => [
                'value' => $class->id,
                'label' => $class->name.' ('.$class->code.')',
                'keywords' => trim($class->name.' '.$class->code),
            ]);
    }
}
