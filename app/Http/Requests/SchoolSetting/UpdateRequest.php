<?php

namespace App\Http\Requests\SchoolSetting;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('school-settings.update') ?? false;
    }

    public function rules(): array
    {
        return [
            'school_name' => ['required', 'string', 'max:200'],
            'school_prefix' => ['required', 'string', 'max:10', 'alpha_num'],
            'registration_number' => ['nullable', 'string', 'max:100'],
            'affiliation' => ['nullable', 'string', 'max:200'],
            'email' => ['nullable', 'email', 'max:120'],
            'phone' => ['nullable', 'string', 'max:30'],
            'secondary_phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'country' => ['nullable', 'string', 'max:100'],
            'footer_text' => ['nullable', 'string', 'max:1000'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,svg,webp', 'max:2048'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('school_prefix')) {
            $this->merge([
                'school_prefix' => strtoupper($this->input('school_prefix')),
            ]);
        }
    }
}
