<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Repair drifted schemas: e.g. a live database restored from an older dump where the
        // create migration is already recorded in the `migrations` table but the column itself
        // is missing. Without this guard, `migrate` dies with:
        // SQLSTATE[42S22]: Unknown column 'section_id' in 'student_enrollments'.
        if (! Schema::hasColumn('student_enrollments', 'section_id')) {
            Schema::table('student_enrollments', function (Blueprint $table): void {
                $table->foreignId('section_id')->nullable()->after('school_class_id')
                    ->constrained()
                    ->nullOnDelete();

                // The composite index from the create migration cannot exist while the
                // column was missing, so recreate it to match the canonical schema.
                $table->index(
                    ['academic_session_id', 'school_class_id', 'section_id'],
                    'se_session_class_section_index',
                );
            });

            return;
        }

        Schema::table('student_enrollments', function (Blueprint $table): void {
            $table->foreignId('section_id')->nullable()->change();

            $table->dropForeign(['section_id']);
            $table->foreign('section_id')
                ->references('id')
                ->on('sections')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('student_enrollments', function (Blueprint $table): void {
            $table->foreignId('section_id')->nullable(false)->change();

            $table->dropForeign(['section_id']);
            $table->foreign('section_id')
                ->references('id')
                ->on('sections')
                ->cascadeOnDelete();
        });
    }
};
