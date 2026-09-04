<?php

namespace Tests\Feature;

use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IndicadosTest extends TestCase
{
    use RefreshDatabase;

    // ---------------------------------------------------------------------------
    // Dados de apoio
    // ---------------------------------------------------------------------------

    private function criarUsuario(array $overrides = []): Usuario
    {
        static $counter = 0;
        $counter++;

        return Usuario::create(array_merge([
            'nome'            => "Usuário {$counter}",
            'whatsapp'        => '619999' . str_pad($counter, 5, '0', STR_PAD_LEFT),
            'data_nascimento' => '1990-01-15',
            'endereco'        => 'Rua Teste, 100',
            'cidade'          => 'Brasília',
            'email'           => "usuario{$counter}@example.com",
            'referral_code'   => strtoupper(str_pad((string) $counter, 8, 'X', STR_PAD_LEFT)),
            'lgpd_aceito_em'  => now(),
        ], $overrides));
    }

    // ---------------------------------------------------------------------------
    // 1. Usuário com indicados retorna 200 com lista
    // ---------------------------------------------------------------------------

    public function test_usuario_com_indicados_retorna_200_com_lista(): void
    {
        // Cria usuário A
        $usuarioA = $this->criarUsuario([
            'referral_code' => 'AAAAAAAA',
        ]);

        // Cria usuário B indicado por A
        $usuarioB = $this->criarUsuario([
            'referral_code' => 'BBBBBBBB',
            'indicador_id'  => $usuarioA->id,
        ]);

        $response = $this->getJson("/api/usuarios/{$usuarioA->referral_code}/indicados");

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         '*' => ['nome', 'cidade', 'data_cadastro'],
                     ],
                 ]);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($usuarioB->nome, $data[0]['nome']);
        $this->assertEquals($usuarioB->cidade, $data[0]['cidade']);
    }

    // ---------------------------------------------------------------------------
    // 2. Usuário sem indicados retorna 200 com lista vazia
    // ---------------------------------------------------------------------------

    public function test_usuario_sem_indicados_retorna_200_com_lista_vazia(): void
    {
        $usuarioA = $this->criarUsuario([
            'referral_code' => 'AAAAAAAA',
        ]);

        $response = $this->getJson("/api/usuarios/{$usuarioA->referral_code}/indicados");

        $response->assertStatus(200)
                 ->assertJson(['data' => []]);
    }

    // ---------------------------------------------------------------------------
    // 3. referral_code inexistente retorna 404
    // ---------------------------------------------------------------------------

    public function test_referral_code_inexistente_retorna_404(): void
    {
        $response = $this->getJson('/api/usuarios/ZZZZZZZZ/indicados');

        $response->assertStatus(404);
    }

    // ---------------------------------------------------------------------------
    // 4. Resposta não expõe dados sensíveis
    // ---------------------------------------------------------------------------

    public function test_resposta_nao_expoe_dados_sensiveis(): void
    {
        // Cria usuário A
        $usuarioA = $this->criarUsuario([
            'referral_code' => 'AAAAAAAA',
        ]);

        // Cria usuário B indicado por A
        $this->criarUsuario([
            'referral_code' => 'BBBBBBBB',
            'indicador_id'  => $usuarioA->id,
        ]);

        $response = $this->getJson("/api/usuarios/{$usuarioA->referral_code}/indicados");

        $response->assertStatus(200);

        $responseBody = $response->getContent();

        $this->assertStringNotContainsString('whatsapp', $responseBody);
        $this->assertStringNotContainsString('email', $responseBody);
    }
}
