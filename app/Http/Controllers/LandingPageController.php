<?php

namespace App\Http\Controllers;

use App\Models\AcademicSession;
use App\Models\LandingPageSetting;
use App\Models\SchoolSetting;
use App\Services\ImageOptimizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class LandingPageController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $school = SchoolSetting::first();
        $cms = LandingPageSetting::current();
        $activeSession = AcademicSession::active()->first();

        return Inertia::render('Landing', [
            'school' => $school ? [
                'school_name' => $school->school_name,
                'school_prefix' => $school->school_prefix,
                'address' => $school->address,
                'city' => $school->city,
                'phone' => $school->phone,
                'email' => $school->email,
                'footer_text' => $school->footer_text,
                'logo_url' => $school->logoUrl(),
            ] : null,
            'cms' => $cms,
            'activeSession' => $activeSession ? [
                'name' => $activeSession->name,
                'start_date' => $activeSession->start_date?->format('M Y'),
                'end_date' => $activeSession->end_date?->format('M Y'),
            ] : null,
        ]);
    }

    public function edit(): Response
    {
        $settings = LandingPageSetting::current();

        return Inertia::render('LandingPage/Edit', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'hero_badge_text' => ['nullable', 'string', 'max:100'],
            'hero_title' => ['nullable', 'string', 'max:200'],
            'hero_title_highlight' => ['nullable', 'string', 'max:200'],
            'hero_title_suffix' => ['nullable', 'string', 'max:100'],
            'hero_subtitle' => ['nullable', 'string', 'max:500'],
            'hero_button_text' => ['nullable', 'string', 'max:50'],
            'hero_button_link' => ['nullable', 'string', 'max:200'],
            'hero_secondary_button_text' => ['nullable', 'string', 'max:50'],
            'hero_secondary_button_link' => ['nullable', 'string', 'max:200'],
            'hero_stats' => ['nullable', 'array'],
            'hero_stats.*.label' => ['nullable', 'string', 'max:100'],
            'hero_stats.*.value' => ['nullable', 'string', 'max:100'],
            'hero_float_label' => ['nullable', 'string', 'max:100'],
            'hero_float_value' => ['nullable', 'string', 'max:100'],
            'hero_float_sub' => ['nullable', 'string', 'max:100'],
            'banner_image' => ['nullable', 'image', 'mimes:jpeg,png,webp', 'max:4096'],
            'programs_label' => ['nullable', 'string', 'max:100'],
            'programs_title' => ['nullable', 'string', 'max:200'],
            'programs_title_highlight' => ['nullable', 'string', 'max:100'],
            'programs_link_text' => ['nullable', 'string', 'max:100'],
            'programs' => ['nullable', 'array'],
            'programs.*.icon' => ['nullable', 'string', 'max:50'],
            'programs.*.title' => ['nullable', 'string', 'max:100'],
            'programs.*.description' => ['nullable', 'string', 'max:300'],
            'programs.*.badge' => ['nullable', 'string', 'max:100'],
            'locations_label' => ['nullable', 'string', 'max:100'],
            'locations_title' => ['nullable', 'string', 'max:200'],
            'locations_title_highlight' => ['nullable', 'string', 'max:100'],
            'locations_description' => ['nullable', 'string', 'max:500'],
            'locations' => ['nullable', 'array'],
            'locations.*.title' => ['nullable', 'string', 'max:100'],
            'locations.*.description' => ['nullable', 'string', 'max:300'],
            'locations.*.icon' => ['nullable', 'string', 'max:50'],
            'dashboard_label' => ['nullable', 'string', 'max:100'],
            'dashboard_title' => ['nullable', 'string', 'max:200'],
            'dashboard_title_highlight' => ['nullable', 'string', 'max:100'],
            'dashboard_description' => ['nullable', 'string', 'max:500'],
            'dashboard_features' => ['nullable', 'array'],
            'dashboard_features.*' => ['nullable', 'string', 'max:300'],
            'dashboard_button_text' => ['nullable', 'string', 'max:50'],
            'dashboard_button_link' => ['nullable', 'string', 'max:200'],
            'dashboard_preview' => ['nullable', 'array'],
            'dashboard_preview.course' => ['nullable', 'string', 'max:100'],
            'dashboard_preview.units' => ['nullable', 'string', 'max:50'],
            'dashboard_preview.units_pct' => ['nullable', 'string', 'max:50'],
            'dashboard_preview.attendance' => ['nullable', 'string', 'max:50'],
            'dashboard_preview.attendance_pct' => ['nullable', 'string', 'max:50'],
            'dashboard_preview.ielts' => ['nullable', 'string', 'max:50'],
            'dashboard_preview.ielts_pct' => ['nullable', 'string', 'max:50'],
            'dashboard_preview.mentor_note' => ['nullable', 'string', 'max:500'],
            'dashboard_preview_label' => ['nullable', 'string', 'max:100'],
            'dashboard_preview_status' => ['nullable', 'string', 'max:50'],
            'dashboard_preview_units_label' => ['nullable', 'string', 'max:50'],
            'dashboard_preview_attendance_label' => ['nullable', 'string', 'max:50'],
            'dashboard_preview_ielts_label' => ['nullable', 'string', 'max:50'],
            'dashboard_preview_mentor_label' => ['nullable', 'string', 'max:50'],
            'why_us_label' => ['nullable', 'string', 'max:100'],
            'why_us_title' => ['nullable', 'string', 'max:200'],
            'why_us_title_highlight' => ['nullable', 'string', 'max:100'],
            'why_us' => ['nullable', 'array'],
            'why_us.*.title' => ['nullable', 'string', 'max:100'],
            'why_us.*.description' => ['nullable', 'string', 'max:300'],
            'why_us.*.icon' => ['nullable', 'string', 'max:50'],
            'testimonials_label' => ['nullable', 'string', 'max:100'],
            'testimonials_title' => ['nullable', 'string', 'max:200'],
            'testimonials_title_highlight' => ['nullable', 'string', 'max:100'],
            'testimonials' => ['nullable', 'array'],
            'testimonials.*.name' => ['nullable', 'string', 'max:100'],
            'testimonials.*.program' => ['nullable', 'string', 'max:100'],
            'testimonials.*.location' => ['nullable', 'string', 'max:100'],
            'testimonials.*.quote' => ['nullable', 'string', 'max:500'],
            'cta_badge_text' => ['nullable', 'string', 'max:100'],
            'cta_title' => ['nullable', 'string', 'max:200'],
            'cta_title_highlight' => ['nullable', 'string', 'max:100'],
            'cta_description' => ['nullable', 'string', 'max:500'],
            'cta_button_text' => ['nullable', 'string', 'max:50'],
            'cta_button_link' => ['nullable', 'string', 'max:200'],
            'cta_secondary_button_text' => ['nullable', 'string', 'max:50'],
            'cta_secondary_button_link' => ['nullable', 'string', 'max:200'],
            'footer_description' => ['nullable', 'string', 'max:500'],
            'footer_programs_label' => ['nullable', 'string', 'max:100'],
            'footer_institute_label' => ['nullable', 'string', 'max:100'],
            'footer_institute_links' => ['nullable', 'array'],
            'footer_institute_links.*.label' => ['nullable', 'string', 'max:100'],
            'footer_institute_links.*.link' => ['nullable', 'string', 'max:200'],
            'footer_reach_label' => ['nullable', 'string', 'max:100'],
            'footer_mode_text' => ['nullable', 'string', 'max:100'],
            'footer_tagline' => ['nullable', 'string', 'max:200'],
        ]);

        $settings = LandingPageSetting::current();

        if ($request->hasFile('banner_image')) {
            if ($settings->banner_image_url) {
                $oldPath = str_replace('/storage/', '', $settings->banner_image_url);
                Storage::disk('public')->delete($oldPath);
            }

            $optimizedPath = ImageOptimizer::optimize($request->file('banner_image'), 1920, 70, 500);
            $filename = 'banners/' . uniqid('banner_') . '.webp';
            Storage::disk('public')->put($filename, file_get_contents($optimizedPath));
            @unlink($optimizedPath);

            $validated['banner_image_url'] = '/storage/' . $filename;
        }

        unset($validated['banner_image']);

        $settings->update($validated);

        return redirect()->back()->with('success', 'Landing page content updated successfully.');
    }
}
