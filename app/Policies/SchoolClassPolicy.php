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
}
