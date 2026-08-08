<?php

namespace App\Policies;

use App\Models\FeePayment;
use App\Models\User;

class FeePaymentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('fee-payments.view');
    }

    public function view(User $user, FeePayment $feePayment): bool
    {
        return $user->can('fee-payments.view');
    }

    public function create(User $user): bool
    {
        return $user->can('fee-payments.create');
    }

    public function delete(User $user, FeePayment $feePayment): bool
    {
        return $user->can('fee-payments.delete');
    }
}
