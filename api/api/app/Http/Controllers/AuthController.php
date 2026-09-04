<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\UpdateProfileRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Authenticate the user and return a Sanctum token.
     *
     * Returns HTTP 401 for invalid credentials.
     * Returns HTTP 403 if the leader (lider) has active = false.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        if (! Auth::attempt(['email' => $request->email, 'password' => $request->password])) {
            return response()->json([
                'message' => 'Credenciais inválidas.',
            ], 401);
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();

        if ($user->role === 'lider' && ! $user->active) {
            Auth::logout();

            return response()->json([
                'message' => 'Sua conta está desativada. Entre em contato com o administrador.',
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
        ]);
    }

    /**
     * Revoke the current access token (logout).
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout realizado com sucesso.',
        ]);
    }

    /**
     * Return the authenticated user's data.
     */
    public function me(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        return response()->json([
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'role'  => $user->role,
        ]);
    }

    /**
     * Update the authenticated user's profile (name, email and/or password).
     *
     * - Updates name and/or email when present in the payload.
     * - Verifies current_password with Hash::check() before updating the password.
     * - Returns { id, name, email, role } with HTTP 200 on success.
     * - Returns HTTP 422 with a validation error on current_password if the check fails.
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        if ($request->has('name')) {
            $user->name = $request->name;
        }

        if ($request->has('email')) {
            $user->email = $request->email;
        }

        if ($request->has('password')) {
            if (! Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'message' => 'Os dados fornecidos são inválidos.',
                    'errors'  => [
                        'current_password' => ['A senha atual informada está incorreta.'],
                    ],
                ], 422);
            }

            $user->password = Hash::make($request->password);
        }

        $user->save();

        return response()->json([
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'role'  => $user->role,
        ]);
    }
}
