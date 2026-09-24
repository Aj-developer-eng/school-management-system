<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teacher_subject_assignments', function (Blueprint $table): void {
            $table->unsignedTinyInteger('day_of_week')->nullable()->after('end_time')->comment('1=Monday ... 7=Sunday');
            $table->index(['day_of_week', 'academic_session_id']);
        });
    }

    public function down(): void
    {
        Schema::table('teacher_subject_assignments', function (Blueprint $table): void {
            $table->dropIndex(['day_of_week', 'academic_session_id']);
            $table->dropColumn('day_of_week');
        });
    }
};
