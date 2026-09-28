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
        Schema::table('landing_page_settings', function (Blueprint $table): void {
            if (! Schema::hasColumn('landing_page_settings', 'meta_title')) {
                $table->string('meta_title', 255)->nullable()->after('footer_reach_label');
            }
            if (! Schema::hasColumn('landing_page_settings', 'meta_description')) {
                $table->text('meta_description')->nullable()->after('meta_title');
            }
            if (! Schema::hasColumn('landing_page_settings', 'meta_keywords')) {
                $table->text('meta_keywords')->nullable()->after('meta_description');
            }
            if (! Schema::hasColumn('landing_page_settings', 'og_image_url')) {
                $table->string('og_image_url', 500)->nullable()->after('meta_keywords');
            }
            if (! Schema::hasColumn('landing_page_settings', 'canonical_url')) {
                $table->string('canonical_url', 500)->nullable()->after('og_image_url');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('landing_page_settings', function (Blueprint $table): void {
            $table->dropColumn([
                'meta_title',
                'meta_description',
                'meta_keywords',
                'og_image_url',
                'canonical_url',
            ]);
        });
    }
};
