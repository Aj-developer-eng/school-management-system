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

    /**
     * Bulk activation/deactivation on the index page reuses the update
     * permission — it flags no model instance, so the class name is passed.
     */
    public function bulkUpdate(User $user): bool
    {
        return $user->can('academic-sessions.update');
    }

    public function delete(User $user, AcademicSession $session): bool
    {
        return $user->can('academic-sessions.delete');
    }
}
