<?php

namespace App\Services;

use App\Models\AdmissionNumberCounter;
use App\Models\SchoolSetting;
use Illuminate\Support\Facades\DB;

class AdmissionNumberGenerator
{
    public function next(int $year): string
    {
        $prefix = $this->getPrefix();

        return DB::transaction(function () use ($year, $prefix): string {
            $counter = AdmissionNumberCounter::lockForUpdate()
                ->firstOrCreate(
                    ['year' => $year],
                    ['last_number' => 0]
                );

            $counter->last_number += 1;
            $counter->save();

            return sprintf('%s-%d-%04d', $prefix, $year, $counter->last_number);
        });
    }

    private function getPrefix(): string
    {
        $settings = app(SchoolSettingsService::class)->get();

        return $settings->school_prefix ?? 'SCH';
    }
}
