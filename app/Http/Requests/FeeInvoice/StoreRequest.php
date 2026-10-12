<?php

namespace App\Http\Requests\FeeInvoice;

use App\Enums\ConcessionTypeEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'fee_structure_id' => ['required', 'exists:fee_structures,id'],
            'issue_date' => ['required', 'date'],
            'due_date' => ['required', 'date', 'after_or_equal:issue_date'],
            // Optional concession recorded in the same step as the invoice.
            // The student, fee structure, and invoice linkage are derived
            // server-side from the invoice being created.
            'concession' => ['nullable', 'array'],
            'concession.concession_type' => ['required_with:concession', Rule::enum(ConcessionTypeEnum::class)],
            'concession.percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'concession.flat_amount' => ['nullable', 'numeric', 'min:0'],
            'concession.reason' => ['nullable', 'string', 'max:500'],
            'concession.is_active' => ['nullable', 'boolean'],
        ];
    }

    public function after(): array
    {
        return [
            function ($validator): void {
                if (! $this->filled('concession')) {
                    return;
                }

                // Recording a concession on the invoice form creates a real
                // fee_concessions row, so the concession permission is required.
                if (! $this->user()->can('fee-concessions.create')) {
                    $validator->errors()->add('concession', 'You do not have permission to create fee concessions.');

                    return;
                }

                $hasPercentage = $this->filled('concession.percentage');
                $hasFlat = $this->filled('concession.flat_amount');

                if (! $hasPercentage && ! $hasFlat) {
                    $validator->errors()->add('concession.percentage', 'Either percentage or flat amount is required.');
                }

                if ($hasPercentage && $hasFlat) {
                    $validator->errors()->add('concession.percentage', 'Specify either percentage or flat amount, not both.');
                }
            },
        ];
    }
}
