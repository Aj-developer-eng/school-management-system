<?php

namespace App\Http\Controllers;

use App\Http\Requests\Student\StoreRequest;
use App\Http\Requests\Student\UpdateRequest;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Services\ActivityLogService;
use App\Services\StudentService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    public function __construct(private readonly StudentService $students) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Student::class);

        $query = Student::query()
            ->with(['user', 'enrollments.academicSession', 'enrollments.schoolClass', 'enrollments.section']);

        if ($request->search) {
            $query->whereHas('user', function ($q) use ($request): void {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%");
            })
                ->orWhere('admission_number', 'like', "%{$request->search}%");
        }

        $students = $query->orderBy('admission_number', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Student/Index', [
            'students' => $students,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Student::class);

        return $this->renderForm();
    }

    public function store(StoreRequest $request): \Illuminate\Http\RedirectResponse
    {
        $student = $this->students->create($request->validated());

        ActivityLogService::created('Students', $student, "Admitted student: {$student->user->name} ({$student->admission_number})");

        return redirect()->route('students.index')
            ->with('success', 'Student admitted successfully.');
    }

    public function edit(Student $student): Response
    {
        $this->authorize('update', $student);
        $student->load(['user', 'enrollments.academicSession', 'enrollments.schoolClass', 'enrollments.section']);

        return $this->renderForm($student);
    }

    public function show(Student $student): Response
    {
        $this->authorize('view', $student);

        $student->load(['user', 'enrollments.academicSession', 'enrollments.schoolClass', 'enrollments.section']);

        $parents = $student->parents()
            ->with('user:id,name,email,phone')
            ->get()
            ->map(fn ($parent) => [
                'id' => $parent->id,
                'name' => $parent->user?->name,
                'email' => $parent->user?->email,
                'phone' => $parent->user?->phone,
                'occupation' => $parent->occupation,
                'cnic' => $parent->cnic,
                'emergency_contact' => $parent->emergency_contact,
                'address' => $parent->address,
                'is_active' => $parent->is_active,
                'guardian_type' => $parent->pivot->guardian_type,
                'is_primary_contact' => $parent->pivot->is_primary_contact,
            ]);

        return Inertia::render('Student/Show', [
            'student' => [
                'id' => $student->id,
                'admission_number' => $student->admission_number,
                'name' => $student->user?->name,
                'email' => $student->user?->email,
                'phone' => $student->user?->phone,
                'date_of_birth' => $student->date_of_birth?->format('Y-m-d'),
                'gender' => $student->gender,
                'address' => $student->address,
                'is_active' => $student->is_active,
                'current_class' => $student->enrollments?->first() ? [
                    'class' => $student->enrollments->first()->schoolClass?->name,
                    'section' => $student->enrollments->first()->section?->name,
                    'session' => $student->enrollments->first()->academicSession?->name,
                ] : null,
            ],
            'parents' => $parents,
        ]);
    }

    public function update(UpdateRequest $request, Student $student): \Illuminate\Http\RedirectResponse
    {
        $this->students->update($student, $request->validated());

        ActivityLogService::updated('Students', $student, "Updated student: {$student->user->name} ({$student->admission_number})");

        return redirect()->route('students.index')
            ->with('success', 'Student updated successfully.');
    }

    public function destroy(Student $student): \Illuminate\Http\RedirectResponse
    {
        $this->authorize('delete', $student);

        ActivityLogService::deleted('Students', $student, "Deleted student: {$student->user->name} ({$student->admission_number})");

        $student->delete();
        $student->user->update(['is_active' => false]);

        return redirect()->route('students.index')
            ->with('success', 'Student deleted successfully.');
    }

    private function renderForm(?Student $student = null): Response
    {
        $activeSession = AcademicSession::active()->first();

        return Inertia::render('Student/Form', [
            'student' => $student,
            'sessions' => AcademicSession::orderByDesc('start_date')->pluck('name', 'id'),
            'classes' => SchoolClass::where('is_active', true)->orderBy('level')->pluck('name', 'id'),
            'sections' => Section::orderBy('name')
                ->get()
                ->map(fn (Section $section) => [
                    'id' => $section->id,
                    'name' => $section->name,
                    'school_class_id' => $section->school_class_id,
                    'academic_session_id' => $section->academic_session_id,
                ])
                ->all(),
            'default_session_id' => $student?->enrollments?->first()?->academic_session_id ?? $activeSession?->id,
        ]);
    }
}
