<?php

namespace App\Http\Controllers;

use App\Http\Requests\SchoolClass\AttachStudentRequest;
use App\Http\Requests\SchoolClass\StoreNoteRequest;
use App\Http\Requests\SchoolClass\StoreRequest;
use App\Http\Requests\SchoolClass\UpdateRequest;
use App\Http\Requests\SchoolClass\UploadPapersRequest;
use App\Models\AcademicSession;
use App\Models\ClassPaper;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\Teacher;
use App\Models\TeacherSubjectAssignment;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SchoolClassController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(SchoolClass::class, 'school_class');
    }

    public function index(Request $request): Response
    {
        // Scalar subqueries used to sort classes by their earliest class time
        // so the index table can be displayed time-wise (grouped per slot).
        $earliestStart = '(select min(tsa.start_time)
            from teacher_subject_assignments tsa
            where tsa.school_class_id = school_classes.id
                and tsa.deleted_at is null)';
        $earliestEnd = '(select min(tsa.end_time)
            from teacher_subject_assignments tsa
            where tsa.school_class_id = school_classes.id
                and tsa.deleted_at is null)';

        $classes = SchoolClass::query()
            ->with([
                'activeFromSession',
                // The papers list shown in the Papers modal; the files live on
                // the private local disk and are only served by the
                // permission-gated classes.papers.download route.
                'papers:id,school_class_id,original_name,mime_type,size,created_at',
            ])
            // Notes are only shared with users allowed to read them
            // ("classes.view-notes") or write them ("classes.create-notes"),
            // so the payload never leaks notes to other roles.
            ->when(
                $request->user()?->can('classes.view-notes')
                    || $request->user()?->can('classes.create-notes'),
                fn ($query) => $query->with([
                    'notes' => fn ($notes) => $notes->with('creator:id,name')->latest('id'),
                ]),
            )
            ->select('school_classes.*')
            ->selectRaw('(select count(distinct se.student_id)
                from student_enrollments se
                where se.school_class_id = school_classes.id
                    and se.deleted_at is null) as students_count')
            ->when($request->search, function ($query, $search): void {
                $query->where(function ($q) use ($search): void {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            })
            // Sort by each class's earliest class time so rows arrive grouped
            // time-wise; classes without a class time are listed last.
            ->orderByRaw("{$earliestStart} is null")
            ->orderByRaw($earliestStart)
            ->orderByRaw("{$earliestEnd} is null")
            ->orderByRaw($earliestEnd)
            ->orderBy('level')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        // Load the student lists for the classes on this page so the Students
        // badge can open a detail modal. The roster is session-agnostic: a
        // student enrolled in the class in any academic session shows up.
        $pageClassIds = $classes->getCollection()->pluck('id');

        $studentsByClass = $pageClassIds->isNotEmpty()
            ? DB::table('student_enrollments as se')
                ->join('students as st', 'st.id', '=', 'se.student_id')
                ->join('users as u', 'u.id', '=', 'st.user_id')
                ->whereIn('se.school_class_id', $pageClassIds)
                ->whereNull('se.deleted_at')
                ->whereNull('st.deleted_at')
                ->groupBy('se.school_class_id', 'st.id', 'u.name', 'st.admission_number')
                ->orderBy('u.name')
                ->get([
                    'se.school_class_id',
                    'st.id as student_id',
                    'u.name as student_name',
                    'st.admission_number',
                ])
                ->groupBy('school_class_id')
            : collect();

        // Active students that can still be attached to a class from its
        // Students modal — only loaded for users allowed to manage the roster
        // ("students.update"); every class excludes its own current roster.
        // Shaped for the searchable picker (value/label/keywords): the label
        // shows the admission number and keywords allow matching on name or
        // admission number, which keeps long student lists usable.
        $activeStudents = $request->user()?->can('students.update')
            ? Student::query()
                ->join('users', 'users.id', '=', 'students.user_id')
                ->where('students.is_active', true)
                ->whereNull('students.deleted_at')
                ->whereNull('users.deleted_at')
                ->with('user:id,name')
                ->orderBy('users.name')
                ->get(['students.id', 'students.user_id', 'students.admission_number'])
                ->map(fn (Student $student) => [
                    'value' => $student->id,
                    'label' => ($student->user?->name ?? 'Unknown').' ('.$student->admission_number.')',
                    'keywords' => trim(($student->user?->name ?? '').' '.$student->admission_number),
                ])
            : collect();

        // Load the class times (from teacher assignments) for the classes on
        // this page so the table can show them instead of the numeric level.
        $timesByClass = $pageClassIds->isNotEmpty()
            ? TeacherSubjectAssignment::query()
                ->whereIn('school_class_id', $pageClassIds)
                ->orderByRaw('CASE WHEN start_time IS NULL THEN 1 ELSE 0 END')
                ->orderBy('start_time')
                ->orderBy('end_time')
                ->get(['school_class_id', 'start_time', 'end_time'])
                ->groupBy('school_class_id')
            : collect();

        $classes->getCollection()->each(function (SchoolClass $class) use ($studentsByClass, $timesByClass, $activeStudents): void {
            $class->students_list = $studentsByClass->get($class->id, collect())->values();
            // Active students that are not enrolled in this class in any
            // session — the options of the modal's Add-student picker.
            $rosterIds = $class->students_list->pluck('student_id');
            $class->students_addable = $activeStudents
                ->reject(fn (array $option) => $rosterIds->contains($option['value']))
                ->values();
            $class->class_times = $timesByClass->get($class->id, collect())
                ->map(fn (TeacherSubjectAssignment $assignment) => [
                    'start_time' => $assignment->start_time?->format('H:i'),
                    'end_time' => $assignment->end_time?->format('H:i'),
                ])
                ->filter(fn (array $time) => $time['start_time'] !== null || $time['end_time'] !== null)
                ->unique()
                ->values();
        });

        return Inertia::render('Academic/Class/Index', [
            'classes' => $classes,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create(Request $request): Response
    {
        // The optional assignment section is only offered to users who may
        // create teacher assignments, so no teacher list is sent otherwise.
        $canAssign = $request->user()?->can('create', TeacherSubjectAssignment::class) ?? false;

        return Inertia::render('Academic/Class/Form', [
            'sessions' => AcademicSession::orderByDesc('start_date')->pluck('name', 'id'),
            'teachers' => $canAssign
                ? Teacher::query()
                    ->where('is_active', true)
                    ->with('user')
                    ->get()
                    ->map(fn (Teacher $teacher) => ['id' => $teacher->id, 'label' => $teacher->user->name])
                : [],
            'can_assign' => $canAssign,
        ]);
    }

    public function store(StoreRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $assignmentData = $data['assignment'] ?? [];
        unset($data['assignment']);

        // The class assignment section is optional: an assignment is only
        // created when a teacher is chosen and the user holds the
        // "teacher-assignments.create" permission (the section is hidden
        // server-side for users without it).
        $teacherId = $assignmentData['teacher_id'] ?? null;
        $canAssign = filled($teacherId)
            && ($request->user()?->can('create', TeacherSubjectAssignment::class) ?? false);

        $sessionId = null;
        if ($canAssign) {
            // Use the submitted session, falling back to the active one.
            $sessionId = ($assignmentData['academic_session_id'] ?? null)
                ?? AcademicSession::active()->value('id');

            // Resolve this before creating the class so a failure can never
            // leave a class behind without its assignment.
            if ($sessionId === null) {
                throw ValidationException::withMessages([
                    'assignment.academic_session_id' => 'Select an academic session for the class assignment.',
                ]);
            }
        }

        // The form no longer collects a sort order, so new classes are
        // appended to the end of the existing ordering.
        $data['level'] = (int) SchoolClass::withTrashed()->max('level') + 1;

        return DB::transaction(function () use ($data, $assignmentData, $teacherId, $sessionId, $canAssign): RedirectResponse {
            $schoolClass = SchoolClass::create($data);

            if ($canAssign) {
                $assignment = TeacherSubjectAssignment::create([
                    'teacher_id' => $teacherId,
                    'academic_session_id' => $sessionId,
                    'school_class_id' => $schoolClass->id,
                    'start_time' => $assignmentData['start_time'] ?? null,
                    'end_time' => $assignmentData['end_time'] ?? null,
                    'days_of_week' => $assignmentData['days_of_week'] ?? [],
                ]);

                ActivityLogService::created('Teacher Assignments', $assignment, 'Created class assignment');
            }

            return redirect()->route('classes.index')
                ->with('success', 'Class created successfully.');
        });
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
        DB::transaction(function () use ($schoolClass): void {
            // The class's teacher assignments drive the weekly timetable and
            // the teacher-assignments list, so they are soft-deleted together
            // with the class (same pattern as deleting an invoice removes its
            // payments) instead of being left behind as orphaned entries.
            $schoolClass->teacherSubjectAssignments()->delete();

            $schoolClass->delete();
        });

        return redirect()->route('classes.index')
            ->with('success', 'Class deleted successfully.');
    }

    /**
     * Store a note against a class (authorized via StoreNoteRequest —
     * "classes.create-notes"). Super Admin holds it via Gate::before; the
     * super admin can grant it to any role from /roles. Parents holding
     * "classes.view-notes" read the notes from the Class Notes page.
     */
    public function storeNote(StoreNoteRequest $request, SchoolClass $schoolClass): RedirectResponse
    {
        $schoolClass->notes()->create($request->validated());

        return back()->with('success', 'Note added successfully.');
    }

    /**
     * Attach a student to the class roster (authorized via
     * SchoolClassPolicy::manageStudents — "students.update").
     *
     * The roster is session-agnostic: an enrollment in any academic session
     * counts as attached. The unique (student, session, class) key includes
     * soft-deleted rows, so a previously detached enrollment is restored
     * instead of recreated (same approach as StudentService::syncClassSelection).
     */
    public function attachStudent(AttachStudentRequest $request, SchoolClass $schoolClass): RedirectResponse
    {
        $this->authorize('manageStudents', $schoolClass);

        $studentId = $request->validated('student_id');

        // Enrolled somewhere already (any session) — harmless no-op.
        $alreadyAttached = StudentEnrollment::where('student_id', $studentId)
            ->where('school_class_id', $schoolClass->id)
            ->exists();

        if (! $alreadyAttached) {
            $enrollment = StudentEnrollment::withTrashed()
                ->where('student_id', $studentId)
                ->where('school_class_id', $schoolClass->id)
                ->orderByDesc('id')
                ->first();

            if ($enrollment) {
                $enrollment->restore();
            } else {
                // A brand-new enrollment still needs a session for its
                // foreign key: prefer the active one, else the latest.
                $session = AcademicSession::active()->first()
                    ?? AcademicSession::query()->orderByDesc('start_date')->orderByDesc('id')->first();

                if (! $session) {
                    return back()->withErrors(['student_id' => 'No academic session exists yet.']);
                }

                StudentEnrollment::create([
                    'student_id' => $studentId,
                    'academic_session_id' => $session->id,
                    'school_class_id' => $schoolClass->id,
                ]);
            }
        }

        return back()->with('success', 'Student added to the class.');
    }

    /**
     * Detach a student from the class roster. Every enrollment row for this
     * class (any session) is soft-deleted so the student leaves the roster
     * completely; history is preserved and a repeat call is a harmless
     * no-op (idempotent).
     */
    public function detachStudent(SchoolClass $schoolClass, Student $student): RedirectResponse
    {
        $this->authorize('manageStudents', $schoolClass);

        StudentEnrollment::where('student_id', $student->id)
            ->where('school_class_id', $schoolClass->id)
            ->delete();

        return back()->with('success', 'Student removed from the class.');
    }

    /**
     * Upload one or more papers (PDF/Word) against a class.
     *
     * Authorization happens in UploadPapersRequest (classes.upload-papers);
     * the files are kept on the private "local" disk so they can only be
     * served through the permission-gated download route.
     */
    public function uploadPapers(UploadPapersRequest $request, SchoolClass $schoolClass): RedirectResponse
    {
        foreach ($request->file('papers') as $file) {
            $schoolClass->papers()->create([
                'file_path' => $file->store('class-papers', 'local'),
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
            ]);
        }

        return back()->with('success', 'Papers uploaded successfully.');
    }

    /**
     * Download a paper that was uploaded for a class ("classes.download-papers").
     */
    public function downloadPaper(ClassPaper $paper): StreamedResponse
    {
        $class = $paper->schoolClass()->withTrashed()->firstOrFail();

        $this->authorize('downloadPapers', $class);

        abort_unless(Storage::disk('local')->exists($paper->file_path), 404);

        return Storage::disk('local')->download($paper->file_path, $paper->original_name);
    }

    /**
     * Remove a paper from a class ("classes.delete-papers").
     */
    public function destroyPaper(ClassPaper $paper): RedirectResponse
    {
        $class = $paper->schoolClass()->withTrashed()->firstOrFail();

        $this->authorize('deletePapers', $class);

        Storage::disk('local')->delete($paper->file_path);
        $paper->delete();

        return back()->with('success', 'Paper deleted successfully.');
    }
}
