<?php

namespace App\Http\Controllers;

use App\Http\Requests\CadastroRequest;
use App\Services\CadastroService;
use Illuminate\Http\JsonResponse;

class CadastroController extends Controller
{
    public function __construct(
        private readonly CadastroService $cadastroService
    ) {}

    /**
     * Cadastra um novo usuário.
     *
     * @param  CadastroRequest  $request
     * @return JsonResponse
     */
    public function store(CadastroRequest $request): JsonResponse
    {
        $usuario = $this->cadastroService->cadastrar($request->validated());

        return response()->json($usuario, 201);
    }
}
