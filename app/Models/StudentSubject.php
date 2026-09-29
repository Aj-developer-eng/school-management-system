<?php

namespace App\Models;

use App\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Relations\Pivot;

class StudentSubject extends Pivot
{
    use HasAuditFields;

    protected $table = 'student_subject';
}
