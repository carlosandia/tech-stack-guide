

## Auditoria de Producao — Modulo /automacoes

Analise para 500+ usuarios, alto volume de automacoes e execucoes, conforme diretrizes do Arquiteto de Produto.

---

### 1. Problemas Criticos

#### 1.1 Auth inline em `criarAutomacao` (automacoes.api.ts)

Linhas 37-43: Faz `supabase.auth.getUser()` + `supabase.from('usuarios').select()` manualmente a cada criacao. O `auth-context.ts` compartilhado ja existe e foi adotado nos modulos /emails, /formularios, /configuracoes.

**Correcao**: Importar `getOrganizacaoId` e `getUsuarioId` de `@/shared/services/auth-context` e usar no lugar da query inline.

**Risco**: Zero. Refactor DRY puro.

---

#### 1.2 Auth inline em `SegmentoSelect` (AcaoConfig.tsx)

Linhas 177-180: Dentro de `criarSegmento()`, faz `supabase.auth.getUser()` + query de `usuarios` inline para obter `organizacao_id`. Duplicacao identica ao padrao ja corrigido.

**Correcao**: Importar e usar `getOrganizacaoId` do `auth-context`.

**Risco**: Zero.

---

#### 1.3 Auth inline em `TriggerConfig` (TriggerConfig.tsx)

Linhas 25-38: Hook `useQuery` dedicado (`usuario-atual-trigger`) que faz `supabase.auth.getUser()` + query de `usuarios` para obter `organizacao_id`. Usado para buscar formularios e exibir o WebhookDebugPanel.

**Correcao**: Criar um hook simples `useOrganizacaoId()` que encapsula a chamada a `getOrganizacaoId` via `useQuery` com `staleTime: Infinity`, e reusar em vez da query inline. Alternativamente, importar diretamente `getOrganizacaoId` dentro das queryFn que precisam (formularios, webhooks).

**Risco**: Zero.

---

#### 1.4 `listarAutomacoes` sem limit (automacoes.api.ts)

Linha 13-22: `listarAutomacoes` busca TODAS as automacoes da organizacao sem `.limit()`. Com 500+ tenants, cada um pode ter dezenas de automacoes. A sidebar ja carrega tudo de uma vez.

**Correcao**: Adicionar `.limit(100)` como trava de seguranca.

**Risco**: Zero. 100 automacoes e um limite generoso (nenhum tenant realista tera mais que isso).

---

#### 1.5 Auto-save dispara `invalidateQueries` desnecessariamente

Linha 55-56 (useAtualizarAutomacao): O auto-save com debounce de 1s chama `atualizarMutation.mutate()`, que no `onSuccess` faz `qc.invalidateQueries({ queryKey: QUERY_KEY })`. Isso re-fetcha a lista completa de automacoes a cada keystroke (com 1s de delay). Como o auto-save usa `silent: true` para evitar toast, deveria tambem evitar invalidacao desnecessaria.

**Correcao**: No hook `useAtualizarAutomacao`, quando `variables.silent === true`, pular o `invalidateQueries` (os dados no canvas ja estao atualizados localmente).

**Risco**: Baixo. O estado local do canvas ja tem os dados mais recentes; a lista lateral sera invalidada na proxima operacao nao-silenciosa.

---

#### 1.6 WebhookDebugPanel — polling sem cleanup no unmount

Linhas 94-109 (WebhookDebugPanel.tsx): O polling com `setInterval` de 3s nao tem timeout maximo. Se o usuario iniciar a escuta e esquecer, o polling roda indefinidamente.

**Correcao**: Adicionar um timeout maximo de 120 segundos (40 iteracoes). Apos o timeout, parar automaticamente e exibir mensagem.

**Risco**: Zero.

---

#### 1.7 WebhookDebugPanel — carrega webhooks com `useEffect` em vez de `useQuery`

Linhas 50-63: Usa `useEffect` + `useState` manual para carregar webhooks, sem cache, staleTime, ou retry. Cada vez que o componente monta, refaz a query.

**Correcao**: Converter para `useQuery` com `staleTime: 60_000`, consistente com os outros seletores do modulo (MembroSelector, SegmentoSelect, WebhookSaidaSelect).

**Risco**: Zero.

---

### 2. O que ja esta BEM FEITO

- Auto-save com debounce de 1s (evita saves excessivos)
- Serializer/deserializer de grafo robusto (flowConverter.ts) com suporte a branching
- `initialLoadRef` para evitar save ao carregar automacao (previne loop save-ao-carregar)
- Refs estaveis para nodes/edges no auto-save (`nodesRef`, `edgesRef`)
- Hooks React Query bem estruturados com queryKeys consistentes
- `staleTime: 60_000` nos sub-seletores (membros, segmentos, webhooks saida)
- `staleTime: Infinity` no usuario-atual-trigger (dado imutavel na sessao)
- Logs com `.limit(50)` configuravel
- Soft delete padronizado
- Canvas React Flow com memoizacao correta (`useMemo` para nodeTypes, edgeTypes, callbacks)
- Sidebar com busca client-side (aceitavel para volume de automacoes por tenant)
- Edge deletavel com hover UX
- Mobile responsive com overlay sidebar

---

### 3. Plano de Acao

| # | Acao | Arquivo | Impacto |
|---|------|---------|---------|
| 1 | Importar auth-context em criarAutomacao | `automacoes.api.ts` | Elimina auth duplicado |
| 2 | Importar auth-context em SegmentoSelect | `AcaoConfig.tsx` | Elimina auth duplicado |
| 3 | Importar auth-context em TriggerConfig | `TriggerConfig.tsx` | Elimina auth duplicado |
| 4 | Adicionar .limit(100) em listarAutomacoes | `automacoes.api.ts` | Trava de seguranca |
| 5 | Pular invalidateQueries quando silent=true | `useAutomacoes.ts` | Elimina refetch desnecessario no auto-save |
| 6 | Adicionar timeout de 120s no polling | `WebhookDebugPanel.tsx` | Previne polling infinito |
| 7 | Converter load de webhooks para useQuery | `WebhookDebugPanel.tsx` | Cache + retry automatico |

---

### 4. Detalhes Tecnicos

**4.1 Auth-context em criarAutomacao (automacoes.api.ts)**

Adicionar no topo:
```typescript
import { getOrganizacaoId, getUsuarioId } from '@/shared/services/auth-context'
```

Substituir linhas 37-43:
```typescript
const organizacaoId = await getOrganizacaoId()
const usuarioId = await getUsuarioId()
```

E usar `organizacaoId` e `usuarioId` no insert.

**4.2 Auth-context em SegmentoSelect (AcaoConfig.tsx)**

Substituir linhas 177-180 de `criarSegmento()`:
```typescript
import { getOrganizacaoId } from '@/shared/services/auth-context'
// dentro de criarSegmento:
const organizacaoId = await getOrganizacaoId()
```

Remover a busca manual de `supabase.auth.getUser()` + query de `usuarios`.

**4.3 Auth-context em TriggerConfig (TriggerConfig.tsx)**

Substituir o hook `useQuery(['usuario-atual-trigger'])` por chamada direta a `getOrganizacaoId` dentro das queryFn que precisam:

```typescript
import { getOrganizacaoId } from '@/shared/services/auth-context'
```

No useQuery de formularios, usar `getOrganizacaoId()` diretamente. Para o `organizacaoId` passado ao `WebhookDebugPanel`, usar um `useQuery` simples:
```typescript
const { data: organizacaoId } = useQuery({
  queryKey: ['org-id'],
  queryFn: getOrganizacaoId,
  staleTime: Infinity,
})
```

**4.4 Limit em listarAutomacoes (automacoes.api.ts)**

Adicionar `.limit(100)` apos `.order()`.

**4.5 Pular invalidateQueries no silent (useAutomacoes.ts)**

No `useAtualizarAutomacao`, alterar `onSuccess`:
```typescript
onSuccess: (_, variables) => {
  if (!variables.silent) {
    qc.invalidateQueries({ queryKey: QUERY_KEY })
    toast.success('Automacao atualizada')
  }
},
```

**4.6 Timeout no polling (WebhookDebugPanel.tsx)**

No `startListening`, adicionar contador:
```typescript
let iteracoes = 0
pollingRef.current = setInterval(async () => {
  iteracoes++
  if (iteracoes >= 40) { // 40 * 3s = 120s
    stopListening()
    return
  }
  // ... resto do polling
}, 3000)
```

**4.7 Converter load de webhooks para useQuery (WebhookDebugPanel.tsx)**

Substituir o `useEffect` + `useState` por:
```typescript
const { data: webhooks = [], isLoading: loading } = useQuery({
  queryKey: ['webhooks-entrada', organizacaoId],
  queryFn: async () => {
    const { data } = await supabase
      .from('webhooks_entrada')
      .select('id, nome, url_token, ativo')
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)
      .order('criado_em', { ascending: false })
    return data || []
  },
  enabled: !!organizacaoId,
  staleTime: 60_000,
})
```

---

### 5. Arquivos impactados

| Arquivo | Tipo de mudanca |
|---------|----------------|
| `src/modules/automacoes/services/automacoes.api.ts` | Auth-context, limit |
| `src/modules/automacoes/hooks/useAutomacoes.ts` | Pular invalidate no silent |
| `src/modules/automacoes/components/panels/AcaoConfig.tsx` | Auth-context em SegmentoSelect |
| `src/modules/automacoes/components/panels/TriggerConfig.tsx` | Auth-context |
| `src/modules/automacoes/components/panels/WebhookDebugPanel.tsx` | useQuery, timeout polling |

### 6. Garantias de seguranca

- Nenhum componente visual alterado
- Nenhuma prop removida ou renomeada
- Hooks mantem mesma assinatura e comportamento
- Auto-save com debounce preservado
- Canvas React Flow inalterado
- Flow converter (serializer/deserializer) inalterado
- Triggers SQL de emissao de eventos inalterados
- Motor de execucao (Edge Functions) inalterado
- RLS continua como unica linha de defesa

