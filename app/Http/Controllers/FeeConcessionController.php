<?php

namespace App\Http\Controllers;

use App\Http\Requests\FeeConcession\StoreRequest;
use App\Http\Requests\FeeConcession\UpdateRequest;
use App\Models\FeeConcession;
use App\Models\FeeInvoice;
use App\Models\FeeStructure;
use App\Models\Student;
use App\Services\ActivityLogService;
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
            ->with(['student.user', 'feeStructure', 'feeInvoice'])
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
            'feeInvoices' => FeeInvoice::with('student.user:id,name', 'feeStructure:id,name')
                ->whereNull('deleted_at')
                ->orderByDesc('id')
                ->get(['id', 'invoice_number', 'student_id', 'fee_structure_id', 'total_amount', 'status']),
        ]);
    }

    public function store(StoreRequest $request): \Illuminate\Http\RedirectResponse
    {
        $concession = FeeConcession::create($request->validated());

        if ($concession->fee_invoice_id) {
            $this->recalculateInvoiceConcession($concession->fee_invoice_id);
        }

        $studentName = $concession->student?->user?->name ?? 'Unknown';
        ActivityLogService::custom('Fee Concessions', 'created', "Created concession for student: {$studentName}");

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
            'feeInvoices' => FeeInvoice::with('student.user:id,name', 'feeStructure:id,name')
                ->whereNull('deleted_at')
                ->orderByDesc('id')
                ->get(['id', 'invoice_number', 'student_id', 'fee_structure_id', 'total_amount', 'status']),
        ]);
    }

    public function update(UpdateRequest $request, FeeConcession $feeConcession): \Illuminate\Http\RedirectResponse
    {
        $oldInvoiceId = $feeConcession->fee_invoice_id;

        $feeConcession->update($request->validated());

        if ($feeConcession->fee_invoice_id) {
            $this->recalculateInvoiceConcession($feeConcession->fee_invoice_id);
        }

        if ($oldInvoiceId && $oldInvoiceId !== $feeConcession->fee_invoice_id) {
            $this->recalculateInvoiceConcession($oldInvoiceId);
        }

        $studentName = $feeConcession->student?->user?->name ?? 'Unknown';
        ActivityLogService::custom('Fee Concessions', 'updated', "Updated concession for student: {$studentName}");

        return redirect()->route('fee-concessions.index')
            ->with('success', 'Concession updated successfully.');
    }

    public function destroy(FeeConcession $feeConcession): \Illuminate\Http\RedirectResponse
    {
        $invoiceId = $feeConcession->fee_invoice_id;
        $studentName = $feeConcession->student?->user?->name ?? 'Unknown';

        $feeConcession->delete();

        if ($invoiceId) {
            $this->recalculateInvoiceConcession($invoiceId);
        }

        ActivityLogService::custom('Fee Concessions', 'deleted', "Deleted concession for student: {$studentName}");

        return redirect()->route('fee-concessions.index')
            ->with('success', 'Concession deleted successfully.');
    }

    private function recalculateInvoiceConcession(int $invoiceId): void
    {
        $invoice = FeeInvoice::find($invoiceId);
        if (! $invoice) {
            return;
        }

        $concessions = FeeConcession::where('fee_invoice_id', $invoiceId)
            ->where('is_active', true)
            ->whereNull('deleted_at')
            ->get();

        $totalConcession = 0;
        foreach ($concessions as $concession) {
            if ($concession->percentage !== null) {
                $totalConcession += (float) $invoice->total_amount * ((float) $concession->percentage / 100);
            } elseif ($concession->flat_amount !== null) {
                $totalConcession += (float) $concession->flat_amount;
            }
        }

        $invoice->concession_amount = min($totalConcession, (float) $invoice->total_amount);
        $invoice->recalculate();
    }
}
