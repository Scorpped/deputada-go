# Plano de Implementação: Admin Panel

## Visão Geral

Implementação do painel administrativo com dois perfis (Admin e Líder), autenticação via Laravel Sanctum, API RESTful em Laravel e SPA React/TypeScript com rotas protegidas por perfil.

## Tasks

- [x] 1. Migration e extensão da tabela `users`
  - [x] 1.1 Criar migration para adicionar colunas `role`, `referral_code` e `active` na tabela `users`
    - Coluna `role`: enum `['admin', 'lider']`, not null
    - Coluna `referral_code`: string único, nullable
    - Coluna `active`: boolean, default `true`
    - Adicionar índice único em `referral_code`
    - _Requisitos: 2.3, 2.7, 6.5_

- [x] 2. Modelo User e lógica de domínio
  - [x] 2.1 Atualizar modelo `User` com fillable, casts, accessor e relacionamento
    - Adicionar `role`, `referral_code`, `active` ao `$fillable`
    - Cast `active` para boolean
    - Accessor `referral_link` que retorna `config('app.url') . '/cadastro?ref=' . $this->referral_code`
    - Relacionamento `indicados()` hasMany para model `Usuario` via coluna `referral_code`
    - _Requisitos: 2.2, 2.3, 5.2_

  - [ ]* 2.2 Escrever testes unitários para o modelo User
    - Testar accessor `referral_link` com e sem `referral_code`
    - Testar cast de `active`
    - _Requisitos: 2.2_

- [x] 3. Middleware de controle de acesso
  - [x] 3.1 Criar middleware `CheckRole` em `app/Http/Middleware/CheckRole.php`
    - Receber role esperada como parâmetro
    - Retornar HTTP 403 se o usuário autenticado não tiver a role correta
    - Registrar no `$routeMiddleware` do Kernel como `'role'`
    - _Requisitos: 6.2, 6.3, 6.5_

  - [ ]* 3.2 Escrever testes unitários para o middleware CheckRole
    - Testar acesso permitido com role correta
    - Testar HTTP 403 com role incorreta
    - Testar HTTP 401 sem autenticação
    - _Requisitos: 6.1, 6.2, 6.3_

- [x] 4. AuthController e autenticação Sanctum
  - [x] 4.1 Criar `LoginRequest` em `app/Http/Requests/LoginRequest.php`
    - Validar `email` (required, email) e `password` (required, string)
    - _Requisitos: 1.1, 1.4_

  - [x] 4.2 Criar `AuthController` em `app/Http/Controllers/AuthController.php`
    - Método `login`: autenticar via `Auth::attempt`, verificar `active`, criar token Sanctum, retornar token + dados do usuário
    - Retornar HTTP 401 para credenciais inválidas
    - Retornar HTTP 403 se líder estiver com `active = false`
    - Método `logout`: revogar token atual via `$request->user()->currentAccessToken()->delete()`
    - Método `me`: retornar dados do usuário autenticado
    - _Requisitos: 1.1, 1.4, 1.6, 1.9, 2.7_

  - [ ]* 4.3 Escrever testes de feature para AuthController
    - Testar login com credenciais válidas (admin e lider)
    - Testar login com credenciais inválidas → HTTP 401
    - Testar login com líder inativo → HTTP 403
    - Testar logout → token invalidado
    - Testar `GET /api/auth/me` com token válido e sem token
    - _Requisitos: 1.1, 1.4, 1.6, 1.9, 2.7, 6.1_

- [x] 5. Admin\LiderController
  - [x] 5.1 Criar `StoreLiderRequest` e `UpdateLiderRequest` em `app/Http/Requests/Admin/`
    - `StoreLiderRequest`: validar `name` (required), `email` (required, email, unique:users), `password` (required, min:8)
    - `UpdateLiderRequest`: validar `name` (required), `email` (required, email, unique:users exceto o próprio)
    - _Requisitos: 2.8, 2.9_

  - [x] 5.2 Criar `Admin\LiderController` em `app/Http/Controllers/Admin/LiderController.php`
    - Método `index`: listar líderes paginados (15 por página), incluindo contagem de `indicados`
    - Método `store`: criar User com role `lider`, gerar `referral_code` único (Str::random(8)), hash da senha
    - Método `update`: atualizar `name` e `email` do líder
    - Método `toggle`: alternar campo `active` do líder
    - Retornar os campos: `id`, `name`, `email`, `referral_code`, `referral_link`, `active`, `created_at`, `total_indicados`
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.8, 2.9_

  - [ ]* 5.3 Escrever testes de feature para Admin\LiderController
    - Testar listagem paginada com e sem líderes
    - Testar criação com dados válidos → líder criado com referral_code gerado
    - Testar criação com email duplicado → HTTP 422
    - Testar criação com senha curta → HTTP 422
    - Testar atualização de nome e email
    - Testar toggle de ativação/desativação
    - Testar acesso por líder → HTTP 403
    - Testar acesso sem token → HTTP 401
    - _Requisitos: 2.1, 2.3, 2.5, 2.6, 2.7, 2.8, 2.9, 6.1, 6.2_

- [x] 6. Admin\ApoiadorController
  - [x] 6.1 Criar `Admin\ApoiadorController` em `app/Http/Controllers/Admin/ApoiadorController.php`
    - Método `index`: listar apoiadores paginados (15 por página) da tabela `usuarios`
    - Suportar parâmetro `search` para filtrar por nome, email ou cidade (LIKE `%search%`)
    - Suportar parâmetros `page` e `per_page`
    - Incluir nome do indicador via join/eager load com tabela `users` pelo `referral_code`
    - Retornar campos: `id`, `nome`, `email`, `whatsapp`, `cidade`, `data_nascimento`, `referral_code`, `created_at`, `nome_indicador`
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.6_

  - [ ]* 6.2 Escrever testes de feature para Admin\ApoiadorController
    - Testar listagem paginada
    - Testar busca por nome, email e cidade
    - Testar busca sem resultados → lista vazia
    - Testar acesso por líder → HTTP 403
    - Testar acesso sem token → HTTP 401
    - _Requisitos: 3.1, 3.3, 3.4, 3.6, 6.1, 6.2_

- [ ] 7. Admin\DashboardController
  - [x] 7.1 Criar `Admin\DashboardController` em `app/Http/Controllers/Admin/DashboardController.php`
    - Método `index`: retornar `total_apoiadores` (count da tabela `usuarios`), `total_lideres` (count de users com role `lider`), `cadastros_por_dia` (agrupamento por data dos últimos 30 dias da tabela `usuarios`)
    - _Requisitos: 4.1, 4.2_

  - [ ]* 7.2 Escrever testes de feature para Admin\DashboardController
    - Testar retorno dos campos esperados
    - Testar que `cadastros_por_dia` cobre os últimos 30 dias
    - Testar acesso por líder → HTTP 403
    - _Requisitos: 4.1, 4.2, 6.2_

- [x] 8. Lider\DashboardController
  - [x] 8.1 Criar `Lider\DashboardController` em `app/Http/Controllers/Lider/DashboardController.php`
    - Método `index`: retornar `total_indicados` e `cadastros_por_dia` filtrados pelo `referral_code` do usuário autenticado
    - Garantir que nenhum dado pessoal de apoiadores seja exposto
    - _Requisitos: 5.1, 5.2, 5.7, 5.8_

  - [ ]* 8.2 Escrever testes de feature para Lider\DashboardController
    - Testar que retorna apenas dados do líder autenticado
    - Testar que não expõe dados de outros líderes
    - Testar acesso por admin → HTTP 403
    - Testar acesso sem token → HTTP 401
    - _Requisitos: 5.1, 5.2, 5.7, 6.1, 6.3_

- [x] 9. Registro de rotas da API
  - [x] 9.1 Registrar todas as rotas em `routes/api.php` com middlewares corretos
    - Grupo público: `POST /api/auth/login`
    - Grupo `auth:sanctum`: `POST /api/auth/logout`, `GET /api/auth/me`
    - Grupo `auth:sanctum` + `role:admin`: prefixo `/api/admin` → rotas de lideres, apoiadores e dashboard admin
    - Grupo `auth:sanctum` + `role:lider`: prefixo `/api/lider` → rota de dashboard lider
    - _Requisitos: 1.1, 1.6, 1.9, 6.1, 6.4, 6.5_

- [x] 10. AdminSeeder
  - [x] 10.1 Criar `AdminSeeder` em `database/seeders/AdminSeeder.php`
    - Criar usuário admin com email `admin@admin.com` (ou via env `ADMIN_EMAIL`) e senha via `env('ADMIN_PASSWORD')`
    - Verificar se já existe antes de criar (idempotente)
    - Registrar no `DatabaseSeeder`
    - _Requisitos: 1.1_

- [x] 11. Checkpoint Backend — Garantir que todos os testes PHPUnit passam
  - Executar `php artisan test` e corrigir falhas antes de prosseguir para o frontend.

- [x] 12. AuthContext e useAuth hook
  - [x] 12.1 Criar `AuthContext` em `src/contexts/AuthContext.tsx`
    - Estado: `token`, `user` (com campos `id`, `name`, `email`, `role`), `isAuthenticated`, `isLoading`
    - Persistir token no `localStorage`
    - Funções: `login(email, password)`, `logout()`
    - Escutar evento de sessão expirada disparado pelo ApiClient para redirecionar ao login
    - _Requisitos: 1.2, 1.6, 1.7, 7.3_

  - [x] 12.2 Criar hook `useAuth` em `src/hooks/useAuth.ts`
    - Retornar o contexto de autenticação via `useContext(AuthContext)`
    - Lançar erro se usado fora do `AuthProvider`
    - _Requisitos: 1.2, 1.7_

- [x] 13. Extensão do ApiClient
  - [x] 13.1 Estender `src/lib/api.ts` com função `authFetch` e todos os novos endpoints
    - `authFetch(url, options)`: wrapper que injeta `Authorization: Bearer {token}` e dispara evento `auth:expired` em HTTP 401
    - `login(email, password)`: `POST /api/auth/login`
    - `logout()`: `POST /api/auth/logout`
    - `getMe()`: `GET /api/auth/me`
    - `getLideres(params)`: `GET /api/admin/lideres` com suporte a `page` e `per_page`
    - `createLider(data)`: `POST /api/admin/lideres`
    - `updateLider(id, data)`: `PUT /api/admin/lideres/{id}`
    - `toggleLider(id)`: `PATCH /api/admin/lideres/{id}/toggle`
    - `getApoiadores(params)`: `GET /api/admin/apoiadores` com suporte a `page`, `per_page` e `search`
    - `getAdminDashboard()`: `GET /api/admin/dashboard`
    - `getLiderDashboard()`: `GET /api/lider/dashboard`
    - _Requisitos: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 13.2 Escrever testes de propriedade para authFetch
    - **Propriedade 1: authFetch sempre injeta header Authorization com token não-vazio**
    - **Valida: Requisito 7.1**

  - [ ]* 13.3 Escrever testes unitários para as funções do ApiClient
    - Testar que cada função chama o endpoint correto com os parâmetros esperados
    - Testar que HTTP 401 dispara evento `auth:expired`
    - Testar parâmetros de paginação e busca
    - _Requisitos: 7.1, 7.2, 7.3, 7.4_

- [x] 14. Hooks de dados do painel
  - [x] 14.1 Criar `useAdminDashboard` em `src/hooks/useAdminDashboard.ts`
    - Chamar `getAdminDashboard()`, retornar `{ data, isLoading, error, refetch }`
    - _Requisitos: 4.1, 4.5, 4.6_

  - [x] 14.2 Criar `useLiderDashboard` em `src/hooks/useLiderDashboard.ts`
    - Chamar `getLiderDashboard()`, retornar `{ data, isLoading, error, refetch }`
    - _Requisitos: 5.1, 5.5, 5.6_

  - [x] 14.3 Criar `useLideres` em `src/hooks/useLideres.ts`
    - Chamar `getLideres(params)`, retornar `{ data, isLoading, error, page, setPage, refetch }`
    - _Requisitos: 2.1, 3.5_

  - [x] 14.4 Criar `useApoiadores` em `src/hooks/useApoiadores.ts`
    - Chamar `getApoiadores(params)`, retornar `{ data, isLoading, error, page, setPage, search, setSearch, refetch }`
    - _Requisitos: 3.1, 3.4, 3.5_

- [x] 15. ProtectedRoute e PainelLayout
  - [x] 15.1 Criar `ProtectedRoute` em `src/components/ProtectedRoute.tsx`
    - Redirecionar para `/login` se não autenticado
    - Aceitar prop `allowedRoles` para redirecionar para rota correta se role não permitida
    - _Requisitos: 1.7, 1.8_

  - [x] 15.2 Criar `PainelLayout` em `src/components/PainelLayout.tsx`
    - Sidebar com links de navegação condicionais por role
    - Header com nome do usuário e botão de logout
    - Chamar `logout()` do `useAuth` ao clicar em logout
    - _Requisitos: 1.6_

- [x] 16. Página de Login
  - [x] 16.1 Criar `src/pages/Login.tsx`
    - Formulário com campos email e senha
    - Chamar `login()` do `useAuth` ao submeter
    - Desabilitar botão e exibir loading durante requisição
    - Exibir mensagem de erro abaixo do formulário em caso de falha
    - Redirecionar para `/painel` após login bem-sucedido
    - _Requisitos: 1.1, 1.4, 1.5_

- [x] 17. Página de entrada do painel
  - [x] 17.1 Criar `src/pages/painel/Index.tsx`
    - Redirecionar para `/painel/admin` se role for `admin`
    - Redirecionar para `/painel/lider` se role for `lider`
    - _Requisitos: 1.3_

- [x] 18. Dashboard Admin
  - [x] 18.1 Criar `src/pages/painel/admin/Dashboard.tsx`
    - Usar `useAdminDashboard` para buscar dados
    - Exibir cards com `total_apoiadores` e `total_lideres`
    - Exibir gráfico de linha/barras com `cadastros_por_dia` usando Recharts
    - Exibir skeleton/loading enquanto carrega
    - Exibir mensagem de erro com botão de retry em caso de falha
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_


- [x] 19. Página de Líderes (Admin)
  - [x] 19.1 Criar `src/pages/painel/admin/Lideres.tsx`
    - Usar `useLideres` para buscar dados paginados
    - Tabela com colunas: nome, email, referral_link, status (ativo/inativo), total indicados, ações
    - Botão para abrir modal de criação de líder
    - Botão de edição por linha para abrir modal de edição
    - Toggle de ativação/desativação por linha chamando `toggleLider`
    - Exibir `referral_link` completo após criação bem-sucedida
    - Exibir erros de validação abaixo dos campos no modal
    - Exibir loading na tabela durante troca de página
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.8, 2.9_

- [x] 20. Página de Apoiadores (Admin)
  - [x] 20.1 Criar `src/pages/painel/admin/Apoiadores.tsx`
    - Usar `useApoiadores` para buscar dados paginados com busca
    - Tabela com colunas: nome, email, whatsapp, cidade, data_nascimento, indicador, data de cadastro
    - Campo de busca que dispara `setSearch` com debounce
    - Paginação com controles de página
    - Exibir loading na tabela durante busca ou troca de página
    - Exibir mensagem informativa quando lista estiver vazia
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 21. Dashboard Líder
  - [x] 21.1 Criar `src/pages/painel/lider/Dashboard.tsx`
    - Usar `useLiderDashboard` para buscar dados
    - Exibir card com `total_indicados`
    - Exibir gráfico de linha/barras com `cadastros_por_dia` usando Recharts
    - Exibir skeleton/loading enquanto carrega
    - Exibir mensagem de erro com botão de retry em caso de falha
    - Nunca exibir dados pessoais de apoiadores
    - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.8_

- [x] 22. Registro de rotas no App.tsx
  - [x] 22.1 Atualizar `src/App.tsx` com todas as rotas do painel
    - Rota pública: `/login` → `Login`
    - Rota protegida `/painel` → `PainelLayout` wrapping:
      - `/painel` → `painel/Index` (redirect por role)
      - `/painel/admin` → `ProtectedRoute` (role: admin) → `admin/Dashboard`
      - `/painel/admin/lideres` → `ProtectedRoute` (role: admin) → `admin/Lideres`
      - `/painel/admin/apoiadores` → `ProtectedRoute` (role: admin) → `admin/Apoiadores`
      - `/painel/lider` → `ProtectedRoute` (role: lider) → `lider/Dashboard`
    - Envolver toda a aplicação com `AuthProvider`
    - _Requisitos: 1.2, 1.3, 1.7, 1.8_

- [x] 23. Checkpoint Frontend — Garantir que todos os testes Vitest passam
  - Executar `vitest --run` e corrigir falhas antes de prosseguir.

- [x] 24. Testes de AuthContext e ApiClient
  - [ ]* 24.1 Escrever testes de propriedade para AuthContext
    - **Propriedade 2: login seguido de logout sempre resulta em estado não autenticado**
    - **Valida: Requisito 1.6**
    - **Propriedade 3: token persistido no localStorage é sempre o mesmo do estado do contexto**
    - **Valida: Requisito 1.2**

  - [ ]* 24.2 Escrever testes unitários para AuthContext
    - Testar login bem-sucedido → token e user armazenados
    - Testar logout → estado limpo e localStorage limpo
    - Testar evento `auth:expired` → logout automático
    - Testar redirecionamento para `/login` quando não autenticado
    - _Requisitos: 1.2, 1.6, 1.7, 7.3_

- [x] 25. Testes de componentes das páginas do painel
  - [ ]* 25.1 Escrever testes de componente para `Login.tsx`
    - Testar renderização do formulário
    - Testar estado de loading durante submit
    - Testar exibição de erro em credenciais inválidas
    - _Requisitos: 1.4, 1.5_

  - [ ]* 25.2 Escrever testes de componente para `ProtectedRoute`
    - Testar redirecionamento para `/login` sem autenticação
    - Testar redirecionamento por role incorreta
    - Testar renderização do filho com role correta
    - _Requisitos: 1.7, 1.8_

  - [ ]* 25.3 Escrever testes de componente para `admin/Dashboard.tsx`
    - Testar exibição de skeleton durante loading
    - Testar exibição de cards com dados
    - Testar exibição de erro com botão de retry
    - _Requisitos: 4.3, 4.4, 4.5, 4.6_

  - [ ]* 25.4 Escrever testes de componente para `admin/Lideres.tsx`
    - Testar renderização da tabela com dados
    - Testar abertura e submissão do modal de criação
    - Testar exibição de erros de validação
    - Testar toggle de ativação
    - _Requisitos: 2.1, 2.4, 2.8, 2.9_

- [ ] 26. Checkpoint Final — Garantir que todos os testes passam
  - Executar `vitest --run` e `php artisan test`. Corrigir qualquer falha antes de concluir.

## Notas

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia os requisitos correspondentes para rastreabilidade
- Os checkpoints garantem validação incremental antes de avançar para a próxima camada
- Testes de propriedade validam invariantes universais; testes unitários validam exemplos e casos de borda
