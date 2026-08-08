<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fee_structures', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('academic_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('school_class_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->enum('fee_type', \App\Enums\FeeTypeEnum::values());
            $table->decimal('amount', 10, 2);
            $table->enum('frequency', \App\Enums\FeeFrequencyEnum::values())->default('one_time');
            $table->unsignedSmallInteger('due_day')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['academic_session_id', 'school_class_id', 'is_active'], 'fee_structures_session_class_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fee_structures');
    }
};
