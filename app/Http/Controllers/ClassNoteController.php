<?php

namespace App\Http\Controllers;

use App\Enums\RoleEnum;
use App\Models\ClassNote;
use App\Models\SchoolClass;
use App\Models\StudentParent;
use App\Models\Teacher;
use App\Models\TeacherSubjectAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ClassNoteController extends Controller
{
    /**
     * List class notes for the current user ("classes.view-notes").
     *
     * Parents only see the notes of the classes their children are enrolled
     * in; teachers only see the notes of the classes they are assigned to
     * teach; every other role holding the permission sees all notes. The
     * route itself is gated by the can:classes.view-notes middleware.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = ClassNote::query()
            ->with(['schoolClass:id,name', 'creator:id,name'])
            ->latest('id');

        $emptyClasses = collect();

        // For non-parent, non-teacher users (including super admins), find classes
        // with no notes. Teachers are scoped to their assigned classes below, and
        // parents are scoped to their children's classes.
        if (!$user?->hasRole(RoleEnum::Parent->value) && !$user?->hasRole(RoleEnum::Teacher->value)) {
            $allClassIds = SchoolClass::orderBy('level')->pluck('id');
            $classesWithNotes = ClassNote::whereIn('school_class_id', $allClassIds)
                ->distinct()
                ->pluck('school_class_id');

            $emptyClasses = $allClassIds->diff($classesWithNotes)
                ->mapWithKeys(function (string $classId) {
                    $class = SchoolClass::find($classId);

                    if (!$class) {
                        return [];
                    }

                    return [$classId => [
                        'id' => $classId,
                        'name' => $class->name,
                    ]];
                });
        }

        if ($user?->hasRole(RoleEnum::Parent->value)) {
            $parent = StudentParent::where('user_id', $user->id)->first();

            // No linked parent record (or no enrollments) means no scope:
            // an empty result is safer than falling back to every class.
            $classIds = $parent
                ? DB::table('student_enrollments as se')
                    ->join('parent_student as ps', 'ps.student_id', '=', 'se.student_id')
                    ->where('ps.parent_id', $parent->id)
                    ->whereNull('se.deleted_at')
                    ->pluck('se.school_class_id')
                    ->unique()
                    ->values()
                : collect();

            $query->whereIn('school_class_id', $classIds);

            // Also compute empty classes for parents, but only within their enrolled classes
            if ($parent) {
                $enrolledClassIds = DB::table('student_enrollments as se')
                    ->join('parent_student as ps', 'ps.student_id', '=', 'se.student_id')
                    ->where('ps.parent_id', $parent->id)
                    ->whereNull('se.deleted_at')
                    ->pluck('se.school_class_id')
                    ->unique()
                    ->values();

                $classesWithNotes = ClassNote::whereIn('school_class_id', $enrolledClassIds)
                    ->distinct()
                    ->pluck('school_class_id');

                $emptyClasses = $enrolledClassIds->diff($classesWithNotes)
                    ->mapWithKeys(function (string $classId) {
                        $class = SchoolClass::find($classId);

                        if (!$class) {
                            return [];
                        }

                        return [$classId => [
                            'id' => $classId,
                            'name' => $class->name,
                        ]];
                    });
            }
        }

        // Teachers only see notes attached to the classes they are assigned to teach.
        // A teacher without a linked Teacher record (or without any assignments) is
        // scoped to nothing rather than falling back to every class.
        if ($user?->hasRole(RoleEnum::Teacher->value)) {
            $teacherId = Teacher::where('user_id', $user->id)->value('id');

            $classIds = $teacherId
                ? TeacherSubjectAssignment::where('teacher_id', $teacherId)
                    ->whereNotNull('school_class_id')
                    ->distinct()
                    ->pluck('school_class_id')
                : collect();

            $query->whereIn('school_class_id', $classIds);

            // Compute empty classes only within the classes the teacher is assigned to.
            if ($teacherId) {
                $classesWithNotes = ClassNote::whereIn('school_class_id', $classIds)
                    ->distinct()
                    ->pluck('school_class_id');

                $emptyClasses = $classIds->diff($classesWithNotes)
                    ->mapWithKeys(function (string $classId) {
                        $class = SchoolClass::find($classId);

                        if (!$class) {
                            return [];
                        }

                        return [$classId => [
                            'id' => $classId,
                            'name' => $class->name,
                        ]];
                    });
            }
        }

        return Inertia::render('ClassNote/Index', [
            'notes' => $query->paginate(15)->withQueryString(),
            'emptyClasses' => $emptyClasses,
        ]);
    }
}
