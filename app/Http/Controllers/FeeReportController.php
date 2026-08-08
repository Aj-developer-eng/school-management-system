<?php

namespace App\Http\Controllers;

use App\Enums\InvoiceStatusEnum;
use App\Models\AcademicSession;
use App\Models\FeeInvoice;
use App\Models\FeePayment;
use App\Models\SchoolClass;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class FeeReportController extends Controller
{
    public function index(Request $request): Response
    {
        $sessionId = $request->input('academic_session_id');
        $classId = $request->input('school_class_id');

        $invoiceQuery = FeeInvoice::query()
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
        ]);
    }
}
