<?php

namespace App\Http\Controllers;

use App\Enums\RoleEnum;
use App\Http\Requests\TeacherAssignment\StoreRequest;
use App\Http\Requests\TeacherAssignment\UpdateRequest;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Teacher;
use App\Models\TeacherSubjectAssignment;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class TeacherAssignmentController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(TeacherSubjectAssignment::class, 'teacher_assignment');
    }

    public function index(Request $request): Response
    {
        // Teachers only see their own class assignments; other permitted roles
        // (null) are not scoped. A teacher without a linked Teacher record is
        // scoped to nothing.
        $scopedTeacherIds = $this->scopedTeacherIds($request->user());

        $assignments = TeacherSubjectAssignment::query()
            ->with(['teacher.user', 'academicSession', 'schoolClass'])
            ->when($scopedTeacherIds !== null, fn ($query) => $query->whereIn('teacher_id', $scopedTeacherIds))
            ->when($request->search, function ($query, $search): void {
                $query->where(function ($q) use ($search): void {
                    $q->whereHas('teacher.user', function ($qq) use ($search): void {
                        $qq->where('name', 'like', "%{$search}%");
                    })
                        ->orWhereHas('schoolClass', function ($qq) use ($search): void {
                            $qq->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->orderByRaw('CASE WHEN start_time IS NULL THEN 1 ELSE 0 END')
            ->orderBy('start_time')
            ->orderBy('end_time')
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Teacher/Assignment/Index', [
            'assignments' => $assignments,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create(): Response
    {
        return $this->renderForm();
    }

    public function store(StoreRequest $request): \Illuminate\Http\RedirectResponse
    {
        $assignment = TeacherSubjectAssignment::create($request->validated());

        ActivityLogService::created('Teacher Assignments', $assignment, 'Created class assignment');

        return redirect()->route('teacher-assignments.index')
            ->with('success', 'Class assignment created successfully.');
    }

    public function edit(TeacherSubjectAssignment $teacherAssignment): Response
    {
        return $this->renderForm($teacherAssignment);
    }

    public function update(UpdateRequest $request, TeacherSubjectAssignment $teacherAssignment): \Illuminate\Http\RedirectResponse
    {
        $teacherAssignment->update($request->validated());

        ActivityLogService::updated('Teacher Assignments', $teacherAssignment, 'Updated class assignment');

        return redirect()->route('teacher-assignments.index')
            ->with('success', 'Class assignment updated successfully.');
    }

    public function destroy(TeacherSubjectAssignment $teacherAssignment): \Illuminate\Http\RedirectResponse
    {
        ActivityLogService::deleted('Teacher Assignments', $teacherAssignment, 'Deleted class assignment');

        $teacherAssignment->delete();

        return redirect()->route('teacher-assignments.index')
            ->with('success', 'Class assignment deleted successfully.');
    }

    private function renderForm(?TeacherSubjectAssignment $assignment = null): Response
    {
        $assignment?->load('teacher', 'academicSession', 'schoolClass');

        return Inertia::render('Teacher/Assignment/Form', [
            'assignment' => $assignment,
            'teachers' => Teacher::where('is_active', true)
                ->with('user')
                ->get()
                ->map(fn (Teacher $teacher) => ['id' => $teacher->id, 'label' => $teacher->user->name]),
            'sessions' => AcademicSession::orderByDesc('start_date')->pluck('name', 'id'),
            'classes' => SchoolClass::where('is_active', true)->orderBy('level')->pluck('name', 'id'),
        ]);
    }

    /**
     * Return the teacher IDs the current user is allowed to view assignments for.
     * Teachers are scoped to their own assignments. A teacher without a linked
     * Teacher record is scoped to nothing. Other staff roles are not scoped (null).
     *
     * @return Collection<int, int>|null
     */
    private function scopedTeacherIds(User $user): ?Collection
    {
        if (! $user->hasRole(RoleEnum::Teacher->value)) {
            return null;
        }

        $teacherId = Teacher::where('user_id', $user->id)->value('id');

        return $teacherId !== null ? collect([$teacherId]) : collect();
    }
}
