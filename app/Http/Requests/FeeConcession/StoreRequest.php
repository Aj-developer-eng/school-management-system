<?php

namespace App\Http\Requests\FeeConcession;

use App\Enums\ConcessionTypeEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('fee-concessions.create');
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'exists:students,id'],
            'fee_structure_id' => ['nullable', 'exists:fee_structures,id'],
            'fee_invoice_id' => ['required', 'exists:fee_invoices,id'],
            'concession_type' => ['required', Rule::enum(ConcessionTypeEnum::class)],
            'percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'flat_amount' => ['nullable', 'numeric', 'min:0'],
            'reason' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
        ];
    }

    public function after(): array
    {
        return [
            function ($validator): void {
                $hasPercentage = $this->filled('percentage');
                $hasFlat = $this->filled('flat_amount');

                if (! $hasPercentage && ! $hasFlat) {
                    $validator->errors()->add('percentage', 'Either percentage or flat amount is required.');
                }

                if ($hasPercentage && $hasFlat) {
                    $validator->errors()->add('percentage', 'Specify either percentage or flat amount, not both.');
                }
            },
        ];
    }
}
