<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('users.view');
    }

    public function view(User $auth, User $target): bool
    {
        return $auth->can('users.view');
    }

    public function create(User $user): bool
    {
        return $user->can('users.create');
    }

    public function update(User $auth, User $target): bool
    {
        return $auth->can('users.update');
    }

    public function delete(User $auth, User $target): bool
    {
        return $auth->can('users.delete');
    }
}
