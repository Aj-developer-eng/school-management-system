<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // NOTE: this migration shipped with an empty body, so it was recorded in the
        // `migrations` table without ever making `section_id` nullable. The actual
        // change now lives in 2026_10_16_120000_make_section_id_nullable_in_teacher_subject_assignments_table,
        // which is guarded and runs wherever the column is still NOT NULL.
        Schema::table('teacher_subject_assignments', function (Blueprint $table) {
            //
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('teacher_subject_assignments', function (Blueprint $table) {
            //
        });
    }
};
