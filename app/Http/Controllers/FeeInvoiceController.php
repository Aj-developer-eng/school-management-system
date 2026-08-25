<?php

namespace App\Http\Controllers;

use App\Http\Requests\FeeInvoice\BulkGenerateRequest;
use App\Http\Requests\FeeInvoice\StoreRequest;
use App\Models\AcademicSession;
use App\Models\FeeInvoice;
use App\Models\FeeStructure;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentParent;
use App\Models\User;
use App\Enums\RoleEnum;
use App\Services\ActivityLogService;
use App\Services\FeeInvoiceService;
use App\Services\SchoolSettingsService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class FeeInvoiceController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(FeeInvoice::class, 'fee_invoice');
    }

    public function index(Request $request): Response
    {
        $invoices = FeeInvoice::query()
            ->with(['student.user', 'academicSession', 'schoolClass', 'feeStructure'])
            ->when($this->scopedStudentIds($request->user()), function ($query, $studentIds): void {
                $query->whereIn('student_id', $studentIds);
            })
            ->when($request->search, function ($query, $search): void {
                $query->where(function ($q) use ($search): void {
                    $q->where('invoice_number', 'like', "%{$search}%")
                        ->orWhereHas('student.user', function ($sq) use ($search): void {
                            $sq->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($request->status, function ($query, $status): void {
                $query->where('status', $status);
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Fee/Invoice/Index', [
            'invoices' => $invoices,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Return the student IDs the current user is allowed to view invoices for.
     * Parents are scoped to their children; students to themselves.
     * Returns null for staff roles (no scoping — they see everything).
     */
    private function scopedStudentIds(User $user): ?Collection
    {
        if ($user->hasRole(RoleEnum::Parent->value)) {
            $parent = StudentParent::where('user_id', $user->id)->first();

            return $parent?->students()->pluck('students.id') ?? collect();
        }

        if ($user->hasRole(RoleEnum::Student->value)) {
            $student = Student::where('user_id', $user->id)->first();

            return $student ? collect([$student->id]) : collect();
        }

        return null;
    }

    public function create(): Response
    {
        return Inertia::render('Fee/Invoice/Form', [
            'students' => Student::with('user:id,name')->whereNull('deleted_at')->get(['id', 'user_id', 'admission_number']),
            'feeStructures' => FeeStructure::with(['academicSession:id,name', 'schoolClass:id,name'])
                ->where('is_active', true)
                ->get(['id', 'name', 'academic_session_id', 'school_class_id', 'amount']),
        ]);
    }

    public function store(StoreRequest $request, FeeInvoiceService $service): \Illuminate\Http\RedirectResponse
    {
        $service->createInvoice($request->validated());

        ActivityLogService::custom('Fee Invoices', 'created', 'Created a new fee invoice');

        return redirect()->route('fee-invoices.index')
            ->with('success', 'Invoice created successfully.');
    }

    public function show(FeeInvoice $feeInvoice): Response
    {
        $feeInvoice->load(['student.user', 'academicSession', 'schoolClass', 'feeStructure', 'payments' => function ($q): void {
            $q->latest();
        }, 'concessions' => function ($q): void {
            $q->whereNull('deleted_at')->latest();
        }]);

        return Inertia::render('Fee/Invoice/Show', [
            'invoice' => $feeInvoice,
        ]);
    }

    public function bulkGenerate(BulkGenerateRequest $request, FeeInvoiceService $service): \Illuminate\Http\RedirectResponse
    {
        $count = $service->bulkGenerate(
            $request->input('fee_structure_id'),
            $request->input('issue_date'),
            $request->input('due_date'),
        );

        ActivityLogService::custom('Fee Invoices', 'created', "Bulk generated {$count} invoice(s)");

        return redirect()->route('fee-invoices.index')
            ->with('success', "{$count} invoice(s) generated successfully.");
    }

    public function cancel(FeeInvoice $feeInvoice, FeeInvoiceService $service): \Illuminate\Http\RedirectResponse
    {
        $service->cancelInvoice($feeInvoice);

        ActivityLogService::custom('Fee Invoices', 'cancelled', "Cancelled invoice: {$feeInvoice->invoice_number}");

        return redirect()->route('fee-invoices.index')
            ->with('success', 'Invoice cancelled successfully.');
    }

    public function destroy(FeeInvoice $feeInvoice): \Illuminate\Http\RedirectResponse
    {
        $feeInvoice->delete();

        ActivityLogService::custom('Fee Invoices', 'deleted', "Deleted invoice: {$feeInvoice->invoice_number}");

        return redirect()->route('fee-invoices.index')
            ->with('success', 'Invoice deleted successfully.');
    }

    public function downloadPdf(FeeInvoice $feeInvoice, SchoolSettingsService $settingsService): \Illuminate\Http\Response
    {
        $this->authorize('view', $feeInvoice);

        $feeInvoice->load(['student.user', 'academicSession', 'schoolClass', 'feeStructure', 'payments' => function ($q): void {
            $q->latest();
        }, 'concessions' => function ($q): void {
            $q->whereNull('deleted_at')->latest();
        }]);

        $school = $settingsService->get();

        $logoBase64 = null;
        $media = $school->getFirstMedia($school::LOGO_COLLECTION);
        if ($media && file_exists($media->getPath())) {
            $logoBase64 = 'data:' . $media->mime_type . ';base64,' . base64_encode(file_get_contents($media->getPath()));
        }

        $pdf = Pdf::loadView('pdf.fee-invoice', [
            'invoice' => $feeInvoice,
            'school' => $school,
            'logoBase64' => $logoBase64,
        ]);

        return $pdf->download("invoice-{$feeInvoice->invoice_number}.pdf");
    }
}
