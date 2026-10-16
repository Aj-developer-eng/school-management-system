<?php

namespace App\Http\Requests\Student;

use App\Enums\GenderEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRequest extends FormRequest
{
    /**
     * Normalize the submitted roll number before validation so manual edits
     * keep the same four-digit, zero-padded format as generated values
     * ("1" becomes "0001").
     */
    protected function prepareForValidation(): void
    {
        $rollNumber = $this->input('roll_number');

        if (is_string($rollNumber) && ctype_digit($rollNumber)) {
            $this->merge(['roll_number' => sprintf('%04d', (int) $rollNumber)]);
        }
    }

    public function authorize(): bool
    {
        $student = $this->route('student');

        return $this->user()?->can('update', $student) ?? false;
    }

    public function rules(): array
    {
        $student = $this->route('student');

        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['nullable', 'email', 'max:120', Rule::unique('users', 'email')->ignore($student->user_id)],
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
            // Roll numbers are auto-generated on create but remain editable on
            // edit; they must stay unique within the class for the session.
            'roll_number' => [
                'required',
                'string',
                'max:20',
                Rule::unique('student_enrollments', 'roll_number')
                    ->where('academic_session_id', $this->input('academic_session_id'))
                    ->where('school_class_id', $this->input('school_class_id'))
                    ->ignore(
                        $student->enrollments()
                            ->where('academic_session_id', $this->input('academic_session_id'))
                            ->value('id')
                    ),
            ],
            'enrolled_on' => ['nullable', 'date'],
            'subject_ids' => ['nullable', 'array'],
            'subject_ids.*' => ['integer', 'exists:subjects,id'],
        ];
    }
}
