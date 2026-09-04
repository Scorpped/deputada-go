<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
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
        $userId = $this->user()->id;

        return [
            'name'                  => ['sometimes', 'required_without_all:password,current_password,password_confirmation', 'string', 'max:255'],
            'email'                 => ['sometimes', 'string', 'email', 'max:255', "unique:users,email,{$userId}"],
            'current_password'      => ['required_with:password', 'string'],
            'password'              => ['sometimes', 'string', 'min:8', 'confirmed'],
            'password_confirmation' => ['required_with:password', 'string'],
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
            'name.required_without_all'          => 'O nome é obrigatório quando nenhum campo de senha é enviado.',
            'name.string'                         => 'O nome deve ser um texto válido.',
            'name.max'                            => 'O nome não pode ter mais de 255 caracteres.',
            'email.string'                        => 'O e-mail deve ser um texto válido.',
            'email.email'                         => 'Informe um endereço de e-mail válido.',
            'email.max'                           => 'O e-mail não pode ter mais de 255 caracteres.',
            'email.unique'                        => 'Este e-mail já está em uso por outro usuário.',
            'current_password.required_with'      => 'A senha atual é obrigatória para alterar a senha.',
            'current_password.string'             => 'A senha atual deve ser um texto válido.',
            'password.string'                     => 'A nova senha deve ser um texto válido.',
            'password.min'                        => 'A nova senha deve ter pelo menos 8 caracteres.',
            'password.confirmed'                  => 'A confirmação de senha não confere.',
            'password_confirmation.required_with' => 'A confirmação de senha é obrigatória quando uma nova senha é informada.',
            'password_confirmation.string'        => 'A confirmação de senha deve ser um texto válido.',
        ];
    }
}
