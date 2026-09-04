# Documento de Requisitos

## Introdução

Este documento descreve os requisitos para a integração do frontend React (TypeScript + Vite + TailwindCSS + shadcn/ui) com a API REST Laravel já existente. O frontend possui um formulário de cadastro em `src/pages/Index.tsx` que atualmente utiliza um mock com `setTimeout` — sem nenhuma chamada real à API. A integração deve substituir esse mock por chamadas reais, tratar erros de validação por campo, exibir dados dinâmicos do indicador e configurar o ambiente para apontar ao backend.

---

## Glossário

- **Frontend**: Aplicação React/TypeScript/Vite localizada em `cadastro-main/`.
- **API**: Backend Laravel 10 REST localizado em `cadastro-api/`, que expõe os endpoints de cadastro e consulta de indicados.
- **VITE_API_URL**: Variável de ambiente do Vite que armazena a URL base da API Laravel.
- **ApiClient**: Módulo de serviço HTTP do frontend responsável por todas as chamadas à API.
- **Referral_Code**: Código alfanumérico único de 8 caracteres gerado pela API para cada usuário cadastrado.
- **Referral_Link**: URL completa contendo o Referral_Code que o usuário pode compartilhar.
- **Indicador**: Usuário que compartilhou seu Referral_Link e originou o cadastro de outro usuário.
- **Indicado**: Usuário que se cadastrou a partir do Referral_Link de um Indicador.
- **Query Param `ref`**: Parâmetro de URL `?ref={referral_code}` presente na URL quando o usuário acessa a página via link de indicação.
- **Erro 422**: Resposta HTTP da API indicando falha de validação, com objeto `errors` contendo mensagens por campo.
- **Toast**: Notificação visual temporária exibida via biblioteca `sonner`.
- **React Query**: Biblioteca `@tanstack/react-query` usada para gerenciamento de estado assíncrono e cache de requisições.
- **react-hook-form**: Biblioteca de gerenciamento de formulários já instalada no projeto.
- **zod**: Biblioteca de validação de esquemas já instalada no projeto.

---

## Requisitos

### Requisito 1: Configuração do Ambiente

**User Story:** Como desenvolvedor, quero configurar a variável de ambiente `VITE_API_URL`, para que o frontend saiba qual URL base usar ao chamar a API Laravel.

#### Critérios de Aceitação

1. THE Frontend SHALL ler a URL base da API exclusivamente a partir da variável de ambiente `VITE_API_URL`.
2. WHEN o arquivo `.env` não definir `VITE_API_URL`, THE ApiClient SHALL utilizar `http://localhost:8000` como valor padrão.
3. THE Frontend SHALL expor um arquivo `.env.example` com a chave `VITE_API_URL` documentada.

---

### Requisito 2: Criação do Cliente HTTP (ApiClient)

**User Story:** Como desenvolvedor, quero um módulo centralizado de chamadas HTTP, para que toda comunicação com a API seja consistente, reutilizável e fácil de manter.

#### Critérios de Aceitação

1. THE ApiClient SHALL utilizar a API `fetch` nativa do navegador para realizar requisições HTTP.
2. THE ApiClient SHALL enviar o header `Content-Type: application/json` em todas as requisições POST.
3. THE ApiClient SHALL enviar o header `Accept: application/json` em todas as requisições.
4. WHEN a API retornar HTTP 422, THE ApiClient SHALL lançar um erro tipado contendo o objeto `errors` com as mensagens de validação por campo.
5. WHEN a API retornar HTTP 4xx ou 5xx diferente de 422, THE ApiClient SHALL lançar um erro genérico com a mensagem retornada pela API.
6. WHEN ocorrer falha de rede (sem resposta do servidor), THE ApiClient SHALL lançar um erro com mensagem indicando falha de conectividade.
7. THE ApiClient SHALL expor uma função `postCadastro(data: CadastroPayload): Promise<CadastroResponse>` para o endpoint `POST /api/cadastro`.
8. THE ApiClient SHALL expor uma função `getIndicador(referralCode: string): Promise<IndicadorResponse>` para o endpoint `GET /api/usuarios/{referral_code}/indicados`.

---

### Requisito 3: Integração do Formulário com POST /api/cadastro

**User Story:** Como visitante, quero que meu cadastro seja enviado para a API real, para que meus dados sejam persistidos no banco de dados.

#### Critérios de Aceitação

1. WHEN o usuário submeter o formulário com dados válidos, THE Frontend SHALL chamar `POST /api/cadastro` com todos os campos: `nome`, `whatsapp`, `data_nascimento`, `endereco`, `cidade`, `email`, `lgpd_aceito`.
2. THE Frontend SHALL enviar o campo `whatsapp` contendo apenas dígitos, sem formatação de máscara.
3. THE Frontend SHALL enviar o campo `data_nascimento` no formato `YYYY-MM-DD`.
4. WHEN a API retornar HTTP 201, THE Frontend SHALL exibir a tela de sucesso com o `referral_link` retornado pela API.
5. WHEN a API retornar HTTP 201, THE Frontend SHALL exibir um Toast de sucesso via `sonner`.
6. WHILE a requisição estiver em andamento, THE Frontend SHALL desabilitar o botão de envio e exibir indicador de carregamento.

---

### Requisito 4: Leitura do Query Param `ref` e Envio do Referral Code

**User Story:** Como visitante que acessou via link de indicação, quero que meu cadastro seja associado ao indicador correto, para que a rede de indicações seja rastreada corretamente.

#### Critérios de Aceitação

1. WHEN a URL contiver o parâmetro `?ref={referral_code}`, THE Frontend SHALL extrair o valor do parâmetro usando `react-router-dom`.
2. WHEN o parâmetro `ref` estiver presente na URL, THE Frontend SHALL incluir o campo `referral_code` no body do `POST /api/cadastro`.
3. WHERE o parâmetro `ref` estiver ausente na URL, THE Frontend SHALL enviar o cadastro sem o campo `referral_code`.

---

### Requisito 5: Exibição Dinâmica do Indicador

**User Story:** Como visitante que acessou via link de indicação, quero ver o nome e a cidade do meu indicador na página, para que eu saiba quem me convidou para o movimento.

#### Critérios de Aceitação

1. WHEN a URL contiver o parâmetro `?ref={referral_code}`, THE Frontend SHALL buscar os dados do indicador via `GET /api/usuarios/{referral_code}/indicados`.
2. WHEN a busca do indicador retornar dados, THE Frontend SHALL exibir o nome e a cidade do indicador na seção "Indicado por", substituindo os valores hardcoded.
3. WHILE a busca do indicador estiver em andamento, THE Frontend SHALL exibir um estado de carregamento na seção "Indicado por".
4. IF a busca do indicador retornar erro (404 ou falha de rede), THE Frontend SHALL ocultar a seção "Indicado por" ou exibir estado neutro, sem expor mensagem de erro técnica ao usuário.
5. WHERE o parâmetro `ref` estiver ausente na URL, THE Frontend SHALL ocultar a seção "Indicado por".

---

### Requisito 6: Tratamento de Erros de Validação (HTTP 422)

**User Story:** Como visitante, quero ver mensagens de erro específicas por campo quando meu cadastro for rejeitado pela API, para que eu saiba exatamente o que precisa ser corrigido.

#### Critérios de Aceitação

1. WHEN a API retornar HTTP 422, THE Frontend SHALL exibir as mensagens de erro abaixo de cada campo correspondente no formulário.
2. THE Frontend SHALL mapear as chaves do objeto `errors` da resposta 422 para os campos do formulário usando `react-hook-form`.
3. WHEN a API retornar HTTP 422 para o campo `email`, THE Frontend SHALL exibir a mensagem de erro abaixo do campo de e-mail.
4. WHEN a API retornar HTTP 422 para o campo `whatsapp`, THE Frontend SHALL exibir a mensagem de erro abaixo do campo de WhatsApp.
5. WHEN a API retornar HTTP 422, THE Frontend SHALL manter o formulário preenchido para que o usuário possa corrigir os dados sem redigitar tudo.

---

### Requisito 7: Tratamento de Erros de Rede e Servidor

**User Story:** Como visitante, quero receber um feedback claro quando o servidor estiver indisponível ou ocorrer um erro inesperado, para que eu saiba que o problema não é meu.

#### Critérios de Aceitação

1. WHEN a API retornar HTTP 500 ou outro erro de servidor, THE Frontend SHALL exibir um Toast de erro via `sonner` com mensagem genérica amigável.
2. WHEN ocorrer falha de rede (sem resposta do servidor), THE Frontend SHALL exibir um Toast de erro via `sonner` indicando problema de conectividade.
3. IF ocorrer qualquer erro não tratado durante o envio do formulário, THEN THE Frontend SHALL reabilitar o botão de envio para que o usuário possa tentar novamente.
4. THE Frontend SHALL nunca exibir stack traces ou mensagens técnicas internas ao usuário final.
