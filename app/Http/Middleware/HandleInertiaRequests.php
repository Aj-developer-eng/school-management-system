<?php

namespace App\Http\Middleware;

use App\Models\Student;
use App\Models\Teacher;
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

        return [
            ...parent::share($request),
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
