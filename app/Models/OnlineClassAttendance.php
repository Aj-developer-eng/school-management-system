<?php

namespace App\Models;

use App\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OnlineClassAttendance extends Model
{
    use HasAuditFields;

    protected $table = 'online_class_attendances';

    protected $fillable = [
        'online_class_id',
        'student_id',
        'academic_session_id',
        'school_class_id',
        'section_id',
        'recorded_by',
        'status',
        'remarks',
    ];

    protected function casts(): array
    {
        return [];
    }

    public function onlineClass(): BelongsTo
    {
        return $this->belongsTo(OnlineClass::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
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

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
