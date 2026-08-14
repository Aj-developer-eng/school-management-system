<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LandingPageSetting extends Model
{
    protected $fillable = [
        'hero_badge_text',
        'hero_title',
        'hero_title_highlight',
        'hero_subtitle',
        'hero_button_text',
        'hero_button_link',
        'hero_secondary_button_text',
        'hero_secondary_button_link',
        'banner_image_url',
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
        'footer_description',
    ];

    protected function casts(): array
    {
        return [
            'about_features' => 'array',
            'values' => 'array',
        ];
    }

    public static function current(): self
    {
        return self::first() ?? self::create([]);
    }
}
