

## Correção da Conexão Google Calendar via Edge Function

### Diagnóstico

O erro `localhost:3001` ocorre porque algumas partes do código ainda tentam chamar o backend Express, que nao é deployado pelo Lovable. Apenas o frontend (Vite) e as Edge Functions (Supabase) funcionam em produção.

A Edge Function `google-auth` já existe e o frontend já a utiliza para obter a auth URL (linhas 1353-1361 de `configuracoes.api.ts`). O fluxo OAuth via Edge Function está correto, mas a **URI de redirecionamento no Google Cloud Console** precisa ser atualizada.

### Ação Necessária no Google Cloud Console

Nas credenciais OAuth do Google (APIs e Serviços > Credenciais), é preciso:

1. **Adicionar** como URI de redirecionamento autorizada:
   `https://ybzhlsalbnxwkfszkloa.supabase.co/functions/v1/google-auth?action=callback`

2. **Manter** as origens JavaScript autorizadas como estão:
   - `https://crm.renovedigital.com.br`
   - `http://127.0.0.1:8080`

### Alterações no Código

#### 1. Edge Function `google-auth` - Corrigir redirect final

**Arquivo**: `supabase/functions/google-auth/index.ts`

- Garantir que o `FRONTEND_URL` aponte para `https://crm.renovedigital.com.br`
- Garantir que a `redirect_uri` do state (vinda do frontend) seja respeitada no redirect final
- Usar `window.location.origin` no frontend ao gerar o redirect_uri para funcionar tanto em dev quanto em produção

#### 2. Verificar `googleCalendarApi` - Remover chamadas via axios/backend

**Arquivo**: `src/modules/configuracoes/services/configuracoes.api.ts`

- O `googleCalendarApi` (linhas 1553-1562) ainda usa `api.get('/v1/conexoes/google/calendarios')` e `api.post('/v1/conexoes/google/calendario')` -- chamadas ao backend Express
- Migrar essas chamadas para usar a Edge Function `google-auth` ou diretamente o Supabase client (tabela `conexoes_google`)
- A função `obterGmailAuthUrl` (linha 1480) também usa `api.get` -- precisa ser migrada se for usada

#### 3. Garantir isolamento por usuário/organização

A Edge Function já filtra por `usuario_id` e `organizacao_id`:
- Cada usuário tem sua própria conexão na tabela `conexoes_google`
- O token OAuth é armazenado por usuário
- A RLS no Supabase garante que cada tenant só vê seus dados

### Fluxo Final (como ficará)

```text
[Usuário clica "Conectar"]
       |
       v
[Frontend] --> supabase.functions.invoke('google-auth', { action: 'auth-url' })
       |
       v
[Edge Function] --> Gera URL Google com redirect_uri = Edge Function callback
       |
       v
[Google Consent Screen] --> Usuário autoriza
       |
       v
[Google] --> Redireciona para Edge Function callback
       |
       v
[Edge Function] --> Troca code por tokens, salva em conexoes_google
       |
       v
[Edge Function] --> Redireciona para https://crm.renovedigital.com.br/app/configuracoes/conexoes?success=google
```

### Resumo das Alterações

| Arquivo | Alteração |
|---|---|
| `supabase/functions/google-auth/index.ts` | Revisar/confirmar redirect URLs e fluxo de callback |
| `src/modules/configuracoes/services/configuracoes.api.ts` | Migrar `googleCalendarApi` de axios para Edge Function/Supabase direto |
| **Google Cloud Console** (manual) | Adicionar URI de redirecionamento da Edge Function |

### Nota Importante

O backend Express (pasta `backend/`) pode continuar existindo para desenvolvimento local, mas em produção todas as chamadas Google devem passar pela Edge Function. Não é possível usar o backend Express em produção via Lovable.
