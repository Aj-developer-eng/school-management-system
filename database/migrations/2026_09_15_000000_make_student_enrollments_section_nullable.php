<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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
