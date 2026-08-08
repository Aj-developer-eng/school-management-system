<?php

namespace App\Http\Requests\SchoolClass;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        $class = $this->route('school_class');

        return $this->user()?->can('update', $class) ?? false;
    }

    public function rules(): array
    {
        $class = $this->route('school_class');

        return [
            'name' => ['required', 'string', 'max:100'],
            'code' => ['required', 'string', 'max:20', 'unique:school_classes,code,'.$class->id],
            'level' => ['required', 'integer', 'min:0', 'max:30'],
            'description' => ['nullable', 'string', 'max:500'],
            'active_from_session_id' => ['nullable', 'exists:academic_sessions,id'],
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
