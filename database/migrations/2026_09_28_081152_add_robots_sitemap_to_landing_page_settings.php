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
            if (! Schema::hasColumn('landing_page_settings', 'robots_indexing')) {
                $table->boolean('robots_indexing')->default(true)->after('canonical_url');
            }
            if (! Schema::hasColumn('landing_page_settings', 'sitemap_enabled')) {
                $table->boolean('sitemap_enabled')->default(true)->after('robots_indexing');
            }
            if (! Schema::hasColumn('landing_page_settings', 'custom_robots_txt')) {
                $table->text('custom_robots_txt')->nullable()->after('sitemap_enabled');
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
                'robots_indexing',
                'sitemap_enabled',
                'custom_robots_txt',
            ]);
        });
    }
};
