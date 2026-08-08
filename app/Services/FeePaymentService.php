<?php

namespace App\Services;

use App\Models\FeeInvoice;
use App\Models\FeePayment;
use Illuminate\Support\Facades\DB;

class FeePaymentService
{
    public function recordPayment(array $data): FeePayment
    {
        return DB::transaction(function () use ($data): FeePayment {
            $payment = FeePayment::create($data);

            $payment->invoice->recalculate();

            return $payment;
        });
    }

    public function deletePayment(FeePayment $payment): void
    {
        DB::transaction(function () use ($payment): void {
            $invoice = $payment->invoice;
            $payment->delete();
            $invoice->recalculate();
        });
    }
}
