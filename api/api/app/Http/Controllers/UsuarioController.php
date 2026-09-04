<?php

namespace App\Http\Controllers;

use App\Services\UsuarioService;
use Illuminate\Http\JsonResponse;

class UsuarioController extends Controller
{
    public function __construct(
        private readonly UsuarioService $usuarioService
    ) {}

    /**
     * Retorna a lista de indicados de um usuário pelo referral_code.
     *
     * @param  string $referral_code  Código de indicação do usuário
     * @return JsonResponse
     */
    public function indicados(string $referral_code): JsonResponse
    {
        $indicados = $this->usuarioService->getIndicados($referral_code);

        return response()->json(['data' => $indicados], 200);
    }
}
