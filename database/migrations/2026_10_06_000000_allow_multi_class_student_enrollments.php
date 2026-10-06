<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Allow a student to be enrolled in more than one class per session.
     *
     * The uniqueness moves from (student, session) to (student, session, class)
     * so each class gets its own enrollment row.
     */
    public function up(): void
    {
        $indexes = array_column(Schema::getIndexes('student_enrollments'), 'name');

        // The replacement key lands first: InnoDB refuses to drop an index a
        // foreign key depends on (error 1553) unless a suitable stand-in
        // already exists, and the `student_id` foreign key is served by
        // `se_student_session_unique`. The composite starts with `student_id`
        // as well, so the constraint simply rebinds to it on the drop.
        if (! in_array('se_student_session_class_unique', $indexes, true)) {
            Schema::table('student_enrollments', function (Blueprint $table): void {
                $table->unique(
                    ['student_id', 'academic_session_id', 'school_class_id'],
                    'se_student_session_class_unique'
                );
            });
        }

        if (in_array('se_student_session_unique', $indexes, true)) {
            Schema::table('student_enrollments', function (Blueprint $table): void {
                $table->dropUnique('se_student_session_unique');
            });
        }
    }

    public function down(): void
    {
        $indexes = array_column(Schema::getIndexes('student_enrollments'), 'name');

        // Mirror of up(): the two-column key is restored before the composite
        // is dropped so the `student_id` foreign key always has an index to
        // fall back to. Reversal assumes one enrollment row per student and
        // session — multi-class rows must be removed by hand first.
        if (! in_array('se_student_session_unique', $indexes, true)) {
            Schema::table('student_enrollments', function (Blueprint $table): void {
                $table->unique(['student_id', 'academic_session_id'], 'se_student_session_unique');
            });
        }

        if (in_array('se_student_session_class_unique', $indexes, true)) {
            Schema::table('student_enrollments', function (Blueprint $table): void {
                $table->dropUnique('se_student_session_class_unique');
            });
        }
    }
};