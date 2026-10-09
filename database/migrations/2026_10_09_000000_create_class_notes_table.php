<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Notes an admin can attach to a class from the /classes action column.
     * Parents holding "classes.view-notes" see the notes of the classes their
     * children are enrolled in (see ClassNoteController).
     */
    public function up(): void
    {
        Schema::create('class_notes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('school_class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->text('body');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('school_class_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_notes');
    }
};
