<?php

namespace App\Policies;

use App\Models\SchoolSetting;
use App\Models\User;

class SchoolSettingPolicy
{
    public function view(User $user, SchoolSetting $setting): bool
    {
        return $user->can('school-settings.view');
    }

    public function update(User $user, ?SchoolSetting $setting = null): bool
    {
        return $user->can('school-settings.update');
    }
}
