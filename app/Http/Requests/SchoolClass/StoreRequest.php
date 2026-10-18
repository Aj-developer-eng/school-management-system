<?php

namespace App\Http\Requests\SchoolClass;

use App\Models\SchoolClass;
use Illuminate\Foundation\Http\FormRequest;

class StoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', SchoolClass::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'code' => ['required', 'string', 'max:20', 'unique:school_classes,code'],
            'description' => ['nullable', 'string', 'max:500'],
            'active_from_session_id' => ['nullable', 'exists:academic_sessions,id'],
            'is_active' => ['sometimes', 'boolean'],

            // Optional class assignment section on /classes/create (mirrors
            // TeacherAssignment\StoreRequest minus the class, which is the class
            // being created). A teacher is only required when other assignment
            // details are provided; with no teacher at all the section is skipped.
            'assignment' => ['sometimes', 'array'],
            'assignment.teacher_id' => [
                'required_with:assignment.start_time,assignment.end_time,assignment.days_of_week',
                'nullable',
                'integer',
                'exists:teachers,id',
            ],
            'assignment.academic_session_id' => ['nullable', 'integer', 'exists:academic_sessions,id'],
            'assignment.start_time' => ['nullable', 'date_format:H:i'],
            'assignment.end_time' => ['nullable', 'date_format:H:i', 'after_or_equal:assignment.start_time'],
            'assignment.days_of_week' => ['nullable', 'array'],
            'assignment.days_of_week.*' => ['integer', 'between:1,7'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_active' => $this->boolean('is_active'),
        ]);
    }
}
