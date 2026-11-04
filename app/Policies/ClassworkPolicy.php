<?php

namespace App\Policies;

use App\Models\Classwork;
use App\Models\SchoolClass;
use App\Models\User;

class ClassworkPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('classworks.view');
    }

    public function view(User $user, Classwork $classwork): bool
    {
        return $user->can('classworks.view');
    }

    public function create(User $user): bool
    {
        return $user->can('classworks.create');
    }

    public function update(User $user, Classwork $classwork): bool
    {
        return $user->can('classworks.update');
    }

    public function delete(User $user, Classwork $classwork): bool
    {
        return $user->can('classworks.delete');
    }

    public function takeOnlineClass(User $user): bool
    {
        return $user->can('online-classes.take');
    }
}
