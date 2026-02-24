# PRD: Performance do Modulo /emails

| Campo | Valor |
|-------|-------|
| **Autor** | Equipe Tecnica Renove |
| **Data de criacao** | 2026-02-24 |
| **Ultima atualizacao** | 2026-02-24 |
| **Versao** | v1.0 |
| **Status** | Implementado (2026-02-24) |
| **Modulos impactados** | /emails |
| **Tipo** | Performance Engineering (nao e feature nova) |
| **Revisor tecnico** | Claude Sonnet 4.6 (analise automatizada) |

---

## ⚠️ Regras Obrigatorias de Execucao

> **Estas regras se aplicam a QUALQUER agente, desenvolvedor ou IA que for implementar qualquer item deste documento. Devem ser lidas e seguidas antes de tocar em qualquer arquivo.**

### R1 — Simples antes de Complexo

Sempre optar pela solucao mais simples que resolve o problema. Se existir uma abordagem de 5 linhas e uma de 50 linhas com resultado equivalente, usar as 5 linhas. Nao introduzir abstracoes, utilitarios ou padroes novos quando uma edicao pontual resolve.

### R2 — Verificar Antes de Criar

Antes de qualquer implementacao:
- Verificar se o comportamento ja existe (hook, funcao, config) no modulo ou em `src/shared/`
- Verificar se o componente ja usa `React.memo`, `useCallback` ou `useMemo` para o caso em questao
- Verificar se o `staleTime` ou `gcTime` ja esta configurado na query em questao
- **Nunca duplicar logica existente** — se ja existe, ajustar o existente

### R3 — Nao Continuar se Vai Quebrar

Antes de cada alteracao, avaliar se ela pode quebrar funcionalidade existente:
- Se houver risco real de quebra → **parar e documentar o bloqueio**, nao prosseguir
- Se apos implementar algo quebrar (build falha, erro de tipo, comportamento visual errado) → **reverter imediatamente** o arquivo alterado ao estado anterior
- Nunca deixar o sistema em estado intermediario quebrado

### R4 — Escopo Pontual

Cada correcao deve ser **exatamente** o que esta descrito na tarefa correspondente neste documento. Nao refatorar codigo adjacente, nao renomear variaveis, nao ajustar imports nao relacionados, nao adicionar features extras. Cirurgico e pontual.

### R5 — Consultar Documentacao Oficial (Context7)

Antes de implementar qualquer padrao tecnico novo no projeto:
- Usar **Context7** para ler a documentacao oficial da biblioteca em questao
- Nao assumir API de memoria — verificar a versao instalada no `package.json` e consultar a documentacao correta

### R6 — Verificar Schema do Banco Antes de Qualquer Migration

Antes de escrever qualquer SQL (indices, migrations, queries):
- Ler as tabelas e colunas reais via **Supabase MCP** (`list_tables`, `execute_sql` com `information_schema`)
- Confirmar nome exato da tabela e colunas — nunca assumir nomes
- Especialmente critico para: `emails_recebidos`, `emails_rascunhos`

---

## 1. Resumo Executivo

Este documento consolida os **11 problemas de performance** identificados via analise profunda de codigo no modulo `/emails`. Os problemas foram categorizados em 4 fases por criterio de risco e retorno.

O modulo de emails e usado em sessoes longas com sincronizacao IMAP periodica (a cada 2 minutos) + realtime ativo. Sem otimizacao de cache, cada troca de aba do browser dispara 5-6 refetches simultaneos. O painel de metricas executa 5-7 queries sequenciais a cada abertura. O componente `EmailItem` renderiza 20 instancias sem memoizacao, causando 160+ DOM nodes rerendeizando a cada mudanca de estado na pagina.

**Impacto esperado apos implementacao completa:** reducao de **65-80% nas queries desnecessarias**, eliminacao de re-renders em cascata na lista, reducao de 2-3s para <500ms no carregamento do painel de metricas.

---

## 2. Contexto e Motivacao

### 2.1 Problema

O modulo `/emails` apresenta padroes identicos aos encontrados nos outros modulos na analise geral:

- **Cache ausente:** Todos os hooks principais sem `staleTime` — React Query refaz fetch a cada troca de aba
- **Queries sequenciais:** Painel de metricas executa 5-7 `await` em serie (2-3s de latencia acumulada)
- **Sem memoizacao:** `EmailItem` sem `React.memo` — lista inteira re-renderiza ao qualquer mudanca de pai
- **Debounce insuficiente no Realtime:** 2s de debounce durante sync IMAP de 100 emails = 10-20 ciclos de invalidacao

### 2.2 Impacto no Negocio

| Cenario | Sem otimizacao | Com otimizacao |
|---------|----------------|----------------|
| Abrir /emails (6 hooks simultanios) | 6 queries em cada foco de janela | 0 queries (cache) |
| Carregar painel de metricas | 2-3s (5-7 queries seq.) | <500ms (Promise.all) |
| Sync IMAP de 100 emails | 10-20 invalidacoes em 10s | 2-3 invalidacoes |
| Selecionar email na lista | 20 EmailItems re-renderizam | 1 EmailItem re-renderiza |
| Sessao de 1h com sync ativo | ~1800 queries extras | ~100 queries extras |

### 2.3 Estado dos Indices no Banco

Os indices em `emails_recebidos` ja estao bem configurados:
- `idx_emails_tenant_user_pasta` → `(organizacao_id, usuario_id, pasta, data_email DESC)` ✅
- `idx_emails_tenant_user_lido` → `(organizacao_id, usuario_id, lido)` ✅
- `idx_emails_busca` → GIN `(assunto || corpo_texto)` ✅

**Nenhuma migration de indice necessaria.** O foco e 100% em codigo.

---

## 3. Escopo

### 3.1 O que ESTA no escopo

- Adicao de `staleTime`, `gcTime`, `refetchOnWindowFocus` nos hooks sem cache
- Adicao de `React.memo` em `EmailItem`
- Paralelizacao de queries com `Promise.all()` em `fetchMetricas`
- Ajuste de debounce do Realtime: 2000ms → 5000ms
- SELECT especifico em `emails.api.ts` (remocao de `select('*')` na lista)

### 3.2 O que NAO esta no escopo

- Novas funcionalidades
- Mudanca de stack ou dependencias
- Alteracao de contratos de API
- Mudanca de schema de banco
- Mudanca de UI/UX
- Virtualizacao de lista (risco alto, volume atual nao justifica)

### 3.3 Escopo futuro (pos-MVP performance)

- Lazy import de TipTap/DOMPurify via dynamic import()
- Consolidacao de fetchMetricas em View PostgreSQL materializada
- Virtualizacao da lista quando >200 emails carregados

---

## 4. Requisitos Nao-Funcionais (Metas de Performance)

| Metrica | Baseline atual (estimado) | Meta apos otimizacao | Fase |
|---------|--------------------------|----------------------|------|
| Queries ao trocar de aba | 5-6 por evento | 0 (cache) | Fase 1 |
| Carregamento painel metricas | 2-3s | <500ms | Fase 2 |
| Re-renders ao selecionar email | 20 items | 1 item | Fase 2 |
| Invalidacoes durante sync IMAP (100 emails) | 10-20 | 2-3 | Fase 1 |
| Queries em 1h de uso com sync ativo | ~1800 | <150 | Fase 1+2 |

---

## 5. Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| staleTime alto deixar contador de nao-lidos defasado | Baixa | Medio | Realtime invalida o cache — staleTime apenas controla refetch em focus |
| React.memo no EmailItem quebrar comportamento de check | Baixa | Medio | Testar selecao multipla e toggle de favorito apos implementar |
| Promise.all mascarar erro de query individual em metricas | Baixa | Baixo | Usar Promise.allSettled() se necessario |
| Debounce maior (5s) atrasar listagem de novos emails | Baixa | Baixo | Toast de notificacao e imediato — apenas o refetch e debounced |

---

## 6. Fases de Implementacao

As correcoes estao organizadas em 3 fases por criterios de:
1. **Risco**: do mais seguro ao mais complexo
2. **Retorno**: do maior impacto ao menor
3. **Dependencias**: correcoes que desbloqueiam outras vem primeiro

---

## FASE 1 — Cache e Realtime (1-3 linhas por arquivo)

**Objetivo:** Eliminar refetches desnecessarios e excesso de invalidacoes sem tocar em logica de renderizacao.
**Risco:** Minimo — apenas configuracoes.
**Impacto estimado:** -70% em queries desnecessarias.

---

### TAREFA 1.1 — staleTime e gcTime em todos os hooks de email

**Prioridade:** CRITICA
**Arquivo:** `src/modules/emails/hooks/useEmails.ts`
**Linhas afetadas:** 22-28, 30-55, 57-63, 173-178, 211-216, 306-311
**Problema:** Nenhum hook tem `staleTime` → React Query refaz fetch a cada troca de aba do browser

```typescript
// ANTES — useEmails (linha 22)
export function useEmails(params: ListarEmailsParams = {}) {
  return useQuery({
    queryKey: ['emails', params],
    queryFn: () => emailsApi.listar(params),
    // sem staleTime, sem gcTime, sem refetchOnWindowFocus
  })
}

// DEPOIS
export function useEmails(params: ListarEmailsParams = {}) {
  return useQuery({
    queryKey: ['emails', params],
    queryFn: () => emailsApi.listar(params),
    staleTime: 2 * 60 * 1000,   // 2 minutos — lista de emails
    gcTime: 10 * 60 * 1000,     // 10 minutos em cache
    refetchOnWindowFocus: false, // Realtime invalida quando necessario
  })
}
```

**Tabela de valores por hook:**

| Hook | staleTime | gcTime | refetchOnWindowFocus |
|------|-----------|--------|----------------------|
| `useEmails` | 2 min | 10 min | false |
| `useEmail` (individual) | 5 min | 15 min | false |
| `useContadorNaoLidos` | 1 min | 5 min | false |
| `useRascunhos` | 3 min | 10 min | false |
| `useAssinatura` | 15 min | 30 min | false |
| `useConexoesEmail` | 15 min | 30 min | false |

**Prompt de implementacao:**
```
Abra src/modules/emails/hooks/useEmails.ts.

Para cada hook abaixo, adicione os parametros dentro do useQuery correspondente:

1. useEmails (linha 22): staleTime: 2*60*1000, gcTime: 10*60*1000, refetchOnWindowFocus: false
2. useEmail (linha 33): staleTime: 5*60*1000, gcTime: 15*60*1000, refetchOnWindowFocus: false
3. useContadorNaoLidos (linha 58): staleTime: 60*1000, gcTime: 5*60*1000, refetchOnWindowFocus: false
4. useRascunhos (linha 174): staleTime: 3*60*1000, gcTime: 10*60*1000, refetchOnWindowFocus: false
5. useAssinatura (linha 212): staleTime: 15*60*1000, gcTime: 30*60*1000, refetchOnWindowFocus: false
6. useConexoesEmail (linha 307): staleTime: 15*60*1000, gcTime: 30*60*1000, refetchOnWindowFocus: false

Nao altere mais nada neste arquivo.
```

---

### TAREFA 1.2 — gcTime e refetchOnWindowFocus em useEmailsMetricas

**Prioridade:** ALTA
**Arquivo:** `src/modules/emails/hooks/useEmailsMetricas.ts`
**Linha atual:** 187-196
**Problema:** Tem `staleTime: 5min` mas nao tem `gcTime` → cache descartado apos 5min de inatividade; sem `refetchOnWindowFocus: false` → refetch ao trocar aba

```typescript
// ANTES (linha 187)
export function useEmailsMetricas(filters: MetricasFilters) {
  const { role } = useAuth()
  return useQuery({
    queryKey: ['emails-metricas', filters, role],
    queryFn: () => fetchMetricas(filters),
    staleTime: 5 * 60 * 1000,
    enabled: !!role,
  })
}

// DEPOIS
export function useEmailsMetricas(filters: MetricasFilters) {
  const { role } = useAuth()
  return useQuery({
    queryKey: ['emails-metricas', filters, role],
    queryFn: () => fetchMetricas(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,     // manter cache por 30 min
    enabled: !!role,
    refetchOnWindowFocus: false,
  })
}
```

**Prompt de implementacao:**
```
Abra src/modules/emails/hooks/useEmailsMetricas.ts.
Localize o hook useEmailsMetricas (linha ~187).
Adicione dentro do useQuery:
  gcTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
Nao altere mais nada neste arquivo.
```

---

### TAREFA 1.3 — Debounce Realtime: 2000ms → 5000ms

**Prioridade:** MEDIA
**Arquivo:** `src/modules/emails/hooks/useEmailRealtime.ts`
**Linha atual:** 22
**Problema:** Durante sync IMAP em lote (100 emails), cada INSERT dispara evento Realtime. Com debounce de 2s, 100 inserts em 10s geram ~8-10 ciclos de invalidacao. Com 5s, geram apenas 2-3.

```typescript
// ANTES (linha 19)
refreshTimer.current = setTimeout(() => {
  queryClient.invalidateQueries({ queryKey: ['emails'] })
  queryClient.invalidateQueries({ queryKey: ['email'] })
}, 2000)  // ❌ 2 segundos — muito curto para bulk sync

// DEPOIS
refreshTimer.current = setTimeout(() => {
  queryClient.invalidateQueries({ queryKey: ['emails'] })
  queryClient.invalidateQueries({ queryKey: ['email'] })
}, 5000)  // 5 segundos — absorve bursts do IMAP sync
```

**Prompt de implementacao:**
```
Abra src/modules/emails/hooks/useEmailRealtime.ts.
Na funcao scheduleInvalidation (linha ~19), mude o valor do setTimeout de 2000 para 5000.
Nao altere mais nada neste arquivo.
```

---

## FASE 2 — Memoizacao e Paralelizacao (impacto alto, risco medio)

**Objetivo:** Eliminar re-renders desnecessarios e paralelizar queries sequenciais de metricas.
**Risco:** Baixo-medio — verificar comportamento visual apos cada alteracao.
**Impacto estimado:** -80% re-renders na lista, -70% latencia no painel de metricas.

---

### TAREFA 2.1 — React.memo em EmailItem

**Prioridade:** ALTA
**Arquivo:** `src/modules/emails/components/EmailItem.tsx`
**Linha atual:** 30
**Problema:** `EmailItem` e montado 20 vezes na lista. Sem `React.memo`, qualquer mudanca de estado no pai (ex: selecionar um email, marcar como lido) re-renderiza TODOS os 20 items simultaneamente, incluindo os nao afetados.

```typescript
// ANTES (linha 6 e 30)
import { forwardRef } from 'react'

export const EmailItem = forwardRef<HTMLDivElement, EmailItemProps>(function EmailItem({
  email, isSelected, isChecked, onSelect, onToggleCheck, onToggleFavorito,
}, _ref) {
  // ...
})

// DEPOIS
import { forwardRef, memo } from 'react'

export const EmailItem = memo(forwardRef<HTMLDivElement, EmailItemProps>(function EmailItem({
  email, isSelected, isChecked, onSelect, onToggleCheck, onToggleFavorito,
}, _ref) {
  // ...
}))
EmailItem.displayName = 'EmailItem'
```

**Prompt de implementacao:**
```
Abra src/modules/emails/components/EmailItem.tsx.

1. Na linha 6, adicione 'memo' ao import de react: import { forwardRef, memo } from 'react'

2. Na linha 30, envolva o forwardRef com memo:
   ANTES: export const EmailItem = forwardRef<...>(function EmailItem(...) {
   DEPOIS: export const EmailItem = memo(forwardRef<...>(function EmailItem(...) {

3. Localize o fechamento da funcao forwardRef (ultimo '})') e adicione ')' extra:
   ANTES: })
   DEPOIS: }))

4. Apos o fechamento, adicione: EmailItem.displayName = 'EmailItem'

Nao altere nenhuma logica interna do componente.
```

---

### TAREFA 2.2 — Promise.all() nas queries de fetchMetricas

**Prioridade:** ALTA
**Arquivo:** `src/modules/emails/hooks/useEmailsMetricas.ts`
**Linhas afetadas:** 67-171
**Problema:** `fetchMetricas` executa 5-7 queries `await` em serie. Queries independentes (recebidos, com-anexos, favoritos, rascunhos) esperam uma pela outra desnecessariamente, acumulando 2-3s de latencia.

**Fluxo atual (serie):**
```
1. await enviadosQuery         (~300ms)
2. await recebidosQuery        (~250ms) — nao depende de 1
3. for loop de threads         (depende de 1 — correto manter aqui)
4. await comAnexosQuery        (~200ms) — independente
5. await favoritosCount        (~200ms) — independente
6. await rascunhosCount        (~200ms) — independente
Total: ~1.4s + loop de threads
```

**Fluxo otimizado (paralelo onde possivel):**
```
// Fase 1: queries totalmente independentes em paralelo
const [enviadosResult, recebidosResult, comAnexosResult, favoritosResult, rascunhosResult]
  = await Promise.all([
    enviadosQuery,
    recebidosQuery,
    comAnexosQuery,
    favoritosQuery,
    rascunhosQuery,
  ])
// Fase 2: loop de threads (depende de enviadosResult — executa depois)
Total: ~350ms + loop de threads
```

**Codigo completo da refatoracao:**

```typescript
// ANTES (linhas 67-171) — queries em serie:
const { data: enviados, count: enviadosCount } = await enviadosQuery
const { count: recebidosCount } = await recebidosQuery
// ... logica intermediaria com enviadosList ...
// ... for loop threads ...
const { count: comAnexosCount } = await comAnexosQuery
const { count: favoritosCount } = await supabase.from('emails_recebidos')...
const { count: rascunhosCount } = await supabase.from('emails_rascunhos')...

// DEPOIS — dividir em 2 fases:

// Fase 1: 5 queries independentes em paralelo
const comAnexosQuery = supabase
  .from('emails_recebidos')
  .select('id', { count: 'exact', head: true })
  .eq('organizacao_id', orgId)
  .eq('tem_anexos', true)
  .is('deletado_em', null)
if (dataInicio) comAnexosQuery.gte('data_email', dataInicio)

const favoritosQuery = supabase
  .from('emails_recebidos')
  .select('id', { count: 'exact', head: true })
  .eq('organizacao_id', orgId)
  .eq('favorito', true)
  .is('deletado_em', null)

const rascunhosQuery = supabase
  .from('emails_rascunhos')
  .select('id', { count: 'exact', head: true })
  .eq('organizacao_id', orgId)
  .is('deletado_em', null)

const [
  { data: enviados, count: enviadosCount },
  { count: recebidosCount },
  { count: comAnexosCount },
  { count: favoritosCount },
  { count: rascunhosCount },
] = await Promise.all([
  enviadosQuery,
  recebidosQuery,
  comAnexosQuery,
  favoritosQuery,
  rascunhosQuery,
])

// Fase 2: thread loop (depende dos enviados — executa depois da Fase 1)
const enviadosList = enviados || []
// ... restante da logica igual ...
```

**Adicional — paralelizar o loop de thread batches:**
```typescript
// ANTES — loop sequencial de batches
for (let i = 0; i < threadIds.length; i += batchSize) {
  const batch = threadIds.slice(i, i + batchSize)
  const { data: respostas } = await supabase...in('thread_id', batch)
  // ...
}

// DEPOIS — todos os batches em paralelo
const batches: string[][] = []
for (let i = 0; i < threadIds.length; i += batchSize) {
  batches.push(threadIds.slice(i, i + batchSize))
}
const resultados = await Promise.all(
  batches.map(batch =>
    supabase
      .from('emails_recebidos')
      .select('thread_id')
      .eq('organizacao_id', orgId)
      .eq('pasta', 'inbox')
      .is('deletado_em', null)
      .in('thread_id', batch)
  )
)
for (const { data: respostas } of resultados) {
  if (respostas) {
    for (const r of respostas) {
      if (r.thread_id) threadsComResposta.add(r.thread_id)
    }
  }
}
```

**Prompt de implementacao:**
```
Abra src/modules/emails/hooks/useEmailsMetricas.ts.
Localize a funcao fetchMetricas (linha ~59).

Passo 1: Identifique as queries de comAnexos (linha ~149), favoritos (linha ~158) e rascunhos (linha ~167).
Mova a construcao dessas 3 queries para ANTES do primeiro await, logo apos definir dataInicio e orgId.

Passo 2: Substitua os 5 awaits independentes (enviadosQuery, recebidosQuery, comAnexosQuery, favoritosQuery, rascunhosQuery) por um unico:
  const [envRes, recRes, anexRes, favRes, raRes] = await Promise.all([enviadosQuery, recebidosQuery, comAnexosQuery, favoritosQuery, rascunhosQuery])

Passo 3: Ajuste as variaveis abaixo para usar os resultados desestruturados.

Passo 4: No loop de thread batches (linha ~121), substitua o for...await por:
  const resultados = await Promise.all(batches.map(batch => supabase...in('thread_id', batch)))
  for (const { data: respostas } of resultados) { ... }

Execute npm run build para validar. Se houver erro de tipo, reverta e documente.
```

---

## FASE 3 — Reducao de Payload (baixo risco, ganho moderado)

**Objetivo:** Eliminar colunas desnecessarias nas queries principais.
**Risco:** Baixo — remover SELECT * e listar campos especificos.
**Impacto estimado:** -20-30% no tamanho do payload de listagem.

---

### TAREFA 3.1 — SELECT especifico em emails.api.ts (listar)

**Prioridade:** MEDIA
**Arquivo:** `src/modules/emails/services/emails.api.ts`
**Linha atual:** ~40
**Problema:** `.select('*')` na funcao `listar` busca todas as colunas, incluindo `corpo_html` e `corpo_texto` que podem ter varios KB cada. Esses campos so sao necessarios ao abrir o email (funcao `obter`).

```typescript
// ANTES (linha ~40)
let query = supabase
  .from('emails_recebidos')
  .select('*', { count: 'exact' })
  .eq('organizacao_id', orgId)
  // ...

// DEPOIS — apenas campos necessarios para a lista
let query = supabase
  .from('emails_recebidos')
  .select(
    'id, organizacao_id, usuario_id, pasta, de_nome, de_email, para_email, assunto, ' +
    'preview, lido, favorito, tem_anexos, total_aberturas, aberto_em, data_email, ' +
    'thread_id, provider_id, criado_em, atualizado_em',
    { count: 'exact' }
  )
  .eq('organizacao_id', orgId)
  // ...
```

**Campos omitidos:** `corpo_html`, `corpo_texto` (carregados on-demand pelo `useEmail` via lazy body fetch), `headers_raw`, `tracking_id`, `tracking_pixel_url` e outros campos de rastreamento.

**Prompt de implementacao:**
```
Abra src/modules/emails/services/emails.api.ts.
Localize a funcao listar (linha ~30) onde ha .select('*', { count: 'exact' }).

Confirme via Supabase MCP quais colunas existem na tabela emails_recebidos antes de alterar.
  Execute: SELECT column_name FROM information_schema.columns WHERE table_name = 'emails_recebidos' ORDER BY ordinal_position;

Substitua .select('*', { count: 'exact' }) por uma lista especifica de colunas
que excluia: corpo_html, corpo_texto, headers_raw, corpo_html_original e similares (campos de conteudo pesado).
Mantenha: id, organizacao_id, usuario_id, pasta, de_nome, de_email, para_email, assunto, preview,
          lido, favorito, tem_anexos, total_aberturas, aberto_em, data_email, thread_id,
          provider_id, contato_id, criado_em, atualizado_em.

Execute npm run build para validar tipos TypeScript. Se houver erro, reverta.
```

---

## 7. Tabela de Problemas por Severidade

### CRITICO (implementar primeiro)
| # | Arquivo | Linha | Problema | Impacto |
|---|---------|-------|---------|---------|
| 1.1 | `useEmails.ts` | 22,33,58,174,212,307 | 6 hooks sem staleTime/gcTime | -70% queries |

### ALTO
| # | Arquivo | Linha | Problema | Impacto |
|---|---------|-------|---------|---------|
| 1.2 | `useEmailsMetricas.ts` | 190 | Falta gcTime + refetchOnWindowFocus | Cache descartado |
| 2.1 | `EmailItem.tsx` | 30 | Sem React.memo — 20 re-renders por selecao | -95% re-renders lista |
| 2.2 | `useEmailsMetricas.ts` | 67-171 | 5-7 queries sequenciais (2-3s) | -70% latencia metricas |

### MEDIO
| # | Arquivo | Linha | Problema | Impacto |
|---|---------|-------|---------|---------|
| 1.3 | `useEmailRealtime.ts` | 22 | Debounce 2s (deveria ser 5s) | -60% invalidacoes no bulk sync |
| 3.1 | `emails.api.ts` | 40 | SELECT * traz corpo_html/texto na lista | -20% payload |

---

## 8. O que ja esta bem implementado

| Aspecto | Status | Detalhe |
|---------|--------|---------|
| Indices no banco | ✅ | `idx_emails_tenant_user_pasta`, `idx_emails_busca` (GIN), `idx_emails_tenant_user_lido` |
| Lazy load do corpo | ✅ | `useEmail` carrega `corpo_html/texto` on-demand via `fetchEmailBody` |
| Cleanup do Realtime | ✅ | `supabase.removeChannel(channel)` + `clearTimeout` no return do useEffect |
| Guard `isSyncingRef` | ✅ | `useAutoSyncEmails` previne sobreposicao de syncs |
| Optimistic updates | ✅ | `useAtualizarEmail` tem rollback em caso de erro |
| staleTime em metricas | ✅ | `useEmailsMetricas` tem `staleTime: 5min` |
| Debounce de busca | ✅ | Campo de busca ja tem debounce implementado |

---

## 9. Checklist de Implementacao por Fase

### Fase 1 — Cache e Realtime (menor risco, maior ROI)
- [x] 1.1 staleTime/gcTime/refetchOnWindowFocus em 6 hooks (useEmails.ts)
- [x] 1.2 gcTime + refetchOnWindowFocus em useEmailsMetricas
- [x] 1.3 Debounce Realtime: 2000ms → 5000ms

### Fase 2 — Memoizacao e Paralelizacao
- [x] 2.1 React.memo em EmailItem
- [x] 2.2 Promise.all() em fetchMetricas (queries independentes + thread batches)

### Fase 3 — Reducao de Payload
- [x] 3.1 SELECT especifico em emails.api.ts listar() (sem corpo_html/texto/anexos_info)

---

## 10. Historico de Versoes

| Versao | Data | Autor | Descricao |
|--------|------|-------|-----------|
| v1.0 | 2026-02-24 | Claude Sonnet 4.6 | Versao inicial — baseado em analise profunda de 11 problemas |

---

> **AIDEV-NOTE:** Este documento e a fonte de verdade para as otimizacoes de performance do modulo /emails.
> Cada tarefa tem um prompt especifico pronto para implementacao direta.
> Nenhuma correcao aqui altera funcionalidade — apenas performance e escalabilidade.
> Implementar sempre em branch separada, testando build antes de commit.
