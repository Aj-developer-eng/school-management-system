<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parent_student', function (Blueprint $table): void {
            $table->foreignId('parent_id')->constrained('parents')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->enum('guardian_type', ['Father', 'Mother', 'Guardian']);
            $table->boolean('is_primary_contact')->default(false);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->primary(['parent_id', 'student_id']);
            $table->index(['student_id', 'is_primary_contact']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parent_student');
    }
};
