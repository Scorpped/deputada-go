# Documento de Requisitos

## Introdução

Este documento descreve os requisitos para o painel administrativo do sistema de cadastro de apoiadores. O painel oferece dois perfis de acesso distintos: **Admin**, que gerencia líderes e visualiza todos os apoiadores com dados completos; e **Líder**, que visualiza apenas métricas agregadas dos apoiadores captados pelo seu próprio link de indicação, sem acesso a dados pessoais.

A autenticação é feita via email e senha com tokens Bearer (Laravel Sanctum). Líderes são entidades separadas dos apoiadores, armazenadas na tabela `users` do Laravel com controle de roles. O frontend é uma SPA React/TypeScript com rotas protegidas por perfil.

---

## Glossário

- **Admin**: Perfil de acesso com permissões totais — gerencia líderes, visualiza todos os apoiadores e acessa o dashboard geral.
- **Líder**: Perfil de acesso restrito — visualiza apenas métricas agregadas dos apoiadores captados pelo seu próprio `referral_code`, sem acesso a dados pessoais.
- **Apoiador**: Registro na tabela `usuarios` — pessoa que preencheu o formulário público de cadastro.
- **User**: Registro na tabela `users` do Laravel — entidade de autenticação com role `admin` ou `lider`.
- **Sanctum**: Biblioteca de autenticação do Laravel que emite tokens Bearer para APIs.
- **Token Bearer**: Token de autenticação enviado no header `Authorization: Bearer {token}` em todas as requisições autenticadas.
- **Referral_Code**: Código alfanumérico único associado a um Líder, usado para rastrear apoiadores captados por ele.
- **Referral_Link**: URL completa no formato `{APP_URL}/cadastro?ref={referral_code}` que o Líder distribui para captar apoiadores.
- **Role**: Atributo do modelo `User` que define o perfil de acesso (`admin` ou `lider`).
- **Dashboard Admin**: Página `/painel/admin` com métricas gerais: total de apoiadores, total de líderes e gráfico de cadastros por dia nos últimos 30 dias.
- **Dashboard Líder**: Página `/painel/lider` com métricas do líder: total de apoiadores indicados e gráfico de evolução dos seus cadastros por dia nos últimos 30 dias.
- **ApiClient**: Módulo centralizado de chamadas HTTP do frontend, já existente em `cadastro-main/src/lib/`.
- **AuthContext**: Contexto React que armazena o estado de autenticação (token, perfil do usuário) e disponibiliza funções de login/logout.
- **Rota Protegida**: Rota do frontend que redireciona para `/login` caso o usuário não esteja autenticado.

---

## Requisitos

### Requisito 1: Autenticação

**User Story:** Como usuário do painel (Admin ou Líder), quero fazer login com email e senha, para que eu possa acessar as funcionalidades do painel de acordo com meu perfil.

#### Critérios de Aceitação

1. WHEN um usuário submeter o formulário de login com email e senha válidos, THE Sistema SHALL autenticar o usuário via `POST /api/auth/login` e retornar um token Bearer junto com os dados do perfil.
2. WHEN a autenticação for bem-sucedida, THE Frontend SHALL armazenar o token Bearer e os dados do usuário no `AuthContext` e redirecionar para `/painel`.
3. WHEN o usuário acessar `/painel`, THE Frontend SHALL redirecionar para `/painel/admin` se o perfil for `admin`, ou para `/painel/lider` se o perfil for `lider`.
4. WHEN um usuário submeter credenciais inválidas, THE Sistema SHALL retornar HTTP 401 e THE Frontend SHALL exibir mensagem de erro no formulário de login.
5. WHILE uma requisição de login estiver em andamento, THE Frontend SHALL desabilitar o botão de login e exibir indicador de carregamento.
6. WHEN o usuário clicar em logout, THE Sistema SHALL invalidar o token via `POST /api/auth/logout` e THE Frontend SHALL limpar o `AuthContext` e redirecionar para `/login`.
7. WHEN um usuário não autenticado tentar acessar qualquer rota do painel (`/painel/*`), THE Frontend SHALL redirecionar para `/login`.
8. WHEN um usuário autenticado como `lider` tentar acessar rotas exclusivas de admin (`/painel/admin/*`), THE Frontend SHALL redirecionar para `/painel/lider`.
9. THE Sistema SHALL expor o endpoint `GET /api/auth/me` que retorna os dados do usuário autenticado a partir do token Bearer.

---

### Requisito 2: Gerenciamento de Líderes (Admin)

**User Story:** Como Admin, quero criar, editar e desativar líderes, para que eu possa controlar quem tem acesso ao painel e distribuir links de indicação.

#### Critérios de Aceitação

1. WHEN o Admin acessar `/painel/admin/lideres`, THE Frontend SHALL exibir a lista paginada de líderes via `GET /api/admin/lideres`.
2. THE Sistema SHALL retornar na listagem de líderes os campos: `id`, `name`, `email`, `referral_code`, `referral_link`, `active`, `created_at` e o total de apoiadores indicados.
3. WHEN o Admin submeter o formulário de criação com nome, email e senha válidos, THE Sistema SHALL criar um novo `User` com role `lider` via `POST /api/admin/lideres` e gerar automaticamente um `referral_code` único.
4. WHEN a criação de líder for bem-sucedida, THE Frontend SHALL exibir o novo líder na lista e mostrar o `referral_link` completo para o Admin copiar.
5. WHEN o Admin submeter o formulário de edição com dados válidos, THE Sistema SHALL atualizar nome e email do líder via `PUT /api/admin/lideres/{id}`.
6. WHEN o Admin acionar o toggle de ativação/desativação, THE Sistema SHALL alternar o status `active` do líder via `PATCH /api/admin/lideres/{id}/toggle`.
7. WHEN um líder estiver desativado, THE Sistema SHALL rejeitar tentativas de login desse líder com HTTP 403.
8. IF o Admin tentar criar um líder com email já cadastrado, THEN THE Sistema SHALL retornar HTTP 422 com mensagem de erro no campo `email` e THE Frontend SHALL exibir a mensagem abaixo do campo.
9. IF o Admin tentar criar um líder com senha com menos de 8 caracteres, THEN THE Sistema SHALL retornar HTTP 422 com mensagem de erro no campo `password` e THE Frontend SHALL exibir a mensagem abaixo do campo.

---

### Requisito 3: Visualização de Apoiadores (Admin)

**User Story:** Como Admin, quero visualizar todos os apoiadores cadastrados com seus dados completos, paginação e busca, para que eu possa consultar e gerenciar a base de apoiadores.

#### Critérios de Aceitação

1. WHEN o Admin acessar `/painel/admin/apoiadores`, THE Frontend SHALL exibir a lista paginada de apoiadores via `GET /api/admin/apoiadores`.
2. THE Sistema SHALL retornar na listagem de apoiadores os campos: `id`, `nome`, `email`, `whatsapp`, `cidade`, `data_nascimento`, `referral_code`, `created_at` e o nome do indicador (se houver).
3. THE Sistema SHALL suportar paginação via parâmetros `page` e `per_page` no endpoint `GET /api/admin/apoiadores`.
4. WHEN o Admin digitar um termo no campo de busca, THE Frontend SHALL enviar o parâmetro `search` para `GET /api/admin/apoiadores` e exibir apenas os apoiadores cujo nome, email ou cidade contenham o termo buscado.
5. WHILE uma busca ou troca de página estiver em andamento, THE Frontend SHALL exibir indicador de carregamento na tabela.
6. WHEN a listagem de apoiadores estiver vazia ou a busca não retornar resultados, THE Frontend SHALL exibir mensagem informativa ao Admin.

---

### Requisito 4: Dashboard do Admin

**User Story:** Como Admin, quero visualizar métricas gerais do sistema em um dashboard, para que eu possa acompanhar o crescimento da base de apoiadores e a performance dos líderes.

#### Critérios de Aceitação

1. WHEN o Admin acessar `/painel/admin`, THE Frontend SHALL buscar as métricas via `GET /api/admin/dashboard`.
2. THE Sistema SHALL retornar no endpoint `GET /api/admin/dashboard` os campos: `total_apoiadores`, `total_lideres` e `cadastros_por_dia` (array com data e quantidade para os últimos 30 dias).
3. THE Frontend SHALL exibir cards com os valores de `total_apoiadores` e `total_lideres`.
4. THE Frontend SHALL exibir um gráfico de linha ou barras com a evolução de `cadastros_por_dia` nos últimos 30 dias.
5. WHILE os dados do dashboard estiverem sendo carregados, THE Frontend SHALL exibir estados de skeleton/loading nos cards e no gráfico.
6. IF o endpoint `GET /api/admin/dashboard` retornar erro, THEN THE Frontend SHALL exibir mensagem de erro e botão para tentar novamente.

---

### Requisito 5: Dashboard do Líder

**User Story:** Como Líder, quero visualizar quantos apoiadores vieram pelo meu link e a evolução dos meus cadastros ao longo do tempo, para que eu possa acompanhar minha performance de captação.

#### Critérios de Aceitação

1. WHEN o Líder acessar `/painel/lider`, THE Frontend SHALL buscar as métricas via `GET /api/lider/dashboard`.
2. THE Sistema SHALL retornar no endpoint `GET /api/lider/dashboard` os campos: `total_indicados` e `cadastros_por_dia` (array com data e quantidade para os últimos 30 dias) referentes exclusivamente aos apoiadores captados pelo `referral_code` do líder autenticado.
3. THE Frontend SHALL exibir um card com o valor de `total_indicados`.
4. THE Frontend SHALL exibir um gráfico de linha ou barras com a evolução de `cadastros_por_dia` nos últimos 30 dias.
5. WHILE os dados do dashboard estiverem sendo carregados, THE Frontend SHALL exibir estados de skeleton/loading no card e no gráfico.
6. IF o endpoint `GET /api/lider/dashboard` retornar erro, THEN THE Frontend SHALL exibir mensagem de erro e botão para tentar novamente.
7. THE Sistema SHALL garantir que o endpoint `GET /api/lider/dashboard` retorne apenas dados do líder autenticado, sem expor dados de outros líderes.
8. THE Frontend SHALL nunca exibir dados pessoais de apoiadores (nome, email, whatsapp, endereço) no dashboard do Líder.

---

### Requisito 6: Controle de Acesso e Segurança da API

**User Story:** Como sistema, quero garantir que cada endpoint seja acessível apenas pelo perfil autorizado, para que dados sensíveis não sejam expostos a usuários sem permissão.

#### Critérios de Aceitação

1. WHEN uma requisição sem token Bearer for feita a qualquer endpoint autenticado, THE Sistema SHALL retornar HTTP 401.
2. WHEN um líder autenticado tentar acessar endpoints exclusivos de admin (`/api/admin/*`), THE Sistema SHALL retornar HTTP 403.
3. WHEN um admin autenticado tentar acessar o endpoint exclusivo de líder (`/api/lider/dashboard`), THE Sistema SHALL retornar HTTP 403.
4. THE Sistema SHALL aplicar middleware de autenticação Sanctum em todos os endpoints de `/api/auth/me`, `/api/admin/*` e `/api/lider/*`.
5. THE Sistema SHALL aplicar middleware de verificação de role em todos os endpoints de `/api/admin/*` (role `admin`) e `/api/lider/*` (role `lider`).
6. IF um token Bearer expirado ou inválido for enviado, THEN THE Sistema SHALL retornar HTTP 401 e THE Frontend SHALL redirecionar o usuário para `/login`.

---

### Requisito 7: Extensão do ApiClient para Endpoints do Painel

**User Story:** Como desenvolvedor, quero que o ApiClient existente seja estendido com os novos endpoints do painel, para que toda comunicação com a API seja centralizada e consistente.

#### Critérios de Aceitação

1. THE ApiClient SHALL enviar o header `Authorization: Bearer {token}` em todas as requisições autenticadas do painel.
2. THE ApiClient SHALL expor funções tipadas para cada novo endpoint: `login`, `logout`, `getMe`, `getLideres`, `createLider`, `updateLider`, `toggleLider`, `getApoiadores`, `getAdminDashboard` e `getLiderDashboard`.
3. WHEN o ApiClient receber HTTP 401 em qualquer requisição autenticada, THE ApiClient SHALL disparar um evento de sessão expirada que o `AuthContext` captura para redirecionar o usuário ao login.
4. THE ApiClient SHALL suportar parâmetros de paginação (`page`, `per_page`) e busca (`search`) nas funções `getLideres` e `getApoiadores`.
