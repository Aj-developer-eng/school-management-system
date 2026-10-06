<?php

namespace App\Http\Controllers;

use App\Enums\RoleEnum;
use App\Enums\TestStatusEnum;
use App\Enums\TestTypeEnum;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentParent;
use App\Models\Teacher;
use App\Models\TeacherSubjectAssignment;
use App\Models\Test;
use App\Models\TestResult;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
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

        // Parents and students only ever see the tests they have a visible result
        // for: published results, excluding "not applicable" entries. Staff roles
        // stay unrestricted.
        $scopedStudentIds = $this->scopedStudentIds($user);
        $isScopedViewer = $scopedStudentIds !== null;

        $tests = Test::query()
            ->with([
                'teacher.user:id,name',
                'schoolClass:id,name',
                'academicSession:id,name',
                'results' => fn ($q) => $q
                    ->whereNull('deleted_at')
                    ->when($isScopedViewer, fn ($rq) => $rq
                        ->whereIn('student_id', $scopedStudentIds)
                        ->where('is_not_applicable', false)),
            ])
            ->whereNull('tests.deleted_at')
            ->when($isScopedViewer, fn ($q) => $q->whereIn('tests.id', $this->visibleTestIds($scopedStudentIds)))
            ->when($activeSession, fn ($q) => $q->where('academic_session_id', $activeSession->id))
            ->when($request->search, function ($query, $search): void {
                $query->where('title', 'like', "%{$search}%")
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

        return Inertia::render('Test/Form', [
            'assignments' => $this->assignmentOptions($teacher, $activeSession),
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
            'status' => TestStatusEnum::Announced,
        ]);

        ActivityLogService::custom('Tests', 'created', "Created test: {$test->title} ({$test->test_type->label()}) for {$test->schoolClass?->name}");

        return redirect()->route('tests.index')
            ->with('success', 'Test announced successfully.');
    }

    public function show(Request $request, Test $test): Response
    {
        $user = $request->user();
        $this->authorizeTestAccess($user, $test);

        $test->load([
            'teacher.user:id,name',
            'schoolClass:id,name',
            'academicSession:id,name',
            'results.student.user:id,name',
        ]);

        $students = collect();
        if ($test->status === TestStatusEnum::Conducted || $test->status === TestStatusEnum::ResultsPublished) {
            $students = $this->getEnrolledStudents($test);
        }

        // Parents see only their children's results; students only their own.
        // Unpublished results stay hidden from them entirely. "Not applicable"
        // results are staff-only.
        $scopedStudentIds = $this->scopedStudentIds($user);
        if ($scopedStudentIds !== null) {
            $students = $test->status === TestStatusEnum::ResultsPublished
                ? $students
                    ->filter(fn ($s) => $scopedStudentIds->contains($s['id']) && ! $s['result']?->is_not_applicable)
                    ->values()
                : collect();
        }

        return Inertia::render('Test/Show', [
            'test' => $test,
            'students' => $students,
        ]);
    }

    public function edit(Test $test): Response
    {
        $this->authorizeTestAccess(request()->user(), $test);

        $user = request()->user();
        $teacher = Teacher::where('user_id', $user->id)->first();
        $activeSession = AcademicSession::active()->first();

        return Inertia::render('Test/Form', [
            'test' => $test,
            'assignments' => $this->assignmentOptions($teacher, $activeSession),
            'testTypes' => collect(TestTypeEnum::cases())->map(fn ($t) => ['value' => $t->value, 'label' => $t->label()])->values(),
        ]);
    }

    public function update(Request $request, Test $test): \Illuminate\Http\RedirectResponse
    {
        $this->authorizeTestAccess($request->user(), $test);

        $validated = $this->validateTest($request, $test);

        $assignment = TeacherSubjectAssignment::findOrFail($validated['teacher_subject_assignment_id']);

        $test->update([
            ...$validated,
            'teacher_id' => $assignment->teacher_id,
            'academic_session_id' => $assignment->academic_session_id,
            'school_class_id' => $assignment->school_class_id,
        ]);

        ActivityLogService::custom('Tests', 'updated', "Updated test: {$test->title}");

        return redirect()->route('tests.index')
            ->with('success', 'Test updated successfully.');
    }

    public function destroy(Test $test): \Illuminate\Http\RedirectResponse
    {
        $this->authorizeTestAccess(request()->user(), $test);

        ActivityLogService::custom('Tests', 'deleted', "Deleted test: {$test->title}");

        $test->delete();

        return redirect()->route('tests.index')
            ->with('success', 'Test deleted successfully.');
    }

    public function markConducted(Test $test): \Illuminate\Http\RedirectResponse
    {
        $this->authorizeTestAccess(request()->user(), $test);

        $test->update(['status' => TestStatusEnum::Conducted]);

        ActivityLogService::custom('Tests', 'updated', "Marked test as conducted: {$test->title}");

        return redirect()->back()->with('success', 'Test marked as conducted. You can now upload results.');
    }

    public function saveResults(Request $request, Test $test): \Illuminate\Http\RedirectResponse
    {
        $this->authorizeTestAccess($request->user(), $test);

        $request->validate([
            'results' => ['required', 'array'],
            'results.*.student_id' => ['required', 'exists:students,id'],
            'results.*.marks_obtained' => ['nullable', 'numeric', 'min:0'],
            'results.*.is_absent' => ['boolean'],
            'results.*.is_not_applicable' => ['boolean'],
            'results.*.remarks' => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($request, $test): void {
            foreach ($request->input('results') as $row) {
                // "Not Applicable" takes precedence: the test does not apply to
                // the student, so they are neither absent nor graded.
                $isNotApplicable = (bool) ($row['is_not_applicable'] ?? false);
                $isAbsent = ! $isNotApplicable && (bool) ($row['is_absent'] ?? false);

                $marks = ($isNotApplicable || $isAbsent) ? null : ($row['marks_obtained'] ?? null);
                $grade = $this->calculateGrade($marks, $test->total_marks, $test->passing_marks);

                TestResult::updateOrCreate(
                    ['test_id' => $test->id, 'student_id' => $row['student_id']],
                    [
                        'marks_obtained' => $marks,
                        'grade' => $grade,
                        'remarks' => $row['remarks'] ?? null,
                        'is_absent' => $isAbsent,
                        'is_not_applicable' => $isNotApplicable,
                    ]
                );
            }
        });

        ActivityLogService::custom('Tests', 'updated', "Saved results for test: {$test->title}");

        return redirect()->back()->with('success', 'Results saved successfully.');
    }

    public function publishResults(Test $test): \Illuminate\Http\RedirectResponse
    {
        $this->authorizeTestAccess(request()->user(), $test);

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

    /**
     * Options for the class picker on the test form: one entry per active
     * assignment of the teacher, labelled "Class · start – end" so classes
     * sharing a name but running at different times stay tellable apart.
     *
     * @return Collection<int, array{id: int, label: string, school_class_id: int, academic_session_id: int}>
     */
    private function assignmentOptions(?Teacher $teacher, ?AcademicSession $activeSession): Collection
    {
        return TeacherSubjectAssignment::with(['schoolClass:id,name'])
            ->where('teacher_id', $teacher?->id)
            ->whereNull('deleted_at')
            ->when($activeSession, fn ($q) => $q->where('academic_session_id', $activeSession->id))
            ->get()
            ->map(fn (TeacherSubjectAssignment $assignment): array => [
                'id' => $assignment->id,
                'label' => $this->assignmentLabel($assignment),
                'school_class_id' => $assignment->school_class_id,
                'academic_session_id' => $assignment->academic_session_id,
            ]);
    }

    private function assignmentLabel(TeacherSubjectAssignment $assignment): string
    {
        $label = (string) $assignment->schoolClass?->name;

        $start = $assignment->start_time?->format('H:i');
        $end = $assignment->end_time?->format('H:i');

        if ($start !== null && $end !== null) {
            return "{$label} · {$start} – {$end}";
        }

        if ($start !== null) {
            return "{$label} · {$start}";
        }

        return $label;
    }

    private function getEnrolledStudents(Test $test)
    {
        $query = StudentEnrollment::with(['student.user:id,name'])
            ->where('academic_session_id', $test->academic_session_id)
            ->where('school_class_id', $test->school_class_id)
            ->whereNull('deleted_at');

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

    /**
     * The IDs of the tests a scoped viewer (parent or student) may see: the
     * ones holding at least one of their results that has been published.
     * Mirrors the visibility rules applied by show() and the parent dashboard.
     */
    private function visibleTestIds(Collection $studentIds): array
    {
        return TestResult::query()
            ->select('test_id')
            ->whereIn('student_id', $studentIds)
            ->whereNull('deleted_at')
            ->where('is_not_applicable', false)
            ->whereHas('test', fn ($q) => $q
                ->where('status', TestStatusEnum::ResultsPublished->value)
                ->whereNull('deleted_at'))
            ->pluck('test_id')
            ->all();
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
        $test->load(['results.student.user:id,name', 'results.student.parents.user', 'schoolClass:id,name']);

        foreach ($test->results as $result) {
            $student = $result->student;
            if (! $student) {
                continue;
            }

            $marksDisplay = match (true) {
                $result->is_not_applicable => 'Not Applicable',
                $result->is_absent => 'Absent',
                default => number_format((float) $result->marks_obtained, 2) . '/' . number_format((float) $test->total_marks, 2),
            };

            $gradeDisplay = $result->grade ? " — Grade: {$result->grade}" : '';

            foreach ($student->parents as $parent) {
                if ($parent->user) {
                    NotificationService::send($parent->user, [
                        'type' => 'test_result_published',
                        'title' => "Test Result: {$test->title}",
                        'message' => "{$student->user->name} — {$test->schoolClass?->name}: {$marksDisplay}{$gradeDisplay}",
                        'link' => '/tests/' . $test->id,
                    ]);
                }
            }
        }
    }

    /**
     * Teachers may only access their own tests; other permitted staff roles
     * (Super Admin, Principal, Vice Principal) can access every test.
     */
    private function authorizeTestAccess(User $user, Test $test): void
    {
        if (! $user->hasRole(RoleEnum::Teacher->value)) {
            return;
        }

        $teacher = Teacher::where('user_id', $user->id)->first();

        if (! $teacher || $test->teacher_id !== $teacher->id) {
            abort(403);
        }
    }

    /**
     * Return the student IDs the current user may view results for.
     * Parents are scoped to their children; students to themselves.
     * Returns null for staff roles (no scoping).
     */
    private function scopedStudentIds(User $user): ?Collection
    {
        if ($user->hasRole(RoleEnum::Parent->value)) {
            $parent = StudentParent::where('user_id', $user->id)->first();

            return $parent?->students()->pluck('students.id') ?? collect();
        }

        if ($user->hasRole(RoleEnum::Student->value)) {
            $student = Student::where('user_id', $user->id)->first();

            return $student ? collect([$student->id]) : collect();
        }

        return null;
    }
}
