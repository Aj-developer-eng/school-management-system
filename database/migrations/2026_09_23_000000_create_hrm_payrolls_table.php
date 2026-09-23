<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hrm_payrolls', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('month'); // first day of the payroll month
            $table->decimal('amount', 12, 2)->default(0);
            $table->string('status')->default('unpaid'); // unpaid | paid
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['user_id', 'month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hrm_payrolls');
    }
};
