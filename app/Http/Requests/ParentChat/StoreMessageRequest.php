<?php

namespace App\Http\Requests\ParentChat;

use Illuminate\Foundation\Http\FormRequest;

class StoreMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'max:4000'],
        ];
    }

    public function messages(): array
    {
        return [
            'body.required' => 'Type a message before sending.',
            'body.max' => 'The message is too long.',
        ];
    }
}
