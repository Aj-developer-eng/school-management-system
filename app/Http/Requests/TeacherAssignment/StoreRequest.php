<?php

namespace App\Http\Requests\TeacherAssignment;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', \App\Models\TeacherSubjectAssignment::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'teacher_id' => ['required', 'exists:teachers,id'],
            'academic_session_id' => ['required', 'exists:academic_sessions,id'],
            'school_class_id' => ['required', 'exists:school_classes,id'],
            'section_id' => [
                'nullable',
                'exists:sections,id',
                Rule::exists('sections', 'id')->where(function ($query) {
                    $query->where('academic_session_id', $this->input('academic_session_id'))
                        ->where('school_class_id', $this->input('school_class_id'));
                }),
            ],
            'subject_id' => [
                'required',
                'exists:subjects,id',
                Rule::exists('class_subject', 'subject_id')->where(function ($query) {
                    $query->where('school_class_id', $this->input('school_class_id'));
                }),
            ],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i', 'after_or_equal:start_time'],
        ];
    }
}
