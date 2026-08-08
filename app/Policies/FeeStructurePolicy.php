<?php

namespace App\Policies;

use App\Models\FeeStructure;
use App\Models\User;

class FeeStructurePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('fee-structures.view');
    }

    public function view(User $user, FeeStructure $feeStructure): bool
    {
        return $user->can('fee-structures.view');
    }

    public function create(User $user): bool
    {
        return $user->can('fee-structures.create');
    }

    public function update(User $user, FeeStructure $feeStructure): bool
    {
        return $user->can('fee-structures.update');
    }

    public function delete(User $user, FeeStructure $feeStructure): bool
    {
        return $user->can('fee-structures.delete');
    }
}
