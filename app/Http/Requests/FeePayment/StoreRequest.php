<?php

namespace App\Http\Requests\FeePayment;

use App\Enums\PaymentMethodEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('fee-payments.create');
    }

    public function rules(): array
    {
        return [
            'fee_invoice_id' => ['required', 'exists:fee_invoices,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_date' => ['required', 'date'],
            'payment_method' => ['required', Rule::enum(PaymentMethodEnum::class)],
            'transaction_reference' => ['nullable', 'string', 'max:120'],
            'remarks' => ['nullable', 'string', 'max:500'],
            'evidence' => ['nullable', 'image', 'mimes:jpeg,png,webp,jpg', 'max:4096'],
        ];
    }
}
