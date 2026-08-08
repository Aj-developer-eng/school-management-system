<?php

namespace App\Services;

use App\Models\FeeInvoice;
use Illuminate\Support\Facades\DB;

class InvoiceNumberGenerator
{
    public function generate(int $academicSessionId): string
    {
        return DB::transaction(function () use ($academicSessionId): string {
            $lastInvoice = FeeInvoice::where('academic_session_id', $academicSessionId)
                ->orderByDesc('id')
                ->lockForUpdate()
                ->first();

            $nextSequence = $lastInvoice ? ((int) substr($lastInvoice->invoice_number, -5)) + 1 : 1;

            return sprintf('INV-%d-%05d', $academicSessionId, $nextSequence);
        });
    }
}
