<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Combined invoices (created on /fee-invoices/create when several fee
     * structures are selected) are not linked to a single structure, so
     * `fee_structure_id` must accept null. The `items` JSON column snapshots
     * each included structure (id, name, amount) on the invoice itself so
     * the invoice remains self-descriptive even if structures change later.
     */
    public function up(): void
    {
        Schema::table('fee_invoices', function (Blueprint $table): void {
            $table->foreignId('fee_structure_id')->nullable()->change();
            $table->json('items')->nullable()->after('fee_structure_id');
        });
    }

    public function down(): void
    {
        Schema::table('fee_invoices', function (Blueprint $table): void {
            $table->dropColumn('items');

            // Restoring NOT NULL would fail while combined (null) invoices
            // exist, so `fee_structure_id` is intentionally left nullable.
        });
    }
};
