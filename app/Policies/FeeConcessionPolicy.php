<?php

namespace App\Policies;

use App\Models\FeeConcession;
use App\Models\User;

class FeeConcessionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('fee-concessions.view');
    }

    public function view(User $user, FeeConcession $feeConcession): bool
    {
        return $user->can('fee-concessions.view');
    }

    public function create(User $user): bool
    {
        return $user->can('fee-concessions.create');
    }

    public function update(User $user, FeeConcession $feeConcession): bool
    {
        return $user->can('fee-concessions.update');
    }

    public function delete(User $user, FeeConcession $feeConcession): bool
    {
        return $user->can('fee-concessions.delete');
    }
}
