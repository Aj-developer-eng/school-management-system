<?php

namespace App\Http\Controllers;

use App\Http\Requests\FeePayment\StoreRequest;
use App\Models\FeeInvoice;
use App\Models\FeePayment;
use App\Services\ActivityLogService;
use App\Services\FeePaymentService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class FeePaymentController extends Controller
{
    public function __construct()
    {
        $this->middleware(function (Request $request, $next): mixed {
            if ($request->routeIs('fee-payments.create') && ! $request->user()->can('fee-payments.create')) {
                abort(403);
            }
            if ($request->routeIs('fee-payments.store') && ! $request->user()->can('fee-payments.create')) {
                abort(403);
            }
            if ($request->routeIs('fee-payments.destroy') && ! $request->user()->can('fee-payments.delete')) {
                abort(403);
            }

            return $next($request);
        });
    }

    public function create(Request $request): Response
    {
        $invoice = null;
        if ($request->has('invoice_id')) {
            $invoice = FeeInvoice::with(['student.user', 'feeStructure'])
                ->findOrFail($request->input('invoice_id'));
        }

        return Inertia::render('Fee/Payment/Form', [
            'invoice' => $invoice,
            'invoices' => FeeInvoice::with(['student.user:id,name'])
                ->whereNull('deleted_at')
                ->whereNotIn('status', ['paid', 'cancelled'])
                ->get(['id', 'invoice_number', 'student_id', 'balance', 'total_amount', 'concession_amount', 'paid_amount']),
        ]);
    }

    public function store(StoreRequest $request, FeePaymentService $service): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validated();

        if ($request->hasFile('evidence')) {
            $path = $request->file('evidence')->store('payment-evidence', 'public');
            $validated['evidence_url'] = '/storage/' . $path;
        }

        unset($validated['evidence']);

        $payment = $service->recordPayment($validated);

        NotificationService::sendToAdmins([
            'type' => 'payment_recorded',
            'title' => "Payment recorded for invoice #{$payment->fee_invoice_id}",
            'message' => "Rs " . number_format((float) $payment->amount, 2) . " via {$payment->payment_method->value}",
            'link' => '/fee-invoices/' . $payment->fee_invoice_id,
        ]);

        ActivityLogService::custom('Fee Payments', 'recorded', "Recorded payment of Rs. {$payment->amount} for invoice #{$payment->fee_invoice_id}");

        return redirect()->route('fee-invoices.show', $payment->fee_invoice_id)
            ->with('success', 'Payment recorded successfully.');
    }

    public function destroy(FeePayment $feePayment, FeePaymentService $service): \Illuminate\Http\RedirectResponse
    {
        $invoiceId = $feePayment->fee_invoice_id;
        $service->deletePayment($feePayment);

        ActivityLogService::custom('Fee Payments', 'deleted', "Deleted payment of Rs. {$feePayment->amount} for invoice #{$invoiceId}");

        return redirect()->route('fee-invoices.show', $invoiceId)
            ->with('success', 'Payment deleted successfully.');
    }
}
