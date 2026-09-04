<?php

namespace App\Services;

use App\Models\Usuario;
use Illuminate\Support\Str;

class CadastroService
{
    /**
     * Gera um referral_code alfanumérico de 8 caracteres único na tabela usuarios.
     */
    public function generateUniqueReferralCode(): string
    {
        do {
            $code = Str::random(8);
        } while (Usuario::where('referral_code', $code)->exists());

        return $code;
    }

    /**
     * Cadastra um novo usuário a partir dos dados validados.
     *
     * @param  array $data  Dados validados do CadastroRequest
     * @return Usuario      Model do usuário criado
     */
    public function cadastrar(array $data): Usuario
    {
        // Resolve indicador_id (apoiador) ou lider_referral_code (líder)
        $indicadorId = null;
        $liderReferralCode = null;
        if (!empty($data['referral_code'])) {
            $apoiador = Usuario::where('referral_code', $data['referral_code'])->first();
            if ($apoiador) {
                $indicadorId = $apoiador->id;
            } else {
                // Código pertence a um líder (tabela users)
                $liderExists = \App\Models\User::where('referral_code', $data['referral_code'])
                    ->where('active', true)
                    ->exists();
                if ($liderExists) {
                    $liderReferralCode = $data['referral_code'];
                }
            }
        }

        // Converte lgpd_aceito: true → lgpd_aceito_em: now()
        $lgpdAceitoEm = now();

        // Gera referral_code único para o novo usuário
        $referralCode = $this->generateUniqueReferralCode();

        // Persiste o usuário
        $usuario = Usuario::create([
            'nome'                => $data['nome'],
            'whatsapp'            => $data['whatsapp'],
            'data_nascimento'     => $data['data_nascimento'],
            'endereco'            => $data['endereco'],
            'cidade'              => $data['cidade'],
            'email'               => $data['email'],
            'referral_code'       => $referralCode,
            'indicador_id'        => $indicadorId,
            'lider_referral_code' => $liderReferralCode,
            'lgpd_aceito_em'      => $lgpdAceitoEm,
        ]);

        return $usuario;
    }
}
