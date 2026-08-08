<?php

namespace App\Models;

use App\Enums\InvoiceStatusEnum;
use App\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FeeInvoice extends Model
{
    use HasAuditFields;
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'student_id',
        'academic_session_id',
        'school_class_id',
        'fee_structure_id',
        'invoice_number',
        'issue_date',
        'due_date',
        'total_amount',
        'concession_amount',
        'paid_amount',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'issue_date' => 'date',
            'due_date' => 'date',
            'total_amount' => 'decimal:2',
            'concession_amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'balance' => 'decimal:2',
            'status' => InvoiceStatusEnum::class,
        ];
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

    public function feeStructure(): BelongsTo
    {
        return $this->belongsTo(FeeStructure::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(FeePayment::class);
    }

    public function recalculate(): void
    {
        $this->paid_amount = $this->payments()->sum('amount');

        if ($this->total_amount - $this->concession_amount - $this->paid_amount <= 0) {
            $this->status = InvoiceStatusEnum::Paid;
        } elseif ($this->paid_amount > 0) {
            $this->status = InvoiceStatusEnum::Partial;
        } else {
            $this->status = InvoiceStatusEnum::Unpaid;
        }

        $this->save();
    }
}
