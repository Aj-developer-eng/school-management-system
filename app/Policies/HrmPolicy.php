<?php

namespace App\Policies;

use App\Models\Hrm;
use App\Models\User;

class HrmPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('hrm.view');
    }

    /**
     * Manage payroll: update salary amounts, mark paid/unpaid, bulk pay.
     */
    public function manage(User $user): bool
    {
        return $user->can('hrm.update');
    }
}
