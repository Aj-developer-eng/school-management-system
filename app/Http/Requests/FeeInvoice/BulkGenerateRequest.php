<?php

namespace App\Http\Requests\FeeInvoice;

use Illuminate\Foundation\Http\FormRequest;

class BulkGenerateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('fee-invoices.create');
    }

    public function rules(): array
    {
        return [
            'fee_structure_id' => ['required', 'exists:fee_structures,id'],
            'issue_date' => ['required', 'date'],
            'due_date' => ['required', 'date', 'after_or_equal:issue_date'],
        ];
    }
}
