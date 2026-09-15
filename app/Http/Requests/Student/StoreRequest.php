<?php

namespace App\Http\Requests\Student;

use App\Enums\GenderEnum;
use Illuminate\Foundation\Http\FormRequest;

class StoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', \App\Models\Student::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['nullable', 'email', 'max:120', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:20'],
            'admission_date' => ['required', 'date'],
            'date_of_birth' => ['required', 'date', 'before:today'],
            'gender' => ['required', 'in:'.implode(',', GenderEnum::values())],
            'blood_group' => ['nullable', 'string', 'max:5'],
            'religion' => ['nullable', 'string', 'max:50'],
            'nationality' => ['nullable', 'string', 'max:50'],
            'cnic_bform' => ['required', 'string', 'max:20'],
            'address' => ['required', 'string', 'max:500'],
            'previous_school' => ['nullable', 'string', 'max:200'],
            'medical_notes' => ['required', 'string', 'max:1000'],
            'academic_session_id' => ['required', 'exists:academic_sessions,id'],
            'school_class_id' => ['required', 'exists:school_classes,id'],
            'section_id' => ['nullable', 'exists:sections,id'],
            'roll_number' => ['required', 'string', 'max:20'],
            'enrolled_on' => ['nullable', 'date'],
        ];
    }
}
