<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_enrollments', function (Blueprint $table) {
            $table->foreignId('section_id')
                ->nullable()
                ->after('school_class_id')
                ->constrained('sections')
                ->nullOnDelete();

            $table->index(
                ['academic_session_id', 'school_class_id', 'section_id'],
                'se_session_class_section_index'
            );
        });
    }

    public function down(): void
    {
        Schema::table('student_enrollments', function (Blueprint $table) {
            $table->dropForeign(['section_id']);
            $table->dropIndex('se_session_class_section_index');
            $table->dropColumn('section_id');
        });
    }
};