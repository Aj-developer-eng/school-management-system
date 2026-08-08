<?php

namespace App\Http\Requests\Subject;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        $subject = $this->route('subject');

        return $this->user()?->can('update', $subject) ?? false;
    }

    public function rules(): array
    {
        $subject = $this->route('subject');

        return [
            'name' => ['required', 'string', 'max:100'],
            'code' => ['required', 'string', 'max:20', 'unique:subjects,code,'.$subject->id],
            'description' => ['nullable', 'string', 'max:500'],
            'school_class_ids' => ['sometimes', 'array'],
            'school_class_ids.*' => ['integer', 'exists:school_classes,id'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_active' => $this->boolean('is_active'),
        ]);
    }
}
