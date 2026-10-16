<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Mirrors admission_number_counters: one sequential counter per class
        // for the academic session, so roll numbers stay unique per class.
        Schema::create('roll_number_counters', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('academic_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('school_class_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('last_number')->default(0);
            $table->timestamps();

            $table->unique(
                ['academic_session_id', 'school_class_id'],
                'rnc_session_class_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('roll_number_counters');
    }
};
