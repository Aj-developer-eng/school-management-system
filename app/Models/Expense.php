<?php

namespace App\Models;

use App\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Expense extends Model
{
    use HasAuditFields;
    use HasFactory;
    use SoftDeletes;

    public const CATEGORIES = [
        'general' => 'General',
        'utilities' => 'Utilities',
        'salaries' => 'Salaries',
        'maintenance' => 'Maintenance',
        'supplies' => 'Supplies',
        'transport' => 'Transport',
        'events' => 'Events',
        'marketing' => 'Marketing',
        'other' => 'Other',
    ];

    protected $fillable = [
        'title',
        'category',
        'amount',
        'expense_date',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'expense_date' => 'date',
        ];
    }
}
