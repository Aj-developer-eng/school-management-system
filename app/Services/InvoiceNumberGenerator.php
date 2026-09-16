<?php

namespace App\Services;

use App\Models\FeeInvoice;
use Illuminate\Support\Facades\DB;

class InvoiceNumberGenerator
{
    public function generate(int $academicSessionId): string
    {
        return DB::transaction(function () use ($academicSessionId): string {
            $prefix = sprintf('INV-%d-', $academicSessionId);

            // Soft-deleted invoices still occupy their invoice_number (the
            // UNIQUE constraint applies to them too), so they must be included
            // when computing the next sequence. Order by the number itself —
            // the zero-padded suffix sorts correctly — so the highest sequence
            // wins even when rows were created or deleted out of order.
            $lastInvoice = FeeInvoice::withTrashed()
                ->where('academic_session_id', $academicSessionId)
                ->orderByDesc('invoice_number')
                ->lockForUpdate()
                ->first();

            $nextSequence = $lastInvoice ? ((int) substr($lastInvoice->invoice_number, -5)) + 1 : 1;

            // Safety net: skip any number that already exists (e.g. a number
            // committed by a concurrent request between the read and insert).
            while (FeeInvoice::withTrashed()
                ->where('invoice_number', $prefix.sprintf('%05d', $nextSequence))
                ->exists()) {
                $nextSequence++;
            }

            return $prefix.sprintf('%05d', $nextSequence);
        });
    }
}
