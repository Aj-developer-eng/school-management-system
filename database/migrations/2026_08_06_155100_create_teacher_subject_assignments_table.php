<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teacher_subject_assignments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->foreignId('academic_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('school_class_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['academic_session_id', 'school_class_id'], 'tsa_session_class_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_subject_assignments');
    }
};
