<?php

namespace App\Http\Controllers;

use App\Http\Requests\SchoolSetting\UpdateRequest;
use App\Models\SchoolSetting;
use App\Services\ActivityLogService;
use App\Services\SchoolSettingsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SchoolSettingController extends Controller
{
    public function __construct(private readonly SchoolSettingsService $settings) {}

    public function edit(Request $request): Response
    {
        $this->authorize('view', SchoolSetting::class);

        $setting = $this->settings->get();
        $setting->load('media');

        return Inertia::render('Settings/Edit', [
            'setting' => [
                ...$setting->toArray(),
                'logo_url' => $setting->logoUrl(),
            ],
            'can_update' => $request->user()->can('school-settings.update'),
        ]);
    }

    public function update(UpdateRequest $request): \Illuminate\Http\RedirectResponse
    {
        $this->authorize('update', SchoolSetting::class);

        $data = $request->safe()->except('logo');
        $logo = $request->file('logo');

        $this->settings->update($data, $logo);

        ActivityLogService::custom('School Settings', 'updated', 'Updated school settings');

        return redirect()->route('school-settings.edit')
            ->with('success', 'School settings updated successfully.');
    }
}
