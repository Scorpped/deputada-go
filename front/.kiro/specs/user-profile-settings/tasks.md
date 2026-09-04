# Plano de Implementação: user-profile-settings

## Visão Geral

Implementação incremental da feature de configurações de perfil: backend (rota + validação + controller), frontend (API client + hook + página + rota) e testes.

## Tasks

- [x] 1. Criar `UpdateProfileRequest` e adicionar rota no backend
  - Criar `app/Http/Requests/UpdateProfileRequest.php` com as regras de validação descritas no design
  - Adicionar `PUT /api/auth/profile` ao grupo `auth:sanctum` em `routes/api.php`
  - _Requirements: 4.1, 4.3, 4.4, 4.5_

- [x] 2. Implementar `AuthController::updateProfile()`
  - [x] 2.1 Implementar o método `updateProfile()` no `AuthController`
    - Atualizar `name` e/ou `email` quando presentes no payload
    - Verificar `current_password` com `Hash::check()` antes de atualizar a senha
    - Retornar `{ id, name, email, role }` com HTTP 200
    - _Requirements: 4.2, 4.4, 4.5, 4.6, 3.2, 3.6_

  - [ ]* 2.2 Escrever testes de feature para `PUT /api/auth/profile`
    - Testar requisição sem autenticação retorna 401
    - Testar atualização de nome/email com sucesso retorna 200
    - Testar e-mail duplicado retorna 422
    - Testar senha atual incorreta retorna 422
    - Testar e-mail igual ao próprio usuário não é rejeitado como duplicado
    - _Requirements: 4.1, 4.2, 2.2, 3.2_

  - [ ]* 2.3 Escrever testes de propriedade (PHPUnit + Eris) para o endpoint
    - **Property 2: Atualização de dados pessoais retorna os dados atualizados** — Validates: Requirements 2.1, 4.6
    - **Property 3: Nome vazio é rejeitado pela API** — Validates: Requirements 2.3
    - **Property 4: E-mail inválido é rejeitado pela API** — Validates: Requirements 2.4
    - **Property 6: Alteração de senha com dados válidos retorna HTTP 200** — Validates: Requirements 3.1
    - **Property 7: Nova senha com menos de 8 caracteres é rejeitada** — Validates: Requirements 3.3
    - **Property 8: Confirmação de senha diferente da nova senha é rejeitada** — Validates: Requirements 3.4
    - **Property 10: Atualização de perfil afeta apenas o usuário autenticado** — Validates: Requirements 4.2
    - **Property 11: Atualização de dados pessoais não exige campos de senha** — Validates: Requirements 4.4
    - **Property 12: Envio parcial de campos de senha é rejeitado** — Validates: Requirements 4.5
    - Localização: `tests/Property/ProfileSettingsTest.php`

- [x] 3. Checkpoint — garantir que todos os testes de backend passam
  - Garantir que todos os testes passam; perguntar ao usuário se houver dúvidas.

- [x] 4. Adicionar `updateProfile()` ao API client e `updateUser` ao AuthContext
  - [x] 4.1 Adicionar função `updateProfile(payload: UpdateProfilePayload)` em `src/lib/api.ts`
    - Chamar `PUT /api/auth/profile` via `authFetch`
    - Aceitar payload parcial conforme interface `UpdateProfilePayload` do design
    - _Requirements: 4.1, 4.3_

  - [x] 4.2 Adicionar método `updateUser(user: AuthUser): void` ao `AuthContext`
    - Estender `AuthContextValue` com o método `updateUser`
    - Implementar a atualização do estado interno do contexto
    - _Requirements: 2.6_

- [x] 5. Implementar hook `useProfileSettings`
  - [x] 5.1 Criar `src/hooks/useProfileSettings.ts`
    - Carregar dados via `getMe()` na montagem do componente
    - Expor `profileForm`, `setProfileForm`, `submitProfile`, `profileStatus`, `profileError`
    - Expor `passwordForm`, `setPasswordForm`, `submitPassword`, `passwordStatus`, `passwordError`
    - Chamar `updateUser()` do `AuthContext` após atualização de perfil bem-sucedida
    - Limpar campos de senha após alteração bem-sucedida
    - _Requirements: 1.2, 1.3, 2.5, 2.6, 3.5_

  - [ ]* 5.2 Escrever testes unitários para `useProfileSettings`
    - Testar renderização dos dados do usuário nos campos do formulário
    - Testar exibição de erro quando `GET /api/auth/me` falha
    - Testar chamada ao endpoint correto com payload correto
    - Testar limpeza dos campos de senha após sucesso
    - Localização: `src/hooks/__tests__/useProfileSettings.test.ts`
    - _Requirements: 1.2, 1.3, 3.5_

  - [ ]* 5.3 Escrever testes de propriedade (Vitest + fast-check) para o hook
    - **Property 1: Dados do perfil exibidos correspondem ao usuário autenticado** — Validates: Requirements 1.1, 1.2
    - **Property 5: Sucesso na atualização de perfil sincroniza o AuthContext** — Validates: Requirements 2.6
    - **Property 9: Campos de senha são limpos após alteração bem-sucedida** — Validates: Requirements 3.5
    - Localização: `src/hooks/__tests__/useProfileSettings.property.test.ts`

- [x] 6. Implementar página `ProfileSettings` e adicionar rota
  - [x] 6.1 Criar `src/pages/painel/ProfileSettings.tsx`
    - Formulário de dados pessoais (nome e e-mail) usando componentes `ui/` existentes
    - Formulário de alteração de senha (senha atual, nova senha, confirmação)
    - Exibir mensagens de sucesso e erro para cada formulário
    - Exibir mensagem de erro com botão de retry quando o carregamento falhar
    - _Requirements: 1.1, 1.3, 2.5, 3.5_

  - [x] 6.2 Adicionar rota `/painel/perfil` apontando para `ProfileSettings`
    - Registrar a rota no arquivo de rotas do frontend para ambos os roles (`admin` e `lider`)
    - _Requirements: 1.1_

  - [ ]* 6.3 Escrever testes unitários para o componente `ProfileSettings`
    - Testar exibição dos dados do usuário nos campos
    - Testar exibição de mensagem de sucesso após atualização de perfil
    - Testar exibição de mensagem de sucesso e limpeza dos campos após alteração de senha
    - Testar exibição de erros de validação retornados pela API (422)
    - Localização: `src/pages/__tests__/ProfileSettings.test.tsx`
    - _Requirements: 1.1, 2.5, 3.5_

- [x] 7. Checkpoint final — garantir que todos os testes passam
  - Garantir que todos os testes passam; perguntar ao usuário se houver dúvidas.

## Notas

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia os requisitos específicos para rastreabilidade
- Testes de propriedade usam **fast-check** (frontend) e **Eris** (backend), ambos já presentes no projeto
- O modelo `User` já possui os campos necessários — nenhuma migração é necessária
