<?php

namespace App\Http\Requests\FeeInvoice;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('fee-invoices.update');
    }

    public function rules(): array
    {
        return [
            'total_amount' => ['required', 'numeric', 'min:0'],
            'concession_amount' => ['required', 'numeric', 'min:0'],
            'paid_amount' => ['required', 'numeric', 'min:0'],
            'issue_date' => ['required', 'date'],
            'due_date' => ['required', 'date', 'after_or_equal:issue_date'],
        ];
    }
}
