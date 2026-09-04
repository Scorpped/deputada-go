<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreLiderRequest;
use App\Http\Requests\Admin\UpdateLiderRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class LiderController extends Controller
{
    /**
     * Listar líderes paginados (15 por página), incluindo contagem de indicados.
     *
     * Requirements: 2.1, 2.2
     */
    public function index(): JsonResponse
    {
        $lideres = User::where('role', 'lider')
            ->withCount('indicados')
            ->paginate(15);

        $data = $lideres->getCollection()->map(function (User $lider) {
            return $this->formatLider($lider);
        });

        return response()->json([
            'data'         => $data,
            'current_page' => $lideres->currentPage(),
            'last_page'    => $lideres->lastPage(),
            'per_page'     => $lideres->perPage(),
            'total'        => $lideres->total(),
        ]);
    }

    /**
     * Criar um novo líder com role `lider` e referral_code único.
     *
     * Requirements: 2.3, 2.8, 2.9
     */
    public function store(StoreLiderRequest $request): JsonResponse
    {
        $referralCode = $this->generateUniqueReferralCode();

        $lider = User::create([
            'name'          => $request->name,
            'email'         => $request->email,
            'password'      => Hash::make($request->password),
            'role'          => 'lider',
            'referral_code' => $referralCode,
            'active'        => true,
        ]);

        $lider->loadCount('indicados');

        return response()->json($this->formatLider($lider), 201);
    }

    /**
     * Atualizar nome e email do líder.
     *
     * Requirements: 2.5, 2.9
     */
    public function update(UpdateLiderRequest $request, int $id): JsonResponse
    {
        $lider = User::where('role', 'lider')->findOrFail($id);

        $lider->update([
            'name'  => $request->name,
            'email' => $request->email,
        ]);

        $lider->loadCount('indicados');

        return response()->json($this->formatLider($lider));
    }

    /**
     * Alternar o campo `active` do líder.
     *
     * Requirements: 2.6
     */
    public function toggle(int $id): JsonResponse
    {
        $lider = User::where('role', 'lider')->findOrFail($id);

        $lider->update(['active' => !$lider->active]);

        $lider->loadCount('indicados');

        return response()->json($this->formatLider($lider));
    }

    /**
     * Redefinir a senha do líder.
     *
     * Requirements: 2.5
     */
    public function resetPassword(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'string', 'min:8'],
        ]);

        $lider = User::where('role', 'lider')->findOrFail($id);
        $lider->update(['password' => Hash::make($request->password)]);

        // Revogar todos os tokens existentes para forçar novo login
        $lider->tokens()->delete();

        return response()->json(['message' => 'Senha redefinida com sucesso.']);
    }

    /**
     * Formatar os dados do líder para a resposta.
     */
    private function formatLider(User $lider): array
    {
        return [
            'id'               => $lider->id,
            'name'             => $lider->name,
            'email'            => $lider->email,
            'referral_code'    => $lider->referral_code,
            'referral_link'    => $lider->referral_link,
            'active'           => $lider->active,
            'created_at'       => $lider->created_at,
            'total_indicados'  => $lider->indicados_count ?? 0,
        ];
    }

    /**
     * Gerar um referral_code único de 8 caracteres.
     */
    private function generateUniqueReferralCode(): string
    {
        do {
            $code = Str::random(8);
        } while (User::where('referral_code', $code)->exists());

        return $code;
    }
}
