<?php

namespace Tests\Feature;

use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CadastroTest extends TestCase
{
    use RefreshDatabase;

    // ---------------------------------------------------------------------------
    // Dados de apoio
    // ---------------------------------------------------------------------------

    private function dadosValidos(array $overrides = []): array
    {
        return array_merge([
            'nome'            => 'João Silva',
            'whatsapp'        => '61999990001',
            'data_nascimento' => '1990-01-15',
            'endereco'        => 'Rua das Flores, 123',
            'cidade'          => 'Brasília',
            'email'           => 'joao@example.com',
            'lgpd_aceito'     => true,
        ], $overrides);
    }

    // ---------------------------------------------------------------------------
    // 1. Cadastro bem-sucedido
    // ---------------------------------------------------------------------------

    public function test_cadastro_bem_sucedido_retorna_201_com_estrutura_correta(): void
    {
        $response = $this->postJson('/api/cadastro', $this->dadosValidos());

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'id',
                     'nome',
                     'cidade',
                     'referral_code',
                     'referral_link',
                     'lgpd_aceito_em',
                     'created_at',
                 ]);

        $referralCode = $response->json('referral_code');
        $this->assertMatchesRegularExpression('/^[A-Za-z0-9]{8}$/', $referralCode);

        $referralLink = $response->json('referral_link');
        $this->assertStringContainsString('?ref=', $referralLink);
    }

    // ---------------------------------------------------------------------------
    // 2. Email duplicado
    // ---------------------------------------------------------------------------

    public function test_email_duplicado_retorna_422(): void
    {
        // Cadastra usuário A
        $this->postJson('/api/cadastro', $this->dadosValidos());

        // Tenta cadastrar B com mesmo email
        $response = $this->postJson('/api/cadastro', $this->dadosValidos([
            'whatsapp' => '61999990002',
            'email'    => 'joao@example.com', // mesmo email
        ]));

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);
    }

    // ---------------------------------------------------------------------------
    // 3. WhatsApp duplicado
    // ---------------------------------------------------------------------------

    public function test_whatsapp_duplicado_retorna_422(): void
    {
        // Cadastra usuário A
        $this->postJson('/api/cadastro', $this->dadosValidos());

        // Tenta cadastrar B com mesmo whatsapp
        $response = $this->postJson('/api/cadastro', $this->dadosValidos([
            'whatsapp' => '61999990001', // mesmo whatsapp
            'email'    => 'outro@example.com',
        ]));

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['whatsapp']);
    }

    // ---------------------------------------------------------------------------
    // 4. lgpd_aceito ausente
    // ---------------------------------------------------------------------------

    public function test_lgpd_aceito_ausente_retorna_422(): void
    {
        $dados = $this->dadosValidos();
        unset($dados['lgpd_aceito']);

        $response = $this->postJson('/api/cadastro', $dados);

        $response->assertStatus(422);
    }

    // ---------------------------------------------------------------------------
    // 5. Nome inválido
    // ---------------------------------------------------------------------------

    public function test_nome_invalido_retorna_422(): void
    {
        $response = $this->postJson('/api/cadastro', $this->dadosValidos([
            'nome' => '',
        ]));

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['nome']);
    }

    // ---------------------------------------------------------------------------
    // 6. WhatsApp inválido (com letras)
    // ---------------------------------------------------------------------------

    public function test_whatsapp_invalido_retorna_422(): void
    {
        $response = $this->postJson('/api/cadastro', $this->dadosValidos([
            'whatsapp' => 'abc12345678',
        ]));

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['whatsapp']);
    }

    // ---------------------------------------------------------------------------
    // 7. Data de nascimento futura
    // ---------------------------------------------------------------------------

    public function test_data_nascimento_futura_retorna_422(): void
    {
        $response = $this->postJson('/api/cadastro', $this->dadosValidos([
            'data_nascimento' => now()->addYear()->format('Y-m-d'),
        ]));

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['data_nascimento']);
    }

    // ---------------------------------------------------------------------------
    // 8. Email inválido
    // ---------------------------------------------------------------------------

    public function test_email_invalido_retorna_422(): void
    {
        $response = $this->postJson('/api/cadastro', $this->dadosValidos([
            'email' => 'nao-e-um-email',
        ]));

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);
    }

    // ---------------------------------------------------------------------------
    // 9. Cadastro com referral_code válido associa indicador
    // ---------------------------------------------------------------------------

    public function test_cadastro_com_referral_code_valido_associa_indicador(): void
    {
        // Cria usuário A diretamente no banco
        $usuarioA = Usuario::create([
            'nome'            => 'Maria Indicadora',
            'whatsapp'        => '61988880001',
            'data_nascimento' => '1985-05-20',
            'endereco'        => 'Av. Central, 456',
            'cidade'          => 'Goiânia',
            'email'           => 'maria@example.com',
            'referral_code'   => 'AAAAAAAA',
            'lgpd_aceito_em'  => now(),
        ]);

        // Cadastra B usando o referral_code de A
        $response = $this->postJson('/api/cadastro', $this->dadosValidos([
            'referral_code' => 'AAAAAAAA',
        ]));

        $response->assertStatus(201);

        // Verifica no banco que B tem indicador_id = id de A
        $usuarioB = Usuario::where('email', 'joao@example.com')->first();
        $this->assertNotNull($usuarioB);
        $this->assertEquals($usuarioA->id, $usuarioB->indicador_id);
    }

    // ---------------------------------------------------------------------------
    // 10. Cadastro com referral_code inválido retorna 422
    // ---------------------------------------------------------------------------

    public function test_cadastro_com_referral_code_invalido_retorna_422(): void
    {
        $response = $this->postJson('/api/cadastro', $this->dadosValidos([
            'referral_code' => 'ZZZZZZZZ', // não existe no banco
        ]));

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['referral_code']);
    }

    // ---------------------------------------------------------------------------
    // 11. Cadastro sem referral_code cria usuário sem indicador
    // ---------------------------------------------------------------------------

    public function test_cadastro_sem_referral_code_cria_usuario_sem_indicador(): void
    {
        $response = $this->postJson('/api/cadastro', $this->dadosValidos());

        $response->assertStatus(201);

        $usuario = Usuario::where('email', 'joao@example.com')->first();
        $this->assertNotNull($usuario);
        $this->assertNull($usuario->indicador_id);
    }

    // ---------------------------------------------------------------------------
    // 12. Preflight OPTIONS retorna 200 com headers CORS
    // ---------------------------------------------------------------------------

    public function test_preflight_options_retorna_200_com_headers_cors(): void
    {
        $response = $this->call(
            'OPTIONS',
            '/api/cadastro',
            [],
            [],
            [],
            ['HTTP_ORIGIN' => 'http://localhost:5173']
        );

        $response->assertStatus(200);
        $this->assertNotEmpty($response->headers->get('Access-Control-Allow-Origin'));
    }
}
