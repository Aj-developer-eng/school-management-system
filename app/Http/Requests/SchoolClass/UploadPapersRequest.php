<?php

namespace App\Http\Requests\SchoolClass;

use Illuminate\Foundation\Http\FormRequest;

class UploadPapersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('classes.upload-papers') ?? false;
    }

    public function rules(): array
    {
        return [
            'papers' => ['required', 'array', 'min:1', 'max:10'],
            // PDF and Word documents only — the extension is derived from the
            // file's actual content, not from the uploaded file name.
            'papers.*' => ['file', 'mimes:pdf,doc,docx', 'max:20480'],
        ];
    }

    public function messages(): array
    {
        return [
            'papers.required' => 'Select at least one paper to upload.',
            'papers.min' => 'Select at least one paper to upload.',
            'papers.max' => 'You can upload up to 10 papers at a time.',
            'papers.*.mimes' => 'Only PDF and Word (doc/docx) files are allowed.',
            'papers.*.max' => 'Each paper must be smaller than 20 MB.',
        ];
    }
}