<?php

namespace App\Http\Controllers;

use App\Http\Requests\Section\StoreRequest;
use App\Http\Requests\Section\UpdateRequest;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\SectionCategory;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SectionController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Section::class);
    }

    public function index(Request $request): Response
    {
        $sections = Section::query()
            ->with(['schoolClass', 'academicSession', 'category'])
            ->withCount('enrollments')
            ->when($request->search, function ($query, $search): void {
                $query->where('name', 'like', "%{$search}%");
            })
            ->when($request->academic_session_id, function ($query, $id): void {
                $query->where('academic_session_id', $id);
            })
            ->when($request->school_class_id, function ($query, $id): void {
                $query->where('school_class_id', $id);
            })
            ->orderBy('academic_session_id', 'desc')
            ->orderBy('school_class_id')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Academic/Section/Index', [
            'sections' => $sections,
            'filters' => $request->only(['search', 'academic_session_id', 'school_class_id']),
            'sessions' => AcademicSession::orderByDesc('start_date')->pluck('name', 'id'),
            'classes' => SchoolClass::where('is_active', true)->orderBy('level')->pluck('name', 'id'),
        ]);
    }

    /**
     * List the students enrolled in a section. Used by the "Students" button
     * on the sections listing to show a modal with the enrolled students.
     */
    public function students(Request $request, Section $section): JsonResponse
    {
        $this->authorize('view', $section);
        $this->authorize('viewAny', Student::class);

        $students = StudentEnrollment::query()
            ->with(['student.user:id,name,email,phone', 'student.subjects:id,name,code'])
            ->where('section_id', $section->id)
            ->whereNull('deleted_at')
            ->when($request->search, function ($query, $search): void {
                $query->whereHas('student', function ($studentQuery) use ($search): void {
                    $studentQuery->where('admission_number', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($userQuery) use ($search): void {
                            $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            })
            ->orderByRaw('roll_number is null or roll_number = ""')
            ->orderBy('roll_number')
            ->get()
            ->map(fn (StudentEnrollment $enrollment) => [
                'id' => $enrollment->student_id,
                'admission_number' => $enrollment->student?->admission_number,
                'name' => $enrollment->student?->user?->name,
                'email' => $enrollment->student?->user?->email,
                'phone' => $enrollment->student?->user?->phone,
                'gender' => $enrollment->student?->gender,
                'roll_number' => $enrollment->roll_number,
                'status' => $enrollment->status,
                'is_active' => (bool) $enrollment->student?->is_active,
                // Subjects the student is personally enrolled in. A student may
                // have none selected, so this is an empty list rather than the
                // subjects of the whole class.
                'subjects' => $enrollment->student?->subjects
                    ->map(fn (Subject $subject) => [
                        'id' => $subject->id,
                        'name' => $subject->name,
                        'code' => $subject->code,
                    ])
                    ->values()
                    ->all() ?? [],
            ]);

        return response()->json([
            'section' => [
                'id' => $section->id,
                'name' => $section->name,
                'school_class' => $section->schoolClass?->name,
                'academic_session' => $section->academicSession?->name,
            ],
            'students' => $students,
            'total' => $students->count(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Academic/Section/Form', $this->formProps());
    }

    public function store(StoreRequest $request): \Illuminate\Http\RedirectResponse
    {
        Section::create($request->validated());

        return redirect()->route('sections.index')
            ->with('success', 'Section created successfully.');
    }

    public function edit(Section $section): Response
    {
        $section->load('category');

        return Inertia::render('Academic/Section/Form', [
            'section' => $section,
            ...$this->formProps(),
        ]);
    }

    /**
     * Shared props for the section create/edit form.
     *
     * @return array<string, mixed>
     */
    protected function formProps(): array
    {
        return [
            'sessions' => AcademicSession::orderByDesc('start_date')->pluck('name', 'id'),
            'classes' => SchoolClass::where('is_active', true)->orderBy('level')->pluck('name', 'id'),
            'categories' => SectionCategory::where('is_active', true)
                ->orderBy('name')
                ->pluck('name', 'id'),
        ];
    }

    public function update(UpdateRequest $request, Section $section): \Illuminate\Http\RedirectResponse
    {
        $section->update($request->validated());

        return redirect()->route('sections.index')
            ->with('success', 'Section updated successfully.');
    }

    public function destroy(Section $section): \Illuminate\Http\RedirectResponse
    {
        $section->delete();

        return redirect()->route('sections.index')
            ->with('success', 'Section deleted successfully.');
    }
}
