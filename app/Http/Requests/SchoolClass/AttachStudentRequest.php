<?php

namespace App\Http\Requests\SchoolClass;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AttachStudentRequest extends FormRequest
{
    /**
     * Authorization happens in SchoolClassController::attachStudent via the
     * manageStudents policy ability ("students.update").
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Soft-deleted (withdrawn/archived) and inactive students cannot be
     * attached — the Students modal only offers active students anyway.
     */
    public function rules(): array
    {
        return [
            'student_id' => [
                'required',
                'integer',
                Rule::exists('students', 'id')
                    ->whereNull('deleted_at')
                    ->where('is_active', true),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'student_id.required' => 'Select a student to add to the class.',
            'student_id.exists' => 'The selected student is unknown or inactive.',
        ];
    }
}
