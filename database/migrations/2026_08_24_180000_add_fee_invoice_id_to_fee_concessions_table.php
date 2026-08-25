<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fee_concessions', function (Blueprint $table): void {
            $table->foreignId('fee_invoice_id')->nullable()->after('fee_structure_id')->constrained('fee_invoices')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('fee_concessions', function (Blueprint $table): void {
            $table->dropForeign(['fee_invoice_id']);
            $table->dropColumn('fee_invoice_id');
        });
    }
};
