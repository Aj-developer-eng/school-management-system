<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LandingPageSetting extends Model
{
    protected $fillable = [
        'hero_badge_text',
        'hero_title',
        'hero_title_highlight',
        'hero_title_suffix',
        'hero_subtitle',
        'hero_button_text',
        'hero_button_link',
        'hero_secondary_button_text',
        'hero_secondary_button_link',
        'hero_stats',
        'hero_float_label',
        'hero_float_value',
        'hero_float_sub',
        'banner_image_url',
        'programs_label',
        'programs_title',
        'programs_title_highlight',
        'programs_link_text',
        'programs',
        'locations_label',
        'locations_title',
        'locations_title_highlight',
        'locations_description',
        'locations',
        'dashboard_label',
        'dashboard_title',
        'dashboard_title_highlight',
        'dashboard_description',
        'dashboard_features',
        'dashboard_button_text',
        'dashboard_button_link',
        'dashboard_preview',
        'dashboard_preview_label',
        'dashboard_preview_status',
        'dashboard_preview_units_label',
        'dashboard_preview_attendance_label',
        'dashboard_preview_ielts_label',
        'dashboard_preview_mentor_label',
        'why_us_label',
        'why_us_title',
        'why_us_title_highlight',
        'why_us',
        'testimonials_label',
        'testimonials_title',
        'testimonials_title_highlight',
        'testimonials',
        'cta_badge_text',
        'cta_title',
        'cta_title_highlight',
        'cta_description',
        'cta_button_text',
        'cta_button_link',
        'cta_secondary_button_text',
        'cta_secondary_button_link',
        'footer_description',
        'footer_programs_label',
        'footer_institute_label',
        'footer_institute_links',
        'footer_reach_label',
        'footer_mode_text',
        'footer_tagline',
    ];

    protected function casts(): array
    {
        return [
            'hero_stats' => 'array',
            'programs' => 'array',
            'locations' => 'array',
            'dashboard_features' => 'array',
            'dashboard_preview' => 'array',
            'why_us' => 'array',
            'testimonials' => 'array',
            'footer_institute_links' => 'array',
        ];
    }

    public static function current(): self
    {
        return self::first() ?? self::create([]);
    }
}
