<?php

namespace App\Http\Controllers;

use App\Http\Requests\TeacherAssignment\StoreRequest;
use App\Http\Requests\TeacherAssignment\UpdateRequest;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Teacher;
use App\Models\TeacherSubjectAssignment;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
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
        $assignments = TeacherSubjectAssignment::query()
            ->with(['teacher.user', 'academicSession', 'schoolClass'])
            ->when($request->search, function ($query, $search): void {
                $query->whereHas('teacher.user', function ($q) use ($search): void {
                    $q->where('name', 'like', "%{$search}%");
                })
                    ->orWhereHas('schoolClass', function ($q) use ($search): void {
                        $q->where('name', 'like', "%{$search}%");
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
}
