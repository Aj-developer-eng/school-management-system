<?php

namespace App\Policies;

use App\Models\AcademicSession;
use App\Models\User;

class AcademicSessionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('academic-sessions.view');
    }

    public function view(User $user, AcademicSession $session): bool
    {
        return $user->can('academic-sessions.view');
    }

    public function create(User $user): bool
    {
        return $user->can('academic-sessions.create');
    }

    public function update(User $user, AcademicSession $session): bool
    {
        return $user->can('academic-sessions.update');
    }

    public function delete(User $user, AcademicSession $session): bool
    {
        return $user->can('academic-sessions.delete');
    }
}
