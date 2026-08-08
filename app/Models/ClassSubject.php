<?php

namespace App\Models;

use App\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Relations\Pivot;

class ClassSubject extends Pivot
{
    use HasAuditFields;

    protected $table = 'class_subject';
}
