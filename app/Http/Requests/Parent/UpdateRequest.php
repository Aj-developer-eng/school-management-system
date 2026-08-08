<?php

namespace App\Http\Requests\Parent;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        $parent = $this->route('parent');

        return $this->user()?->can('update', $parent) ?? false;
    }

    public function rules(): array
    {
        $parent = $this->route('parent');

        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:120', Rule::unique('users', 'email')->ignore($parent->user_id)],
            'phone' => ['nullable', 'string', 'max:20'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'occupation' => ['nullable', 'string', 'max:100'],
            'cnic' => ['nullable', 'string', 'max:20'],
            'emergency_contact' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:500'],
            'is_active' => ['sometimes', 'boolean'],
            'students' => ['sometimes', 'array'],
            'students.*.student_id' => ['integer', 'exists:students,id'],
            'students.*.guardian_type' => ['required_with:students.*.student_id', 'in:Father,Mother,Guardian'],
            'students.*.is_primary_contact' => ['boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_active' => $this->boolean('is_active'),
        ]);
    }
}
