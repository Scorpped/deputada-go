<?php

namespace App\Services;

use App\Models\Usuario;
use Illuminate\Support\Collection;

class UsuarioService
{
    /**
     * Retorna a lista de indicados de um usuário identificado pelo referral_code.
     *
     * @param  string $referral_code  Código de indicação do usuário
     * @return Collection             Coleção com nome, cidade e data_cadastro de cada indicado
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException  Se o referral_code não existir
     */
    public function getIndicados(string $referral_code): Collection
    {
        $usuario = Usuario::where('referral_code', $referral_code)->firstOrFail();

        return $usuario->indicados->map(fn (Usuario $indicado) => [
            'nome'          => $indicado->nome,
            'cidade'        => $indicado->cidade,
            'data_cadastro' => $indicado->created_at,
        ]);
    }
}
