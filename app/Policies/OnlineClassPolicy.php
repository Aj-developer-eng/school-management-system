<?php

namespace App\Policies;

use App\Enums\RoleEnum;
use App\Models\OnlineClass;
use App\Models\Teacher;
use App\Models\User;

class OnlineClassPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('online-classes.view');
    }

    public function view(User $user, OnlineClass $onlineClass): bool
    {
        return $user->can('online-classes.view');
    }

    public function create(User $user): bool
    {
        return $user->can('online-classes.create');
    }

    public function update(User $user, OnlineClass $onlineClass): bool
    {
        return $user->can('online-classes.update');
    }

    public function delete(User $user, OnlineClass $onlineClass): bool
    {
        return $user->can('online-classes.delete');
    }

    /**
     * The assigned teacher can mark attendance for their own online classes,
     * in addition to anyone with the update permission (e.g. Super Admin).
     */
    public function markAttendance(User $user, OnlineClass $onlineClass): bool
    {
        if ($user->can('online-classes.update')) {
            return true;
        }

        if ($user->hasRole(RoleEnum::Teacher->value)) {
            $teacher = Teacher::where('user_id', $user->id)->first();

            return $teacher !== null && $teacher->id === $onlineClass->teacher_id;
        }

        return false;
    }
}

