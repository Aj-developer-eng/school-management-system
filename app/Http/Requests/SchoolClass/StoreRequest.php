<?php

namespace App\Http\Requests\SchoolClass;

use App\Models\SchoolClass;
use App\Models\TeacherSubjectAssignment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        if (! ($this->user()?->can('create', SchoolClass::class) ?? false)) {
            return false;
        }

        // Creating a class can also create a subject assignment for it, which
        // needs the teacher-assignments permission as well.
        if ($this->boolean('create_assignment')) {
            return $this->user()?->can('create', TeacherSubjectAssignment::class) ?? false;
        }

        return true;
    }

    public function rules(): array
    {
        $withAssignment = $this->boolean('create_assignment');

        return [
            'name' => ['required', 'string', 'max:100'],
            'code' => ['nullable', 'string', 'max:20', 'unique:school_classes,code'],
            'description' => ['nullable', 'string', 'max:500'],
            'active_from_session_id' => ['nullable', 'exists:academic_sessions,id'],
            'is_active' => ['sometimes', 'boolean'],

            // Optional subject assignment created together with the class.
            'create_assignment' => ['sometimes', 'boolean'],
            'teacher_id' => [Rule::requiredIf($withAssignment), 'nullable', 'exists:teachers,id'],
            'academic_session_id' => [Rule::requiredIf($withAssignment), 'nullable', 'exists:academic_sessions,id'],
            'subject_id' => [Rule::requiredIf($withAssignment), 'nullable', 'exists:subjects,id'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i', 'after_or_equal:start_time'],
            'days_of_week' => ['nullable', 'array'],
            'days_of_week.*' => ['integer', 'between:1,7'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $createAssignment = $this->boolean('create_assignment');

        $this->merge([
            'code' => filled($this->input('code')) ? $this->input('code') : null,
            'is_active' => $this->boolean('is_active'),
            'create_assignment' => $createAssignment,
            // When the toggle is off, clear the assignment payload so none of
            // its rules apply to this request.
            'teacher_id' => $createAssignment ? $this->input('teacher_id') : null,
            'academic_session_id' => $createAssignment ? $this->input('academic_session_id') : null,
            'subject_id' => $createAssignment ? $this->input('subject_id') : null,
            'start_time' => $createAssignment ? $this->input('start_time') : null,
            'end_time' => $createAssignment ? $this->input('end_time') : null,
            'days_of_week' => $createAssignment ? $this->input('days_of_week') : null,
        ]);
    }
}
