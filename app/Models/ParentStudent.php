<?php

namespace App\Models;

use App\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Relations\Pivot;

class ParentStudent extends Pivot
{
    use HasAuditFields;

    protected $table = 'parent_student';

    protected $fillable = [
        'guardian_type',
        'is_primary_contact',
    ];

    protected function casts(): array
    {
        return [
            'is_primary_contact' => 'boolean',
        ];
    }
}
