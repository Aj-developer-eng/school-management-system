<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('landing_page_settings', function (Blueprint $table) {
            // New dynamic content fields
            $table->string('hero_title_suffix')->nullable()->after('hero_title_highlight');
            $table->string('hero_float_label')->nullable()->after('hero_stats');
            $table->string('hero_float_value')->nullable()->after('hero_float_label');
            $table->string('hero_float_sub')->nullable()->after('hero_float_value');
            $table->string('programs_title_highlight')->nullable()->after('programs_title');
            $table->string('locations_title_highlight')->nullable()->after('locations_title');
            $table->string('dashboard_title_highlight')->nullable()->after('dashboard_title');
            $table->string('dashboard_preview_label')->nullable()->after('dashboard_preview');
            $table->string('dashboard_preview_status')->nullable()->after('dashboard_preview_label');
            $table->string('dashboard_preview_units_label')->nullable()->after('dashboard_preview_status');
            $table->string('dashboard_preview_attendance_label')->nullable()->after('dashboard_preview_units_label');
            $table->string('dashboard_preview_ielts_label')->nullable()->after('dashboard_preview_attendance_label');
            $table->string('dashboard_preview_mentor_label')->nullable()->after('dashboard_preview_ielts_label');
            $table->string('why_us_title_highlight')->nullable()->after('why_us_title');
            $table->string('testimonials_title_highlight')->nullable()->after('testimonials_title');
            $table->string('cta_badge_text')->nullable()->after('cta_description');
            $table->string('cta_title_highlight')->nullable()->after('cta_badge_text');
            $table->json('footer_institute_links')->nullable()->after('footer_institute_label');
            $table->string('footer_mode_text')->nullable()->after('footer_institute_links');
            $table->string('footer_tagline')->nullable()->after('footer_mode_text');
        });

        // Drop unused columns
        Schema::table('landing_page_settings', function (Blueprint $table) {
            $table->dropColumn([
                'about_label',
                'about_title',
                'about_description',
                'about_image_url',
                'about_features',
                'values',
                'teachers_label',
                'teachers_title',
                'teachers_subtitle',
                'founder_name',
                'founder_qualification',
                'founder_bio',
                'founder_image_url',
                'admissions_title',
                'admissions_description',
                'admissions_button_text',
                'admissions_button_link',
                'admissions_secondary_button_text',
                'admissions_secondary_button_link',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('landing_page_settings', function (Blueprint $table) {
            $table->dropColumn([
                'hero_title_suffix',
                'hero_float_label',
                'hero_float_value',
                'hero_float_sub',
                'programs_title_highlight',
                'locations_title_highlight',
                'dashboard_title_highlight',
                'dashboard_preview_label',
                'dashboard_preview_status',
                'dashboard_preview_units_label',
                'dashboard_preview_attendance_label',
                'dashboard_preview_ielts_label',
                'dashboard_preview_mentor_label',
                'why_us_title_highlight',
                'testimonials_title_highlight',
                'cta_badge_text',
                'cta_title_highlight',
                'footer_institute_links',
                'footer_mode_text',
                'footer_tagline',
            ]);
        });

        Schema::table('landing_page_settings', function (Blueprint $table) {
            $table->string('about_label')->nullable();
            $table->string('about_title')->nullable();
            $table->text('about_description')->nullable();
            $table->string('about_image_url')->nullable();
            $table->json('about_features')->nullable();
            $table->json('values')->nullable();
            $table->string('teachers_label')->nullable();
            $table->string('teachers_title')->nullable();
            $table->string('teachers_subtitle')->nullable();
            $table->string('founder_name')->nullable();
            $table->string('founder_qualification')->nullable();
            $table->text('founder_bio')->nullable();
            $table->string('founder_image_url')->nullable();
            $table->string('admissions_title')->nullable();
            $table->text('admissions_description')->nullable();
            $table->string('admissions_button_text')->nullable();
            $table->string('admissions_button_link')->nullable();
            $table->string('admissions_secondary_button_text')->nullable();
            $table->string('admissions_secondary_button_link')->nullable();
        });
    }
};
