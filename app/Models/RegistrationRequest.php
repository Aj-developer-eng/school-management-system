<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class RegistrationRequest extends Model
{
    protected $fillable = ['name', 'email', 'phone', 'program', 'status', 'assigned_user_id'];

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }
}
