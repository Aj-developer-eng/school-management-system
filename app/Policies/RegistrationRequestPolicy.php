<?php

namespace App\Policies;

use App\Models\User;
use App\Models\RegistrationRequest;
use Illuminate\Auth\Access\HandlesAuthorization;

class RegistrationRequestPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->can('registration-requests.view');
    }

    public function view(User $user, RegistrationRequest $registrationRequest): bool
    {
        return $user->can('registration-requests.view');
    }

    public function update(User $user, RegistrationRequest $registrationRequest): bool
    {
        return $user->can('registration-requests.update');
    }

    public function approve(User $user, RegistrationRequest $registrationRequest): bool
    {
        return $user->can('registration-requests.approve');
    }

    public function reject(User $user, RegistrationRequest $registrationRequest): bool
    {
        return $user->can('registration-requests.reject');
    }
}