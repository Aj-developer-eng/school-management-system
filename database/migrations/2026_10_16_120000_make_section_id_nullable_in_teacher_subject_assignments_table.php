<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Finish the work migration 2026_08_12_102717 was meant to do: that file was
     * generated with an empty up() body, so on every database where it is recorded
     * in the `migrations` table it never actually altered the column.
     *
     * The application treats the section as optional everywhere ("Section (Optional)"
     * on the assignment form, `section_id => nullable` in the Store/Update requests),
     * but the physical column created by 2026_08_06_155100 is NOT NULL, so creating
     * an assignment without a section fails on MySQL with:
     *
     * SQLSTATE[23000]: Integrity constraint violation: 1048
     * Column 'section_id' cannot be null.
     *
     * Every step is guarded (hasTable / hasColumn / nullability check), so this
     * migration is a no-op on databases where the column is already nullable
     * (e.g. tables rebuilt by the 2026_10_08 repair migration).
     */
    public function up(): void
    {
        if (! Schema::hasTable('teacher_subject_assignments')
            || ! Schema::hasColumn('teacher_subject_assignments', 'section_id')) {
            return;
        }

        $sectionColumn = collect(Schema::getColumns('teacher_subject_assignments'))
            ->firstWhere('name', 'section_id');

        if (! $sectionColumn || ($sectionColumn['nullable'] ?? false)) {
            return;
        }

        Schema::table('teacher_subject_assignments', function (Blueprint $table): void {
            // Same definition the 2026_10_08 repair migration uses when it has to
            // (re)create this column, so all databases converge on one shape. The
            // existing FK and indexes stay in place - only nullability changes.
            $table->foreignId('section_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Repair migration - intentionally left empty.
    }
};
