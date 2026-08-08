<?php

namespace App\Policies;

use App\Models\FeeInvoice;
use App\Models\User;

class FeeInvoicePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('fee-invoices.view');
    }

    public function view(User $user, FeeInvoice $feeInvoice): bool
    {
        return $user->can('fee-invoices.view');
    }

    public function create(User $user): bool
    {
        return $user->can('fee-invoices.create');
    }

    public function update(User $user, FeeInvoice $feeInvoice): bool
    {
        return $user->can('fee-invoices.update');
    }

    public function delete(User $user, FeeInvoice $feeInvoice): bool
    {
        return $user->can('fee-invoices.delete');
    }
}
