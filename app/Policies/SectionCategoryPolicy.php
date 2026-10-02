<?php

namespace App\Policies;

use App\Models\SectionCategory;
use App\Models\User;

class SectionCategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('section-categories.view');
    }

    public function view(User $user, SectionCategory $sectionCategory): bool
    {
        return $user->can('section-categories.view');
    }

    public function create(User $user): bool
    {
        return $user->can('section-categories.create');
    }

    public function update(User $user, SectionCategory $sectionCategory): bool
    {
        return $user->can('section-categories.update');
    }

    public function delete(User $user, SectionCategory $sectionCategory): bool
    {
        return $user->can('section-categories.delete');
    }
}