<?php

namespace App\Http\Controllers;

use App\Enums\InvoiceStatusEnum;
use App\Enums\RoleEnum;
use App\Models\AcademicSession;
use App\Models\FeeInvoice;
use App\Models\FeePayment;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentParent;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class FeeReportController extends Controller
{
    public function index(Request $request): Response
    {
        $sessionId = $request->input('academic_session_id');
        $classId = $request->input('school_class_id');
        $scopedStudentIds = $this->scopedStudentIds($request->user());

        $invoiceQuery = FeeInvoice::query()
            ->when($scopedStudentIds, function ($q, $studentIds): void {
                $q->whereIn('student_id', $studentIds);
            })
            ->when($sessionId, function ($q) use ($sessionId): void {
                $q->where('academic_session_id', $sessionId);
            })
            ->when($classId, function ($q) use ($classId): void {
                $q->where('school_class_id', $classId);
            });

        $totalInvoiced = (clone $invoiceQuery)->sum('total_amount');
        $totalConcession = (clone $invoiceQuery)->sum('concession_amount');
        $totalCollected = (clone $invoiceQuery)->sum('paid_amount');
        $totalOutstanding = $totalInvoiced - $totalConcession - $totalCollected;

        $statusBreakdown = (clone $invoiceQuery)
            ->select('status', DB::raw('count(*) as count'), DB::raw('sum(total_amount) as total'))
            ->groupBy('status')
            ->get()
            ->map(fn ($row) => [
                'status' => $row->status,
                'count' => $row->count,
                'total' => (float) $row->total,
            ]);

        $collectionByMethod = FeePayment::query()
            ->join('fee_invoices', 'fee_payments.fee_invoice_id', '=', 'fee_invoices.id')
            ->whereNull('fee_invoices.deleted_at')
            ->when($scopedStudentIds, function ($q, $studentIds): void {
                $q->whereIn('fee_invoices.student_id', $studentIds);
            })
            ->when($sessionId, function ($q) use ($sessionId): void {
                $q->where('fee_invoices.academic_session_id', $sessionId);
            })
            ->when($classId, function ($q) use ($classId): void {
                $q->where('fee_invoices.school_class_id', $classId);
            })
            ->select('fee_payments.payment_method', DB::raw('sum(fee_payments.amount) as total'), DB::raw('count(*) as count'))
            ->groupBy('fee_payments.payment_method')
            ->get()
            ->map(fn ($row) => [
                'method' => $row->payment_method,
                'total' => (float) $row->total,
                'count' => $row->count,
            ]);

        $topOutstanding = (clone $invoiceQuery)
            ->with(['student.user', 'schoolClass'])
            ->whereNotIn('status', [InvoiceStatusEnum::Paid->value, InvoiceStatusEnum::Cancelled->value])
            ->orderByDesc('balance')
            ->limit(10)
            ->get();

        $classWiseSummary = (clone $invoiceQuery)
            ->join('school_classes', 'fee_invoices.school_class_id', '=', 'school_classes.id')
            ->select(
                'school_classes.name as class_name',
                DB::raw('count(*) as invoice_count'),
                DB::raw('sum(fee_invoices.total_amount) as total_invoiced'),
                DB::raw('sum(fee_invoices.concession_amount) as total_concession'),
                DB::raw('sum(fee_invoices.paid_amount) as total_collected'),
            )
            ->groupBy('school_classes.id', 'school_classes.name')
            ->orderBy('school_classes.level')
            ->get()
            ->map(fn ($row) => [
                'class_name' => $row->class_name,
                'invoice_count' => $row->invoice_count,
                'total_invoiced' => (float) $row->total_invoiced,
                'total_concession' => (float) $row->total_concession,
                'total_collected' => (float) $row->total_collected,
                'outstanding' => (float) $row->total_invoiced - (float) $row->total_concession - (float) $row->total_collected,
            ]);

        $isScoped = $scopedStudentIds !== null;
        $isSuperAdmin = $request->user()->hasRole(RoleEnum::SuperAdmin->value);

        return Inertia::render('Fee/Report/Index', [
            'summary' => [
                'total_invoiced' => (float) $totalInvoiced,
                'total_concession' => (float) $totalConcession,
                'total_collected' => (float) $totalCollected,
                'total_outstanding' => (float) $totalOutstanding,
                'invoice_count' => (clone $invoiceQuery)->count(),
            ],
            'statusBreakdown' => $statusBreakdown,
            'collectionByMethod' => $collectionByMethod,
            'topOutstanding' => $topOutstanding,
            'classWiseSummary' => $classWiseSummary,
            'filters' => $request->only(['academic_session_id', 'school_class_id']),
            'academicSessions' => AcademicSession::orderByDesc('start_date')->pluck('name', 'id'),
            'classes' => SchoolClass::where('is_active', true)->orderBy('level')->pluck('name', 'id'),
            'isScoped' => $isScoped,
            'isSuperAdmin' => $isSuperAdmin,
        ]);
    }

    /**
     * Return the student IDs the current user is allowed to view reports for.
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

    /**
     * Soft-deleted invoices and orphaned payments report (Super Admin only).
     */
    public function trashed(Request $request): Response
    {
        abort_unless($request->user()->hasRole(RoleEnum::SuperAdmin->value), 403);

        $trashedInvoices = FeeInvoice::onlyTrashed()
            ->with(['student.user', 'academicSession', 'schoolClass', 'feeStructure', 'payments' => function ($q): void {
                $q->withTrashed()->latest();
            }])
            ->latest('deleted_at')
            ->get()
            ->map(fn ($inv) => [
                'id' => $inv->id,
                'invoice_number' => $inv->invoice_number,
                'student_name' => $inv->student?->user?->name ?? '—',
                'class_name' => $inv->schoolClass?->name ?? '—',
                'session_name' => $inv->academicSession?->name ?? '—',
                'fee_structure' => $inv->feeStructure?->name ?? '—',
                'total_amount' => (float) $inv->total_amount,
                'concession_amount' => (float) $inv->concession_amount,
                'paid_amount' => (float) $inv->paid_amount,
                'balance' => (float) $inv->balance,
                'status' => $inv->status->value,
                'issue_date' => $inv->issue_date?->format('M d, Y'),
                'due_date' => $inv->due_date?->format('M d, Y'),
                'deleted_at' => $inv->deleted_at?->format('M d, Y H:i'),
                'payments' => $inv->payments->map(fn ($p) => [
                    'id' => $p->id,
                    'amount' => (float) $p->amount,
                    'payment_method' => $p->payment_method->value,
                    'payment_date' => $p->payment_date?->format('M d, Y'),
                    'transaction_reference' => $p->transaction_reference,
                    'deleted_at' => $p->deleted_at?->format('M d, Y H:i'),
                ])->toArray(),
            ]);

        // Orphaned payments: payments whose invoice is soft-deleted but the
        // payment itself is NOT soft-deleted (shouldn't happen after the
        // cascade fix, but may exist from before).
        $orphanedPayments = FeePayment::query()
            ->whereHas('invoice', function ($q): void {
                $q->onlyTrashed();
            })
            ->with(['invoice' => fn ($q) => $q->withTrashed()])
            ->latest()
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'amount' => (float) $p->amount,
                'payment_method' => $p->payment_method->value,
                'payment_date' => $p->payment_date?->format('M d, Y'),
                'transaction_reference' => $p->transaction_reference,
                'invoice_number' => $p->invoice?->invoice_number ?? '—',
                'invoice_id' => $p->fee_invoice_id,
            ]);

        $summary = [
            'trashed_invoice_count' => $trashedInvoices->count(),
            'trashed_total' => $trashedInvoices->sum('total_amount'),
            'trashed_collected' => $trashedInvoices->sum('paid_amount'),
            'orphaned_payment_count' => $orphanedPayments->count(),
            'orphaned_total' => $orphanedPayments->sum('amount'),
        ];

        return Inertia::render('Fee/Report/Trashed', [
            'trashedInvoices' => $trashedInvoices,
            'orphanedPayments' => $orphanedPayments,
            'summary' => $summary,
        ]);
    }

    /**
     * Download PDF of a soft-deleted invoice (Super Admin only).
     */
    public function trashedPdf(Request $request, int $id, SchoolSettingsService $settingsService): \Illuminate\Http\Response
    {
        abort_unless($request->user()->hasRole(RoleEnum::SuperAdmin->value), 403);

        $feeInvoice = FeeInvoice::onlyTrashed()
            ->with(['student.user', 'academicSession', 'schoolClass', 'feeStructure', 'payments' => function ($q): void {
                $q->withTrashed()->latest();
            }, 'concessions' => function ($q): void {
                $q->whereNull('deleted_at')->latest();
            }])
            ->findOrFail($id);

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

        return $pdf->download("trashed-invoice-{$feeInvoice->invoice_number}.pdf");
    }
}
