<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApoiadorController extends Controller
{
    /**
     * Listar apoiadores paginados com suporte a busca e nome do indicador.
     *
     * Requirements: 3.1, 3.2, 3.3, 3.4, 3.6
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->input('per_page', 15);
        $search  = $request->input('search');

        $query = Usuario::query()
            ->leftJoin('users', 'users.referral_code', '=', 'usuarios.lider_referral_code')
            ->select([
                'usuarios.id',
                'usuarios.nome',
                'usuarios.email',
                'usuarios.whatsapp',
                'usuarios.cidade',
                'usuarios.data_nascimento',
                'usuarios.referral_code',
                'usuarios.created_at',
                'users.name as nome_indicador',
            ]);

        if ($search) {
            $like = '%' . $search . '%';
            $query->where(function ($q) use ($like) {
                $q->where('usuarios.nome', 'LIKE', $like)
                  ->orWhere('usuarios.email', 'LIKE', $like)
                  ->orWhere('usuarios.cidade', 'LIKE', $like);
            });
        }

        $apoiadores = $query->paginate($perPage);

        return response()->json([
            'data'         => $apoiadores->items(),
            'current_page' => $apoiadores->currentPage(),
            'last_page'    => $apoiadores->lastPage(),
            'per_page'     => $apoiadores->perPage(),
            'total'        => $apoiadores->total(),
        ]);
    }
}
