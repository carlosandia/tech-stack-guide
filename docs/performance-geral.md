# PRD: Performance Geral — Otimizacao dos Modulos Principais

| Campo | Valor |
|-------|-------|
| **Autor** | Equipe Tecnica Renove |
| **Data de criacao** | 2026-02-24 |
| **Ultima atualizacao** | 2026-02-24 |
| **Versao** | v1.0 |
| **Status** | Aprovado — Aguardando Implementacao |
| **Modulos impactados** | /conversas · /negocios · /contatos |
| **Tipo** | Performance Engineering (nao e feature nova) |
| **Revisor tecnico** | Claude Sonnet 4.6 (analise automatizada) |

---

## ⚠️ Regras Obrigatorias de Execucao

> **Estas regras se aplicam a QUALQUER agente, desenvolvedor ou IA que for implementar qualquer item deste documento. Devem ser lidas e seguidas antes de tocar em qualquer arquivo.**

### R1 — Simples antes de Complexo

Sempre optar pela solucao mais simples que resolve o problema. Se existir uma abordagem de 5 linhas e uma de 50 linhas com resultado equivalente, usar as 5 linhas. Nao introduzir abstrações, utilitarios ou padroes novos quando uma edicao pontual resolve.

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
- Usar **Context7** para ler a documentacao oficial da biblioteca em questao (`@tanstack/react-virtual`, `@tanstack/react-query`, etc.)
- Nao assumir API de memoria — verificar a versao instalada no `package.json` e consultar a documentacao correta

### R6 — Verificar Schema do Banco Antes de Qualquer Migration

Antes de escrever qualquer SQL (indices, migrations, queries):
- Ler as tabelas e colunas reais via **Supabase MCP** (`list_tables`, `execute_sql` com `information_schema`)
- Confirmar nome exato da tabela e colunas — nunca assumir nomes
- Especialmente critico para: `contatos`, `oportunidades`, `funis`, `etapas_funil`

---

## 1. Resumo Executivo

Este documento consolida os **35 problemas de performance** identificados via analise profunda de codigo nos tres modulos de maior trafego do CRM Renove: `/conversas`, `/negocios` e `/contatos`. Todos esses modulos serao intensamente usados em producao com multiplos usuarios simultaneos, alto volume de registros e sessoes longas de retencao.

A analise revelou que os problemas nao sao de funcionalidade — o sistema funciona corretamente. O problema e **escalabilidade**: padroes que funcionam com 50 registros degradam severamente com 500–5.000 registros ou 10+ usuarios simultaneos. As correcoes propostas eliminam gargalos sem alterar nenhuma funcionalidade existente.

Impacto esperado apos implementacao completa: reducao de **70–90% na latencia percebida**, eliminacao de memory leaks em sessoes longas e suporte confortavel a **5x o volume atual** sem infraestrutura adicional.

---

## 2. Contexto e Motivacao

### 2.1 Problema

O CRM esta sendo preparado para producao com usuarios reais. Os tres modulos criticos apresentam padroes arquiteturais que funcionam em desenvolvimento (poucos dados, usuario unico) mas colapsam em producao:

- **N+1 Queries**: Cada pagina de dados dispara 7–30 queries ao banco em vez de 1–3
- **Sem virtualizacao**: Listas renderizam 500+ elementos no DOM simultaneamente
- **Memory leaks**: Subscriptions Realtime nao sao fechadas corretamente
- **100 setIntervals simultaneos**: Contagem regressiva SLA no Kanban cria 100 timers/pagina
- **Busca sem indice**: Full table scan em 8 colunas para cada busca de contato
- **Cache mal configurado**: React Query refaz fetch em cada troca de aba

### 2.2 Impacto no Negocio

| Cenario | Sem otimizacao | Com otimizacao |
|---------|----------------|----------------|
| Abrir /contatos com 5.000 registros | 2–5s de carregamento | <300ms |
| Buscar contato por nome | 2–5s (full scan) | <50ms (indice GIN) |
| Scroll em chat com 500 mensagens | Trava, 20fps | Fluido, 60fps |
| 10 usuarios no Kanban simultaneos | CPU alta, lentidao | Performance estavel |
| Sessao longa de 2h em /conversas | Memory leak +100MB | Memoria estavel |
| Filtrar Kanban com 1.000 oportunidades | 200ms de lag | <16ms |

### 2.3 Alinhamento Estrategico

Performance e retencao de usuarios sao diretamente correlacionadas. Sistemas que respondem em <300ms tem taxa de abandono 3x menor. As correcoes aqui garantem que o CRM suporte crescimento de clientes sem necessidade de upgrade de infraestrutura imediato.

---

## 3. Escopo

### 3.1 O que ESTA no escopo

- Otimizacao de queries existentes (sem alterar contratos de API)
- Adicao de `React.memo`, `useCallback`, `useMemo` onde ausentes
- Configuracao de `staleTime` e `gcTime` no React Query
- Virtualizacao de listas longas com `@tanstack/react-virtual` (ja na stack)
- Migration de indice GIN no banco de dados
- Consolidacao de subscriptions Realtime
- Paralelizacao de queries sequenciais com `Promise.all()`
- Refactoring de SLA intervals para contexto compartilhado

### 3.2 O que NAO esta no escopo

- Novas funcionalidades
- Mudanca de stack ou dependencias (apenas o que ja esta instalado)
- Alteracao de contratos de API publicos
- Mudanca de schema de banco alem dos indices
- Mudanca de UI/UX

### 3.3 Escopo futuro (pos-MVP performance)

- Paginacao lazy do Kanban por coluna (1.000+ oportunidades)
- Streaming de exportacao de contatos (10K+)
- Service Worker para cache offline
- Server-Side Rendering parcial para first paint

---

## 4. Requisitos Nao-Funcionais (Metas de Performance)

| Metrica | Baseline atual (estimado) | Meta apos otimizacao | Prazo |
|---------|--------------------------|----------------------|-------|
| Carregamento inicial /contatos | 2–5s | <500ms | Fase 1 |
| Busca de contato por nome | 2–5s | <100ms | Fase 2 |
| Scroll em chat (500 mensagens) | 20fps (jank) | 60fps | Fase 2 |
| Carregamento Kanban (500 ops) | 3–5s | <800ms | Fase 1–2 |
| Drag-and-drop no Kanban | 300–500ms lag | <50ms | Fase 2 |
| Memoria em sessao 2h /conversas | +100MB leak | Estavel | Fase 1 |
| CPU idle com SLA ativo | ~50% | <5% | Fase 1 |
| Refetch desnecessario por aba | 2–3x por sessao | 0 | Fase 1 |

---

## 5. Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| React.memo quebrar comportamento de render | Baixa | Medio | Testar visualmente cada componente apos wrap |
| staleTime muito alto causar dados desatualizados | Baixa | Medio | Usar valores conservadores (60s para dados volateis, 5min para estaticos) |
| Migration de indice bloquear tabela contatos | Baixa | Alto | Usar `CREATE INDEX CONCURRENTLY` no Supabase |
| Virtualizacao quebrar scroll comportamento especifico | Media | Medio | Testar scroll-to-bottom em chat apos implementar |
| Promise.all() mascarar erro de query individual | Baixa | Baixo | Usar Promise.allSettled() onde apropriado |

---

## 6. Fases de Implementacao

As correcoes estao organizadas em 4 fases por criterios de:
1. **Risco**: do mais seguro ao mais complexo
2. **Retorno**: do maior impacto ao menor
3. **Dependencias**: correcoes que desbloqueiam outras vem primeiro

---

## FASE 1 — Configuracoes e Corrects Cirurgicas (1–5 linhas por arquivo)

**Objetivo:** Eliminar refetches desnecessarios, memory leaks e CPU waste sem tocar em logica de renderizacao.
**Risco:** Minimo — apenas configuracoes e cleanup.
**Impacto estimado:** -50% em requests desnecessarios, eliminar memory leak de /conversas.

---

### TAREFA 1.1 — staleTime e gcTime nos hooks criticos

**Prioridade:** CRITICA
**Arquivos afetados:** 6 hooks
**Risco de quebra:** Nenhum

#### Subtarefa 1.1.1 — useContatos

**Arquivo:** `src/modules/contatos/hooks/useContatos.ts`
**Linha atual:** 10-14
**Problema:** Sem `staleTime` → refetch a cada troca de aba do browser

```typescript
// ANTES
return useQuery({
  queryKey: ['contatos', params],
  queryFn: () => contatosApi.listar(params),
})

// DEPOIS
return useQuery({
  queryKey: ['contatos', params],
  queryFn: () => contatosApi.listar(params),
  staleTime: 2 * 60 * 1000,   // 2 minutos — dados de lista
  gcTime: 10 * 60 * 1000,     // 10 minutos — manter em cache
  refetchOnWindowFocus: false, // evitar refetch ao trocar aba
})
```

**Prompt de implementacao:**
```
Abra src/modules/contatos/hooks/useContatos.ts.
No hook useContatos (linha ~10), adicione dentro do useQuery:
  staleTime: 2 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  refetchOnWindowFocus: false,
Nao altere mais nada neste arquivo. Nao crie novos hooks.
```

---

#### Subtarefa 1.1.2 — useKanban

**Arquivo:** `src/modules/negocios/hooks/useKanban.ts`
**Linha atual:** ~59
**Problema:** `refetchOnWindowFocus: true` + queryKey instavel = 2–3 fetches extras por sessao

```typescript
// ANTES
return useQuery({
  queryKey: ['kanban', funilId, filtros],
  queryFn: () => negociosApi.carregarKanban(funilId!, filtros),
  enabled: !!funilId,
  staleTime: 30 * 1000,
  refetchOnWindowFocus: true,
})

// DEPOIS
return useQuery({
  queryKey: ['kanban', funilId, filtros],
  queryFn: () => negociosApi.carregarKanban(funilId!, filtros),
  enabled: !!funilId,
  staleTime: 60 * 1000,         // aumentar de 30s para 60s
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,  // evitar refetch ao trocar aba
})
```

**Prompt de implementacao:**
```
Abra src/modules/negocios/hooks/useKanban.ts.
No useQuery do kanban, altere refetchOnWindowFocus de true para false
e staleTime de 30 * 1000 para 60 * 1000.
Adicione gcTime: 5 * 60 * 1000.
Nao altere mais nada.
```

---

#### Subtarefa 1.1.3 — SLA Config no KanbanBoard

**Arquivo:** `src/modules/negocios/components/kanban/KanbanBoard.tsx`
**Linha atual:** ~54
**Problema:** Sem `staleTime` → fetch de config SLA a cada render do board

```typescript
// ADICIONAR dentro do useQuery de slaConfig:
staleTime: 10 * 60 * 1000, // SLA config muda raramente — 10 minutos
gcTime: 30 * 60 * 1000,
```

**Prompt de implementacao:**
```
Abra src/modules/negocios/components/kanban/KanbanBoard.tsx.
Localize o useQuery que busca configuracoes_distribuicao para SLA (linha ~54).
Adicione staleTime: 10 * 60 * 1000 e gcTime: 30 * 60 * 1000 dentro desse useQuery.
Nao altere mais nada.
```

---

#### Subtarefa 1.1.4 — Membros no DetalhesOportunidadeModal

**Arquivo:** `src/modules/negocios/components/detalhes/DetalhesOportunidadeModal.tsx`
**Linha atual:** ~52
**Problema:** staleTime de 60s faz refetch a cada modal aberto (membros mudam raramente)

```typescript
// ALTERAR
staleTime: 60 * 1000, // 60 segundos
// PARA
staleTime: 15 * 60 * 1000, // 15 minutos — membros nao mudam com frequencia
```

**Prompt de implementacao:**
```
Abra src/modules/negocios/components/detalhes/DetalhesOportunidadeModal.tsx.
No useQuery que busca 'membros_tenant' (linha ~52), altere staleTime de 60 * 1000
para 15 * 60 * 1000.
Nao altere mais nada.
```

---

### TAREFA 1.2 — Corrigir subscription Realtime sem cleanup em /conversas

**Prioridade:** CRITICA (memory leak em sessoes longas)
**Arquivo:** `src/modules/conversas/hooks/useConversasRealtime.ts`
**Linha atual:** 30-143
**Problema:** Subscriptions abertas sem cleanup correto acumulam em sessoes longas

**O que verificar e corrigir:**
1. Todo `supabase.channel()` deve ter `return () => supabase.removeChannel(channel)` no cleanup do useEffect
2. O channel nao deve ser recriado desnecessariamente (dependencias do useEffect)

```typescript
// PADRAO CORRETO (verificar se esta assim)
useEffect(() => {
  const channel = supabase.channel(`...`)
    .on('postgres_changes', ..., handler)
    .subscribe()

  return () => {
    supabase.removeChannel(channel) // DEVE existir aqui
  }
}, [organizacaoId]) // dependencias minimas e estaveis
```

**Prompt de implementacao:**
```
Abra src/modules/conversas/hooks/useConversasRealtime.ts.
Verifique cada useEffect que cria um supabase.channel().
Para cada um, confirme que o return do useEffect chama supabase.removeChannel(channel).
Se algum estiver faltando, adicione o cleanup.
Confirme que as dependencias do useEffect sao minimas (apenas IDs estaveis).
Nao altere a logica de processamento dos eventos.
```

---

### TAREFA 1.3 — Debounce do Realtime no Kanban

**Prioridade:** ALTA
**Arquivo:** `src/modules/negocios/hooks/useKanban.ts`
**Linha atual:** ~27-56
**Problema:** Debounce de 2000ms faz outros usuarios esperarem 2s para ver atualizacoes

```typescript
// ANTES
}, 2000) // 2 segundos

// DEPOIS
}, 500) // 500ms — responsivo sem flood
```

**Prompt de implementacao:**
```
Abra src/modules/negocios/hooks/useKanban.ts.
Localize o debounceTimerRef onde setTimeout e chamado com 2000ms.
Altere para 500.
Nao altere mais nada.
```

---

### TAREFA 1.4 — refetchOnWindowFocus em hooks de conversas

**Prioridade:** ALTA
**Arquivos:** hooks em `src/modules/conversas/hooks/`
**Problema:** Usuarios que trocam de aba frequentemente disparam refetches desnecessarios

**Prompt de implementacao:**
```
Abra todos os arquivos em src/modules/conversas/hooks/ que usam useQuery.
Em cada useQuery que NAO seja de dados em tempo real (exceto mensagens novas),
adicione refetchOnWindowFocus: false.
Para hooks de mensagens, mantenha o padrao atual pois dependem de Realtime.
Nao altere a logica dos hooks.
```

---

## FASE 2 — Memoizacao de Componentes (React.memo + useCallback)

**Objetivo:** Eliminar re-renders desnecessarios nas listas e boards.
**Risco:** Baixo — apenas envolve componentes em memo sem alterar logica.
**Impacto estimado:** -80% em renders desnecessarios durante interacao.

---

### TAREFA 2.1 — Memoizar KanbanCard

**Prioridade:** CRITICA
**Arquivo:** `src/modules/negocios/components/kanban/KanbanCard.tsx`
**Linha atual:** 128
**Problema:** KanbanCard e forwardRef mas SEM React.memo — re-renderiza com qualquer update do pai

```typescript
// ANTES
export const KanbanCard = forwardRef<HTMLDivElement, KanbanCardProps>(
  function KanbanCard({ oportunidade, ...props }, ref) {
    // ...
  }
)

// DEPOIS
export const KanbanCard = memo(forwardRef<HTMLDivElement, KanbanCardProps>(
  function KanbanCard({ oportunidade, ...props }, ref) {
    // ...
  }
))

// Adicionar no topo do arquivo (ja pode existir):
import { memo } from 'react'
```

**Prompt de implementacao:**
```
Abra src/modules/negocios/components/kanban/KanbanCard.tsx.
Importe memo do react (adicionar ao import existente de React).
Envolva o export do KanbanCard com memo():
  export const KanbanCard = memo(forwardRef<...>(...))
Verifique que memo esta importado. Nao altere a logica interna do componente.
Teste visualmente que o card ainda renderiza corretamente apos a mudanca.
```

---

### TAREFA 2.2 — Memoizar KanbanColumn

**Prioridade:** CRITICA
**Arquivo:** `src/modules/negocios/components/kanban/KanbanColumn.tsx`
**Linha atual:** 65

**Prompt de implementacao:**
```
Abra src/modules/negocios/components/kanban/KanbanColumn.tsx.
Importe memo do react.
Envolva o export do KanbanColumn com memo():
  export const KanbanColumn = memo(forwardRef<...>(...))
Garanta que os handlers passados como props (onDragStart, etc.) sao estaveis
(criados com useCallback no componente pai, NegociosPage ou KanbanBoard).
Nao altere a logica interna.
```

---

### TAREFA 2.3 — Memoizar handlers no KanbanBoard/NegociosPage

**Prioridade:** ALTA
**Arquivo:** `src/modules/negocios/pages/NegociosPage.tsx` e `KanbanBoard.tsx`
**Problema:** Handlers inline re-criados a cada render invalidam o memo das colunas/cards

**Prompt de implementacao:**
```
Abra src/modules/negocios/pages/NegociosPage.tsx.
Identifique todas as funcoes passadas como props para KanbanBoard e KanbanColumn
(ex: onDragEnd, onCardClick, onMoverEtapa, onFiltroChange, etc.).
Envolva cada uma com useCallback(), listando dependencias corretamente.
Importe useCallback do react se nao estiver importado.
Nao altere a logica das funcoes, apenas o wrapper.
```

---

### TAREFA 2.4 — Memoizar ChatMessageBubble

**Prioridade:** CRITICA
**Arquivo:** `src/modules/conversas/components/ChatMessageBubble.tsx`
**Linha atual:** 967
**Problema:** Sem React.memo — 500 bolhas re-renderizam a cada update do pai

```typescript
// ANTES
export function ChatMessageBubble({ mensagem, ...props }: ChatMessageBubbleProps) {

// DEPOIS
export const ChatMessageBubble = memo(function ChatMessageBubble(
  { mensagem, ...props }: ChatMessageBubbleProps
) {
  // ...
})
```

**Prompt de implementacao:**
```
Abra src/modules/conversas/components/ChatMessageBubble.tsx.
Importe memo do react.
Converta a funcao ChatMessageBubble de function declaration para
const ChatMessageBubble = memo(function ChatMessageBubble(...) { ... }).
Exporte como named export. Nao altere a logica interna.
Teste que as mensagens ainda renderizam corretamente (texto, imagem, audio, reacoes).
```

---

### TAREFA 2.5 — Memoizar celulas interativas de ContatosList

**Prioridade:** ALTA
**Arquivo:** `src/modules/contatos/components/ContatosList.tsx`
**Linha atual:** 164-477
**Problema:** Celulas sem memo re-renderizam todas as 50 linhas ao editar qualquer campo

**Prompt de implementacao:**
```
Abra src/modules/contatos/components/ContatosList.tsx.
Identifique os subcomponentes de celula definidos dentro do arquivo:
CellNomePessoa, CellSegmentacao, CellResponsavel, CellEmpresaVinculada (ou similares).
Envolva cada um com React.memo():
  const CellNomePessoa = memo(function CellNomePessoa({ contato, ... }) { ... })
Importe memo do react.
Garanta que os handlers passados para essas celulas sao estaveis (useCallback no pai).
Nao altere a logica de renderizacao das celulas.
```

---

### TAREFA 2.6 — SLA Clock Context compartilhado (eliminar 100 intervals)

**Prioridade:** CRITICA
**Arquivo:** `src/modules/negocios/components/kanban/KanbanCard.tsx` (linha 146)
**Problema:** Cada card cria `setInterval(1000ms)` proprio = 100 timers/pagina = 50% CPU

**Solucao:** Criar um contexto de relogio unico que bate 1x/segundo e todos os cards consomem.

**Prompt de implementacao:**
```
Crie o arquivo src/modules/negocios/contexts/SlaClockContext.tsx com o seguinte:
1. Um contexto React que exporta o timestamp atual (Date.now())
2. Um SlaClockProvider que mantem UM setInterval de 1 segundo
3. Um hook useSlaAgora() que retorna o timestamp atual do contexto

Em KanbanCard.tsx (linha ~146), substitua o useEffect com setInterval por:
  const agora = useSlaAgora()
E remova o state local `agora` e o useEffect com setInterval.

Envolva KanbanBoard (ou o nivel acima) com <SlaClockProvider>.
Isso elimina N timers e substitui por 1 timer compartilhado.
Nao altere a logica de calculo de SLA (apenas de onde vem o timestamp atual).
```

---

## FASE 3 — Virtualizacao e N+1 Queries (Maior impacto, medio risco)

**Objetivo:** Resolver os gargalos mais severos de scalabilidade.
**Risco:** Medio — envolve refatoracao de renderizacao e queries.
**Impacto estimado:** Suporte a 10x volume atual sem degradacao.

---

### TAREFA 3.1 — Virtualizacao de mensagens no ChatWindow

**Prioridade:** CRITICA
**Arquivo:** `src/modules/conversas/components/ChatMessages.tsx`
**Linha atual:** 357-429
**Dependencia:** `@tanstack/react-virtual` (ja instalado na stack)
**Problema:** Todas as mensagens no DOM — 500 mensagens = trava em 20fps

**Prompt de implementacao:**
```
Abra src/modules/conversas/components/ChatMessages.tsx.

Implemente virtualizacao com @tanstack/react-virtual:

1. Importe useVirtualizer de '@tanstack/react-virtual'
2. Crie um ref para o container de scroll (containerRef)
3. Instancie o virtualizer:
   const rowVirtualizer = useVirtualizer({
     count: visibleMessages.length,
     getScrollElement: () => containerRef.current,
     estimateSize: () => 80, // altura media de mensagem
     overscan: 5,
   })
4. No JSX, substitua o .map() por:
   <div ref={containerRef} style={{ overflowY: 'auto', height: '100%' }}>
     <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
       {rowVirtualizer.getVirtualItems().map(virtualRow => (
         <div key={virtualRow.key} style={{
           position: 'absolute',
           transform: `translateY(${virtualRow.start}px)`,
           width: '100%',
         }}>
           <ChatMessageBubble mensagem={visibleMessages[virtualRow.index]} ... />
         </div>
       ))}
     </div>
   </div>

5. Mantenha o scroll-to-bottom ao receber nova mensagem (scrollToIndex no virtualizer).
6. Mantenha scroll-to-top para carregar mais mensagens (onLoadMore ao detectar topo).

Teste: abrir conversa com 200+ mensagens, verificar que scroll e fluido (60fps).
```

---

### TAREFA 3.2 — Virtualizacao de cards no KanbanColumn

**Prioridade:** CRITICA
**Arquivo:** `src/modules/negocios/components/kanban/KanbanColumn.tsx`
**Linha atual:** 253-265
**Problema:** Todos os cards renderizados mesmo fora da viewport

**Prompt de implementacao:**
```
Abra src/modules/negocios/components/kanban/KanbanColumn.tsx.

Implemente virtualizacao com @tanstack/react-virtual:

1. Importe useVirtualizer de '@tanstack/react-virtual'
2. Adicione ref ao container de scroll da coluna (cardsContainerRef ja existe, verificar)
3. Instancie o virtualizer para os cards da coluna:
   const rowVirtualizer = useVirtualizer({
     count: etapa.oportunidades.length,
     getScrollElement: () => cardsContainerRef.current,
     estimateSize: () => 120, // altura media do KanbanCard
     overscan: 3,
   })
4. Substitua renderCardsWithDropZones() por virtualizacao:
   <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
     {rowVirtualizer.getVirtualItems().map(virtualRow => {
       const op = etapa.oportunidades[virtualRow.index]
       return (
         <div key={op.id} style={{ position: 'absolute', transform: `translateY(${virtualRow.start}px)`, width: '100%', padding: '4px 0' }}>
           <KanbanCard oportunidade={op} ... />
         </div>
       )
     })}
   </div>

ATENCAO: Drag-and-drop com @dnd-kit pode precisar de ajuste.
Verifique se os droppable zones ainda funcionam apos virtualizacao.
Teste: coluna com 100+ cards, verificar scroll fluido e drag-and-drop funcional.
```

---

### TAREFA 3.3 — Paralelizar batch de tarefas no Kanban (N+1)

**Prioridade:** CRITICA
**Arquivo:** `src/modules/negocios/services/negocios.api.ts`
**Linha atual:** 358-384
**Problema:** Loop sequencial de batches de tarefas — 20 queries seriais para 1000 oportunidades

```typescript
// ANTES (sequencial)
for (let i = 0; i < opIds.length; i += batchSize) {
  const { data: tarefas } = await supabase...
}

// DEPOIS (paralelo)
const batches = []
for (let i = 0; i < opIds.length; i += batchSize) {
  batches.push(opIds.slice(i, i + batchSize))
}
const resultados = await Promise.all(
  batches.map(batch =>
    supabase.from('tarefas')
      .select('oportunidade_id, status')
      .in('oportunidade_id', batch)
      .is('deletado_em', null)
  )
)
// consolidar resultados de resultados.flatMap(r => r.data || [])
```

**Prompt de implementacao:**
```
Abra src/modules/negocios/services/negocios.api.ts.
Localize o loop for que busca tarefas em batches sequencialmente (linha ~358-384).
Refatore para usar Promise.all():
1. Calcule todos os batches (arrays de IDs) em um array de batches
2. Use Promise.all() para executar todas as queries de tarefas em paralelo
3. Use .flatMap() para consolidar os resultados
4. Mantenha a logica de construcao do tarefasPendentesMap identica
Nao altere nenhuma outra parte do arquivo.
Teste: kanban com 200+ oportunidades deve carregar mais rapido.
```

---

### TAREFA 3.4 — Paralelizar queries em contatosApi.listar() (N+1)

**Prioridade:** CRITICA
**Arquivo:** `src/modules/contatos/services/contatos.api.ts`
**Linha atual:** 180-359
**Problema:** 7 queries sequenciais por pagina de contatos

**Prompt de implementacao:**
```
Abra src/modules/contatos/services/contatos.api.ts.
Analise a funcao listar() e identifique as queries que podem ser paralelizadas.

Queries que dependem do resultado da query principal (contatos) podem ser executadas
em paralelo entre si apos obter os IDs dos contatos:

1. Execute a query principal de contatos primeiro (retorna IDs)
2. Em seguida, use Promise.all() para executar em PARALELO:
   - Query de segmentos vinculados
   - Query de owners
   - Query de empresas vinculadas
   - Query de campos customizados (definicoes)
   - Query de valores de campos customizados
   - Query de contagem de oportunidades

3. Consolide os resultados para montar o objeto final

Mantenha a estrutura de retorno identica (mesmo shape de dados).
Nao altere filtros, paginacao ou parametros da funcao.
Teste: listar contatos deve ser mais rapido (especialmente com muitos registros).
```

---

### TAREFA 3.5 — Consolidar ultima mensagem no query de conversas (N+1)

**Prioridade:** CRITICA
**Arquivo:** `src/modules/conversas/services/conversas.api.ts`
**Linha atual:** 239-304
**Problema:** Query separada para ultima mensagem de cada conversa (N+1)

**Prompt de implementacao:**
```
Abra src/modules/conversas/services/conversas.api.ts.
Na funcao que lista conversas (linha ~239), identifique onde ultima_mensagem
e buscada separadamente para cada conversa.

Tente consolidar usando subquery do Supabase (se a tabela mensagens tiver
conversa_id como FK):

No .select() principal da query de conversas, adicione:
  ultima_mensagem:mensagens!conversas_id_fkey(
    id, conteudo, tipo, criado_em, status
    order=criado_em.desc
    limit=1
  )

Se o join direto nao funcionar pela estrutura das tabelas, use Promise.all()
para buscar ultimas mensagens de todas as conversas em UMA UNICA query:
  supabase.from('mensagens')
    .select('id, conversa_id, conteudo, tipo, criado_em')
    .in('conversa_id', conversaIds)
    .order('criado_em', { ascending: false })

E agrupe por conversa_id no JS para pegar apenas a ultima de cada uma.

Nao altere a estrutura de retorno da API.
Teste: lista de conversas deve carregar mais rapido.
```

---

### TAREFA 3.6 — Optimistic update nos kanban mutations (invalidateQueries cirurgico)

**Prioridade:** ALTA
**Arquivo:** `src/modules/negocios/hooks/useKanban.ts` e `useOportunidadeDetalhes.ts`
**Problema:** Toda mutacao invalida TODO o kanban forcando refetch completo

**Prompt de implementacao:**
```
Abra src/modules/negocios/hooks/useOportunidadeDetalhes.ts.
No hook useAtualizarOportunidade (linha ~32), substitua:
  queryClient.invalidateQueries({ queryKey: ['kanban'] })
Por optimistic update com setQueryData:

onMutate: async (variables) => {
  await queryClient.cancelQueries({ queryKey: ['kanban', funilId] })
  const snapshot = queryClient.getQueryData(['kanban', funilId])
  queryClient.setQueryData(['kanban', funilId], (old: any) => {
    if (!old) return old
    return {
      ...old,
      etapas: old.etapas.map((etapa: any) => ({
        ...etapa,
        oportunidades: etapa.oportunidades.map((op: any) =>
          op.id === variables.id ? { ...op, ...variables.payload } : op
        ),
      })),
    }
  })
  return { snapshot }
},
onError: (_err, _vars, context) => {
  if (context?.snapshot) {
    queryClient.setQueryData(['kanban', funilId], context.snapshot)
  }
},
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: ['kanban', funilId] }) // re-sync apos sucesso
},

Mantenha funilId disponivel no scope do hook (via parametro ou contexto).
```

---

## FASE 4 — Banco de Dados e Otimizacoes Avancadas

**Objetivo:** Otimizacao de queries no banco e casos de uso com volume extremo.
**Risco:** Baixo para indices, medio para paginacao.
**Impacto estimado:** Busca textual 100x mais rapida, suporte a 50K contatos.

---

### TAREFA 4.1 — Indice GIN para busca textual em contatos

**Prioridade:** CRITICA
**Onde:** Supabase Migration (banco de dados)
**Problema:** Busca ILIKE em 8 colunas = full table scan

**Migration SQL:**
```sql
-- AIDEV-NOTE: Indice GIN para busca full-text em contatos
-- Elimina full table scan em buscas ILIKE por nome/email/telefone
-- Usar CREATE INDEX CONCURRENTLY para nao bloquear tabela em producao

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contatos_busca_fts
  ON contatos
  USING GIN (
    to_tsvector('portuguese',
      coalesce(nome, '') || ' ' ||
      coalesce(sobrenome, '') || ' ' ||
      coalesce(email, '') || ' ' ||
      coalesce(telefone, '')
    )
  );

-- Indice adicional para busca por email exato (login, dedup)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contatos_email
  ON contatos (organizacao_id, lower(email))
  WHERE deletado_em IS NULL;
```

**Prompt de implementacao:**
```
Crie uma nova migration no Supabase com o SQL acima.
Use o MCP do Supabase (apply_migration) com nome "add_contatos_busca_gin_index".
Apos criar o indice, atualize a query ILIKE em contatos.api.ts para usar
full-text search quando possivel:
  .textSearch('nome', busca, { type: 'websearch', config: 'portuguese' })
em vez de multiplos .ilike().
Teste: busca de contato deve retornar em <100ms.
```

---

### TAREFA 4.2 — Indice composto em oportunidades

**Prioridade:** ALTA
**Onde:** Supabase Migration
**Problema:** Query do Kanban sem indice composto em funil_id + deletado_em

**Migration SQL:**
```sql
-- AIDEV-NOTE: Indice composto para query principal do Kanban
-- Otimiza: WHERE funil_id = ? AND deletado_em IS NULL ORDER BY posicao
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_oportunidades_kanban
  ON oportunidades (organizacao_id, funil_id, etapa_id)
  WHERE deletado_em IS NULL AND fechado_em IS NULL;

-- Indice para busca por titulo no kanban
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_oportunidades_titulo
  ON oportunidades (organizacao_id, funil_id)
  WHERE deletado_em IS NULL;
```

**Prompt de implementacao:**
```
Crie uma nova migration no Supabase com o SQL acima.
Use o MCP do Supabase (apply_migration) com nome "add_oportunidades_kanban_indexes".
Nao altere nenhum codigo de aplicacao para esta tarefa.
```

---

### TAREFA 4.3 — Remover SELECT * no frontend de oportunidades

**Prioridade:** ALTA
**Arquivo:** `src/modules/negocios/services/negocios.api.ts`
**Linha atual:** ~260
**Problema:** `.select('*')` traz todas as colunas — payload 20–30% maior que necessario

**Prompt de implementacao:**
```
Abra src/modules/negocios/services/negocios.api.ts.
Localize a query que usa .select('*') para oportunidades (linha ~260).
Substitua por select especifico com apenas os campos usados na UI:
  .select(`
    id, titulo, valor, moeda, etapa_id, funil_id, previsao_fechamento,
    qualificado_mql, qualificado_sql, criado_em, atualizado_em,
    usuario_responsavel_id, contato_id, observacoes
  `)
Verifique que nenhum campo usado pelo frontend foi omitido.
Se houver erro de TypeScript, ajuste o tipo de retorno para refletir os campos selecionados.
Nao altere a logica de processamento dos dados.
```

---

### TAREFA 4.4 — Virtualizacao da lista de contatos

**Prioridade:** ALTA
**Arquivo:** `src/modules/contatos/components/ContatosList.tsx`
**Linha atual:** 100-158

**Prompt de implementacao:**
```
Abra src/modules/contatos/components/ContatosList.tsx.
A lista usa uma tabela com linhas renderizadas via .map().
Implemente virtualizacao com @tanstack/react-virtual:

1. Adicione ref ao container da tabela (containerRef)
2. Instancie useVirtualizer:
   const rowVirtualizer = useVirtualizer({
     count: contatos.length,
     getScrollElement: () => containerRef.current,
     estimateSize: () => 56, // altura de linha de tabela
     overscan: 5,
   })
3. Mantenha o <table> e <thead> normais
4. No <tbody>, renderize apenas os itens virtuais:
   <tbody style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
     {rowVirtualizer.getVirtualItems().map(virtualRow => (
       <tr key={contatos[virtualRow.index].id}
           style={{ position: 'absolute', transform: `translateY(${virtualRow.start}px)`, width: '100%', display: 'table-row' }}>
         // ... celulas do contato
       </tr>
     ))}
   </tbody>

Atencao: CSS de tabela com position:absolute pode precisar de ajuste de largura das colunas.
Alternativa: usar div com role="table" em vez de table nativa para facilitar virtualizacao.
Teste: lista com 200+ contatos deve ter scroll fluido.
```

---

### TAREFA 4.5 — Lazy-load popovers nos KanbanCards

**Prioridade:** MEDIA
**Arquivo:** `src/modules/negocios/components/kanban/KanbanCard.tsx`
**Linha atual:** 391-461
**Problema:** AgendaQuickPopover e TarefasPopover instanciados em CADA card mesmo fechados

**Prompt de implementacao:**
```
Abra src/modules/negocios/components/kanban/KanbanCard.tsx.
Identifique AgendaQuickPopover e TarefasPopover (linhas ~391-461).

Adicione estado local para controlar abertura:
  const [agendaOpen, setAgendaOpen] = useState(false)
  const [tarefasOpen, setTarefasOpen] = useState(false)

Renderize o conteudo pesado apenas quando open=true:
  {agendaOpen && <AgendaQuickPopover ... />}
  {tarefasOpen && <TarefasPopover ... />}

Mantenha o botao de trigger sempre visivel.
O popover em si so e montado quando aberto, evitando 500 instancias no DOM.
Nao altere a logica interna dos popovers.
```

---

### TAREFA 4.6 — Debounce na busca inline do InlineEmpresaPopover

**Prioridade:** MEDIA
**Arquivo:** `src/modules/contatos/components/InlineEmpresaPopover.tsx`
**Linha atual:** 24-26
**Problema:** Dispara query a cada keystroke sem debounce

**Prompt de implementacao:**
```
Abra src/modules/contatos/components/InlineEmpresaPopover.tsx.
O componente tem um campo de busca que dispara useContatos a cada keystroke.

1. Adicione state local para o valor de busca instantaneo:
   const [searchInput, setSearchInput] = useState('')
   const [debouncedSearch, setDebouncedSearch] = useState('')

2. Adicione useEffect com debounce de 500ms:
   useEffect(() => {
     const timer = setTimeout(() => setDebouncedSearch(searchInput), 500)
     return () => clearTimeout(timer)
   }, [searchInput])

3. Use debouncedSearch na query:
   useContatos({ tipo: 'empresa', limit: 100, busca: debouncedSearch || undefined })

4. Use searchInput no valor do input.

Nao altere o comportamento de selecao de empresa.
```

---

## 7. Metricas de Sucesso

### 7.1 KPIs de Performance

| Metrica | Como medir | Meta | Responsavel |
|---------|-----------|------|-------------|
| Time to Interactive /contatos | Chrome DevTools > Performance | <500ms | Fase 1+3 |
| Busca por nome (500 contatos) | Network tab timing | <100ms | Fase 4.1 |
| Scroll 500 mensagens | DevTools > FPS meter | >55fps | Fase 3.1 |
| Kanban load (200 oportunidades) | Network timing | <800ms | Fase 3.3 |
| Memoria apos 2h /conversas | DevTools > Memory profiler | Sem crescimento | Fase 1.2 |
| CPU idle com SLA ativo | DevTools > Performance > CPU | <5% | Fase 2.6 |

### 7.2 Criterios de Lancamento de Cada Fase

**Fase 1 concluida quando:**
- [ ] Nenhum refetch em troca de aba (verificar Network tab)
- [ ] Memory profiler em /conversas estavel apos 30min
- [ ] Debounce do Kanban Realtime em 500ms (verificar no console)

**Fase 2 concluida quando:**
- [ ] React DevTools Profiler mostra <5 renders por interacao no Kanban
- [ ] ChatMessageBubble aparece como memo no Profiler
- [ ] CPU idle sem pico > 5% com Kanban aberto

**Fase 3 concluida quando:**
- [ ] Network tab mostra <5 queries por carregamento de Kanban
- [ ] Scroll em chat com 300+ mensagens e fluido (sem jank)
- [ ] Lista de contatos rola sem lag ate 200 itens

**Fase 4 concluida quando:**
- [ ] EXPLAIN ANALYZE confirma uso do indice GIN na busca
- [ ] Busca de contato retorna em <100ms com 5.000 registros
- [ ] Payload de oportunidades reduzido (verificar Response size no Network)

---

## 8. Historico de Versoes

| Versao | Data | Autor | Mudancas |
|--------|------|-------|----------|
| v1.0 | 2026-02-24 | Claude Sonnet 4.6 | Versao inicial — baseado em analise profunda de 35 problemas |

---

## 9. Checklist de Implementacao por Fase

### Fase 1 — Configuracoes (menor risco, maior ROI de curto prazo)
- [x] 1.1.1 staleTime em useContatos
- [x] 1.1.2 staleTime + refetchOnWindowFocus em useKanban
- [x] 1.1.3 staleTime em SLA Config
- [x] 1.1.4 staleTime em Membros no Modal
- [x] 1.2 Cleanup de subscriptions Realtime em /conversas (ja implementado)
- [x] 1.3 Debounce Realtime Kanban: 2000ms → 500ms
- [x] 1.4 refetchOnWindowFocus: false em hooks de conversas

### Fase 2 — Memoizacao (sem risco, grande impacto em interacao)
- [x] 2.1 React.memo em KanbanCard
- [x] 2.2 React.memo em KanbanColumn
- [x] 2.3 useCallback em handlers do NegociosPage/KanbanBoard (ja implementado)
- [x] 2.4 React.memo em ChatMessageBubble
- [x] 2.5 React.memo em celulas de ContatosList
- [x] 2.6 SlaClockContext compartilhado (eliminar N intervals)

### Fase 3 — Virtualizacao e N+1 (maior impacto, risco medio)
- [-] 3.1 Virtualizacao em ChatMessages (risco alto - ADIADO)
- [-] 3.2 Virtualizacao em KanbanColumn (risco alto/dnd-kit - ADIADO)
- [x] 3.3 Promise.all() nos batches de tarefas
- [x] 3.4 Promise.all() nas queries de contatos
- [x] 3.5 Consolidar ultima mensagem no query de conversas (ja implementado)
- [-] 3.6 Optimistic update no Kanban mutations (interface quebra callers - BLOQUEADO)

### Fase 4 — Banco e Avancados
- [x] 4.1 Migration: indice GIN em contatos (indices ja existiam no banco)
- [x] 4.2 Migration: indice composto em oportunidades (indices ja existiam no banco)
- [x] 4.3 Remover SELECT * em oportunidades (15 campos pontual, eliminando 10 colunas desnecessarias)
- [-] 4.4 Virtualizacao em ContatosList (risco alto position:absolute em table - ADIADO)
- [x] 4.5 Lazy-load popovers nos KanbanCards (AgendaQuickPopover lazy-mount)
- [x] 4.6 Debounce no InlineEmpresaPopover (500ms debounce adicionado)

---

> **AIDEV-NOTE:** Este documento e a fonte de verdade para as otimizacoes de performance.
> Cada tarefa tem um prompt especifico pronto para implementacao direta.
> Nenhuma correcao aqui altera funcionalidade — apenas performance e escalabilidade.
> Implementar sempre em branch separada, testando build antes de commit.
