<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('school_classes', function (Blueprint $table): void {
            $table->dropIndex(['is_active', 'level']);
            $table->dropColumn('level');
        });
    }

    public function down(): void
    {
        Schema::table('school_classes', function (Blueprint $table): void {
            $table->unsignedTinyInteger('level')->default(0)->after('code');
            $table->index(['is_active', 'level']);
        });
    }
};