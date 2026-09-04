<?php

namespace App\Http\Controllers\Lider;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Retornar métricas do líder autenticado.
     *
     * Retorna apenas dados agregados — nenhum dado pessoal de apoiadores
     * (nome, email, whatsapp, endereço) é exposto.
     *
     * Requirements: 5.1, 5.2, 5.7, 5.8
     */
    public function index(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $referralCode = $user->referral_code;

        // Total de apoiadores captados pelo referral_code do líder autenticado
        $totalIndicados = Usuario::where('lider_referral_code', $referralCode)->count();

        // Cadastros por dia nos últimos 30 dias, filtrados pelo referral_code do líder
        $cadastrosPorDia = Usuario::query()
            ->select(
                DB::raw('DATE(created_at) as data'),
                DB::raw('COUNT(*) as quantidade')
            )
            ->where('lider_referral_code', $referralCode)
            ->where('created_at', '>=', now()->subDays(30)->startOfDay())
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('data', 'asc')
            ->get()
            ->map(fn ($row) => [
                'data'       => $row->data,
                'quantidade' => (int) $row->quantidade,
            ])
            ->values()
            ->toArray();

        return response()->json([
            'total_indicados'   => $totalIndicados,
            'cadastros_por_dia' => $cadastrosPorDia,
        ]);
    }
}
