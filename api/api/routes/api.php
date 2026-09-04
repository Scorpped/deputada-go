<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CadastroController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\Admin\LiderController;
use App\Http\Controllers\Admin\ApoiadorController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Lider\DashboardController as LiderDashboardController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Rotas públicas existentes
Route::post('/cadastro', [CadastroController::class, 'store']);
Route::get('/usuarios/{referral_code}/indicados', [UsuarioController::class, 'indicados']);
Route::get('/lider-info/{referral_code}', function (string $referral_code) {
    $lider = \App\Models\User::where('referral_code', $referral_code)
        ->where('active', true)
        ->select('name')
        ->first();

    if (!$lider) {
        return response()->json(['data' => null], 404);
    }

    return response()->json(['data' => ['nome' => $lider->name]]);
});

// Grupo público: autenticação
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

// Grupo autenticado (auth:sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
    });

    // Grupo admin: auth:sanctum + role:admin
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index']);

        Route::get('/lideres', [LiderController::class, 'index']);
        Route::post('/lideres', [LiderController::class, 'store']);
        Route::put('/lideres/{id}', [LiderController::class, 'update']);
        Route::patch('/lideres/{id}/toggle', [LiderController::class, 'toggle']);
        Route::patch('/lideres/{id}/reset-password', [LiderController::class, 'resetPassword']);

        Route::get('/apoiadores', [ApoiadorController::class, 'index']);
    });

    // Grupo lider: auth:sanctum + role:lider
    Route::middleware('role:lider')->prefix('lider')->group(function () {
        Route::get('/dashboard', [LiderDashboardController::class, 'index']);
    });
});
