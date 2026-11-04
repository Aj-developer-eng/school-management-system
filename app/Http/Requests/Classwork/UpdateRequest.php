<?php

namespace App\Http\Requests\Classwork;

use App\Models\Classwork;
use Illuminate\Foundation\Http\FormRequest;

class UpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', Classwork::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'in:announcement,assignment'],
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:2000'],
            'due_date' => ['nullable', 'date'],
            'status' => ['required', 'in:published,draft'],
        ];
    }
}
