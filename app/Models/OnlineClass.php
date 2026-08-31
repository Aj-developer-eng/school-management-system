<?php

namespace App\Models;

use App\Enums\OnlineClassStatusEnum;
use App\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class OnlineClass extends Model
{
    use HasAuditFields;
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'teacher_id',
        'academic_session_id',
        'school_class_id',
        'section_id',
        'subject_id',
        'title',
        'meeting_link',
        'description',
        'scheduled_at',
        'status',
        'disabled_at',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'disabled_at' => 'datetime',
            'status' => OnlineClassStatusEnum::class,
        ];
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', OnlineClassStatusEnum::Active->value);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(OnlineClassAttendance::class);
    }
}
