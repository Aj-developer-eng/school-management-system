<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Pivot recording which fee structures make up an invoice. A single
        // invoice created from multiple selected structures (a "combined"
        // invoice) lists all of them here; legacy single-structure invoices
        // only have fee_invoices.fee_structure_id set.
        Schema::create('fee_invoice_fee_structures', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('fee_invoice_id')->constrained()->cascadeOnDelete();
            $table->foreignId('fee_structure_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['fee_invoice_id', 'fee_structure_id'], 'fee_invoice_structure_unique');
        });

        // Combined invoices are not tied to one fee structure.
        Schema::table('fee_invoices', function (Blueprint $table): void {
            $table->foreignId('fee_structure_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('fee_invoices', function (Blueprint $table): void {
            $table->foreignId('fee_structure_id')->nullable(false)->change();
        });

        Schema::dropIfExists('fee_invoice_fee_structures');
    }
};
