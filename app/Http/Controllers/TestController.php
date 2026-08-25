<?php

namespace App\Http\Controllers;

use App\Enums\RoleEnum;
use App\Enums\TestStatusEnum;
use App\Enums\TestTypeEnum;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\Teacher;
use App\Models\TeacherSubjectAssignment;
use App\Models\Test;
use App\Models\TestResult;
use App\Services\ActivityLogService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TestController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $activeSession = AcademicSession::active()->first();

        $tests = Test::query()
            ->with([
                'teacher.user:id,name',
                'schoolClass:id,name',
                'section:id,name',
                'subject:id,name',
                'academicSession:id,name',
                'results' => fn ($q) => $q->whereNull('deleted_at'),
            ])
            ->whereNull('tests.deleted_at')
            ->when($activeSession, fn ($q) => $q->where('academic_session_id', $activeSession->id))
            ->when($request->search, function ($query, $search): void {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhereHas('subject', fn ($sq) => $sq->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('schoolClass', fn ($sq) => $sq->where('name', 'like', "%{$search}%"));
            });

        if ($user->hasRole(RoleEnum::Teacher->value)) {
            $teacher = Teacher::where('user_id', $user->id)->first();
            if ($teacher) {
                $tests->where('teacher_id', $teacher->id);
            }
        }

        $tests = $tests->latest()->paginate(15)->withQueryString();

        return Inertia::render('Test/Index', [
            'tests' => $tests,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create(): Response
    {
        $user = request()->user();
        $teacher = Teacher::where('user_id', $user->id)->first();
        $activeSession = AcademicSession::active()->first();

        $assignments = TeacherSubjectAssignment::with(['schoolClass:id,name', 'section:id,name', 'subject:id,name'])
            ->where('teacher_id', $teacher?->id)
            ->whereNull('deleted_at')
            ->when($activeSession, fn ($q) => $q->where('academic_session_id', $activeSession->id))
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'label' => "{$a->schoolClass?->name}" . ($a->section ? " — {$a->section?->name}" : '') . " — {$a->subject?->name}",
                'school_class_id' => $a->school_class_id,
                'section_id' => $a->section_id,
                'subject_id' => $a->subject_id,
                'academic_session_id' => $a->academic_session_id,
            ]);

        return Inertia::render('Test/Form', [
            'assignments' => $assignments,
            'testTypes' => collect(TestTypeEnum::cases())->map(fn ($t) => ['value' => $t->value, 'label' => $t->label()])->values(),
        ]);
    }

    public function store(Request $request): \Illuminate\Http\RedirectResponse
    {
        $validated = $this->validateTest($request);

        $assignment = TeacherSubjectAssignment::findOrFail($validated['teacher_subject_assignment_id']);
        $teacher = Teacher::where('user_id', $request->user()->id)->first();

        $test = Test::create([
            ...$validated,
            'teacher_id' => $assignment->teacher_id,
            'academic_session_id' => $assignment->academic_session_id,
            'school_class_id' => $assignment->school_class_id,
            'section_id' => $assignment->section_id,
            'subject_id' => $assignment->subject_id,
            'status' => TestStatusEnum::Announced,
        ]);

        ActivityLogService::custom('Tests', 'created', "Created test: {$test->title} ({$test->test_type->label()}) for {$test->schoolClass?->name} — {$test->subject?->name}");

        return redirect()->route('tests.index')
            ->with('success', 'Test announced successfully.');
    }

    public function show(Test $test): Response
    {
        $test->load([
            'teacher.user:id,name',
            'schoolClass:id,name',
            'section:id,name',
            'subject:id,name',
            'academicSession:id,name',
            'results.student.user:id,name',
        ]);

        $students = collect();
        if ($test->status === TestStatusEnum::Conducted || $test->status === TestStatusEnum::ResultsPublished) {
            $students = $this->getEnrolledStudents($test);
        }

        return Inertia::render('Test/Show', [
            'test' => $test,
            'students' => $students,
        ]);
    }

    public function edit(Test $test): Response
    {
        $user = request()->user();
        $teacher = Teacher::where('user_id', $user->id)->first();
        $activeSession = AcademicSession::active()->first();

        $assignments = TeacherSubjectAssignment::with(['schoolClass:id,name', 'section:id,name', 'subject:id,name'])
            ->where('teacher_id', $teacher?->id)
            ->whereNull('deleted_at')
            ->when($activeSession, fn ($q) => $q->where('academic_session_id', $activeSession->id))
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'label' => "{$a->schoolClass?->name}" . ($a->section ? " — {$a->section?->name}" : '') . " — {$a->subject?->name}",
                'school_class_id' => $a->school_class_id,
                'section_id' => $a->section_id,
                'subject_id' => $a->subject_id,
                'academic_session_id' => $a->academic_session_id,
            ]);

        return Inertia::render('Test/Form', [
            'test' => $test,
            'assignments' => $assignments,
            'testTypes' => collect(TestTypeEnum::cases())->map(fn ($t) => ['value' => $t->value, 'label' => $t->label()])->values(),
        ]);
    }

    public function update(Request $request, Test $test): \Illuminate\Http\RedirectResponse
    {
        $validated = $this->validateTest($request, $test);

        $assignment = TeacherSubjectAssignment::findOrFail($validated['teacher_subject_assignment_id']);

        $test->update([
            ...$validated,
            'teacher_id' => $assignment->teacher_id,
            'academic_session_id' => $assignment->academic_session_id,
            'school_class_id' => $assignment->school_class_id,
            'section_id' => $assignment->section_id,
            'subject_id' => $assignment->subject_id,
        ]);

        ActivityLogService::custom('Tests', 'updated', "Updated test: {$test->title}");

        return redirect()->route('tests.index')
            ->with('success', 'Test updated successfully.');
    }

    public function destroy(Test $test): \Illuminate\Http\RedirectResponse
    {
        ActivityLogService::custom('Tests', 'deleted', "Deleted test: {$test->title}");

        $test->delete();

        return redirect()->route('tests.index')
            ->with('success', 'Test deleted successfully.');
    }

    public function markConducted(Test $test): \Illuminate\Http\RedirectResponse
    {
        $test->update(['status' => TestStatusEnum::Conducted]);

        ActivityLogService::custom('Tests', 'updated', "Marked test as conducted: {$test->title}");

        return redirect()->back()->with('success', 'Test marked as conducted. You can now upload results.');
    }

    public function saveResults(Request $request, Test $test): \Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'results' => ['required', 'array'],
            'results.*.student_id' => ['required', 'exists:students,id'],
            'results.*.marks_obtained' => ['nullable', 'numeric', 'min:0'],
            'results.*.is_absent' => ['boolean'],
            'results.*.remarks' => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($request, $test): void {
            foreach ($request->input('results') as $row) {
                $marks = ($row['is_absent'] ?? false) ? null : ($row['marks_obtained'] ?? null);
                $grade = $this->calculateGrade($marks, $test->total_marks, $test->passing_marks);

                TestResult::updateOrCreate(
                    ['test_id' => $test->id, 'student_id' => $row['student_id']],
                    [
                        'marks_obtained' => $marks,
                        'grade' => $grade,
                        'remarks' => $row['remarks'] ?? null,
                        'is_absent' => $row['is_absent'] ?? false,
                    ]
                );
            }
        });

        ActivityLogService::custom('Tests', 'updated', "Saved results for test: {$test->title}");

        return redirect()->back()->with('success', 'Results saved successfully.');
    }

    public function publishResults(Test $test): \Illuminate\Http\RedirectResponse
    {
        if ($test->results()->count() === 0) {
            return redirect()->back()->with('error', 'No results to publish. Please save results first.');
        }

        $test->update([
            'status' => TestStatusEnum::ResultsPublished,
            'results_published_at' => now(),
        ]);

        $this->notifyParents($test);

        ActivityLogService::custom('Tests', 'updated', "Published results for test: {$test->title}");

        return redirect()->back()->with('success', 'Results published. Parents have been notified.');
    }

    private function validateTest(Request $request, ?Test $test = null): array
    {
        return $request->validate([
            'teacher_subject_assignment_id' => ['required', 'exists:teacher_subject_assignments,id'],
            'title' => ['required', 'string', 'max:255'],
            'test_type' => ['required', Rule::enum(TestTypeEnum::class)],
            'test_date' => ['required', 'date'],
            'total_marks' => ['required', 'numeric', 'min:1'],
            'passing_marks' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);
    }

    private function getEnrolledStudents(Test $test)
    {
        $query = StudentEnrollment::with(['student.user:id,name'])
            ->where('academic_session_id', $test->academic_session_id)
            ->where('school_class_id', $test->school_class_id)
            ->whereNull('deleted_at');

        if ($test->section_id) {
            $query->where('section_id', $test->section_id);
        }

        return $query->get()
            ->map(fn ($e) => [
                'id' => $e->student_id,
                'name' => $e->student?->user?->name,
                'roll_number' => $e->roll_number,
                'result' => $test->results->firstWhere('student_id', $e->student_id),
            ])
            ->sortBy('roll_number')
            ->values();
    }

    private function calculateGrade(?string $marks, string $totalMarks, string $passingMarks): ?string
    {
        if ($marks === null) {
            return null;
        }

        $marks = (float) $marks;
        $total = (float) $totalMarks;
        $passing = (float) $passingMarks;
        $percentage = ($total > 0) ? ($marks / $total) * 100 : 0;

        if ($marks < $passing) {
            return 'F';
        }

        return match (true) {
            $percentage >= 90 => 'A+',
            $percentage >= 80 => 'A',
            $percentage >= 70 => 'B',
            $percentage >= 60 => 'C',
            $percentage >= 50 => 'D',
            $percentage >= $passing => 'E',
            default => 'F',
        };
    }

    private function notifyParents(Test $test): void
    {
        $test->load(['results.student.parents.user', 'subject:id,name', 'schoolClass:id,name']);

        foreach ($test->results as $result) {
            $student = $result->student;
            if (! $student) {
                continue;
            }

            $marksDisplay = $result->is_absent
                ? 'Absent'
                : number_format((float) $result->marks_obtained, 2) . '/' . number_format((float) $test->total_marks, 2);

            foreach ($student->parents as $parent) {
                if ($parent->user) {
                    NotificationService::send($parent->user, [
                        'type' => 'test_result_published',
                        'title' => "Test Result: {$test->title}",
                        'message' => "{$student->user->name} — {$test->subject?->name} ({$test->schoolClass?->name}): {$marksDisplay} — Grade: {$result->grade}",
                        'link' => '/tests/' . $test->id,
                    ]);
                }
            }
        }
    }
}
