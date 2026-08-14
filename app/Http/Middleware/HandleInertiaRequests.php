<?php

namespace App\Http\Middleware;

use App\Models\Student;
use App\Models\Teacher;
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

        return [
            ...parent::share($request),
            'school' => [
                'name' => $school->school_name,
                'logo_url' => $school->logoUrl(),
            ],
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
