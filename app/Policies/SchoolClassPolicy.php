<?php

namespace App\Policies;

use App\Models\SchoolClass;
use App\Models\User;

class SchoolClassPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('classes.view');
    }

    public function view(User $user, SchoolClass $class): bool
    {
        return $user->can('classes.view');
    }

    public function create(User $user): bool
    {
        return $user->can('classes.create');
    }

    public function update(User $user, SchoolClass $class): bool
    {
        return $user->can('classes.update');
    }

    public function delete(User $user, SchoolClass $class): bool
    {
        return $user->can('classes.delete');
    }

    /**
     * Upload PDF/Word papers against a class (gated by "classes.upload-papers",
     * which a super admin can grant to any role from /roles).
     */
    public function uploadPapers(User $user, SchoolClass $class): bool
    {
        return $user->can('classes.upload-papers');
    }

    /**
     * Download papers uploaded for a class ("classes.download-papers").
     */
    public function downloadPapers(User $user, SchoolClass $class): bool
    {
        return $user->can('classes.download-papers');
    }

    /**
     * Remove a paper from a class ("classes.delete-papers").
     */
    public function deletePapers(User $user, SchoolClass $class): bool
    {
        return $user->can('classes.delete-papers');
    }
}
