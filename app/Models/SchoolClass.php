<?php

namespace App\Models;

use App\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SchoolClass extends Model
{
    use HasAuditFields;
    use HasFactory;
    use SoftDeletes;

    protected $table = 'school_classes';

    protected $fillable = [
        'name',
        'code',
        'level',
        'description',
        'active_from_session_id',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'level' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function activeFromSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class, 'active_from_session_id');
    }

    public function teacherSubjectAssignments(): HasMany
    {
        return $this->hasMany(TeacherSubjectAssignment::class, 'school_class_id');
    }

    public function papers(): HasMany
    {
        return $this->hasMany(ClassPaper::class);
    }

    /**
     * Notes attached to this class (viewable via "classes.view-notes").
     */
    public function notes(): HasMany
    {
        return $this->hasMany(ClassNote::class);
    }
}
