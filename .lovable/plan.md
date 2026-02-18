

## Auditoria de Producao — Modulo /emails

Analise para 500+ usuarios, alto volume de emails sincronizados via IMAP, conforme diretrizes do Arquiteto de Produto.

---

### 1. Problemas Criticos

#### 1.1 Cache auth duplicado (emails.api.ts)

Linhas 25-66: Mesma duplicacao `_cachedOrgId/_cachedUserId + onAuthStateChange` ja corrigida nos modulos /negocios, /contatos e /conversas. O `auth-context.ts` compartilhado ja existe.

**Correcao**: Remover linhas 25-66 e importar `getOrganizacaoId` e `getUsuarioId` de `@/shared/services/auth-context`.

**Risco**: Zero. Refactor DRY puro.

---

#### 1.2 Realtime sem debounce (useEmailRealtime.ts)

Cada INSERT/UPDATE na tabela `emails_recebidos` dispara `invalidateQueries` imediatamente. Durante uma sincronizacao IMAP que insere 50 emails, isso causa 50 re-fetches consecutivos.

**Correcao**: Adicionar debounce de 2 segundos usando `useRef` + `setTimeout` (mesmo padrao ja implementado em `useKanban.ts` e `useConversasRealtime.ts`).

**Risco**: Zero. O optimistic update ja garante UX imediata.

---

#### 1.3 Polling redundante com Realtime ativo

Tres fontes de polling redundante:
- `useEmails`: `refetchInterval: 60000` (linha 26)
- `useContadorNaoLidos`: `refetchInterval: 30000` (linha 62)
- `useAutoSyncEmails`: `setInterval` de 120s que chama `sincronizarEmails` (IMAP) e invalida cache

O `useEmailRealtime` ja escuta INSERT/UPDATE na tabela e invalida cache. O `useAutoSyncEmails` faz sync IMAP (necessario pois Realtime so ve mudancas locais, nao emails novos no servidor remoto). Porem os `refetchInterval` de `useEmails` e `useContadorNaoLidos` sao redundantes porque:
- Se ha emails novos no servidor IMAP, o `useAutoSyncEmails` os traz e o Realtime notifica
- Se ha mudancas locais, o Realtime notifica

**Correcao**: Remover `refetchInterval` de `useEmails` e `useContadorNaoLidos`. Manter `useAutoSyncEmails` (e o unico que busca emails novos do servidor remoto).

**Risco**: Baixo. O auto-sync IMAP continua trazendo emails novos a cada 2min, e o Realtime invalida o cache.

---

#### 1.4 Rascunhos sem limit (listarRascunhos)

Linha 342-351: `listarRascunhos` nao tem `.limit()` — carrega TODOS os rascunhos.

**Correcao**: Adicionar `.limit(50)`.

**Risco**: Zero.

---

#### 1.5 Assinatura com upsert manual (salvarAssinatura)

Linhas 440-476: Faz SELECT para verificar existencia, depois UPDATE ou INSERT. Sao 2 queries quando poderia ser 1 com `.upsert()`.

**Correcao**: Usar `.upsert()` com `onConflict: 'organizacao_id,usuario_id'` (assumindo que existe constraint unica nessas colunas). Se nao existir, manter o padrao atual mas documentar como melhoria futura.

**Risco**: Baixo. Depende da existencia de constraint unica na tabela.

---

### 2. Problemas de Performance Media

#### 2.1 Metricas — auth duplicado inline (useEmailsMetricas.ts)

Linhas 62-73: `fetchMetricas` faz `supabase.auth.getUser()` + `supabase.from('usuarios').select()` manualmente, duplicando a logica de `getOrganizacaoId`/`getUsuarioId`.

**Correcao**: Importar e usar `getOrganizacaoId` do `auth-context` compartilhado.

**Risco**: Zero.

---

#### 2.2 Metricas — "sem resposta" com batches de threadIds

Linhas 126-150: Busca threads com resposta em batches de 50, o que e razoavel. Porem, para periodos grandes com milhares de emails enviados, isso gera muitos batches.

**Correcao imediata**: Manter os batches (ja e uma solucao aceitavel), mas aumentar o batchSize para 100 para reduzir roundtrips. Solucao futura: mover para SQL function.

**Risco**: Zero.

---

#### 2.3 Historico de aberturas — polling redundante (useEmailHistorico.ts)

Linha 45: `refetchInterval: 60000` — polling de 1min para historico de aberturas. Esse dado muda raramente e ja seria invalidado pelo Realtime.

**Correcao**: Remover `refetchInterval`. Manter `staleTime: 30000`.

**Risco**: Zero.

---

### 3. O que ja esta BEM FEITO

- Paginacao na listagem principal com `.range()`
- Lazy loading de corpo do email (busca via IMAP sob demanda)
- Optimistic updates em `useAtualizarEmail`
- Acoes em lote eficientes com `.in()`
- Auto-sync IMAP silencioso com protecao contra concorrencia (`isSyncingRef`)
- Exclusao IMAP bidirecional via Edge Function
- Tracking de aberturas com pixel via function SQL
- Upload de anexos para Storage antes do envio
- Soft delete padronizado
- Tipos bem definidos em `email.types.ts`
- Notificacao de novos emails via Realtime (toast)

---

### 4. Plano de Acao

| # | Acao | Arquivo | Impacto |
|---|------|---------|---------|
| 1 | Importar auth-context compartilhado | `emails.api.ts` | Elimina duplicacao DRY |
| 2 | Adicionar debounce 2s no Realtime | `useEmailRealtime.ts` | Previne refetch storms durante sync IMAP |
| 3 | Remover refetchInterval de useEmails e useContadorNaoLidos | `useEmails.ts` | Elimina polling redundante |
| 4 | Remover refetchInterval de useEmailHistorico | `useEmailHistorico.ts` | Elimina polling desnecessario |
| 5 | Adicionar .limit(50) em listarRascunhos | `emails.api.ts` | Previne carregamento excessivo |
| 6 | Usar auth-context em fetchMetricas | `useEmailsMetricas.ts` | Elimina duplicacao de auth inline |
| 7 | Aumentar batchSize de threadIds para 100 | `useEmailsMetricas.ts` | Reduz roundtrips |

---

### 5. Detalhes Tecnicos

**5.1 Auth-context (emails.api.ts)**

Remover linhas 25-66 (cache local + `getOrganizacaoId` + `getUsuarioId` + `onAuthStateChange`). Adicionar:

```typescript
import { getOrganizacaoId, getUsuarioId } from '@/shared/services/auth-context'
```

**5.2 Debounce no Realtime (useEmailRealtime.ts)**

Adicionar `useRef` para timer. No callback de INSERT e UPDATE, limpar timer anterior e agendar invalidacao com 2s de delay. Manter toast de notificacao imediato (apenas o invalidateQueries recebe debounce).

**5.3 Remover polling (useEmails.ts)**

- Linha 26: remover `refetchInterval: 60000` de `useEmails`
- Linha 62: remover `refetchInterval: 30000` de `useContadorNaoLidos`

**5.4 Remover polling historico (useEmailHistorico.ts)**

- Linha 45: remover `refetchInterval: 60000`

**5.5 Limit em rascunhos (emails.api.ts)**

Adicionar `.limit(50)` na query de `listarRascunhos`.

**5.6 Auth-context em metricas (useEmailsMetricas.ts)**

Substituir linhas 62-73 por:

```typescript
const orgId = await getOrganizacaoId()
```

Remover a busca manual de `usuario` + `organizacao_id`.

**5.7 BatchSize de threadIds (useEmailsMetricas.ts)**

Linha 128: alterar `const batchSize = 50` para `const batchSize = 100`.

---

### 6. Arquivos impactados

| Arquivo | Tipo de mudanca |
|---------|----------------|
| `src/modules/emails/services/emails.api.ts` | Auth-context, limit rascunhos |
| `src/modules/emails/hooks/useEmailRealtime.ts` | Debounce 2s |
| `src/modules/emails/hooks/useEmails.ts` | Remover refetchInterval |
| `src/modules/emails/hooks/useEmailHistorico.ts` | Remover refetchInterval |
| `src/modules/emails/hooks/useEmailsMetricas.ts` | Auth-context, batchSize |

### 7. Garantias de seguranca

- Nenhum componente visual alterado
- Nenhuma prop removida ou renomeada
- Hooks mantem mesma assinatura e comportamento
- Lazy loading de corpo preservado
- Sync IMAP automatico preservado (useAutoSyncEmails)
- Tracking de aberturas inalterado
- Upload de anexos inalterado
- Soft delete preservado

