<?php

namespace App\Http\Requests\TeacherAssignment;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        $assignment = $this->route('teacher_assignment');

        return $this->user()?->can('update', $assignment) ?? false;
    }

    public function rules(): array
    {
        return [
            'teacher_id' => ['required', 'exists:teachers,id'],
            'academic_session_id' => ['required', 'exists:academic_sessions,id'],
            'school_class_id' => ['required', 'exists:school_classes,id'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i', 'after_or_equal:start_time'],
            'days_of_week' => ['nullable', 'array'],
            'days_of_week.*' => ['integer', 'between:1,7'],
        ];
    }
}
