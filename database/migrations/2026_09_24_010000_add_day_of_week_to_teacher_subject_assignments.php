<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teacher_subject_assignments', function (Blueprint $table): void {
            if (! Schema::hasColumn('teacher_subject_assignments', 'day_of_week')) {
                $table->unsignedTinyInteger('day_of_week')->nullable()->after('end_time')->comment('1=Monday ... 7=Sunday');
            }

            
            if (! $this->hasDayOfWeekIndex()) {
                $table->index(['day_of_week', 'academic_session_id'], 'tsa_day_session_index');
            }
        });
    }

    public function down(): void
    {
        Schema::table('teacher_subject_assignments', function (Blueprint $table): void {
            if ($this->hasDayOfWeekIndex()) {
                $table->dropIndex('tsa_day_session_index');
            }

            if (Schema::hasColumn('teacher_subject_assignments', 'day_of_week')) {
                $table->dropColumn('day_of_week');
            }
        });
    }

    private function hasDayOfWeekIndex(): bool
    {
        foreach (Schema::getIndexes('teacher_subject_assignments') as $index) {
            if ($index['columns'] === ['day_of_week', 'academic_session_id']) {
                return true;
            }
        }

        return false;
    }
};
