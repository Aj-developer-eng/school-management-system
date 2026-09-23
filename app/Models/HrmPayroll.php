<?php

namespace App\Models;

use App\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class HrmPayroll extends Model
{
    use HasAuditFields;
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'month',
        'amount',
        'status',
        'paid_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'month' => 'date',
            'amount' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
