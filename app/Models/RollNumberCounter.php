<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RollNumberCounter extends Model
{
    protected $fillable = ['academic_session_id', 'school_class_id', 'last_number'];

    protected function casts(): array
    {
        return [
            'academic_session_id' => 'integer',
            'school_class_id' => 'integer',
            'last_number' => 'integer',
        ];
    }

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class);
    }
}
