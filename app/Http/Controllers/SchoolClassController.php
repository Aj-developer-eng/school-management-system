<?php

namespace App\Http\Controllers;

use App\Http\Requests\SchoolClass\StoreRequest;
use App\Http\Requests\SchoolClass\UpdateRequest;
use App\Http\Requests\SchoolClass\UploadPapersRequest;
use App\Models\AcademicSession;
use App\Models\ClassPaper;
use App\Models\SchoolClass;
use App\Models\TeacherSubjectAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
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
        $activeSessionId = AcademicSession::active()->value('id');

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
        // badge can open a detail modal.
        $pageClassIds = $classes->getCollection()->pluck('id');

        $studentsByClass = $pageClassIds->isNotEmpty()
            ? DB::table('student_enrollments as se')
                ->join('students as st', 'st.id', '=', 'se.student_id')
                ->join('users as u', 'u.id', '=', 'st.user_id')
                ->whereIn('se.school_class_id', $pageClassIds)
                ->whereNull('se.deleted_at')
                ->whereNull('st.deleted_at')
                ->when($activeSessionId, function ($q) use ($activeSessionId): void {
                    $q->where('se.academic_session_id', $activeSessionId);
                })
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

        $classes->getCollection()->each(function (SchoolClass $class) use ($studentsByClass, $timesByClass): void {
            $class->students_list = $studentsByClass->get($class->id, collect())->values();
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

    public function create(): Response
    {
        return Inertia::render('Academic/Class/Form', [
            'sessions' => AcademicSession::orderByDesc('start_date')->pluck('name', 'id'),
        ]);
    }

    public function store(StoreRequest $request): \Illuminate\Http\RedirectResponse
    {
        $data = $request->validated();

        // The form no longer collects a sort order, so new classes are
        // appended to the end of the existing ordering.
        $data['level'] = (int) SchoolClass::withTrashed()->max('level') + 1;

        SchoolClass::create($data);

        return redirect()->route('classes.index')
            ->with('success', 'Class created successfully.');
    }

    public function edit(SchoolClass $schoolClass): Response
    {
        return Inertia::render('Academic/Class/Form', [
            'class' => $schoolClass,
            'sessions' => AcademicSession::orderByDesc('start_date')->pluck('name', 'id'),
        ]);
    }

    public function update(UpdateRequest $request, SchoolClass $schoolClass): \Illuminate\Http\RedirectResponse
    {
        $schoolClass->update($request->validated());

        return redirect()->route('classes.index')
            ->with('success', 'Class updated successfully.');
    }

    public function destroy(SchoolClass $schoolClass): \Illuminate\Http\RedirectResponse
    {
        $schoolClass->delete();

        return redirect()->route('classes.index')
            ->with('success', 'Class deleted successfully.');
    }

    /**
     * Upload one or more papers (PDF/Word) against a class.
     *
     * Authorization happens in UploadPapersRequest (classes.upload-papers);
     * the files are kept on the private "local" disk so they can only be
     * served through the permission-gated download route.
     */
    public function uploadPapers(UploadPapersRequest $request, SchoolClass $schoolClass): \Illuminate\Http\RedirectResponse
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
    public function destroyPaper(ClassPaper $paper): \Illuminate\Http\RedirectResponse
    {
        $class = $paper->schoolClass()->withTrashed()->firstOrFail();

        $this->authorize('deletePapers', $class);

        Storage::disk('local')->delete($paper->file_path);
        $paper->delete();

        return back()->with('success', 'Paper deleted successfully.');
    }
}
