<?php

namespace App\Models;

use App\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AcademicSession extends Model
{
    use HasAuditFields;
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'name',
        'start_date',
        'end_date',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Multiple category sessions may be active at the same time (bulk
     * activation is available on /academic-sessions). Pages that need a
     * single "current" session rely on the ordering below so
     * active()->first() resolves to the session with the latest start date.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true)->orderByDesc('start_date');
    }
}
