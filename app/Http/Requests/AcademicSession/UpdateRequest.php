<?php

namespace App\Http\Requests\AcademicSession;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        $session = $this->route('academic_session');

        return $this->user()?->can('update', $session) ?? false;
    }

    public function rules(): array
    {
        $session = $this->route('academic_session');

        return [
            'name' => ['required', 'string', 'max:100', 'unique:academic_sessions,name,'.$session->id],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
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
