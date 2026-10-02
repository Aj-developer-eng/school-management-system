<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('section_categories', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique('name');
        });

        Schema::table('sections', function (Blueprint $table): void {
            $table->foreignId('section_category_id')
                ->nullable()
                ->after('name')
                ->constrained('section_categories')
                ->nullOnDelete();
        });

        $now = now();

        DB::table('section_categories')->insert([
            ['name' => 'Science', 'description' => 'Science stream sections', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Arts', 'description' => 'Arts / humanities stream sections', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Commercial', 'description' => 'Commerce stream sections', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Technical', 'description' => 'Technical / vocational stream sections', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Default', 'description' => 'Uncategorised sections', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::table('sections', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('section_category_id');
        });

        Schema::dropIfExists('section_categories');
    }
};