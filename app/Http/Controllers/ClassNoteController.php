<?php

namespace App\Http\Controllers;

use App\Enums\RoleEnum;
use App\Models\ClassNote;
use App\Models\StudentParent;
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
     * in; every other role holding the permission sees all notes. The route
     * itself is gated by the can:classes.view-notes middleware.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = ClassNote::query()
            ->with(['schoolClass:id,name', 'creator:id,name'])
            ->latest('id');

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
        }

        return Inertia::render('ClassNote/Index', [
            'notes' => $query->paginate(15)->withQueryString(),
        ]);
    }
}
