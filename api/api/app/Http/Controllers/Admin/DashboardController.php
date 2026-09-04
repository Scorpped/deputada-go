<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Retornar métricas gerais do sistema para o dashboard do Admin.
     *
     * Requirements: 4.1, 4.2
     */
    public function index(): JsonResponse
    {
        $totalApoiadores = Usuario::count();

        $totalLideres = User::where('role', 'lider')->count();

        $cadastrosPorDia = Usuario::query()
            ->select(
                DB::raw('DATE(created_at) as data'),
                DB::raw('COUNT(*) as quantidade')
            )
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
            'total_apoiadores'  => $totalApoiadores,
            'total_lideres'     => $totalLideres,
            'cadastros_por_dia' => $cadastrosPorDia,
        ]);
    }
}
