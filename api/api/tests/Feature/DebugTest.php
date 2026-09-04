<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DebugTest extends TestCase
{
    use RefreshDatabase;

    public function test_debug_route(): void
    {
        $response = $this->postJson('/api/cadastro', [
            'nome' => 'João Silva',
            'whatsapp' => '61999990001',
            'data_nascimento' => '1990-01-15',
            'endereco' => 'Rua das Flores, 123',
            'cidade' => 'Brasília',
            'email' => 'joao@example.com',
            'lgpd_aceito' => true,
        ]);

        // Dump the response for debugging
        echo "\nStatus: " . $response->getStatusCode() . "\n";
        echo "Content: " . $response->getContent() . "\n";
        echo "Headers: " . json_encode($response->headers->all()) . "\n";

        $this->assertTrue(true); // Always pass
    }
}
