<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreLiderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required'     => 'O nome é obrigatório.',
            'name.string'       => 'O nome deve ser um texto válido.',
            'email.required'    => 'O e-mail é obrigatório.',
            'email.email'       => 'Informe um endereço de e-mail válido.',
            'email.unique'      => 'Este e-mail já está cadastrado.',
            'password.required' => 'A senha é obrigatória.',
            'password.string'   => 'A senha deve ser um texto válido.',
            'password.min'      => 'A senha deve ter no mínimo 8 caracteres.',
        ];
    }
}
