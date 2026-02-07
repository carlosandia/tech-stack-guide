
# Plano de Implementacao - PRD-07: Modulo de Negocios (Pipeline/Kanban)

## Visao Geral

O modulo de Negocios e o nucleo operacional do CRM, responsavel pela gestao visual de oportunidades via Kanban. A implementacao sera feita em **5 fases incrementais**, priorizando funcionalidades que entregam valor imediato ao usuario.

**Premissas:**
- O backend Express ja possui rotas completas para funis, oportunidades, etapas e distribuicao
- As tabelas do banco (funis, etapas_funil, oportunidades, etc.) ja existem com RLS
- A camada de API frontend usara Supabase direto (mesmo padrao do modulo Contatos)
- Todo o UI seguira fielmente o Design System (docs/designsystem.md)

---

## Fase 1: Fundacao - Estrutura, Roteamento e Kanban Basico
**Prioridade: CRITICA | Estimativa: 1 iteracao grande**

### 1.1 Estrutura do Modulo

Criar a estrutura de pastas seguindo o padrao existente:

```text
src/modules/negocios/
  components/
    kanban/
      KanbanBoard.tsx          -- Board principal com colunas
      KanbanColumn.tsx         -- Coluna individual (etapa)
      KanbanCard.tsx           -- Card da oportunidade
      KanbanEmptyState.tsx     -- Estado vazio
    toolbar/
      NegociosToolbar.tsx      -- Barra de acoes (busca, filtros, pipeline selector)
      PipelineSelector.tsx     -- Dropdown de selecao de pipeline
      MetricasPanel.tsx        -- Painel de metricas colapsavel
    modals/
      NovaOportunidadeModal.tsx -- Modal de criacao (3 secoes)
      NovaPipelineModal.tsx     -- Modal de criacao de pipeline
      FecharOportunidadeModal.tsx -- Modal de ganho/perda com motivo
    ui/
      QualificacaoBadge.tsx    -- Badge Lead/MQL/SQL
  hooks/
    useFunis.ts               -- Hook TanStack Query para pipelines
    useOportunidades.ts       -- Hook TanStack Query para oportunidades
    useKanban.ts              -- Hook para estado do Kanban + drag
  services/
    negocios.api.ts           -- API via Supabase direto
  schemas/
    negocios.schema.ts        -- Zod schemas
  pages/
    NegociosPage.tsx          -- Pagina principal do Kanban
  index.ts                    -- Barrel exports
```

### 1.2 Roteamento (App.tsx)

Adicionar rota `/app/negocios` dentro do AppLayout:

```text
/app/negocios          -- Kanban principal (NegociosPage)
```

### 1.3 Service Layer (negocios.api.ts)

API via Supabase direto (mesmo padrao de contatos.api.ts):

- `listarFunis()` -- Listar pipelines do tenant
- `buscarFunilComEtapas(id)` -- Pipeline com etapas ordenadas
- `criarFunil(payload)` -- Criar nova pipeline
- `listarOportunidadesKanban(funilId, filtros)` -- Dados do Kanban agrupados por etapa
- `criarOportunidade(payload)` -- Nova oportunidade
- `moverEtapa(id, etapaDestinoId)` -- Drag & drop
- `fecharOportunidade(id, tipo, motivoId, obs)` -- Ganho/Perda

### 1.4 Kanban Board

**KanbanBoard.tsx:**
- Scroll horizontal com colunas
- Cada coluna = 1 etapa (ordenadas por `ordem`)
- Colunas fixas: "Novos Negocios" (primeira), "Ganho" e "Perdido" (ultimas)
- Scroll vertical dentro de cada coluna para cards
- Responsivo: no mobile, scroll horizontal com snap

**KanbanColumn.tsx:**
- Header com nome da etapa + cor + contador
- Area de drop para cards
- Indicador visual ao arrastar sobre

**KanbanCard.tsx (conforme Design System 10.4 Card):**
- `bg-card border border-border rounded-lg shadow-sm`
- Hover: `shadow-md` com `transition-all duration-200`
- Campos: titulo, valor (R$), contato, responsavel, tempo na etapa
- Badge de qualificacao (Lead/MQL/SQL)
- Badge de tarefas pendentes
- Click abre modal de detalhes (Fase 3)

### 1.5 Toolbar (NegociosToolbar.tsx)

Seguindo o padrao de toolbar do AppLayout (Context Info):
- **Esquerda:** Titulo "Negocios" + PipelineSelector (dropdown)
- **Direita:** Busca (popover como em Contatos), Toggle Metricas, Filtros, "+ Nova Oportunidade"
- **Progressive Disclosure mobile:** Busca + CTA visiveis, demais em menu overflow (3 pontos)

### 1.6 Pipeline Selector (PipelineSelector.tsx)

Dropdown com:
- Lista de pipelines ativas
- Indicador de pipeline selecionada
- Botao "+ Nova Pipeline" no rodape (Admin only)
- Contador de pipelines (Ativas/Arquivadas)

---

## Fase 2: CRUD de Oportunidades e Drag & Drop
**Prioridade: ALTA | Estimativa: 1 iteracao**

### 2.1 Modal Nova Oportunidade (NovaOportunidadeModal.tsx)

Usando ModalBase existente (size="lg"):

**3 Secoes com separadores visuais:**

1. **CONTATO** -- Toggle Pessoa/Empresa, busca de contato existente, campos dinamicos
2. **OPORTUNIDADE** -- Valor, responsavel, previsao fechamento (etapa = "Novos Negocios" fixo)
3. **PRODUTOS** -- Tabela com + Adicionar Produto, calculo automatico do total

**Titulo automatico:** `[Nome do Contato] - #[Sequencia]`

### 2.2 Drag & Drop

Implementacao usando API nativa HTML5 Drag and Drop (sem lib externa):
- `onDragStart` / `onDragOver` / `onDrop` nos cards e colunas
- Optimistic update: move visualmente antes da API responder
- Rollback se a API falhar (toast de erro)

**Regra critica ao mover para Ganho/Perdido:**
- Interceptar o drop
- Abrir FecharOportunidadeModal com motivos da pipeline
- Se cancelar, card volta para posicao original
- Se confirmar, fecha oportunidade via API

### 2.3 Modal Fechar Oportunidade (FecharOportunidadeModal.tsx)

Usando ModalBase (size="sm"):
- Variante visual: Ganho (icone Check, cor verde) / Perdido (icone X, cor vermelha)
- Lista de motivos (radio buttons) filtrados pelo tipo
- Campo de observacoes (textarea, opcional)
- Botao "Confirmar Ganho" ou "Confirmar Perda"

### 2.4 Modal Nova Pipeline (NovaPipelineModal.tsx)

Usando ModalBase (size="md"):
- Campo nome (min 3 chars)
- Multi-select de membros (usuarios do tenant)
- Ao criar: pipeline com 3 etapas padrao (Novos Negocios, Ganho, Perdido)
- Botao "Criar e Configurar" redireciona para configuracoes da pipeline

---

## Fase 3: Modal de Detalhes da Oportunidade
**Prioridade: ALTA | Estimativa: 1 iteracao**

### 3.1 Estrutura do Modal (size="xl")

Usando ModalBase customizado para layout 3 colunas (desktop) / stack (mobile):

**Header:**
- Titulo da oportunidade + Badge qualificacao
- Stepper horizontal com etapas clicaveis (clicar move a oportunidade)

**Body (3 blocos):**

```text
Desktop:  [Campos 25%] [Abas 50%] [Historico 25%]
Mobile:   Stack vertical com accordion/tabs
```

### 3.2 Bloco 1 - Campos

- Secao "OPORTUNIDADE": valor, responsavel, previsao, produtos
- Secao "CONTATO": campos do contato vinculado
- Engrenagem para show/hide campos
- Campos editaveis inline

### 3.3 Bloco 2 - Abas (5 abas)

Tabs conforme Design System 10.9:

1. **Anotacoes** -- Rich text + listagem
2. **Tarefas** -- Tarefas automaticas (etapa) + manuais, checkbox para concluir
3. **Documentos** -- Upload drag & drop, listagem com preview
4. **E-mail** -- Aviso de configuracao + formulario (dependencia PRD-08)
5. **Agenda** -- Reunioes com status (agendada/realizada/no-show)

**Nota:** Abas E-mail e Agenda mostrarao estado vazio orientando o usuario ("Configure sua conexao de e-mail em Configuracoes > Conexoes") ate que as integracoes estejam implementadas.

### 3.4 Bloco 3 - Historico/Timeline

Timeline vertical com eventos:
- Movimentacao entre etapas
- Alteracao de responsavel
- Criacao/conclusao de tarefas
- Notas adicionadas

---

## Fase 4: Metricas e Filtros
**Prioridade: MEDIA | Estimativa: 1 iteracao**

### 4.1 Painel de Metricas (MetricasPanel.tsx)

- Toggle exibe/oculta (estado persiste em localStorage)
- Cards com metricas: Total, Abertas, Ganhas, Perdidas, Valor Total, Ticket Medio, Conversao, Forecast
- Cores semanticas: verde (positivo), vermelho (negativo), amarelo (alerta)
- Metricas recalculadas ao alterar filtros
- Grid responsivo: 2 colunas mobile, 4-5 desktop

### 4.2 Filtros (Popover)

Popover de filtros conforme Design System 10.6:
- Responsavel (dropdown)
- Tags (multi-select)
- Valor (range min/max)
- Qualificacao (checkboxes Lead/MQL/SQL)
- Origem (dropdown)
- Badge indicando filtros ativos

### 4.3 Filtro de Periodo (Dropdown)

- Presets: Hoje, Ultimos 7 dias, Este mes, etc.
- Personalizado com date range
- Filtrar por data de criacao ou previsao de fechamento

---

## Fase 5: Pre-Oportunidades e Refinamentos
**Prioridade: BAIXA (depende de WhatsApp/WAHA) | Estimativa: 1 iteracao**

### 5.1 Coluna Solicitacoes

- So aparece se houver conexao WhatsApp ativa
- Cards especiais com botoes Aceitar/Rejeitar
- Aceitar: cria contato + oportunidade em "Novos Negocios"
- Rejeitar: marca como rejeitada com motivo opcional

### 5.2 Refinamentos

- Popover de tarefas no badge do card
- Engrenagem na secao contato (show/hide campos)
- Campos UTM no modal de criacao

---

## Detalhes Tecnicos

### Design System - Regras Aplicadas

| Elemento | Especificacao DS |
|----------|-----------------|
| Cards Kanban | `bg-card border border-border rounded-lg shadow-sm`, hover `shadow-md` |
| Colunas | Header com cor da etapa via `borderTop`, `rounded-lg` |
| Modal Nova Opp | ModalBase `size="lg"`, 3 secoes com `space-y-6` |
| Modal Detalhes | ModalBase `size="xl"`, layout flex com 3 blocos |
| Badges | `rounded-full text-xs font-semibold px-2.5 py-0.5` |
| Inputs | `h-10 rounded-md border-input text-sm` |
| Toolbar | Mesmo padrao AppLayout (48px, glass effect) |
| Botoes | Primary para CTA, ghost para filtros, destructive para exclusao |
| Z-Index | Modais z-400/401, popovers z-600, tooltips z-700 |
| Espacamento | `p-6` cards, `space-y-4` forms, `gap-3` button groups |
| Responsividade | Progressive Disclosure: CTA + Busca visiveis, resto em overflow menu |
| Transicoes | `transition-all duration-200` em todas interacoes |

### Padrao de Hooks (TanStack Query)

```text
useFunis()           -- queryKey: ['funis', organizacaoId]
useOportunidades()   -- queryKey: ['oportunidades', funilId, filtros]
useKanban()          -- queryKey: ['kanban', funilId, filtros]
```

Toda mutacao invalida o cache correspondente via `queryClient.invalidateQueries()`.

### Seguranca Multi-Tenant

- Todas queries filtram por `organizacao_id` do usuario logado
- Member ve apenas oportunidades com `usuario_responsavel_id` = seu ID
- Admin ve todas oportunidades do tenant
- RLS ja ativo nas tabelas existentes

---

## Ordem de Implementacao por Mensagens

Para manter as iteracoes gerenciaveis, sugiro implementar nesta ordem:

1. **Iteracao 1:** Estrutura do modulo + service layer + rota + KanbanBoard basico (colunas + cards estaticos carregando do banco)
2. **Iteracao 2:** PipelineSelector + NovaPipelineModal + NegociosToolbar
3. **Iteracao 3:** NovaOportunidadeModal (3 secoes) + Drag & Drop entre colunas
4. **Iteracao 4:** FecharOportunidadeModal (Ganho/Perda) + Badges de qualificacao
5. **Iteracao 5:** Modal de Detalhes da Oportunidade (header + campos + abas basicas)
6. **Iteracao 6:** MetricasPanel + Filtros + Periodo
7. **Iteracao 7:** Refinamentos (popover tarefas, UTM, responsividade final)

Cada iteracao entrega valor funcional testavel pelo usuario.
