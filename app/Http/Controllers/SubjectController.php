<?php

namespace App\Http\Controllers;

use App\Enums\RoleEnum;
use App\Http\Requests\Subject\StoreRequest;
use App\Http\Requests\Subject\UpdateRequest;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\SubjectPaper;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SubjectController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Subject::class);
    }

    public function index(Request $request): Response
    {
        $activeSessionId = AcademicSession::active()->value('id');

        $subjects = Subject::query()
            ->with(['schoolClasses', 'papers'])
            ->select('subjects.*')
            ->selectRaw('(select count(distinct se.student_id)
                from student_enrollments se
                inner join class_subject cs on cs.school_class_id = se.school_class_id
                where cs.subject_id = subjects.id
                    and se.deleted_at is null'
                    .($activeSessionId ? ' and se.academic_session_id = '.(int) $activeSessionId : '')
                    .') as students_count')
            ->when($this->scopedSubjectIds($request->user()), function ($query, $subjectIds): void {
                $query->whereIn('subjects.id', $subjectIds);
            })
            ->when($request->search, function ($query, $search): void {
                $query->where(function ($q) use ($search): void {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        // Load the actual student lists for the subjects on this page so the
        // Students badge can open a detail modal.
        $pageSubjectIds = $subjects->getCollection()->pluck('id');

        $studentsBySubject = $pageSubjectIds->isNotEmpty()
            ? DB::table('class_subject as cs')
                ->join('student_enrollments as se', 'se.school_class_id', '=', 'cs.school_class_id')
                ->join('students as st', 'st.id', '=', 'se.student_id')
                ->join('users as u', 'u.id', '=', 'st.user_id')
                ->leftJoin('school_classes as sc', 'sc.id', '=', 'se.school_class_id')
                ->whereIn('cs.subject_id', $pageSubjectIds)
                ->whereNull('se.deleted_at')
                ->whereNull('st.deleted_at')
                ->when($activeSessionId, function ($q) use ($activeSessionId): void {
                    $q->where('se.academic_session_id', $activeSessionId);
                })
                ->groupBy('cs.subject_id', 'st.id', 'u.name', 'st.admission_number', 'sc.name')
                ->orderBy('u.name')
                ->get([
                    'cs.subject_id',
                    'st.id as student_id',
                    'u.name as student_name',
                    'st.admission_number',
                    'sc.name as class_name',
                ])
                ->groupBy('subject_id')
            : collect();

        $subjects->getCollection()->each(function (Subject $subject) use ($studentsBySubject): void {
            $subject->students_list = $studentsBySubject->get($subject->id, collect())->values();
        });

        return Inertia::render('Academic/Subject/Index', [
            'subjects' => $subjects,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Return the subject IDs the current user is allowed to view.
     * Teachers are scoped to subjects they are assigned to.
     * Returns null for other roles (no scoping — they see everything).
     */
    private function scopedSubjectIds(User $user): ?\Illuminate\Support\Collection
    {
        if ($user->hasRole(RoleEnum::Teacher->value)) {
            $teacher = Teacher::where('user_id', $user->id)->first();

            return $teacher
                ? $teacher->assignments()->whereNull('teacher_subject_assignments.deleted_at')->pluck('subject_id')
                : collect();
        }

        return null;
    }

    public function create(): Response
    {
        return Inertia::render('Academic/Subject/Form', [
            'classes' => SchoolClass::where('is_active', true)->orderBy('level')->pluck('name', 'id'),
        ]);
    }

    public function store(StoreRequest $request): \Illuminate\Http\RedirectResponse
    {
        $subject = Subject::create($request->safe()->except('school_class_ids'));
        $subject->schoolClasses()->sync($request->input('school_class_ids', []));

        return redirect()->route('subjects.index')
            ->with('success', 'Subject created successfully.');
    }

    public function edit(Subject $subject): Response
    {
        $subject->load('schoolClasses');

        return Inertia::render('Academic/Subject/Form', [
            'subject' => $subject,
            'classes' => SchoolClass::where('is_active', true)->orderBy('level')->pluck('name', 'id'),
        ]);
    }

    public function update(UpdateRequest $request, Subject $subject): \Illuminate\Http\RedirectResponse
    {
        $subject->update($request->safe()->except('school_class_ids'));
        $subject->schoolClasses()->sync($request->input('school_class_ids', []));

        return redirect()->route('subjects.index')
            ->with('success', 'Subject updated successfully.');
    }

    public function destroy(Subject $subject): \Illuminate\Http\RedirectResponse
    {
        $subject->delete();

        return redirect()->route('subjects.index')
            ->with('success', 'Subject deleted successfully.');
    }

    public function uploadPaper(Request $request, Subject $subject): \Illuminate\Http\RedirectResponse
    {
        abort_unless($request->user()->can('subjects.upload-papers'), 403);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'file' => ['required', 'file', 'mimes:pdf,doc,docx,png,jpg,jpeg,webp', 'max:10240'],
        ]);

        $file = $validated['file'];

        $subject->papers()->create([
            'title' => $validated['title'],
            'file_path' => $file->store('subject-papers', 'public'),
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
        ]);

        return back()->with('success', 'Paper uploaded successfully.');
    }

    public function downloadPaper(Request $request, SubjectPaper $paper): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        abort_unless(
            $request->user()->can('subjects.download-papers') || $request->user()->can('subjects.upload-papers'),
            403,
        );

        abort_unless(Storage::disk('public')->exists($paper->file_path), 404, 'File not found.');

        return Storage::disk('public')->download($paper->file_path, $paper->original_name);
    }

    public function destroyPaper(Request $request, SubjectPaper $paper): \Illuminate\Http\RedirectResponse
    {
        abort_unless($request->user()->can('subjects.delete-papers'), 403);

        Storage::disk('public')->delete($paper->file_path);
        $paper->delete();

        return back()->with('success', 'Paper deleted successfully.');
    }
}
