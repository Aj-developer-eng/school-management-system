<?php

namespace App\Http\Controllers;

use App\Enums\OnlineClassStatusEnum;
use App\Enums\RoleEnum;
use App\Http\Requests\OnlineClass\StoreRequest;
use App\Http\Requests\OnlineClass\UpdateRequest;
use App\Models\AcademicSession;
use App\Models\OnlineClass;
use App\Models\OnlineClassAttendance;
use App\Models\SchoolClass;
use App\Models\StudentEnrollment;
use App\Models\StudentParent;
use App\Models\Subject;
use App\Models\Teacher;
use App\Services\ActivityLogService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OnlineClassController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(OnlineClass::class, 'online_class');
    }

    public function index(Request $request): Response
    {
        $user = $request->user();

        if ($user->hasRole(RoleEnum::Parent->value)) {
            return $this->parentIndex($request);
        }

        $onlineClasses = OnlineClass::query()
            ->with(['teacher.user:id,name', 'schoolClass:id,name', 'section:id,name', 'subject:id,name', 'academicSession:id,name'])
            ->when($request->search, function ($query, $search): void {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhere('meeting_link', 'like', "%{$search}%")
                    ->orWhereHas('teacher.user', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('schoolClass', fn ($q) => $q->where('name', 'like', "%{$search}%"));
            });

        if ($user->hasRole(RoleEnum::Teacher->value) && ! $user->hasRole(RoleEnum::SuperAdmin->value)) {
            $teacher = Teacher::where('user_id', $user->id)->first();
            if ($teacher) {
                $onlineClasses->where('teacher_id', $teacher->id);
            }
        }

        $onlineClasses = $onlineClasses->latest('scheduled_at')->paginate(15)->withQueryString();

        $canMarkAttendance = $user->can('online-classes.update')
            || ($user->hasRole(RoleEnum::Teacher->value) && Teacher::where('user_id', $user->id)->exists());

        return Inertia::render('OnlineClass/Index', [
            'onlineClasses' => $onlineClasses,
            'filters' => $request->only(['search']),
            'canMarkAttendance' => $canMarkAttendance,
        ]);
    }

    public function parentIndex(Request $request): Response
    {
        $user = $request->user();
        $parent = StudentParent::where('user_id', $user->id)->first();
        $activeSession = AcademicSession::active()->first();

        $onlineClasses = collect();

        if ($parent && $activeSession) {
            $studentIds = $parent->students()->pluck('students.id');

            $enrollments = StudentEnrollment::with(['student.user:id,name', 'schoolClass:id,name', 'section:id,name'])
                ->where('academic_session_id', $activeSession->id)
                ->whereIn('student_id', $studentIds)
                ->whereNull('deleted_at')
                ->get();

            $classIds = $enrollments->pluck('school_class_id')->unique()->values();
            $sectionIds = $enrollments->pluck('section_id')->filter()->unique()->values();

            $onlineClasses = OnlineClass::active()
                ->with(['teacher.user:id,name', 'schoolClass:id,name', 'section:id,name', 'subject:id,name'])
                ->where('academic_session_id', $activeSession->id)
                ->whereIn('school_class_id', $classIds)
                ->where(function ($query) use ($sectionIds): void {
                    $query->whereNull('section_id')->orWhereIn('section_id', $sectionIds);
                })
                ->latest('scheduled_at')
                ->get()
                ->map(function ($onlineClass) use ($enrollments) {
                    $matching = $enrollments->first(function ($e) use ($onlineClass) {
                        return $e->school_class_id === $onlineClass->school_class_id
                            && ($onlineClass->section_id === null || $e->section_id === $onlineClass->section_id);
                    });

                    return [
                        ...$onlineClass->toArray(),
                        'student_name' => $matching?->student?->user?->name,
                    ];
                });
        }

        return Inertia::render('OnlineClass/ParentIndex', [
            'onlineClasses' => $onlineClasses,
        ]);
    }

    public function create(): Response
    {
        return $this->renderForm();
    }

    public function store(StoreRequest $request): \Illuminate\Http\RedirectResponse
    {
        $onlineClass = OnlineClass::create([
            ...$request->validated(),
            'status' => OnlineClassStatusEnum::Active->value,
        ]);

        ActivityLogService::created('Online Classes', $onlineClass, "Created online class for {$onlineClass->schoolClass?->name}");

        $this->notifyParents($onlineClass);

        return redirect()->route('online-classes.index')
            ->with('success', 'Online class link published successfully. Parents have been notified.');
    }

    public function edit(OnlineClass $onlineClass): Response
    {
        return $this->renderForm($onlineClass);
    }

    public function update(UpdateRequest $request, OnlineClass $onlineClass): \Illuminate\Http\RedirectResponse
    {
        $onlineClass->update($request->validated());

        ActivityLogService::updated('Online Classes', $onlineClass, "Updated online class for {$onlineClass->schoolClass?->name}");

        return redirect()->route('online-classes.index')
            ->with('success', 'Online class updated successfully.');
    }

    public function destroy(OnlineClass $onlineClass): \Illuminate\Http\RedirectResponse
    {
        ActivityLogService::custom('Online Classes', 'deleted', "Deleted online class for {$onlineClass->schoolClass?->name}");

        $onlineClass->delete();

        return redirect()->route('online-classes.index')
            ->with('success', 'Online class deleted successfully.');
    }

    public function toggleStatus(OnlineClass $onlineClass): \Illuminate\Http\RedirectResponse
    {
        if ($onlineClass->status === OnlineClassStatusEnum::Active) {
            $onlineClass->update([
                'status' => OnlineClassStatusEnum::Disabled->value,
                'disabled_at' => now(),
            ]);

            ActivityLogService::custom('Online Classes', 'updated', "Disabled online class for {$onlineClass->schoolClass?->name}");

            return redirect()->back()->with('success', 'Online class disabled. Parents can no longer see the link.');
        }

        $onlineClass->update([
            'status' => OnlineClassStatusEnum::Active->value,
            'disabled_at' => null,
        ]);

        ActivityLogService::custom('Online Classes', 'updated', "Re-enabled online class for {$onlineClass->schoolClass?->name}");

        return redirect()->back()->with('success', 'Online class re-enabled. Parents can see the link again.');
    }

    public function attendance(OnlineClass $onlineClass): Response
    {
        $this->authorize('markAttendance', $onlineClass);

        $onlineClass->load(['schoolClass:id,name', 'section:id,name', 'subject:id,name', 'teacher.user:id,name', 'academicSession:id,name']);

        $sessionId = $onlineClass->academic_session_id;

        $students = StudentEnrollment::with(['student.user:id,name'])
            ->when($sessionId, function ($q) use ($sessionId): void {
                $q->where('academic_session_id', $sessionId);
            })
            ->where('school_class_id', $onlineClass->school_class_id)
            ->when($onlineClass->section_id, function ($q) use ($onlineClass): void {
                $q->where('section_id', $onlineClass->section_id);
            })
            ->whereNull('deleted_at')
            ->orderBy('roll_number')
            ->get()
            ->map(function ($enrollment) use ($onlineClass) {
                $record = OnlineClassAttendance::where('online_class_id', $onlineClass->id)
                    ->where('student_id', $enrollment->student_id)
                    ->first();

                return [
                    'student_id' => $enrollment->student_id,
                    'roll_number' => $enrollment->roll_number,
                    'name' => $enrollment->student?->user?->name,
                    'status' => $record?->status ?? 'present',
                    'remarks' => $record?->remarks,
                    'has_record' => (bool) $record,
                ];
            });

        return Inertia::render('OnlineClass/Attendance', [
            'onlineClass' => $onlineClass,
            'students' => $students,
        ]);
    }

    public function storeAttendance(Request $request, OnlineClass $onlineClass): \Illuminate\Http\RedirectResponse
    {
        $this->authorize('markAttendance', $onlineClass);

        $validated = $request->validate([
            'records' => ['required', 'array'],
            'records.*.student_id' => ['required', 'exists:students,id'],
            'records.*.status' => ['required', 'in:present,absent,late,excused'],
            'records.*.remarks' => ['nullable', 'string', 'max:500'],
        ]);

        foreach ($validated['records'] as $record) {
            OnlineClassAttendance::updateOrCreate(
                [
                    'online_class_id' => $onlineClass->id,
                    'student_id' => $record['student_id'],
                ],
                [
                    'academic_session_id' => $onlineClass->academic_session_id,
                    'school_class_id' => $onlineClass->school_class_id,
                    'section_id' => $onlineClass->section_id,
                    'recorded_by' => $request->user()->id,
                    'status' => $record['status'],
                    'remarks' => $record['remarks'] ?? null,
                ]
            );
        }

        $label = $onlineClass->title ?: $onlineClass->schoolClass?->name;

        ActivityLogService::custom('Online Classes', 'updated', "Recorded attendance for online class: {$label}");

        return redirect()->route('online-classes.index')
            ->with('success', 'Attendance saved successfully.');
    }

    private function renderForm(?OnlineClass $onlineClass = null): Response
    {
        $onlineClass?->load('teacher', 'academicSession', 'schoolClass', 'section', 'subject');

        $activeSession = AcademicSession::active()->first();

        return Inertia::render('OnlineClass/Form', [
            'onlineClass' => $onlineClass ? [
                ...$onlineClass->toArray(),
                'scheduled_at' => $onlineClass->scheduled_at?->format('Y-m-d\TH:i'),
            ] : null,
            'teachers' => Teacher::where('is_active', true)
                ->with('user')
                ->get()
                ->map(fn (Teacher $teacher) => ['id' => $teacher->id, 'label' => $teacher->user->name]),
            'sessions' => AcademicSession::orderByDesc('start_date')->pluck('name', 'id'),
            'classes' => SchoolClass::where('is_active', true)->orderBy('level')->pluck('name', 'id'),
            'subjects' => Subject::where('is_active', true)->orderBy('name')->pluck('name', 'id'),
            'activeSessionId' => $activeSession?->id,
        ]);
    }

    private function notifyParents(OnlineClass $onlineClass): void
    {
        $onlineClass->load(['schoolClass:id,name', 'section:id,name', 'subject:id,name', 'teacher.user:id,name']);

        $enrollments = StudentEnrollment::with(['student.parents.user'])
            ->where('academic_session_id', $onlineClass->academic_session_id)
            ->where('school_class_id', $onlineClass->school_class_id)
            ->whereNull('deleted_at')
            ->when($onlineClass->section_id, fn ($q) => $q->where('section_id', $onlineClass->section_id))
            ->get();

        $notified = collect();

        foreach ($enrollments as $enrollment) {
            $student = $enrollment->student;
            if (! $student) {
                continue;
            }

            foreach ($student->parents as $parent) {
                if ($parent->user && ! $notified->contains($parent->user->id)) {
                    $notified->push($parent->user->id);

                    $classLabel = $onlineClass->schoolClass?->name . ($onlineClass->section ? " — {$onlineClass->section?->name}" : '');
                    $title = $onlineClass->title ?: 'Online class';

                    NotificationService::send($parent->user, [
                        'type' => 'online_class_published',
                        'title' => 'New Online Class Link',
                        'message' => "{$classLabel}: {$title} by {$onlineClass->teacher?->user?->name}",
                        'link' => '/online-classes',
                    ]);
                }
            }
        }
    }
}
