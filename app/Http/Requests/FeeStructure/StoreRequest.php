<?php

namespace App\Http\Requests\FeeStructure;

use App\Enums\FeeFrequencyEnum;
use App\Enums\FeeTypeEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('fee-structures.create');
    }

    public function rules(): array
    {
        return [
            'academic_session_id' => ['required', 'exists:academic_sessions,id'],
            'school_class_id' => ['required', 'exists:school_classes,id'],
            'name' => ['required', 'string', 'max:120'],
            'fee_type' => ['required', Rule::enum(FeeTypeEnum::class)],
            'amount' => ['required', 'numeric', 'min:0'],
            'frequency' => ['required', Rule::enum(FeeFrequencyEnum::class)],
            'due_day' => ['nullable', 'integer', 'min:1', 'max:31'],
            'is_active' => ['boolean'],
        ];
    }
}
