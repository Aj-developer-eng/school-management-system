<?php

namespace App\Models;

use App\Enums\TestStatusEnum;
use App\Enums\TestTypeEnum;
use App\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Test extends Model
{
    use HasAuditFields;
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'teacher_subject_assignment_id',
        'teacher_id',
        'academic_session_id',
        'school_class_id',
        'section_id',
        'subject_id',
        'title',
        'test_type',
        'test_date',
        'total_marks',
        'passing_marks',
        'description',
        'status',
        'results_published_at',
    ];

    protected function casts(): array
    {
        return [
            'test_date' => 'date',
            'total_marks' => 'decimal:2',
            'passing_marks' => 'decimal:2',
            'test_type' => TestTypeEnum::class,
            'status' => TestStatusEnum::class,
            'results_published_at' => 'datetime',
        ];
    }

    public function teacherSubjectAssignment(): BelongsTo
    {
        return $this->belongsTo(TeacherSubjectAssignment::class);
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

    public function results(): HasMany
    {
        return $this->hasMany(TestResult::class);
    }
}
