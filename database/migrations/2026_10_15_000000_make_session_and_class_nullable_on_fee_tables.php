<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Fee structures may be saved without an academic session or class so a
     * fee can be defined once and applied school-wide / session-agnostic.
     *
     * Invoices keep a required academic session because the invoice-number
     * series is keyed by it (FeeInvoiceService resolves the structure's
     * session, falling back to the student's enrollment and then the active
     * session), but their class becomes optional to match structures created
     * without a class.
     */
    public function up(): void
    {
        Schema::table('fee_structures', function (Blueprint $table): void {
            $table->foreignId('academic_session_id')->nullable()->change();
            $table->foreignId('school_class_id')->nullable()->change();
        });

        Schema::table('fee_invoices', function (Blueprint $table): void {
            $table->foreignId('school_class_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        // Restoring NOT NULL fails while NULL rows exist — delete or reassign
        // those structures/invoices first.
        Schema::table('fee_invoices', function (Blueprint $table): void {
            $table->foreignId('school_class_id')->nullable(false)->change();
        });

        Schema::table('fee_structures', function (Blueprint $table): void {
            $table->foreignId('academic_session_id')->nullable(false)->change();
            $table->foreignId('school_class_id')->nullable(false)->change();
        });
    }
};