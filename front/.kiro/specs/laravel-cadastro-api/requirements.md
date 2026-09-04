# Documento de Requisitos

## Introdução

Este documento descreve os requisitos para o backend em Laravel 10 que dará suporte ao frontend de cadastro existente (React/TypeScript/Vite). O sistema permite que usuários se cadastrem em um movimento político, com suporte a rastreamento de indicações (referral tracking) por meio de links únicos gerados automaticamente para cada usuário cadastrado.

---

## Glossário

- **API**: Interface de programação de aplicações REST que o frontend consome via HTTP.
- **Usuário**: Pessoa que preenche o formulário de cadastro no frontend.
- **Referral_Code**: Código alfanumérico único gerado para cada usuário, usado para rastreamento de indicações.
- **Referral_Link**: URL completa contendo o Referral_Code que o usuário pode compartilhar.
- **Indicador**: Usuário que compartilhou seu Referral_Link e originou o cadastro de outro usuário.
- **Indicado**: Usuário que se cadastrou a partir do Referral_Link de um Indicador.
- **LGPD**: Lei Geral de Proteção de Dados — legislação brasileira de privacidade de dados.
- **RA**: Região Administrativa do Distrito Federal.

---

## Requisitos

### Requisito 1: Cadastro de Usuário

**User Story:** Como um visitante, quero preencher o formulário de cadastro, para que eu possa me juntar ao movimento e ter meu registro salvo.

#### Critérios de Aceitação

1. WHEN uma requisição POST válida é enviada para `/api/cadastro`, THE API SHALL persistir o usuário no banco de dados e retornar HTTP 201 com os dados do usuário criado, incluindo o `referral_link`.
2. THE API SHALL aceitar os seguintes campos no corpo da requisição: `nome` (string), `whatsapp` (string), `data_nascimento` (date), `endereco` (string), `cidade` (string), `email` (string), `lgpd_aceito` (boolean).
3. WHEN o campo `email` já existir no banco de dados, THE API SHALL retornar HTTP 422 com uma mensagem de erro indicando que o e-mail já está cadastrado.
4. WHEN o campo `whatsapp` já existir no banco de dados, THE API SHALL retornar HTTP 422 com uma mensagem de erro indicando que o WhatsApp já está cadastrado.
5. WHEN `lgpd_aceito` for `false` ou ausente na requisição, THE API SHALL retornar HTTP 422 com uma mensagem de erro indicando que o aceite dos termos é obrigatório.

---

### Requisito 2: Validação dos Dados de Entrada

**User Story:** Como desenvolvedor do sistema, quero que os dados recebidos sejam validados antes de persistir, para que o banco de dados contenha apenas dados íntegros.

#### Critérios de Aceitação

1. THE API SHALL validar que `nome` é uma string não vazia com no máximo 255 caracteres.
2. THE API SHALL validar que `whatsapp` contém apenas dígitos e tem entre 10 e 11 caracteres (sem formatação).
3. THE API SHALL validar que `data_nascimento` é uma data válida no formato `YYYY-MM-DD` e não é uma data futura.
4. THE API SHALL validar que `endereco` é uma string não vazia com no máximo 500 caracteres.
5. THE API SHALL validar que `cidade` é uma string não vazia com no máximo 255 caracteres.
6. THE API SHALL validar que `email` é um endereço de e-mail válido com no máximo 255 caracteres.
7. IF algum campo obrigatório estiver ausente ou inválido, THEN THE API SHALL retornar HTTP 422 com um objeto JSON contendo os erros de validação por campo.

---

### Requisito 3: Geração de Referral Code Único

**User Story:** Como usuário cadastrado, quero receber um link único de indicação, para que eu possa compartilhá-lo e rastrear quem se cadastrou por minha indicação.

#### Critérios de Aceitação

1. WHEN um novo usuário é criado com sucesso, THE API SHALL gerar automaticamente um `referral_code` alfanumérico único de 8 caracteres para esse usuário.
2. THE API SHALL garantir que nenhum dois usuários possuam o mesmo `referral_code`.
3. THE API SHALL retornar o `referral_link` completo no formato `{APP_URL}/cadastro?ref={referral_code}` na resposta de criação do usuário.
4. WHILE o `referral_code` gerado já existir no banco de dados, THE API SHALL gerar um novo código até obter um valor único.

---

### Requisito 4: Rastreamento de Indicação

**User Story:** Como gestor do movimento, quero saber quem indicou cada cadastro, para que eu possa acompanhar a rede de indicações e reconhecer os melhores indicadores.

#### Critérios de Aceitação

1. WHEN uma requisição POST para `/api/cadastro` contiver o campo `referral_code` no corpo, THE API SHALL associar o novo usuário ao Indicador correspondente ao código informado.
2. IF o `referral_code` informado não corresponder a nenhum usuário existente, THEN THE API SHALL retornar HTTP 422 com uma mensagem de erro indicando que o código de indicação é inválido.
3. WHERE o campo `referral_code` estiver ausente na requisição, THE API SHALL cadastrar o usuário sem associação a um Indicador.
4. THE API SHALL armazenar a referência ao `indicador_id` (chave estrangeira) no registro do usuário indicado.

---

### Requisito 5: Consulta de Indicados

**User Story:** Como gestor do movimento, quero consultar a lista de usuários indicados por um determinado indicador, para que eu possa visualizar o desempenho de cada membro da rede.

#### Critérios de Aceitação

1. WHEN uma requisição GET válida é enviada para `/api/usuarios/{referral_code}/indicados`, THE API SHALL retornar HTTP 200 com a lista de usuários indicados pelo dono do `referral_code`.
2. IF o `referral_code` informado não corresponder a nenhum usuário, THEN THE API SHALL retornar HTTP 404 com uma mensagem de erro.
3. THE API SHALL retornar para cada indicado os campos: `nome`, `cidade`, `data_cadastro`.
4. WHEN o usuário não tiver nenhum indicado, THE API SHALL retornar HTTP 200 com uma lista vazia.

---

### Requisito 6: CORS e Integração com o Frontend

**User Story:** Como desenvolvedor frontend, quero que a API aceite requisições do domínio do frontend, para que o formulário React possa se comunicar com o backend sem erros de CORS.

#### Critérios de Aceitação

1. THE API SHALL responder com os cabeçalhos CORS adequados para permitir requisições originadas do domínio configurado em `FRONTEND_URL`.
2. THE API SHALL aceitar requisições com `Content-Type: application/json`.
3. THE API SHALL retornar todas as respostas no formato JSON.
4. WHEN uma requisição OPTIONS (preflight) for recebida, THE API SHALL retornar HTTP 200 com os cabeçalhos CORS corretos.

---

### Requisito 7: Segurança e Proteção de Dados (LGPD)

**User Story:** Como responsável pelo sistema, quero que os dados pessoais sejam tratados de forma segura e em conformidade com a LGPD, para que o sistema esteja em conformidade legal.

#### Critérios de Aceitação

1. THE API SHALL armazenar a data e hora do aceite dos termos LGPD (`lgpd_aceito_em`) junto ao registro do usuário.
2. THE API SHALL armazenar senhas ou dados sensíveis somente de forma protegida — o campo `whatsapp` e `email` NÃO devem ser expostos em endpoints públicos de listagem.
3. THE API SHALL utilizar HTTPS em ambiente de produção (configuração de infraestrutura).
4. THE API SHALL sanitizar todos os dados de entrada para prevenir injeção de SQL e XSS antes de persistir no banco de dados.
