# Tasks — frontend-api-integration

## Task List

- [x] 1. Configurar variável de ambiente e criar .env.example
  - [x] 1.1 Criar arquivo `.env.example` com a chave `VITE_API_URL=http://localhost:8000`
  - [x] 1.2 Verificar se `.env` local já existe; se não, criar com `VITE_API_URL=http://localhost:8000`

- [x] 2. Criar o ApiClient (`src/lib/api.ts`)
  - [x] 2.1 Definir tipos TypeScript: `CadastroPayload`, `CadastroResponse`, `IndicadorResponse`, `ValidationError`
  - [x] 2.2 Implementar função `postCadastro(data: CadastroPayload): Promise<CadastroResponse>` usando `fetch` nativo com headers `Content-Type: application/json` e `Accept: application/json`
  - [x] 2.3 Implementar função `getIndicador(referralCode: string): Promise<IndicadorResponse>` usando `fetch` nativo com header `Accept: application/json`
  - [x] 2.4 Implementar tratamento de erro 422: lançar `ValidationError` com o objeto `errors` da resposta
  - [x] 2.5 Implementar tratamento de erros 4xx/5xx não-422: lançar `Error` com mensagem genérica amigável
  - [x] 2.6 Implementar tratamento de falha de rede: capturar exceção do `fetch` e relançar com mensagem de conectividade

- [x] 3. Criar hooks customizados
  - [x] 3.1 Criar `src/hooks/useIndicador.ts` usando `useQuery` do React Query com `enabled: !!referralCode` e `retry: false`
  - [x] 3.2 Criar `src/hooks/useCadastro.ts` usando `useMutation` do React Query com `mutationFn: postCadastro`

- [x] 4. Refatorar `src/pages/Index.tsx`
  - [x] 4.1 Adicionar `useSearchParams` do `react-router-dom` para ler o parâmetro `ref` da URL
  - [x] 4.2 Integrar `useIndicador(refCode)` e renderizar condicionalmente a seção "Indicado por" (ocultar quando `ref` ausente, mostrar loading, exibir nome/cidade quando dados disponíveis, ocultar em caso de erro)
  - [x] 4.3 Substituir o `useState` de formulário por `useForm` do `react-hook-form` com schema `zod` (campos: `nome`, `whatsapp`, `data_nascimento`, `endereco`, `cidade`, `email`, `lgpd_aceito`)
  - [x] 4.4 Integrar o campo `Select` de cidade com `Controller` do `react-hook-form`
  - [x] 4.5 Integrar o campo `Checkbox` de LGPD com `Controller` do `react-hook-form`
  - [x] 4.6 Adicionar exibição de mensagens de erro abaixo de cada campo usando `formState.errors`
  - [x] 4.7 Implementar `onSubmit`: limpar whatsapp (remover não-dígitos), montar payload com `referral_code` condicional, chamar `mutateAsync`
  - [x] 4.8 Implementar tratamento de sucesso: armazenar `referral_link` da resposta e exibir tela de sucesso com o link; chamar `toast.success`
  - [x] 4.9 Implementar tratamento de erro: se `ValidationError`, chamar `setError` para cada campo; senão, chamar `toast.error` com mensagem amigável
  - [x] 4.10 Vincular estado `isPending` do `useMutation` ao `disabled` do botão de envio e ao texto de loading

- [x] 5. Instalar dependência de testes de propriedade
  - [x] 5.1 Instalar `fast-check` como devDependency: `npm install --save-dev fast-check`

- [x] 6. Escrever testes de unidade e exemplo para o ApiClient
  - [x] 6.1 Criar `src/lib/__tests__/api.test.ts` com mock de `fetch` global
  - [x] 6.2 Testar que `postCadastro` retorna dados corretos para resposta 201
  - [x] 6.3 Testar que `postCadastro` lança `ValidationError` com `errors` correto para resposta 422
  - [x] 6.4 Testar que `postCadastro` lança `Error` genérico para resposta 500
  - [x] 6.5 Testar que falha de rede lança erro com mensagem de conectividade (edge case)
  - [x] 6.6 Testar que `VITE_API_URL` indefinido usa fallback `http://localhost:8000` (edge case)

- [x] 7. Escrever testes baseados em propriedades para o ApiClient
  - [x] 7.1 Criar `src/lib/__tests__/api.property.test.ts`
  - [x] 7.2 Implementar Property 1: headers obrigatórios presentes em todas as requisições (100 iterações)
    - Tag: `Feature: frontend-api-integration, Property 1: Headers obrigatórios presentes em todas as requisições`
  - [x] 7.3 Implementar Property 2: qualquer resposta 422 lança ValidationError com errors correto (100 iterações)
    - Tag: `Feature: frontend-api-integration, Property 2: Erro 422 lança ValidationError com objeto errors`
  - [x] 7.4 Implementar Property 3: qualquer status 4xx/5xx não-422 lança Error genérico (100 iterações)
    - Tag: `Feature: frontend-api-integration, Property 3: Erros não-422 lançam Error genérico`
  - [x] 7.5 Implementar Property 5: whatsapp com qualquer formatação é enviado apenas com dígitos (100 iterações)
    - Tag: `Feature: frontend-api-integration, Property 5: WhatsApp enviado contém apenas dígitos`

- [x] 8. Escrever testes de exemplo para o componente Index
  - [x] 8.1 Criar `src/pages/__tests__/Index.test.tsx` com setup de `QueryClientProvider`, `MemoryRouter` e mock de `fetch`
  - [x] 8.2 Implementar Exemplo 3: seção "Indicado por" não renderizada sem parâmetro `ref`
  - [x] 8.3 Implementar Exemplo 1: tela de sucesso exibe `referral_link` após HTTP 201
  - [x] 8.4 Implementar Exemplo 2: `toast.success` chamado após HTTP 201
  - [x] 8.5 Implementar Exemplo 4: `toast.error` chamado após HTTP 500
  - [x] 8.6 Testar que formulário mantém valores após erro 422 (Req 6.5)
  - [x] 8.7 Testar que botão fica desabilitado durante submissão (Req 3.6)

- [x] 9. Escrever testes baseados em propriedades para o componente Index
  - [x] 9.1 Criar `src/pages/__tests__/Index.property.test.tsx`
  - [x] 9.2 Implementar Property 4: payload contém todos os campos obrigatórios para qualquer entrada válida (100 iterações)
    - Tag: `Feature: frontend-api-integration, Property 4: Payload do formulário contém todos os campos obrigatórios`
  - [x] 9.3 Implementar Property 6: parâmetro ref controla presença de referral_code no payload (100 iterações)
    - Tag: `Feature: frontend-api-integration, Property 6: Parâmetro ref controla presença de referral_code no payload`
  - [x] 9.4 Implementar Property 7: presença de ref na URL dispara busca do indicador (100 iterações)
    - Tag: `Feature: frontend-api-integration, Property 7: Presença de ref na URL dispara busca do indicador`
  - [x] 9.5 Implementar Property 8: erros 422 são mapeados para campos do formulário (100 iterações)
    - Tag: `Feature: frontend-api-integration, Property 8: Erros 422 são mapeados para campos do formulário`
  - [x] 9.6 Implementar Property 9: botão reabilitado após qualquer erro (100 iterações)
    - Tag: `Feature: frontend-api-integration, Property 9: Botão de envio é reabilitado após qualquer erro`

- [x] 10. Executar todos os testes e verificar que passam
  - [x] 10.1 Rodar `npm test` e confirmar que todos os testes passam sem erros
