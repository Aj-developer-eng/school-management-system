<?php

namespace App\Http\Controllers;

use App\Http\Requests\FeeConcession\StoreRequest;
use App\Http\Requests\FeeConcession\UpdateRequest;
use App\Models\FeeConcession;
use App\Models\FeeStructure;
use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FeeConcessionController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(FeeConcession::class, 'fee_concession');
    }

    public function index(Request $request): Response
    {
        $concessions = FeeConcession::query()
            ->with(['student.user', 'feeStructure'])
            ->when($request->search, function ($query, $search): void {
                $query->where(function ($q) use ($search): void {
                    $q->where('concession_type', 'like', "%{$search}%")
                        ->orWhereHas('student.user', function ($sq) use ($search): void {
                            $sq->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Fee/Concession/Index', [
            'concessions' => $concessions,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Fee/Concession/Form', [
            'students' => Student::with('user:id,name')->whereNull('deleted_at')->get(['id', 'user_id', 'admission_number']),
            'feeStructures' => FeeStructure::where('is_active', true)->get(['id', 'name']),
        ]);
    }

    public function store(StoreRequest $request): \Illuminate\Http\RedirectResponse
    {
        FeeConcession::create($request->validated());

        return redirect()->route('fee-concessions.index')
            ->with('success', 'Concession created successfully.');
    }

    public function edit(FeeConcession $feeConcession): Response
    {
        $feeConcession->load('student.user');

        return Inertia::render('Fee/Concession/Form', [
            'concession' => $feeConcession,
            'students' => Student::with('user:id,name')->whereNull('deleted_at')->get(['id', 'user_id', 'admission_number']),
            'feeStructures' => FeeStructure::where('is_active', true)->get(['id', 'name']),
        ]);
    }

    public function update(UpdateRequest $request, FeeConcession $feeConcession): \Illuminate\Http\RedirectResponse
    {
        $feeConcession->update($request->validated());

        return redirect()->route('fee-concessions.index')
            ->with('success', 'Concession updated successfully.');
    }

    public function destroy(FeeConcession $feeConcession): \Illuminate\Http\RedirectResponse
    {
        $feeConcession->delete();

        return redirect()->route('fee-concessions.index')
            ->with('success', 'Concession deleted successfully.');
    }
}
