<?php

namespace App\Models;

use App\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class StudentParent extends Model
{
    use HasAuditFields;
    use HasFactory;
    use SoftDeletes;

    protected $table = 'parents';

    protected $fillable = [
        'user_id',
        'occupation',
        'cnic',
        'emergency_contact',
        'address',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'parent_student', 'parent_id', 'student_id')
            ->using(ParentStudent::class)
            ->withPivot('guardian_type', 'is_primary_contact')
            ->withTimestamps();
    }
}
