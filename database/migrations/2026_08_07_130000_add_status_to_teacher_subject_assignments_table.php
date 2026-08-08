<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teacher_subject_assignments', function (Blueprint $table): void {
            $table->string('status')->default('pending')->after('subject_id');
            $table->timestamp('started_at')->nullable()->after('status');
            $table->timestamp('completed_at')->nullable()->after('started_at');

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::table('teacher_subject_assignments', function (Blueprint $table): void {
            $table->dropIndex(['status']);
            $table->dropColumn(['status', 'started_at', 'completed_at']);
        });
    }
};
