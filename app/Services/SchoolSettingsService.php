<?php

namespace App\Services;

use App\Models\SchoolSetting;
use Illuminate\Support\Facades\Cache;

class SchoolSettingsService
{
    public function get(): SchoolSetting
    {
        return Cache::rememberForever(SchoolSetting::CACHE_KEY, function () {
            return SchoolSetting::firstOrCreate(['id' => 1], [
                'school_name' => 'New School',
                'school_prefix' => 'SCH',
                'country' => 'Pakistan',
            ]);
        });
    }

    public function update(array $data, ?\Illuminate\Http\UploadedFile $logo = null): SchoolSetting
    {
        $settings = SchoolSetting::updateOrCreate(['id' => 1], $data);

        if ($logo) {
            $optimizedPath = ImageOptimizer::optimize($logo, 300, 50, 80);
            $settings->clearMediaCollection(SchoolSetting::LOGO_COLLECTION);
            $settings->addMedia($optimizedPath)
                ->toMediaCollection(SchoolSetting::LOGO_COLLECTION);
        }

        Cache::put(SchoolSetting::CACHE_KEY, $settings);

        return $settings;
    }

    public function clearCache(): void
    {
        Cache::forget(SchoolSetting::CACHE_KEY);
    }
}
