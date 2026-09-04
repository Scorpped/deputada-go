<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CadastroRequest extends FormRequest
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
            'nome'            => ['required', 'string', 'max:255'],
            'whatsapp'        => ['required', 'string', 'digits_between:10,11', 'unique:usuarios,whatsapp'],
            'data_nascimento' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
            'endereco'        => ['required', 'string', 'max:500'],
            'cidade'          => ['required', 'string', 'max:255'],
            'email'           => ['required', 'email', 'max:255', 'unique:usuarios,email'],
            'lgpd_aceito'     => ['required', 'accepted'],
            'referral_code'   => ['nullable', 'string', 'size:8', function ($attribute, $value, $fail) {
                $existsInUsuarios = \App\Models\Usuario::where('referral_code', $value)->exists();
                $existsInUsers    = \App\Models\User::where('referral_code', $value)->where('active', true)->exists();
                if (!$existsInUsuarios && !$existsInUsers) {
                    $fail('O código de indicação informado é inválido.');
                }
            }],
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
            // nome
            'nome.required'            => 'O nome é obrigatório.',
            'nome.string'              => 'O nome deve ser um texto válido.',
            'nome.max'                 => 'O nome não pode ter mais de 255 caracteres.',

            // whatsapp
            'whatsapp.required'        => 'O WhatsApp é obrigatório.',
            'whatsapp.string'          => 'O WhatsApp deve ser um texto válido.',
            'whatsapp.digits_between'  => 'O WhatsApp deve conter entre 10 e 11 dígitos numéricos.',
            'whatsapp.unique'          => 'O WhatsApp já está cadastrado.',

            // data_nascimento
            'data_nascimento.required'         => 'A data de nascimento é obrigatória.',
            'data_nascimento.date_format'      => 'A data de nascimento deve estar no formato AAAA-MM-DD.',
            'data_nascimento.before_or_equal'  => 'A data de nascimento não pode ser uma data futura.',

            // endereco
            'endereco.required'        => 'O endereço é obrigatório.',
            'endereco.string'          => 'O endereço deve ser um texto válido.',
            'endereco.max'             => 'O endereço não pode ter mais de 500 caracteres.',

            // cidade
            'cidade.required'          => 'A cidade é obrigatória.',
            'cidade.string'            => 'A cidade deve ser um texto válido.',
            'cidade.max'               => 'A cidade não pode ter mais de 255 caracteres.',

            // email
            'email.required'           => 'O e-mail é obrigatório.',
            'email.email'              => 'Informe um endereço de e-mail válido.',
            'email.max'                => 'O e-mail não pode ter mais de 255 caracteres.',
            'email.unique'             => 'O e-mail já está cadastrado.',

            // lgpd_aceito
            'lgpd_aceito.required'     => 'É obrigatório aceitar os termos de uso e política de privacidade.',
            'lgpd_aceito.accepted'     => 'Você deve aceitar os termos de uso e política de privacidade para continuar.',

            // referral_code
            'referral_code.string'     => 'O código de indicação deve ser um texto válido.',
            'referral_code.size'       => 'O código de indicação deve ter exatamente 8 caracteres.',
            'referral_code.exists'     => 'O código de indicação informado é inválido.',
        ];
    }
}
