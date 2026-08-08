<?php

namespace App\Http\Controllers;

use App\Models\AcademicSession;
use App\Models\LandingPageSetting;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use App\Models\Student;
use App\Models\StudentParent;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LandingPageController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $school = SchoolSetting::first();
        $cms = LandingPageSetting::current();
        $activeSession = AcademicSession::active()->first();

        $stats = [
            'students' => Student::where('is_active', true)->count(),
            'teachers' => Teacher::where('is_active', true)->count(),
            'parents' => StudentParent::where('is_active', true)->count(),
            'classes' => SchoolClass::where('is_active', true)->count(),
        ];

        $featuredTeachers = Teacher::where('is_active', true)
            ->with('user:id,name')
            ->limit(4)
            ->get()
            ->map(fn ($t) => [
                'name' => $t->user?->name,
                'qualification' => $t->qualification,
                'bio' => $t->bio,
                'employee_code' => $t->employee_code,
                'photo_url' => $t->profileImageUrl(),
            ]);

        return Inertia::render('Landing', [
            'school' => $school ? [
                'school_name' => $school->school_name,
                'school_prefix' => $school->school_prefix,
                'address' => $school->address,
                'city' => $school->city,
                'phone' => $school->phone,
                'email' => $school->email,
                'footer_text' => $school->footer_text,
            ] : null,
            'cms' => $cms,
            'activeSession' => $activeSession ? [
                'name' => $activeSession->name,
                'start_date' => $activeSession->start_date?->format('M Y'),
                'end_date' => $activeSession->end_date?->format('M Y'),
            ] : null,
            'stats' => $stats,
            'featuredTeachers' => $featuredTeachers,
        ]);
    }

    public function edit(): Response
    {
        $settings = LandingPageSetting::current();

        $teachers = Teacher::where('is_active', true)
            ->with('user:id,name')
            ->get()
            ->map(fn ($t) => ['id' => $t->id, 'name' => $t->user?->name]);

        return Inertia::render('LandingPage/Edit', [
            'settings' => $settings,
            'teachers' => $teachers,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'hero_badge_text' => ['nullable', 'string', 'max:100'],
            'hero_title' => ['nullable', 'string', 'max:200'],
            'hero_title_highlight' => ['nullable', 'string', 'max:200'],
            'hero_subtitle' => ['nullable', 'string', 'max:500'],
            'hero_button_text' => ['nullable', 'string', 'max:50'],
            'hero_button_link' => ['nullable', 'string', 'max:200'],
            'hero_secondary_button_text' => ['nullable', 'string', 'max:50'],
            'hero_secondary_button_link' => ['nullable', 'string', 'max:200'],
            'banner_image_url' => ['nullable', 'string', 'max:500'],
            'about_label' => ['nullable', 'string', 'max:100'],
            'about_title' => ['nullable', 'string', 'max:200'],
            'about_description' => ['nullable', 'string', 'max:1000'],
            'about_features' => ['nullable', 'array'],
            'about_features.*.icon' => ['nullable', 'string', 'max:50'],
            'about_features.*.title' => ['nullable', 'string', 'max:100'],
            'about_features.*.description' => ['nullable', 'string', 'max:300'],
            'values' => ['nullable', 'array'],
            'values.*.icon' => ['nullable', 'string', 'max:50'],
            'values.*.title' => ['nullable', 'string', 'max:100'],
            'values.*.description' => ['nullable', 'string', 'max:300'],
            'teachers_label' => ['nullable', 'string', 'max:100'],
            'teachers_title' => ['nullable', 'string', 'max:200'],
            'teachers_subtitle' => ['nullable', 'string', 'max:300'],
            'founder_name' => ['nullable', 'string', 'max:100'],
            'founder_qualification' => ['nullable', 'string', 'max:200'],
            'founder_bio' => ['nullable', 'string', 'max:500'],
            'admissions_title' => ['nullable', 'string', 'max:200'],
            'admissions_description' => ['nullable', 'string', 'max:500'],
            'admissions_button_text' => ['nullable', 'string', 'max:50'],
            'admissions_button_link' => ['nullable', 'string', 'max:200'],
            'admissions_secondary_button_text' => ['nullable', 'string', 'max:50'],
            'admissions_secondary_button_link' => ['nullable', 'string', 'max:200'],
            'footer_description' => ['nullable', 'string', 'max:500'],
        ]);

        LandingPageSetting::current()->update($validated);

        return redirect()->back()->with('success', 'Landing page content updated successfully.');
    }
}
