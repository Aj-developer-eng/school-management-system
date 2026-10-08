<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Exam papers (PDF/Word) uploaded against a class. The files themselves are
     * kept on the private "local" disk and are only served through the
     * permission-gated classes.papers.download route.
     */
    public function up(): void
    {
        Schema::create('class_papers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('school_class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->string('file_path');
            $table->string('original_name');
            $table->string('mime_type');
            $table->unsignedBigInteger('size')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('school_class_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_papers');
    }
};