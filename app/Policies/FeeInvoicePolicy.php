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

        return $this->belongsToViewer($user, $feeInvoice);
    }

    /**
     * Printing a printable copy of an invoice is a separate capability from
     * viewing it, so it has its own permission — but it keeps the same
     * parent/student scoping, so a parent can only ever print their own
     * children's invoices.
     */
    public function print(User $user, FeeInvoice $feeInvoice): bool
    {
        if (! $user->can('fee-invoices.print')) {
            return false;
        }

        return $this->belongsToViewer($user, $feeInvoice);
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

    /**
     * Whether the invoice belongs to the viewer. Parents may only reach their
     * own children's invoices and students only their own; staff see all.
     */
    private function belongsToViewer(User $user, FeeInvoice $feeInvoice): bool
    {
        if ($user->hasRole(RoleEnum::Parent->value)) {
            $parent = StudentParent::where('user_id', $user->id)->first();

            return $parent?->students()->where('students.id', $feeInvoice->student_id)->exists() ?? false;
        }

        if ($user->hasRole(RoleEnum::Student->value)) {
            $student = Student::where('user_id', $user->id)->first();

            return $student?->id === $feeInvoice->student_id;
        }

        return true;
    }
}
