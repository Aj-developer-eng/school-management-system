<?php

namespace App\Http\Controllers;

use App\Enums\RoleEnum;
use App\Http\Requests\Teacher\StoreRequest;
use App\Http\Requests\Teacher\UpdateRequest;
use App\Models\Teacher;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\ImageOptimizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class TeacherController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Teacher::class, 'teacher');
    }

    public function index(Request $request): Response
    {
        $teachers = Teacher::query()
            ->with('user')
            ->when($request->search, function ($query, $search): void {
                $query->whereHas('user', function ($q) use ($search): void {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })
                    ->orWhere('employee_code', 'like', "%{$search}%");
            })
            ->orderBy('employee_code')
            ->paginate(15)
            ->through(function ($teacher) {
                $teacher->photo_url = $teacher->profileImageUrl();
                return $teacher;
            })
            ->withQueryString();

        return Inertia::render('Teacher/Index', [
            'teachers' => $teachers,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Teacher/Form');
    }

    public function store(StoreRequest $request): \Illuminate\Http\RedirectResponse
    {
        DB::transaction(function () use ($request): void {
            $user = User::create([
                'name' => $request->input('name'),
                'email' => $request->input('email'),
                'phone' => $request->input('phone'),
                'password' => Hash::make($request->input('password')),
                'is_active' => $request->input('is_active'),
                'email_verified_at' => now(),
            ]);
            $user->assignRole(RoleEnum::Teacher->value);

            $teacher = Teacher::create([
                'user_id' => $user->id,
                'employee_code' => $request->input('employee_code'),
                'qualification' => $request->input('qualification'),
                'joining_date' => $request->input('joining_date'),
                'bio' => $request->input('bio'),
                'is_active' => $request->input('is_active'),
            ]);

            if ($request->hasFile('photo')) {
                $optimizedPath = ImageOptimizer::optimize($request->file('photo'), 600, 60, 150);
                $teacher->addMedia($optimizedPath)
                    ->toMediaCollection(Teacher::PROFILE_IMAGE_COLLECTION);
            }

            ActivityLogService::created('Teachers', $teacher, "Created teacher: {$request->input('name')} ({$request->input('employee_code')})");
        });

        return redirect()->route('teachers.index')
            ->with('success', 'Teacher created successfully.');
    }

    public function edit(Teacher $teacher): Response
    {
        $teacher->load('user');

        return Inertia::render('Teacher/Form', [
            'teacher' => [
                ...$teacher->toArray(),
                'user' => $teacher->user,
                'photo_url' => $teacher->profileImageUrl(),
            ],
        ]);
    }

    public function update(UpdateRequest $request, Teacher $teacher): \Illuminate\Http\RedirectResponse
    {
        DB::transaction(function () use ($request, $teacher): void {
            $teacher->update($request->safe()->only(['employee_code', 'qualification', 'joining_date', 'bio', 'is_active']));

            $update = $request->safe()->only(['name', 'email', 'phone', 'is_active']);
            if ($request->filled('password')) {
                $update['password'] = Hash::make($request->input('password'));
            }
            $teacher->user->update($update);

            if ($request->hasFile('photo')) {
                $teacher->clearMediaCollection(Teacher::PROFILE_IMAGE_COLLECTION);
                $optimizedPath = ImageOptimizer::optimize($request->file('photo'), 600, 60, 150);
                $teacher->addMedia($optimizedPath)
                    ->toMediaCollection(Teacher::PROFILE_IMAGE_COLLECTION);
            }

            ActivityLogService::updated('Teachers', $teacher, "Updated teacher: {$teacher->user->name} ({$teacher->employee_code})");
        });

        return redirect()->route('teachers.index')
            ->with('success', 'Teacher updated successfully.');
    }

    public function destroy(Teacher $teacher): \Illuminate\Http\RedirectResponse
    {
        ActivityLogService::deleted('Teachers', $teacher, "Deleted teacher: {$teacher->user->name} ({$teacher->employee_code})");

        $teacher->delete();
        $teacher->user->update(['is_active' => false]);

        return redirect()->route('teachers.index')
            ->with('success', 'Teacher deleted successfully.');
    }
}
