<?php

namespace Database\Seeders;

use App\Models\Usuario;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class UsuarioSeeder extends Seeder
{
    public function run(): void
    {
        // Usuário inicial sem indicador — serve como ponto de partida para testes
        // de indicação. O referral_code pode ser usado como ?ref= na URL do frontend.
        Usuario::firstOrCreate(
            ['email' => 'reinaldo@aliancavitoria300.com.br'],
            [
                'nome'            => 'Reinaldo Araújo',
                'whatsapp'        => '61999990001',
                'data_nascimento' => '1975-03-15',
                'endereco'        => 'SGAN 601 Conjunto K, Bloco A',
                'cidade'          => 'Brasília (RA-01)',
                'referral_code'   => 'REINALD0',
                'indicador_id'    => null,
                'lgpd_aceito_em'  => now(),
            ]
        );

        // Segundo usuário indicado pelo primeiro — útil para testar o endpoint
        // GET /api/usuarios/{referral_code}/indicados
        $indicador = Usuario::where('email', 'reinaldo@aliancavitoria300.com.br')->first();

        Usuario::firstOrCreate(
            ['email' => 'matheus@exemplo.com'],
            [
                'nome'            => 'Matheus Afonso Pereira Silva',
                'whatsapp'        => '61988880002',
                'data_nascimento' => '1995-07-22',
                'endereco'        => 'QNM 38 Conjunto F, 12',
                'cidade'          => 'Ceilândia (RA-09)',
                'referral_code'   => Str::upper(Str::random(8)),
                'indicador_id'    => $indicador?->id,
                'lgpd_aceito_em'  => now(),
            ]
        );
    }
}
