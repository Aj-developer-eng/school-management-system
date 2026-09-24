<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teacher_subject_assignments', function (Blueprint $table): void {
            if (! Schema::hasColumn('teacher_subject_assignments', 'days_of_week')) {
                $table->json('days_of_week')->nullable()->after('end_time')->comment('Array of days 1=Monday ... 7=Sunday');
            }
        });

        // Migrate any legacy single-day values into the new array column.
        if (Schema::hasColumn('teacher_subject_assignments', 'day_of_week')) {
            DB::table('teacher_subject_assignments')
                ->whereNotNull('day_of_week')
                ->whereNull('days_of_week')
                ->orderBy('id')
                ->each(function ($row): void {
                    DB::table('teacher_subject_assignments')
                        ->where('id', $row->id)
                        ->update(['days_of_week' => json_encode([(int) $row->day_of_week])]);
                });
        }
    }

    public function down(): void
    {
        Schema::table('teacher_subject_assignments', function (Blueprint $table): void {
            if (Schema::hasColumn('teacher_subject_assignments', 'days_of_week')) {
                $table->dropColumn('days_of_week');
            }
        });
    }
};
