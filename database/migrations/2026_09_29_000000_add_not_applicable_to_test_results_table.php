<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('test_results', function (Blueprint $table): void {
            if (! Schema::hasColumn('test_results', 'is_not_applicable')) {
                $table->boolean('is_not_applicable')->default(false)->after('is_absent');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('test_results', function (Blueprint $table): void {
            if (Schema::hasColumn('test_results', 'is_not_applicable')) {
                $table->dropColumn('is_not_applicable');
            }
        });
    }
};
