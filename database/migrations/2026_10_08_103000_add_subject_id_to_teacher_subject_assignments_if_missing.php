<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Repair a drifted live schema: `teacher_subject_assignments` on the live database was
     * created by an older version of the app (the create migration is already recorded in
     * the `migrations` table, but the physical table predates the current schema), which
     * breaks runtime queries with:
     * SQLSTATE[42S22]: Unknown column 'subject_id' in 'order clause'.
     *
     * Every step is guarded with hasColumn / index-name checks, so this migration is a
     * no-op on healthy databases (fresh installs, dev, tests).
     */
    public function up(): void
    {
        if (! Schema::hasColumn('teacher_subject_assignments', 'teacher_id')) {
            Schema::table('teacher_subject_assignments', function (Blueprint $table): void {
                $table->foreignId('teacher_id')->nullable()->after('id')
                    ->constrained('teachers')
                    ->cascadeOnDelete();
            });
        }

        if (! Schema::hasColumn('teacher_subject_assignments', 'subject_id')) {
            Schema::table('teacher_subject_assignments', function (Blueprint $table): void {
                // Nullable so pre-existing legacy rows remain valid; backfill subject_id
                // values after deploying (see deploy notes) before tightening it.
                $table->foreignId('subject_id')->nullable()->after('section_id')
                    ->constrained()
                    ->cascadeOnDelete();
            });
        }

        if (! Schema::hasColumn('teacher_subject_assignments', 'created_by')) {
            Schema::table('teacher_subject_assignments', function (Blueprint $table): void {
                $table->foreignId('created_by')->nullable()
                    ->constrained('users')
                    ->nullOnDelete();
            });
        }

        if (! Schema::hasColumn('teacher_subject_assignments', 'updated_by')) {
            Schema::table('teacher_subject_assignments', function (Blueprint $table): void {
                $table->foreignId('updated_by')->nullable()
                    ->constrained('users')
                    ->nullOnDelete();
            });
        }

        $indexNames = array_column(Schema::getIndexes('teacher_subject_assignments'), 'name');

        if (! in_array('tsa_session_class_section_index', $indexNames, true)) {
            Schema::table('teacher_subject_assignments', function (Blueprint $table): void {
                $table->index(
                    ['academic_session_id', 'school_class_id', 'section_id'],
                    'tsa_session_class_section_index',
                );
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Repair migration - intentionally left empty.
    }
};
