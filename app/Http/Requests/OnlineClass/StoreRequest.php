<?php

namespace App\Http\Requests\OnlineClass;

use App\Enums\OnlineClassStatusEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', \App\Models\OnlineClass::class) ?? false;
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
                Rule::exists('sections', 'id')->where(function ($query): void {
                    $query->where('academic_session_id', $this->input('academic_session_id'))
                        ->where('school_class_id', $this->input('school_class_id'));
                }),
            ],
            'subject_id' => ['nullable', 'exists:subjects,id'],
            'title' => ['nullable', 'string', 'max:255'],
            'meeting_link' => ['required', 'string', 'max:500', 'url'],
            'description' => ['nullable', 'string', 'max:2000'],
            'scheduled_at' => ['required', 'date'],
            'status' => ['sometimes', Rule::enum(OnlineClassStatusEnum::class)],
        ];
    }
}
