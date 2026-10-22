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
            'description' => ['nullable', 'string', 'max:500'],
            'active_from_session_id' => ['nullable', 'exists:academic_sessions,id'],
            'is_active' => ['sometimes', 'boolean'],

            // Optional class assignment section on /classes/{id}/edit (the
            // same section the create form offers). A teacher is only
            // required when other assignment details are provided; with no
            // teacher at all the section is skipped.
            'assignment' => ['sometimes', 'array'],
            // The id of the assignment row the form is editing. It is scoped
            // to the class being edited in the controller, so a crafted
            // payload can never update another class's assignment.
            'assignment.id' => ['nullable', 'integer', 'exists:teacher_subject_assignments,id'],
            'assignment.teacher_id' => [
                'required_with:assignment.start_time,assignment.end_time,assignment.days_of_week',
                'nullable',
                'integer',
                'exists:teachers,id',
            ],
            // The academic session of an assignment is not accepted from the
            // browser: an existing assignment keeps the session it already
            // belongs to and a new one uses the active session, both resolved
            // on the server.
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
