<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Message extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'sender_id',
        'recipient_id',
        'body',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    /**
     * Scope messages to the conversation between two users.
     */
    public function scopeBetween($query, int $userOne, int $userTwo): self
    {
        return $query->where(function ($q) use ($userOne, $userTwo): void {
            $q->where('sender_id', $userOne)
                ->where('recipient_id', $userTwo);
        })->orWhere(function ($q) use ($userOne, $userTwo): void {
            $q->where('sender_id', $userTwo)
                ->where('recipient_id', $userOne);
        });
    }
}
