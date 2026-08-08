<?php

namespace App\Policies;

use App\Models\StudentParent;
use App\Models\User;

class StudentParentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('parents.view');
    }

    public function view(User $user, StudentParent $parent): bool
    {
        return $user->can('parents.view');
    }

    public function create(User $user): bool
    {
        return $user->can('parents.create');
    }

    public function update(User $user, StudentParent $parent): bool
    {
        return $user->can('parents.update');
    }

    public function delete(User $user, StudentParent $parent): bool
    {
        return $user->can('parents.delete');
    }
}
