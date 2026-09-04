# Requirements Document

## Introduction

Esta feature permite que o usuário autenticado no painel (admin ou líder) visualize e edite seus próprios dados de perfil, incluindo nome, e-mail e senha. A funcionalidade é acessível a partir do painel, sem depender de ação de um administrador.

## Glossary

- **Profile_Settings**: Módulo de configurações de perfil do usuário autenticado
- **User**: Usuário autenticado no painel, podendo ter role `admin` ou `lider`
- **API**: Backend Laravel acessível via HTTP com autenticação Sanctum
- **Current_Password**: Senha atual do usuário, usada para confirmar identidade antes de alterações sensíveis
- **Password_Confirmation**: Campo de confirmação que deve ser idêntico ao novo campo de senha

## Requirements

### Requirement 1: Visualizar dados do perfil

**User Story:** Como usuário autenticado, quero visualizar meus dados de perfil, para que eu possa conferir as informações cadastradas na minha conta.

#### Acceptance Criteria

1. WHEN o usuário acessa a página de configurações de perfil, THE Profile_Settings SHALL exibir o nome e o e-mail atuais do usuário autenticado.
2. THE Profile_Settings SHALL carregar os dados do perfil a partir do endpoint autenticado `GET /api/auth/me`.
3. IF a requisição ao endpoint falhar, THEN THE Profile_Settings SHALL exibir uma mensagem de erro informando que não foi possível carregar os dados.

---

### Requirement 2: Atualizar nome e e-mail

**User Story:** Como usuário autenticado, quero alterar meu nome e e-mail, para que eu possa manter meus dados cadastrais atualizados.

#### Acceptance Criteria

1. WHEN o usuário submete o formulário de dados pessoais com nome e e-mail válidos, THE API SHALL atualizar os dados do usuário autenticado e retornar HTTP 200 com os dados atualizados.
2. IF o e-mail informado já estiver em uso por outro usuário, THEN THE API SHALL retornar HTTP 422 com mensagem de erro indicando que o e-mail já está cadastrado.
3. IF o campo nome estiver vazio, THEN THE API SHALL retornar HTTP 422 com mensagem de erro de validação.
4. IF o campo e-mail estiver vazio ou em formato inválido, THEN THE API SHALL retornar HTTP 422 com mensagem de erro de validação.
5. WHEN a atualização for concluída com sucesso, THE Profile_Settings SHALL exibir uma mensagem de confirmação ao usuário.
6. WHEN a atualização for concluída com sucesso, THE Profile_Settings SHALL atualizar os dados do usuário no contexto de autenticação local (AuthContext).

---

### Requirement 3: Alterar senha

**User Story:** Como usuário autenticado, quero alterar minha senha, para que eu possa manter minha conta segura.

#### Acceptance Criteria

1. WHEN o usuário submete o formulário de alteração de senha com senha atual correta, nova senha e confirmação válidas, THE API SHALL atualizar a senha do usuário autenticado e retornar HTTP 200.
2. IF a senha atual informada estiver incorreta, THEN THE API SHALL retornar HTTP 422 com mensagem de erro indicando que a senha atual está incorreta.
3. IF a nova senha tiver menos de 8 caracteres, THEN THE API SHALL retornar HTTP 422 com mensagem de erro de validação.
4. IF o campo de confirmação de senha for diferente do campo de nova senha, THEN THE API SHALL retornar HTTP 422 com mensagem de erro de validação.
5. WHEN a alteração de senha for concluída com sucesso, THE Profile_Settings SHALL exibir uma mensagem de confirmação e limpar os campos do formulário de senha.
6. THE API SHALL exigir a senha atual (Current_Password) antes de permitir a alteração, para confirmar a identidade do usuário.

---

### Requirement 4: Endpoint de atualização de perfil no backend

**User Story:** Como desenvolvedor, quero um endpoint dedicado para atualização de perfil, para que o frontend possa enviar alterações de dados e senha de forma segura.

#### Acceptance Criteria

1. THE API SHALL expor o endpoint `PUT /api/auth/profile` protegido pelo middleware `auth:sanctum`.
2. WHEN uma requisição válida é recebida em `PUT /api/auth/profile`, THE API SHALL aplicar as alterações apenas ao usuário autenticado identificado pelo token Sanctum.
3. THE API SHALL aceitar os campos opcionais `name`, `email`, `current_password`, `password` e `password_confirmation` no corpo da requisição.
4. IF apenas `name` e/ou `email` forem enviados (sem campos de senha), THEN THE API SHALL atualizar somente os dados pessoais sem exigir senha atual.
5. IF qualquer campo de senha (`current_password`, `password`, `password_confirmation`) for enviado, THEN THE API SHALL exigir que todos os três campos estejam presentes e válidos.
6. THE API SHALL retornar os dados atualizados do usuário (`id`, `name`, `email`, `role`) no corpo da resposta HTTP 200.
