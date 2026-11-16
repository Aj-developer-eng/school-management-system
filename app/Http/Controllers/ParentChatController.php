<?php

namespace App\Http\Controllers;

use App\Http\Requests\ParentChat\StoreMessageRequest;
use App\Models\Message;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentParent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ParentChatController extends Controller
{
    /**
     * Show the WhatsApp-like conversation between the logged-in teacher and the
     * primary parent of the given student (who must be enrolled in the class).
     *
     * Gated by the `teacher-parent.chat` permission.
     */
    public function index(Request $request, SchoolClass $schoolClass, Student $student): Response
    {
        abort_unless($request->user()->can('teacher-parent.chat'), 403);

        $this->verifyStudentInClass($schoolClass, $student);

        $parent = $this->primaryParent($student);
        abort_unless($parent?->user, 404);

        $teacherId = $request->user()->id;
        $parentId = $parent->user->id;

        // Mark parent -> teacher messages as read when the teacher opens the chat.
        Message::where('sender_id', $parentId)
            ->where('recipient_id', $teacherId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $messages = Message::between($teacherId, $parentId)
            ->with(['sender:id,name', 'recipient:id,name'])
            ->orderBy('created_at')
            ->get()
            ->map(fn ($message) => [
                'id' => $message->id,
                'body' => $message->body,
                'sender_id' => $message->sender_id,
                'sender_name' => $message->sender?->name,
                'created_at' => $message->created_at,
                'read_at' => $message->read_at,
            ])->values()->all();

        return Inertia::render('ParentChat/Index', [
            'schoolClass' => $schoolClass,
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'admission_number' => $student->admission_number,
            ],
            'parent' => [
                'id' => $parent->id,
                'name' => $parent->user?->name,
                'phone' => $parent->user?->phone,
                'email' => $parent->user?->email,
            ],
            'messages' => $messages,
        ]);
    }

    /**
     * Send a message from the logged-in teacher to the student's parent.
     */
    public function store(StoreMessageRequest $request, SchoolClass $schoolClass, Student $student): RedirectResponse
    {
        abort_unless($request->user()->can('teacher-parent.chat'), 403);

        $this->verifyStudentInClass($schoolClass, $student);

        $parent = $this->primaryParent($student);
        abort_unless($parent?->user, 404);

        Message::create([
            'sender_id' => $request->user()->id,
            'recipient_id' => $parent->user->id,
            'body' => $request->validated()['body'],
        ]);

        return redirect()->route('classes.students.chat', [$schoolClass->id, $student->id])
            ->with('success', 'Message sent.');
    }

    private function verifyStudentInClass(SchoolClass $schoolClass, Student $student): void
    {
        $enrolled = StudentEnrollment::where('school_class_id', $schoolClass->id)
            ->where('student_id', $student->id)
            ->whereNull('deleted_at')
            ->exists();

        abort_unless($enrolled, 404);
    }

    /**
     * Return the primary-contact parent of the student, falling back to any
     * linked parent.
     */
    private function primaryParent(Student $student): ?StudentParent
    {
        $parents = $student->parents()
            ->with('user:id,name,email,phone')
            ->get();

        return $parents->first(fn ($parent) => (bool) $parent->pivot->is_primary_contact)
            ?? $parents->first();
    }
}
