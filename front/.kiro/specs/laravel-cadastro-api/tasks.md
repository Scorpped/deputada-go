# Plano de Implementação: laravel-cadastro-api

## Visão Geral

Implementação do backend Laravel 10 para a API de cadastro com rastreamento de indicações (referral tracking). O projeto será criado em `e:\Programas\wamp64\www\cadastro-api` e se integrará ao frontend React existente em `cadastro-main/`.

## Tasks

- [x] 1. Configurar projeto Laravel 10 e estrutura base
  - Criar projeto Laravel 10 via Composer em `e:\Programas\wamp64\www\cadastro-api`
  - Configurar `.env` com conexão MySQL (WAMP), `APP_URL` e `FRONTEND_URL`
  - Instalar dependência Eris para testes baseados em propriedades: `composer require --dev giorgiosironi/eris`
  - Criar diretório `tests/Property/` para os testes de propriedade
  - Configurar `phpunit.xml` para incluir a suite `Property`
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 2. Criar Migration e Model Usuario
  - [x] 2.1 Criar migration `create_usuarios_table`
    - Definir todas as colunas conforme o design: `id`, `nome`, `whatsapp` (unique), `data_nascimento`, `endereco`, `cidade`, `email` (unique), `referral_code` (char 8, unique), `indicador_id` (FK nullable → usuarios.id), `lgpd_aceito_em`, `timestamps`
    - Executar `php artisan migrate`
    - _Requirements: 1.1, 3.1, 4.4, 7.1_
  - [x] 2.2 Criar Model `app/Models/Usuario.php`
    - Definir `$table`, `$fillable`, `$hidden` (whatsapp, email, indicador_id, updated_at)
    - Implementar relacionamentos `indicador()` (BelongsTo) e `indicados()` (HasMany)
    - Adicionar cast de `lgpd_aceito_em` para datetime
    - _Requirements: 1.1, 5.3, 7.2_

- [ ] 3. Implementar CadastroRequest
  - [x] 3.1 Criar `app/Http/Requests/CadastroRequest.php`
    - Implementar `authorize()` retornando `true`
    - Definir regras: `nome` (required, string, max:255), `whatsapp` (required, digits, between:10,11, unique:usuarios), `data_nascimento` (required, date_format:Y-m-d, before_or_equal:today), `endereco` (required, string, max:500), `cidade` (required, string, max:255), `email` (required, email, max:255, unique:usuarios), `lgpd_aceito` (required, accepted), `referral_code` (nullable, string, size:8, exists:usuarios,referral_code)
    - Implementar `messages()` com mensagens de erro em português
    - _Requirements: 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 4.2_
  - [ ]* 3.2 Escrever testes de unidade para CadastroRequest
    - Testar cada regra de validação individualmente com dados inválidos
    - Testar que dados válidos passam na validação
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [ ] 4. Implementar CadastroService
  - [x] 4.1 Criar `app/Services/CadastroService.php`
    - Implementar `generateUniqueReferralCode(): string` com loop de unicidade usando `Str::random(8)` e verificação no banco
    - Implementar `cadastrar(array $data): Usuario` que: resolve `indicador_id` a partir do `referral_code` recebido, converte `lgpd_aceito` → `lgpd_aceito_em: now()`, gera `referral_code` único, persiste o usuário e retorna o model
    - Montar `referral_link` = `config('app.url') . '/cadastro?ref=' . $referral_code`
    - _Requirements: 1.1, 3.1, 3.2, 3.3, 3.4, 4.1, 4.3, 4.4, 7.1_
  - [ ]* 4.2 Escrever testes de unidade para CadastroService (`tests/Unit/CadastroServiceTest.php`)
    - Testar que `generateUniqueReferralCode` retorna string de exatamente 8 caracteres alfanuméricos
    - Testar que `generateUniqueReferralCode` nunca retorna código já existente no banco (mock do Model)
    - _Requirements: 3.1, 3.2, 3.4_
  - [ ]* 4.3 Escrever teste de propriedade P5 — Unicidade do referral_code (`tests/Property/CadastroServicePropertyTest.php`)
    - **Property 5: Unicidade do referral_code entre todos os usuários**
    - **Validates: Requirements 3.2**
    - Gerar N cadastros válidos e verificar que todos os `referral_code` são distintos

- [ ] 5. Implementar CadastroController
  - [x] 5.1 Criar `app/Http/Controllers/CadastroController.php`
    - Implementar `store(CadastroRequest $request): JsonResponse`
    - Injetar `CadastroService` via construtor
    - Chamar `CadastroService::cadastrar()` e retornar HTTP 201 com o usuário criado (incluindo `referral_link` como atributo appended)
    - _Requirements: 1.1, 3.3_
  - [x] 5.2 Registrar rota `POST /api/cadastro` em `routes/api.php`
    - _Requirements: 1.1_

- [x] 6. Checkpoint — Testar endpoint de cadastro
  - Garantir que todos os testes passam até aqui, perguntar ao usuário se há dúvidas antes de continuar.

- [ ] 7. Implementar UsuarioService e UsuarioController
  - [x] 7.1 Criar `app/Services/UsuarioService.php`
    - Implementar `getIndicados(string $referral_code): Collection`
    - Buscar o usuário pelo `referral_code` (lançar `ModelNotFoundException` se não encontrado)
    - Retornar `$usuario->indicados` com apenas os campos `nome`, `cidade`, `data_cadastro` (alias de `created_at`)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 7.2_
  - [x] 7.2 Criar `app/Http/Controllers/UsuarioController.php`
    - Implementar `indicados(string $referral_code): JsonResponse`
    - Injetar `UsuarioService` via construtor
    - Retornar HTTP 200 com `{ "data": [...] }`
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 7.3 Registrar rota `GET /api/usuarios/{referral_code}/indicados` em `routes/api.php`
    - _Requirements: 5.1_

- [ ] 8. Configurar CORS e Handler de Exceções
  - [x] 8.1 Configurar `config/cors.php`
    - Definir `paths: ['api/*']`, `allowed_origins: [env('FRONTEND_URL')]`, `allowed_methods: ['GET', 'POST', 'OPTIONS']`, `allowed_headers: ['Content-Type', 'Accept', 'X-Requested-With']`
    - Garantir que o middleware `\Fruitcake\Cors\HandleCors::class` (ou `\Illuminate\Http\Middleware\HandleCors::class` no Laravel 10) está registrado em `app/Http/Kernel.php`
    - _Requirements: 6.1, 6.2, 6.4_
  - [x] 8.2 Configurar `app/Exceptions/Handler.php`
    - Adicionar `renderable` para `ValidationException` em rotas `api/*` → retornar JSON 422
    - Adicionar `renderable` para `ModelNotFoundException` em rotas `api/*` → retornar JSON 404
    - Adicionar tratamento para rotas não encontradas (404) e método não permitido (405) em JSON
    - _Requirements: 6.3, 5.2_

- [ ] 9. Escrever Testes de Feature (PHPUnit)
  - [-] 9.1 Criar `tests/Feature/CadastroTest.php`
    - Testar cadastro bem-sucedido: HTTP 201, estrutura da resposta (id, nome, cidade, referral_code 8 chars, referral_link com `?ref=`, lgpd_aceito_em, created_at)
    - Testar email duplicado → HTTP 422 com chave `email` nos erros
    - Testar whatsapp duplicado → HTTP 422 com chave `whatsapp` nos erros
    - Testar `lgpd_aceito` ausente → HTTP 422
    - Testar cada campo inválido individualmente → HTTP 422 com chave correta
    - Testar cadastro com `referral_code` válido → `indicador_id` associado corretamente
    - Testar cadastro com `referral_code` inválido → HTTP 422
    - Testar cadastro sem `referral_code` → `indicador_id` null
    - Testar preflight OPTIONS `/api/cadastro` → HTTP 200 com headers CORS (Exemplo E1)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1–2.7, 4.1, 4.2, 4.3, 6.1, 6.4_
  - [~] 9.2 Criar `tests/Feature/IndicadosTest.php`
    - Testar usuário com indicados → HTTP 200 com lista contendo `nome`, `cidade`, `data_cadastro`
    - Testar usuário sem indicados → HTTP 200 com lista vazia
    - Testar `referral_code` inexistente → HTTP 404
    - Testar que a resposta NÃO contém `whatsapp` nem `email`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 7.2_

- [ ] 10. Escrever Testes Baseados em Propriedades (Eris)
  - [ ]* 10.1 Criar `tests/Property/CadastroPropertyTest.php` — Propriedades P1, P2, P3, P4, P6, P7, P8, P11
    - [ ]* 10.1.1 Implementar teste da **Property 1: Cadastro válido produz referral_code e referral_link corretos**
      - Gerar dados válidos aleatórios com Eris; verificar HTTP 201, `referral_code` com regex `/^[A-Za-z0-9]{8}$/`, `referral_link` contendo `?ref={referral_code}`
      - **Validates: Requirements 1.1, 3.1, 3.3**
    - [ ]* 10.1.2 Implementar teste da **Property 2: Campos únicos duplicados retornam HTTP 422**
      - Cadastrar usuário A; tentar cadastrar usuário B com mesmo email ou whatsapp; verificar HTTP 422 com campo correto nos erros
      - **Validates: Requirements 1.3, 1.4**
    - [ ]* 10.1.3 Implementar teste da **Property 3: lgpd_aceito ausente ou falso retorna HTTP 422**
      - Gerar dados válidos com `lgpd_aceito` variando entre `false`, `0`, ausente; verificar HTTP 422
      - **Validates: Requirements 1.5**
    - [ ]* 10.1.4 Implementar teste da **Property 4: Dados de entrada inválidos retornam HTTP 422 com erros por campo**
      - Gerar dados com campos inválidos (nome vazio, whatsapp com letras, data futura, email malformado); verificar HTTP 422 com chave do campo nos erros
      - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**
    - [ ]* 10.1.5 Implementar teste da **Property 6: Indicador associado corretamente quando referral_code válido é fornecido**
      - Cadastrar usuário A; cadastrar usuário B com `referral_code` de A; verificar que `indicador_id` de B = `id` de A
      - **Validates: Requirements 4.1, 4.4**
    - [ ]* 10.1.6 Implementar teste da **Property 7: referral_code inválido no cadastro retorna HTTP 422**
      - Gerar strings de 8 chars que não existam no banco; verificar HTTP 422
      - **Validates: Requirements 4.2**
    - [ ]* 10.1.7 Implementar teste da **Property 8: Cadastro sem referral_code resulta em indicador_id nulo**
      - Gerar dados válidos sem `referral_code`; verificar que o registro criado tem `indicador_id` null
      - **Validates: Requirements 4.3**
    - [ ]* 10.1.8 Implementar teste da **Property 11: lgpd_aceito_em preenchido no momento do cadastro**
      - Registrar timestamp antes e depois do cadastro; verificar que `lgpd_aceito_em` está dentro do intervalo (± 5 segundos)
      - **Validates: Requirements 7.1**
  - [ ]* 10.2 Criar `tests/Property/IndicadosPropertyTest.php` — Propriedades P9, P10
    - [ ]* 10.2.1 Implementar teste da **Property 9: Consulta de indicados retorna lista com campos corretos e sem dados sensíveis**
      - Gerar N indicados (N ≥ 0); verificar HTTP 200, lista com N objetos contendo apenas `nome`, `cidade`, `data_cadastro`, sem `whatsapp` nem `email`
      - **Validates: Requirements 5.1, 5.3, 5.4, 7.2**
    - [ ]* 10.2.2 Implementar teste da **Property 10: referral_code inexistente na consulta retorna HTTP 404**
      - Gerar strings de 8 chars que não existam no banco; verificar HTTP 404
      - **Validates: Requirements 5.2**

- [~] 11. Checkpoint final — Garantir que todos os testes passam
  - Executar `php artisan test` e verificar que todas as suites (Feature, Unit, Property) passam sem erros.
  - Perguntar ao usuário se há ajustes antes de considerar a implementação concluída.

## Notas

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia os requisitos específicos para rastreabilidade
- Os testes de propriedade usam mínimo de 100 iterações por propriedade (configurar via `$this->minimumEvaluationRatio(100)` ou `limitTo(100)` no Eris)
- O banco de dados de teste deve usar SQLite em memória (`DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`) para velocidade
- O atributo `referral_link` deve ser adicionado ao model como `$appends` com um accessor `getReferralLinkAttribute()`
