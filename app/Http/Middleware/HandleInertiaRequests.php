<?php

namespace App\Http\Middleware;

use App\Enums\RoleEnum;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\TeacherSubjectAssignment;
use App\Services\NotificationService;
use App\Services\SchoolSettingsService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        $school = app(SchoolSettingsService::class)->get();

        // Whether the current user has any class/assignment to take attendance
        // for. Mirrors the scoping used by AttendanceController@index so the
        // sidebar can hide the Attendance link when there is nothing to view.
        $hasClasses = false;
        if ($user) {
            if ($user->hasRole(RoleEnum::SuperAdmin->value)) {
                $hasClasses = SchoolClass::withTrashed()->exists();
            } else {
                $teacher = Teacher::where('user_id', $user->id)->first();
                if ($teacher) {
                    $hasClasses = TeacherSubjectAssignment::where('teacher_id', $teacher->id)
                        ->whereNull('deleted_at')
                        ->whereHas('schoolClass')
                        ->exists();
                }
            }
        }

        return [
            ...parent::share($request),
            'school' => [
                'name' => $school->school_name,
                'logo_url' => $school->logoUrl(),
            ],
            'hasClasses' => $hasClasses,
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'photo_url' => $this->resolvePhotoUrl($user),
                    'roles' => $user->getRoleNames(),
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                ] : null,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            'notifications' => $user
                ? NotificationService::recentFor($user)->map(fn ($n) => [
                    'id' => $n->id,
                    'type' => $n->type,
                    'title' => $n->title,
                    'message' => $n->message,
                    'link' => $n->link,
                    'read_at' => $n->read_at,
                    'created_at' => $n->created_at?->diffForHumans(),
                ])->values()
                : [],
        ];
    }

    protected function resolvePhotoUrl($user): ?string
    {
        $teacher = Teacher::where('user_id', $user->id)->first();
        if ($teacher) {
            return $teacher->profileImageUrl();
        }

        $student = Student::where('user_id', $user->id)->first();
        if ($student && method_exists($student, 'profileImageUrl')) {
            return $student->profileImageUrl();
        }

        return null;
    }
}
