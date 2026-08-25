<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('landing_page_settings', function (Blueprint $table): void {
            // Hero stats (hero buttons already exist from previous migration)
            $table->json('hero_stats')->nullable()->after('hero_secondary_button_link');

            // Programs section
            $table->string('programs_label')->nullable()->after('banner_image_url');
            $table->string('programs_title')->nullable()->after('programs_label');
            $table->string('programs_link_text')->nullable()->after('programs_title');
            $table->json('programs')->nullable()->after('programs_link_text');

            // Locations section
            $table->string('locations_label')->nullable()->after('programs');
            $table->string('locations_title')->nullable()->after('locations_label');
            $table->text('locations_description')->nullable()->after('locations_title');
            $table->json('locations')->nullable()->after('locations_description');

            // Dashboard section
            $table->string('dashboard_label')->nullable()->after('locations');
            $table->string('dashboard_title')->nullable()->after('dashboard_label');
            $table->text('dashboard_description')->nullable()->after('dashboard_title');
            $table->json('dashboard_features')->nullable()->after('dashboard_description');
            $table->string('dashboard_button_text')->nullable()->after('dashboard_features');
            $table->string('dashboard_button_link')->nullable()->after('dashboard_button_text');
            $table->json('dashboard_preview')->nullable()->after('dashboard_button_link');

            // Why Us section
            $table->string('why_us_label')->nullable()->after('dashboard_preview');
            $table->string('why_us_title')->nullable()->after('why_us_label');
            $table->json('why_us')->nullable()->after('why_us_title');

            // Testimonials section
            $table->string('testimonials_label')->nullable()->after('why_us');
            $table->string('testimonials_title')->nullable()->after('testimonials_label');
            $table->json('testimonials')->nullable()->after('testimonials_title');

            // CTA section
            $table->string('cta_title')->nullable()->after('testimonials');
            $table->text('cta_description')->nullable()->after('cta_title');
            $table->string('cta_button_text')->nullable()->after('cta_description');
            $table->string('cta_button_link')->nullable()->after('cta_button_text');
            $table->string('cta_secondary_button_text')->nullable()->after('cta_button_link');
            $table->string('cta_secondary_button_link')->nullable()->after('cta_secondary_button_text');

            // Footer links
            $table->string('footer_programs_label')->nullable()->after('footer_description');
            $table->string('footer_institute_label')->nullable()->after('footer_programs_label');
            $table->string('footer_reach_label')->nullable()->after('footer_institute_label');
        });
    }

    public function down(): void
    {
        Schema::table('landing_page_settings', function (Blueprint $table): void {
            $table->dropColumn([
                'hero_stats',
                'programs_label',
                'programs_title',
                'programs_link_text',
                'programs',
                'locations_label',
                'locations_title',
                'locations_description',
                'locations',
                'dashboard_label',
                'dashboard_title',
                'dashboard_description',
                'dashboard_features',
                'dashboard_button_text',
                'dashboard_button_link',
                'dashboard_preview',
                'why_us_label',
                'why_us_title',
                'why_us',
                'testimonials_label',
                'testimonials_title',
                'testimonials',
                'cta_title',
                'cta_description',
                'cta_button_text',
                'cta_button_link',
                'cta_secondary_button_text',
                'cta_secondary_button_link',
                'footer_programs_label',
                'footer_institute_label',
                'footer_reach_label',
            ]);
        });
    }
};
