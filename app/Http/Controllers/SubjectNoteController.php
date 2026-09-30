<?php

namespace App\Http\Controllers;

use App\Enums\RoleEnum;
use App\Models\AcademicSession;
use App\Models\StudentParent;
use App\Models\Subject;
use App\Models\SubjectNote;
use App\Models\Teacher;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class SubjectNoteController extends Controller
{
    /**
     * Record a "what was taught today" note against a subject and notify the
     * parents of every student enrolled in a class that offers the subject.
     */
    public function store(Request $request, Subject $subject): RedirectResponse
    {
        abort_unless($request->user()->can('subjects.add-notes'), 403);
        $this->authorizeSubjectAccess($request->user(), $subject);

        $validated = $request->validate([
            'note' => ['required', 'string', 'max:5000'],
            'note_date' => ['required', 'date'],
            'is_active' => ['required', 'boolean'],
        ]);

        $teacher = Teacher::where('user_id', $request->user()->id)->first();

        $note = $subject->notes()->create([
            ...$validated,
            'teacher_id' => $teacher?->id,
            'academic_session_id' => AcademicSession::active()->value('id'),
        ]);

        ActivityLogService::custom(
            'Subjects',
            'created',
            "Added {$subject->name} class note for {$note->note_date?->toDateString()}",
        );

        $notified = $note->is_active ? $this->notifyParents($note) : 0;

        $message = $notified > 0
            ? "Note saved. {$notified} parent(s) notified."
            : 'Note saved.';

        return back()->with('success', $message);
    }

    /**
     * Flip a note between active (visible to parents) and inactive.
     */
    public function toggleActive(Request $request, SubjectNote $note): RedirectResponse
    {
        abort_unless($request->user()->can('subjects.add-notes'), 403);
        $this->authorizeSubjectAccess($request->user(), $note->subject);

        $note->update(['is_active' => ! $note->is_active]);

        // A ternary cannot be used inside a "{$...}" interpolation, so resolve
        // the label first.
        $status = $note->is_active ? 'active' : 'inactive';

        ActivityLogService::custom(
            'Subjects',
            'updated',
            "Marked {$note->subject?->name} class note as {$status}",
        );

        return back()->with('success', 'Note status updated.');
    }

    public function destroy(Request $request, SubjectNote $note): RedirectResponse
    {
        abort_unless($request->user()->can('subjects.delete-notes'), 403);
        $this->authorizeSubjectAccess($request->user(), $note->subject);

        $subjectName = $note->subject?->name;

        $note->delete();

        ActivityLogService::custom('Subjects', 'deleted', "Deleted {$subjectName} class note");

        return back()->with('success', 'Note deleted successfully.');
    }

    /**
     * Notify the parents of every student taking the subject, using the same
     * "students in a subject" definition as the subjects index student list.
     *
     * @return int the number of parents notified
     */
    private function notifyParents(SubjectNote $note): int
    {
        $note->loadMissing(['subject:id,name']);

        $studentIds = DB::table('class_subject as cs')
            ->join('student_enrollments as se', 'se.school_class_id', '=', 'cs.school_class_id')
            ->where('cs.subject_id', $note->subject_id)
            ->whereNull('se.deleted_at')
            ->when($note->academic_session_id, function ($q) use ($note): void {
                $q->where('se.academic_session_id', $note->academic_session_id);
            })
            ->distinct()
            ->pluck('se.student_id');

        if ($studentIds->isEmpty()) {
            return 0;
        }

        $parents = StudentParent::query()
            ->whereHas('students', fn ($q) => $q->whereIn('students.id', $studentIds))
            ->with('user:id,name')
            ->get()
            ->pluck('user')
            ->filter()
            ->unique('id')
            ->values();

        if ($parents->isEmpty()) {
            return 0;
        }

        NotificationService::sendToMany($parents, [
            'type' => 'subject_note',
            'title' => "What we taught today — {$note->subject?->name}",
            'message' => $note->note_date?->format('d M Y').': '.$note->note,
            'link' => '/dashboard',
        ]);

        return $parents->count();
    }

    /**
     * Teachers may only manage notes for subjects they are assigned to teach;
     * other permitted staff roles (Super Admin, Principal, Vice Principal)
     * can manage every subject.
     */
    private function authorizeSubjectAccess(User $user, ?Subject $subject): void
    {
        if ($subject === null || ! $user->hasRole(RoleEnum::Teacher->value)) {
            return;
        }

        $teacher = Teacher::where('user_id', $user->id)->first();

        $assigned = $teacher
            ? $teacher->assignments()->whereNull('teacher_subject_assignments.deleted_at')->pluck('subject_id')
            : new Collection;

        abort_unless($assigned->contains($subject->id), 403);
    }
}
