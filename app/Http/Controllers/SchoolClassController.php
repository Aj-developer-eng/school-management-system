<?php

namespace App\Http\Controllers;

use App\Http\Requests\SchoolClass\StoreRequest;
use App\Http\Requests\SchoolClass\UpdateRequest;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TeacherSubjectAssignment;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SchoolClassController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(SchoolClass::class, 'school_class');
    }

    public function index(Request $request): Response
    {
        $activeSessionId = AcademicSession::active()->value('id');

        $classes = SchoolClass::query()
            ->with('activeFromSession')
            ->select('school_classes.*')
            ->selectRaw('(select count(distinct se.student_id)
                from student_enrollments se
                where se.school_class_id = school_classes.id
                    and se.deleted_at is null'
                    .($activeSessionId ? ' and se.academic_session_id = '.(int) $activeSessionId : '')
                    .') as students_count')
            ->when($request->search, function ($query, $search): void {
                $query->where(function ($q) use ($search): void {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        // Load the student lists for the classes on this page so the Students
        // badge can open a detail modal.
        $pageClassIds = $classes->getCollection()->pluck('id');

        $studentsByClass = $pageClassIds->isNotEmpty()
            ? DB::table('student_enrollments as se')
                ->join('students as st', 'st.id', '=', 'se.student_id')
                ->join('users as u', 'u.id', '=', 'st.user_id')
                ->leftJoin('sections as sec', 'sec.id', '=', 'se.section_id')
                ->whereIn('se.school_class_id', $pageClassIds)
                ->whereNull('se.deleted_at')
                ->whereNull('st.deleted_at')
                ->when($activeSessionId, function ($q) use ($activeSessionId): void {
                    $q->where('se.academic_session_id', $activeSessionId);
                })
                ->groupBy('se.school_class_id', 'st.id', 'u.name', 'st.admission_number', 'sec.name')
                ->orderBy('u.name')
                ->get([
                    'se.school_class_id',
                    'st.id as student_id',
                    'u.name as student_name',
                    'st.admission_number',
                    'sec.name as section_name',
                ])
                ->groupBy('school_class_id')
            : collect();

        $classes->getCollection()->each(function (SchoolClass $class) use ($studentsByClass): void {
            $class->students_list = $studentsByClass->get($class->id, collect())->values();
        });

        // Overview tiles shown above the table (not affected by search).
        $stats = [
            'total' => SchoolClass::count(),
            'active' => SchoolClass::where('is_active', true)->count(),
            'inactive' => SchoolClass::where('is_active', false)->count(),
            'students' => DB::table('student_enrollments')
                ->whereNull('deleted_at')
                ->when($activeSessionId, function ($query) use ($activeSessionId): void {
                    $query->where('academic_session_id', $activeSessionId);
                })
                ->distinct()
                ->count('student_id'),
        ];

        return Inertia::render('Academic/Class/Index', [
            'classes' => $classes,
            'stats' => $stats,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Academic/Class/Form', [
            'sessions' => AcademicSession::orderByDesc('start_date')->pluck('name', 'id'),
            'active_session_id' => AcademicSession::active()->value('id'),
            'teachers' => Teacher::where('is_active', true)
                ->with('user')
                ->get()
                ->map(fn (Teacher $teacher) => ['id' => $teacher->id, 'label' => $teacher->user->name]),
            'subjects' => Subject::where('is_active', true)->orderBy('name')->pluck('name', 'id'),
            'can_create_assignment' => $request->user()?->can('create', TeacherSubjectAssignment::class) ?? false,
        ]);
    }

    public function store(StoreRequest $request): RedirectResponse
    {
        $data = $request->validated();

        // Fields belonging to the optional subject assignment section.
        $assignmentData = $request->boolean('create_assignment')
            ? Arr::only($data, ['teacher_id', 'academic_session_id', 'subject_id', 'start_time', 'end_time', 'days_of_week'])
            : null;

        $classData = Arr::except($data, [
            'create_assignment',
            'teacher_id',
            'academic_session_id',
            'subject_id',
            'start_time',
            'end_time',
            'days_of_week',
        ]);

        if (blank($classData['code'] ?? null)) {
            $classData['code'] = $this->generateUniqueCode($classData['name']);
        }

        DB::transaction(function () use ($classData, $assignmentData): void {
            $class = SchoolClass::create($classData);

            if ($assignmentData === null) {
                return;
            }

            // A brand new class has no subjects yet, so link the assigned one.
            $class->subjects()->syncWithoutDetaching([$assignmentData['subject_id']]);

            $assignment = TeacherSubjectAssignment::create([
                ...$assignmentData,
                'school_class_id' => $class->id,
            ]);

            ActivityLogService::created('Teacher Assignments', $assignment, 'Created subject assignment');
        });

        return redirect()->route('classes.index')
            ->with('success', $assignmentData !== null
                ? 'Class and subject assignment created successfully.'
                : 'Class created successfully.');
    }

    public function edit(SchoolClass $schoolClass): Response
    {
        return Inertia::render('Academic/Class/Form', [
            'class' => $schoolClass,
            'sessions' => AcademicSession::orderByDesc('start_date')->pluck('name', 'id'),
        ]);
    }

    public function update(UpdateRequest $request, SchoolClass $schoolClass): RedirectResponse
    {
        $schoolClass->update($request->validated());

        return redirect()->route('classes.index')
            ->with('success', 'Class updated successfully.');
    }

    public function destroy(SchoolClass $schoolClass): RedirectResponse
    {
        $schoolClass->delete();

        return redirect()->route('classes.index')
            ->with('success', 'Class deleted successfully.');
    }

    /**
     * Generate a unique class code (max 20 chars) derived from the class name,
     * since the code field is no longer entered on the create form.
     */
    private function generateUniqueCode(string $name): string
    {
        $base = strtoupper(substr((string) preg_replace('/[^A-Za-z0-9]/', '', $name), 0, 12));

        if ($base === '') {
            $base = 'CLASS';
        }

        $code = $base;
        $suffix = 1;

        while (SchoolClass::withTrashed()->where('code', $code)->exists()) {
            $suffix++;
            $code = substr($base, 0, 20 - strlen((string) $suffix)).$suffix;
        }

        return $code;
    }
}
