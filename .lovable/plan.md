
## Sincronização Real do Meta Ads com a Graph API

### Problema Atual
O botão "Sincronizar" no card do Meta Ads chama `integracoesApi.sincronizar()` que é um **stub vazio** -- apenas retorna `{ success: true }` sem fazer nada real. Exibe "Sincronização iniciada com sucesso" mas nenhuma operação é executada.

### Solução
Criar uma Edge Function `meta-sync` que, ao ser chamada, faz requisições reais à **Graph API do Meta** para:
1. Validar se o token de acesso ainda é válido
2. Re-buscar as páginas do Facebook vinculadas e atualizar `paginas_meta`
3. Atualizar o campo `ultimo_sync` em `conexoes_meta`

O frontend chamará essa Edge Function ao invés do stub.

### Alterações

| Arquivo | O que muda |
|---------|-----------|
| `supabase/functions/meta-sync/index.ts` | **Novo** - Edge Function que consulta a Graph API e sincroniza dados |
| `src/modules/configuracoes/services/configuracoes.api.ts` | Atualizar `sincronizar()` para chamar a Edge Function `meta-sync` quando a plataforma for Meta |
| `src/modules/configuracoes/hooks/useIntegracoes.ts` | Ajustar `useSincronizarIntegracao` para aceitar plataforma e melhorar feedback |
| `src/modules/configuracoes/pages/ConexoesPage.tsx` | Passar plataforma ao chamar sincronizar |

### Detalhes Tecnicos

**1. Edge Function `meta-sync`**
- Autentica o usuario via JWT
- Busca `organizacao_id` do usuario
- Busca `access_token_encrypted` da tabela `conexoes_meta`
- Chama `GET /me?fields=id,name,email` para validar token
- Chama `GET /me/accounts?fields=id,name,access_token` para listar paginas
- Faz upsert em `paginas_meta` com os dados retornados
- Atualiza `ultimo_sync` e `status` em `conexoes_meta`
- Se token invalido, atualiza `status` para `erro` e `ultimo_erro` com mensagem

**2. API Service**
- `sincronizar()` passa a chamar `supabase.functions.invoke('meta-sync')` ao inves de retornar stub
- Retorna resultado real (paginas sincronizadas, status do token)

**3. Feedback ao usuario**
- Sucesso: "Sincronização concluída: X página(s) atualizada(s)"
- Token expirado: "Token Meta expirado. Reconecte sua conta."
- Erro genérico: mensagem do Meta
