
# Plano: Modulo de Tarefas (PRD-10) - Frontend Completo

## Visao Geral

Criar o modulo de Tarefas como pagina centralizada de acompanhamento (`/app/tarefas`), conectando diretamente ao Supabase via RLS (mesmo padrao usado em Contatos e Negocios). O backend Express ja existe mas o frontend usara acesso direto ao Supabase, seguindo a arquitetura padrao do projeto.

## Arquitetura de Dados

O modulo usara a tabela `tarefas` que ja possui RLS com `get_user_tenant_id()`. A filtragem por role (Admin ve tudo, Member ve apenas suas) sera feita no frontend na camada de servico (`tarefas.api.ts`), verificando o role do usuario logado via tabela `usuarios`.

Tabelas consultadas:
- `tarefas` - Dados principais (com filtro `oportunidade_id IS NOT NULL`)
- `oportunidades` - Titulo, codigo, funil_id, etapa_id
- `funis` - Nome do pipeline
- `etapas_funil` - Nome da etapa
- `usuarios` - Nome do responsavel (owner)

## Estrutura de Arquivos

```text
src/modules/tarefas/
  index.ts                          -- Barrel export
  pages/
    TarefasPage.tsx                 -- Pagina principal com metricas + filtros + lista
  components/
    TarefasToolbar.tsx              -- Injeta acoes no AppToolbar via context
    TarefasMetricasCards.tsx         -- 4 cards de metricas (Em Aberto, Atrasadas, Concluidas, Tempo Medio)
    TarefasFiltros.tsx              -- Barra de filtros (Pipeline, Etapa, Status, Prioridade, Responsavel, Periodo, Busca)
    TarefaItem.tsx                  -- Item individual da lista de tarefas
    TarefasList.tsx                 -- Lista paginada de tarefas
    ConcluirTarefaModal.tsx         -- Modal de confirmacao de conclusao
  hooks/
    useTarefas.ts                   -- TanStack Query hooks (listar, metricas, concluir)
  services/
    tarefas.api.ts                  -- Servico Supabase direto (queries, metricas, concluir)
```

## Secao Tecnica

### 1. Service Layer (`tarefas.api.ts`)

Seguindo o padrao de `negocios.api.ts` e `contatos.api.ts`:
- Helpers `getOrganizacaoId()`, `getUsuarioId()`, `getUserRole()` para identificar usuario
- Cache de IDs com reset no `onAuthStateChange`

Funcoes principais:

**`listarTarefas(filtros)`** - Query com joins:
```text
SELECT tarefas.*, 
  oportunidades(id, codigo, titulo, funil_id, etapa_id, funis(id, nome), etapas_funil(id, nome)),
  owner:usuarios!owner_id(id, nome)
FROM tarefas
WHERE organizacao_id = tenant
  AND oportunidade_id IS NOT NULL
  AND deletado_em IS NULL
  [+ filtros dinamicos]
```
- Se role = 'member': adiciona `owner_id = usuario_id`
- Se role = 'admin' e filtro responsavel: adiciona `owner_id = filtro`
- Paginacao com `range(from, to)` e `count: 'exact'`
- Ordenacao padrao: `data_vencimento ASC`

**`obterMetricas(filtros)`** - 4 queries separadas (head: true, count: 'exact'):
- Em aberto: `status IN ('pendente', 'em_andamento')`
- Atrasadas: `status = 'pendente' AND data_vencimento < now()`
- Concluidas: `status = 'concluida'` (no periodo)
- Tempo medio: calculo manual com `data_conclusao - criado_em`

**`concluirTarefa(tarefaId, observacao?)`** - Update:
- Busca tarefa, valida permissao (Member so pode concluir suas)
- Update `status = 'concluida'`, `data_conclusao = now()`
- Append observacao na descricao se fornecida

**`listarMembros()`** - Para o filtro de responsavel (apenas Admin):
- Query `usuarios` onde `role = 'member'` OR `role = 'admin'`

### 2. Hooks TanStack Query (`useTarefas.ts`)

```text
useTarefas(filtros)          -> queryKey: ['tarefas', filtros]
useTarefasMetricas(filtros)  -> queryKey: ['tarefas-metricas', filtros]
useConcluirTarefa()          -> mutation, invalida ['tarefas'] e ['tarefas-metricas']
```

### 3. Pagina Principal (`TarefasPage.tsx`)

Layout conforme Design System e PRD-10:
- Toolbar (via `useAppToolbar`): Titulo "Acompanhamento" + Busca + Filtros
- Body: Cards de metricas + Filtros expandidos + Lista paginada

**Estados gerenciados:**
- Filtros: pipeline_id, etapa_id, status[], prioridade[], owner_id, data_inicio, data_fim, busca
- Paginacao: page, limit (20)
- Card ativo: filtro rapido ao clicar em um card de metrica
- Modal de conclusao: tarefa selecionada

### 4. Cards de Metricas (`TarefasMetricasCards.tsx`)

4 cards em grid responsivo:
- **Em Aberto** (icone Clock, cor azul) - Clique filtra status=['pendente','em_andamento']
- **Atrasadas** (icone AlertTriangle, cor vermelha, borda vermelha) - Clique filtra atrasadas
- **Concluidas** (icone CheckCircle, cor verde) - Clique filtra status=['concluida']
- **Tempo Medio** (icone Timer, cor cinza) - Apenas informativo

Responsividade: `grid-cols-2 md:grid-cols-4`

### 5. Filtros (`TarefasFiltros.tsx`)

Conforme PRD-10 RF-003:
- **Pipeline**: Select populado com `listarFunis()` (reusa hook existente `useFunis`)
- **Etapa**: Select dependente da pipeline selecionada (carrega etapas dinamicamente)
- **Status**: Multi-select (Pendente, Em Andamento, Concluida, Cancelada)
- **Prioridade**: Multi-select (Baixa, Media, Alta, Urgente) com badges coloridos
- **Responsavel**: Select visivel **apenas para Admin** - lista membros do tenant
- **Periodo**: Date range (Hoje, Esta Semana, Este Mes, Personalizado)
- **Busca**: Input de texto com debounce (300ms)
- **Limpar Filtros**: Botao ghost para resetar

Layout: Inline no desktop, drawer/modal no mobile conforme Design System 7.7

### 6. Lista de Tarefas (`TarefasList.tsx` + `TarefaItem.tsx`)

Cada item exibe:
- Checkbox para concluir (esquerda)
- Icone por tipo (Phone, Mail, Calendar, MessageCircle/WhatsApp, MapPin, ClipboardList)
- Titulo da tarefa (clicavel - abre modal de oportunidade)
- Badge [ATRASADA] se `data_vencimento < now() AND status = 'pendente'`
- Subtitulo: `Oportunidade: Titulo - #codigo  |  Pipeline: Nome  |  Etapa: Nome`
- Data de vencimento (vermelho se atrasada, formatada com date-fns)
- Badge de prioridade (cores conforme `prioridadeTarefaOptions`)
- Nome do responsavel
- Badge [Automatica] ou [Manual] baseado em `tarefa_template_id`
- Botao "Concluir" (direita)

Paginacao: 20 itens por pagina com controles (Anterior/Proximo + indicador de pagina)

Empty state: Icone grande CheckSquare + texto "Nenhuma tarefa encontrada" + descricao contextual

Loading state: Skeleton com 3-4 items placeholder

### 7. Modal de Conclusao (`ConcluirTarefaModal.tsx`)

Usa o padrao `ModalBase` existente:
- Icone CheckCircle verde
- Titulo: "Concluir Tarefa"
- Exibe titulo da tarefa + nome da oportunidade
- Campo textarea opcional para observacao (max 1000 chars)
- Botoes: Cancelar (outline) + Concluir Tarefa (primary)
- Toast de sucesso ao concluir

### 8. Integracao com Modal de Oportunidade

Ao clicar no titulo da tarefa ou no nome da oportunidade, abre o `DetalhesOportunidadeModal` existente. Sera necessario importar o modal e passar os dados necessarios (oportunidadeId, funilId, etapas).

### 9. Roteamento

Adicionar rota `/app/tarefas` no `App.tsx`:
```text
<Route path="tarefas" element={<TarefasPage />} />
```

O menu "Tarefas" ja existe no `AppLayout.tsx` (item com icone CheckSquare, path `/app/tarefas`). Apenas precisa da pagina.

### 10. Barrel Export (`index.ts`)

```text
export { default as TarefasPage } from './pages/TarefasPage'
```

## Design System - Conformidade

Todos os componentes seguirao:
- **Tipografia**: Inter, `text-sm` para corpo, `text-xs` para captions/badges
- **Espacamento**: Base 8px, `gap-4` entre cards, `space-y-3` entre items
- **Border Radius**: `rounded-lg` para cards, `rounded-md` para inputs/botoes, `rounded-full` para badges
- **Glass Effect**: Toolbar com `bg-gray-50/50 backdrop-blur-sm`
- **Transicoes**: `transition-all duration-200`
- **Cores semanticas**: Usar variaveis CSS (--primary, --destructive, etc.)
- **Hover states**: `hover:bg-muted/50` em items de lista
- **Z-index**: Conforme escala padronizada
- **Responsividade**: Mobile-first, cards empilhados no mobile, filtros em drawer

## Sequencia de Implementacao

1. Criar `tarefas.api.ts` (service layer com Supabase direto)
2. Criar `useTarefas.ts` (hooks TanStack Query)
3. Criar componentes UI (MetricasCards, Filtros, TarefaItem, TarefasList, ConcluirModal)
4. Criar `TarefasToolbar.tsx` (injeta no AppToolbar)
5. Criar `TarefasPage.tsx` (composicao de tudo)
6. Criar `index.ts` (barrel export)
7. Registrar rota no `App.tsx`
