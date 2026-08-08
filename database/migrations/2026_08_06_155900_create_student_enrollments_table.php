<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_enrollments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('academic_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('school_class_id')->constrained()->cascadeOnDelete();
            $table->foreignId('section_id')->constrained()->cascadeOnDelete();
            $table->string('roll_number', 20)->nullable();
            $table->date('enrolled_on')->default(now()->toDateString());
            $table->enum('status', ['active', 'completed', 'transferred', 'withdrawn'])->default('active');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['student_id', 'academic_session_id'], 'se_student_session_unique');
            $table->index(['academic_session_id', 'school_class_id', 'section_id'], 'se_session_class_section_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_enrollments');
    }
};
