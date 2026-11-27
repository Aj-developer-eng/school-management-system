<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add the date_of_upload column to the class_papers table so users can
     * record when each paper was uploaded.
     */
    public function up(): void
    {
        Schema::table('class_papers', function (Blueprint $table): void {
            $table->date('date_of_upload')->nullable()->after('size');
        });
    }

    public function down(): void
    {
        Schema::table('class_papers', function (Blueprint $table): void {
            $table->dropColumn('date_of_upload');
        });
    }
};