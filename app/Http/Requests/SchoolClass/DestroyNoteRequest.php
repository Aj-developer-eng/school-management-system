<?php

namespace App\Http\Requests\SchoolClass;

use Illuminate\Foundation\Http\FormRequest;

class DestroyNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('classes.create-notes') ?? false;
    }

    public function rules(): array
    {
        return [];
    }
}