<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fee_concessions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('fee_structure_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('concession_type', \App\Enums\ConcessionTypeEnum::values());
            $table->decimal('percentage', 5, 2)->nullable();
            $table->decimal('flat_amount', 10, 2)->nullable();
            $table->text('reason')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['student_id', 'is_active'], 'fee_concessions_student_active_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fee_concessions');
    }
};
