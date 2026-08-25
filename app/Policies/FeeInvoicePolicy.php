<?php

namespace App\Policies;

use App\Enums\RoleEnum;
use App\Models\FeeInvoice;
use App\Models\Student;
use App\Models\StudentParent;
use App\Models\User;

class FeeInvoicePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('fee-invoices.view');
    }

    public function view(User $user, FeeInvoice $feeInvoice): bool
    {
        if (! $user->can('fee-invoices.view')) {
            return false;
        }

        // Parents may only view invoices for their own children.
        if ($user->hasRole(RoleEnum::Parent->value)) {
            $parent = StudentParent::where('user_id', $user->id)->first();

            return $parent?->students()->where('students.id', $feeInvoice->student_id)->exists() ?? false;
        }

        // Students may only view their own invoices.
        if ($user->hasRole(RoleEnum::Student->value)) {
            $student = Student::where('user_id', $user->id)->first();

            return $student?->id === $feeInvoice->student_id;
        }

        return true;
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
