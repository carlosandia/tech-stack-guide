

# Plano de Implementacao Completa - PRD-07: Modulo de Negocios

## Analise do Estado Atual vs PRD

### O que JA esta implementado (Iteracao 1 concluida)

| Item | Status |
|------|--------|
| Estrutura de pastas do modulo | Feito |
| Rota `/app/negocios` no App.tsx | Feito |
| Service layer (`negocios.api.ts`) - CRUD basico | Feito |
| Hooks TanStack Query (`useFunis`, `useKanban`) | Feito |
| KanbanBoard com scroll horizontal | Feito |
| KanbanColumn com header/cor/contador | Feito |
| KanbanCard com titulo, contato, valor, qualificacao, tempo | Feito |
| KanbanEmptyState | Feito |
| NegociosToolbar com busca popover e progressive disclosure | Feito |
| PipelineSelector dropdown basico | Feito |
| NovaPipelineModal (nome, descricao, cor) | Feito |
| Drag & Drop basico entre colunas (HTML5 nativo) | Feito |
| Mover etapa via API | Feito |

### O que FALTA implementar (por RF do PRD)

| RF | Feature | Status |
|----|---------|--------|
| RF-01 | Kanban click no card abre detalhes | Faltando |
| RF-02 | Criacao de Pipeline com membros | Parcial (falta multi-select membros) |
| RF-03 | Configuracao de Pipeline (6 Abas) | Faltando completamente |
| RF-04 | Aba Etapas (gerenciar etapas do funil) | Faltando |
| RF-05 | Aba Campos (campos personalizados) | Faltando |
| RF-06 | Aba Distribuicao (manual/rodizio) | Faltando |
| RF-07 | Aba Atividades (tarefas automaticas) | Faltando |
| RF-08 | Aba Qualificacao (regras MQL) | Faltando |
| RF-09 | Aba Motivos (ganho/perda) + Modal fechamento | Faltando |
| RF-10 | Modal Nova Oportunidade (3 secoes) | Faltando |
| RF-11 | Solicitacoes/Pre-Oportunidades WhatsApp | Faltando (depende PRD-08) |
| RF-12 | Barra de Acoes completa (Filtros, Periodo, Metricas toggle) | Parcial |
| RF-13 | Painel de Metricas | Faltando |
| RF-14 | Modal de Detalhes da Oportunidade (3 blocos, 5 abas) | Faltando |
| RF-15.1 | PipelineSelector completo (arquivar, editar, excluir, contador) | Parcial |
| RF-15.2 | Toggle Produtos/Manual para valor | Faltando |
| RF-15.3 | Campos UTM na criacao | Faltando |
| RF-15.4 | Popover Filtrar Metricas | Faltando |
| RF-15.5 | Popover de Tarefas no Card | Faltando |

### Problema Critico de RLS

As tabelas `funis`, `etapas_funil`, `oportunidades` e `oportunidades_produtos` usam RLS com `current_setting('app.current_tenant')` que **NAO funciona** com o cliente Supabase do frontend. A tabela `contatos` (que funciona) usa `get_user_tenant_id()`. **As policies precisam ser migradas** para o padrao correto antes de qualquer funcionalidade funcionar.

---

## Plano de Implementacao por Iteracoes

### Iteracao 2: Corrigir RLS + Modal Nova Oportunidade
**Prioridade: CRITICA**

**2.1 Migrar RLS das tabelas de negocios**

Alterar as policies das tabelas `funis`, `etapas_funil`, `oportunidades`, `oportunidades_produtos`, `funis_membros`, `funis_campos`, `funis_regras_qualificacao`, `funis_motivos`, `etapas_tarefas`, `configuracoes_distribuicao`, `anotacoes_oportunidades`, `documentos_oportunidades`, `emails_oportunidades`, `reunioes_oportunidades`, `motivos_noshow`, `preferencias_metricas` para usar `get_user_tenant_id()` em vez de `current_setting('app.current_tenant')`.

Padrao a seguir (mesmo da tabela `contatos`):
- DROP policy `tenant_isolation`
- CREATE policy `tenant_select` com `organizacao_id = get_user_tenant_id()`
- Manter policies de INSERT, UPDATE, DELETE com `get_user_tenant_id()`

**2.2 Modal Nova Oportunidade (RF-10)**

Criar `NovaOportunidadeModal.tsx` usando ModalBase (size="lg") com 3 secoes:

- **Secao 1 - CONTATO**: Toggle Pessoa/Empresa, busca de contato existente (autocomplete no Supabase), campos nome/email/telefone para criar novo inline
- **Secao 2 - OPORTUNIDADE**: Valor (toggle manual/produtos conforme RF-15.2), responsavel (dropdown de membros do tenant), previsao de fechamento (date picker)
- **Secao 3 - PRODUTOS**: Tabela com busca de produtos cadastrados, quantidade, calculo automatico do total

Titulo automatico: `[Nome do Contato] - #[Sequencia]`

**2.3 Conectar o botao "Nova Oportunidade" ao modal**

Substituir o `toast.info` por abertura real do modal no `NegociosPage.tsx`.

---

### Iteracao 3: Modal Fechar Oportunidade + PipelineSelector Completo
**Prioridade: ALTA**

**3.1 FecharOportunidadeModal (RF-09)**

Criar `FecharOportunidadeModal.tsx` usando ModalBase (size="sm"):

- Variante Ganho: icone Check verde, titulo "Fechar como Ganho"
- Variante Perda: icone X vermelho, titulo "Fechar como Perdido"
- Buscar motivos da tabela `motivos_resultado` filtrados por tipo e vinculados a pipeline via `funis_motivos`
- Radio buttons para selecao de motivo
- Textarea para observacoes (opcional)
- Botao de confirmacao com cor semantica

Integrar com o drag & drop existente: ao dropar em coluna Ganho/Perdido, interceptar e abrir modal antes de confirmar movimentacao.

**3.2 PipelineSelector completo (RF-15.1)**

Expandir o PipelineSelector existente com:

- Busca por nome de pipeline
- Separacao Ativas/Arquivadas (com secao colapsavel)
- Icones de acao: Editar (abre config), Arquivar/Desarquivar, Excluir
- Contador no rodape (Ativas: N, Arquivadas: N)
- API para arquivar/desarquivar pipeline no `negocios.api.ts`

**3.3 NovaPipelineModal com membros (RF-02)**

Adicionar campo multi-select de membros (buscar usuarios do tenant) ao modal existente.

---

### Iteracao 4: Filtros, Periodo e Metricas
**Prioridade: ALTA**

**4.1 Popover de Filtros (RF-12)**

Criar `FiltrosPopover.tsx`:

- Responsavel (dropdown de usuarios)
- Qualificacao (checkboxes Lead/MQL/SQL)
- Valor (range min/max com inputs)
- Origem (dropdown)
- Badge no botao indicando filtros ativos
- Persistir filtros em localStorage

**4.2 Dropdown de Periodo (RF-12)**

Criar `PeriodoSelector.tsx`:

- Presets: Hoje, 7 dias, Este mes, Mes passado, Personalizado
- Date range picker para personalizado
- Filtrar por data de criacao ou previsao de fechamento

**4.3 Painel de Metricas (RF-13)**

Criar `MetricasPanel.tsx`:

- Toggle exibe/oculta (estado em localStorage)
- Calcular metricas a partir dos dados filtrados do Kanban:
  - Total, Abertas, Ganhas, Perdidas, Em Novos Negocios
  - Valor Total, Ticket Medio, Taxa Conversao, Tempo Medio, Forecast
  - Stagnadas (>7d), Vencendo (7d), Atrasadas
- Grid responsivo: 2 colunas mobile, 5 desktop
- Cores semanticas: verde (positivo), vermelho (negativo), amarelo (alerta)

**4.4 Popover Filtrar Metricas (RF-15.4)**

Criar `FiltrarMetricasPopover.tsx`:

- Checkboxes para escolher quais metricas exibir
- Persistir preferencia por usuario+pipeline

---

### Iteracao 5: Modal de Detalhes da Oportunidade
**Prioridade: ALTA**

**5.1 Estrutura do Modal (RF-14)**

Criar `DetalhesOportunidadeModal.tsx` usando ModalBase (size="xl"):

- **Header**: Titulo + Badge qualificacao + Stepper horizontal de etapas clicaveis
  - Etapa atual com circulo preenchido, demais vazios
  - Click em etapa move a oportunidade (com modal de motivo se Ganho/Perdido)

- **Body desktop**: Layout flex 3 colunas (25% / 50% / 25%)
- **Body mobile**: Stack vertical com accordion

**5.2 Bloco 1 - Campos (RF-14.2)**

- Secao OPORTUNIDADE: valor, valor produtos (readonly), responsavel, previsao
- Secao CONTATO: campos do contato vinculado, editaveis inline
- Engrenagem para show/hide campos (popover)

**5.3 Bloco 2 - Abas (RF-14.3)**

5 abas usando o padrao Tabs do Design System:

1. **Anotacoes**: Rich text editor (TipTap ja instalado) + listagem + botao gravar audio (placeholder para V1.1)
2. **Tarefas**: Lista de tarefas (automaticas da etapa + manuais), checkbox para concluir, criar nova tarefa
3. **Documentos**: Upload drag & drop para Supabase Storage, listagem com preview, download
4. **E-mail**: Estado vazio com orientacao ("Configure em Configuracoes > Conexoes")
5. **Agenda**: Estado vazio com orientacao ("Configure em Configuracoes > Conexoes")

**5.4 Bloco 3 - Historico/Timeline (RF-14.4)**

- Buscar eventos do `audit_log` para a oportunidade
- Timeline vertical agrupada por dia
- Tipos de evento: criacao, movimentacao, alteracao, anotacao, tarefa, documento

---

### Iteracao 6: Configuracao de Pipeline (6 Abas)
**Prioridade: MEDIA**

**6.1 Rota e Layout**

Adicionar rota `/app/configuracoes/pipeline/:id` ou modal/drawer de configuracao.

**6.2 Aba Etapas (RF-04)**

- Listar etapas ordenadas com drag & drop para reordenar
- Etapas fixas (entrada, ganho, perda) nao podem ser movidas/removidas
- Modal para criar/editar etapa: nome, cor, probabilidade (%), dias meta
- Vincular etapas_templates existentes ou criar novas

**6.3 Aba Campos (RF-05)**

- Listar campos vinculados a pipeline via `funis_campos`
- Filtro por entidade (Contato/Empresa)
- Modal para vincular campo existente ou criar novo campo global
- Badges: Sistema, Padrao, Obrigatorio, Personalizado
- Toggle "Exibir no Card"

**6.4 Aba Distribuicao (RF-06)**

- Toggle Manual/Rodizio
- Se rodizio: configuracoes avancadas (horario, dias, pular inativos, fallback)
- SLA de resposta (tempo limite, max redistribuicoes, acao apos limite)

**6.5 Aba Atividades (RF-07)**

- Listar etapas com templates de tarefa vinculados
- Clicar em etapa abre modal para vincular tarefa_template ou criar novo
- Tarefas sao criadas automaticamente ao mover card para a etapa

**6.6 Aba Qualificacao (RF-08)**

- Listar regras vinculadas via `funis_regras_qualificacao`
- Modal para vincular regra existente ou criar nova
- Logica AND (todas devem ser verdadeiras para MQL)

**6.7 Aba Motivos (RF-09)**

- Toggle exigir motivo ao fechar
- Listas separadas: Motivos de Ganho / Motivos de Perda
- Vincular motivos existentes via `funis_motivos`

---

### Iteracao 7: Refinamentos Finais
**Prioridade: BAIXA**

**7.1 Popover de Tarefas no Card (RF-15.5)**

- Ao clicar no badge de tarefas do card, abrir popover
- Listar tarefas pendentes com checkbox para concluir inline
- Marcar concluida direto do popover

**7.2 Campos UTM (RF-15.3)**

- Secao colapsavel "Rastreamento (opcional)" no modal de criacao
- 5 campos: Source, Campaign, Medium, Term, Content

**7.3 Responsividade final**

- Testar todos modais e popovers em mobile
- Garantir progressive disclosure em todos breakpoints
- KanbanBoard com scroll snap no mobile

**7.4 Pre-Oportunidades (RF-11) - Placeholder**

- Criar componente `PreOportunidadeCard.tsx` com layout visual
- Logica dependente da implementacao de WhatsApp/WAHA (PRD-08)
- Coluna "Solicitacoes" aparece apenas quando conexao WhatsApp ativa

---

## Detalhes Tecnicos

### Migracao de RLS (Critica)

As tabelas core de negocios usam `current_setting('app.current_tenant')` que nao funciona com o cliente Supabase frontend. Precisam ser migradas para `get_user_tenant_id()`, seguindo o padrao da tabela `contatos`.

Tabelas afetadas (16 tabelas):
- funis, etapas_funil, oportunidades, oportunidades_produtos
- funis_membros, funis_campos, funis_regras_qualificacao, funis_motivos
- etapas_tarefas, configuracoes_distribuicao
- anotacoes_oportunidades, documentos_oportunidades
- emails_oportunidades, reunioes_oportunidades
- motivos_noshow, preferencias_metricas

### Tabelas do banco - Todas ja existem

Todas as 20 tabelas necessarias ja foram criadas no banco. Nenhuma migracao de schema e necessaria, apenas correcao de RLS policies.

### Service Layer - Funcoes a adicionar

```text
negocios.api.ts (expandir):
  - buscarOportunidade(id)
  - atualizarOportunidade(id, payload)
  - listarMotivos(funilId, tipo)
  - arquivarFunil(id)
  - desarquivarFunil(id)
  - listarMembros(funilId)
  - criarAnotacao(oportunidadeId, payload)
  - listarAnotacoes(oportunidadeId)
  - uploadDocumento(oportunidadeId, file)
  - listarDocumentos(oportunidadeId)
  - listarHistorico(oportunidadeId)
  - criarTarefa(oportunidadeId, payload)
  - listarTarefas(oportunidadeId)
  - concluirTarefa(tarefaId)
```

### Novos Componentes (total: ~20 arquivos)

```text
modals/
  NovaOportunidadeModal.tsx
  FecharOportunidadeModal.tsx
  DetalhesOportunidadeModal.tsx

detalhes/
  DetalhesHeader.tsx
  DetalhesStepperEtapas.tsx
  DetalhesCampos.tsx
  DetalhesAbas.tsx
  DetalhesHistorico.tsx
  AbaAnotacoes.tsx
  AbaTarefas.tsx
  AbaDocumentos.tsx
  AbaEmail.tsx (placeholder)
  AbaAgenda.tsx (placeholder)

toolbar/
  FiltrosPopover.tsx
  PeriodoSelector.tsx
  MetricasPanel.tsx
  FiltrarMetricasPopover.tsx

config/
  PipelineConfigPage.tsx (6 abas)
```

### Design System - Regras a seguir

| Elemento | Classe Tailwind |
|----------|-----------------|
| Cards Kanban | `bg-card border border-border rounded-lg shadow-sm`, hover `shadow-md` |
| Modal Nova Opp | ModalBase `size="lg"`, 3 secoes com `space-y-6` |
| Modal Detalhes | ModalBase `size="xl"`, layout flex 3 blocos |
| Modal Fechar | ModalBase `size="sm"`, cor semantica verde/vermelha |
| Badges | `rounded-full text-xs font-semibold px-2.5 py-0.5` |
| Inputs | `h-10 rounded-md border-input text-sm` |
| Tabs | Padrao DS 10.9 com underline |
| Popovers | `z-[60]`, `bg-card border border-border rounded-lg shadow-lg` |
| Botoes | Primary para CTA, ghost para filtros, destructive para exclusao |
| Z-Index | Modais z-400/401, popovers z-600, tooltips z-700 |
| Transicoes | `transition-all duration-200` em todas interacoes |
| Responsividade | Progressive Disclosure: CTA + Busca visiveis, resto em overflow |

### Ordem de Execucao Recomendada

1. **Iteracao 2** (Critica): Fix RLS + Nova Oportunidade modal
2. **Iteracao 3**: Fechar Oportunidade + PipelineSelector completo
3. **Iteracao 4**: Filtros + Periodo + Metricas
4. **Iteracao 5**: Modal de Detalhes (3 blocos + 5 abas)
5. **Iteracao 6**: Configuracao de Pipeline (6 abas)
6. **Iteracao 7**: Refinamentos + UTM + Tarefas popover

Cada iteracao entrega valor funcional testavel pelo usuario.

