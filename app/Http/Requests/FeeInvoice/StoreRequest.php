<?php

namespace App\Http\Requests\FeeInvoice;

use Illuminate\Foundation\Http\FormRequest;

class StoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('fee-invoices.create');
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'exists:students,id'],
            'fee_structure_ids' => ['nullable', 'array'],
            'fee_structure_ids.*' => ['integer', 'distinct', 'exists:fee_structures,id'],
            'custom_amount' => ['nullable', 'numeric', 'min:0.01', 'max:99999999.99'],
            'custom_label' => ['nullable', 'string', 'max:191'],
            'issue_date' => ['required', 'date'],
            'due_date' => ['required', 'date', 'after_or_equal:issue_date'],
        ];
    }

    /**
     * The invoice total must come from somewhere: either at least one fee
     * structure, or a custom amount (or both).
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $hasStructures = ! empty($this->input('fee_structure_ids'));
            $hasCustomAmount = $this->filled('custom_amount');

            if (! $hasStructures && ! $hasCustomAmount) {
                $validator->errors()->add(
                    'fee_structure_ids',
                    'Select at least one fee structure or enter a custom amount.'
                );
            }
        });
    }
}
