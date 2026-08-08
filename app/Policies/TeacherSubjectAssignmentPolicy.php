<?php

namespace App\Policies;

use App\Models\TeacherSubjectAssignment;
use App\Models\User;

class TeacherSubjectAssignmentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('teacher-assignments.view');
    }

    public function view(User $user, TeacherSubjectAssignment $assignment): bool
    {
        return $user->can('teacher-assignments.view');
    }

    public function create(User $user): bool
    {
        return $user->can('teacher-assignments.create');
    }

    public function update(User $user, TeacherSubjectAssignment $assignment): bool
    {
        return $user->can('teacher-assignments.update');
    }

    public function delete(User $user, TeacherSubjectAssignment $assignment): bool
    {
        return $user->can('teacher-assignments.delete');
    }
}
