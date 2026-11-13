<?php

namespace App\Policies;

use App\Enums\RoleEnum;
use App\Models\Teacher;
use App\Models\TeacherSubjectAssignment;
use App\Models\User;

class AttendancePolicy
{
    /**
     * View the attendance detail page for a class assignment
     * ("attendance.show", gated by "attendances.view").
     *
     * Super admins bypass this via Gate::before; staff may view any class's
     * attendance, while teachers are limited to their own assignments.
     */
    public function view(User $user, TeacherSubjectAssignment $assignment): bool
    {
        if (! $user->can('attendances.view')) {
            return false;
        }

        if ($user->hasRole(RoleEnum::SuperAdmin->value)) {
            return true;
        }

        $teacher = Teacher::where('user_id', $user->id)->first();

        return $teacher ? $assignment->teacher_id === $teacher->id : false;
    }
}
