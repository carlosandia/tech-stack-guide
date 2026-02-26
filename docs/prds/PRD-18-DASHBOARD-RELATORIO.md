# PRD-18: Dashboard de Relatório de Funil de Marketing

| Campo | Valor |
|-------|-------|
| **Autor** | Carlos Andia |
| **Data de criação** | 2026-02-25 |
| **Última atualização** | 2026-02-25 |
| **Versão** | v1.0 |
| **Status** | Aprovado |
| **Stakeholders** | Admin (tenant), Super Admin |
| **Revisor técnico** | Tech Lead CRM Renove |

---

## 1. Resumo Executivo

Estamos construindo o **Dashboard de Relatório de Funil**, transformando a página `/dashboard` — atualmente um placeholder com valores "—" — em um centro analítico estratégico para os Admins dos tenants.

O problema central é que hoje o CRM armazena dados valiosos de conversão (MQL, SQL, reuniões, fechamentos, valores, UTMs) mas nenhuma tela consolida esses dados em uma visão de funil com taxas de conversão e métricas de custo. Os Admins precisam sair do CRM para analisar o desempenho do seu processo comercial e de marketing.

O impacto esperado é que o Admin passe a tomar decisões de marketing e vendas com base em dados do próprio CRM, reduzindo churn por falta de percepção de valor da plataforma e aumentando o tempo de uso diário.

---

## 2. Contexto e Motivação

### 2.1 Problema

O Admin de um tenant hoje não consegue responder perguntas básicas sem exportar dados ou usar planilhas:
- "Qual é a minha taxa de conversão de lead para venda?"
- "Quanto estou gastando por lead no Meta Ads?"
- "Em qual etapa do funil estou perdendo mais oportunidades?"
- "Qual canal traz leads que mais fecham?"

O módulo `/dashboard` existe na rota há meses e exibe apenas "Em breve" — representando uma promessa não cumprida da plataforma.

Evidências:
- `DashboardPage.tsx` tem 4 cards estáticos com valor fixo `'—'`
- Todas as tabelas necessárias já têm os dados (`oportunidades`, `contatos`, `etapas_funil`, `tarefas`)
- Campos como `qualificado_mql`, `qualificado_sql`, `utm_source`, `etapas_funil.probabilidade` já estão estruturados e populados

### 2.2 Oportunidade de Mercado (MRD resumido)

CRMs B2B no segmento SMB (RD Station, HubSpot Starter, Pipedrive) cobram planos mais caros para desbloquear relatórios de funil. Oferecer essa análise no plano base é um diferencial competitivo direto para retenção de clientes que já migraram de planilhas para o CRM.

### 2.3 Alinhamento Estratégico (BRD resumido)

- **Retenção**: Admin que enxerga valor analítico na ferramenta cancela menos
- **Upsell**: Invest Mode (CPL/CAC) pode ser um gatilho para planos superiores
- **Dados**: Histórico de investimentos abre caminho para integração automática com Meta Ads API (já implementada no projeto)

---

## 3. Usuários e Personas

### 3.1 Persona Primária

```
Nome: André — Dono de negócio local / gestor comercial
Role: Admin do tenant
Contexto: Gerencia equipe de 3 vendedores, investe R$5-15k/mês em Meta Ads
Dores:
  - Não sabe quantos leads viram clientes
  - Não consegue calcular CAC sem planilha manual
  - Precisa de argumento para ajustar investimento em marketing
Objetivos:
  - Ver funil de conversão em um clique
  - Saber se o investimento em marketing está valendo
  - Comparar performance de vendedores
Citação representativa: "Sei que tenho 40 leads esse mês, mas não sei
  quantos viraram reunião ou venda. Fica tudo espalhado."
```

### 3.2 Personas Secundárias

- **Member (vendedor)**: Quer ver suas próprias métricas (negócios, conversão pessoal) — visualização limitada ao seu escopo
- **Super Admin**: Quer relatório consolidado multi-tenant para análise de saúde da plataforma (Fase 3)

### 3.3 Anti-personas

- **E-commerce**: Métricas de funil online (impressão → clique → checkout) são diferentes do funil B2B local
- **Operações internas**: Não é um relatório de RH ou financeiro — foco exclusivo em marketing e vendas

---

## 4. Hierarquia de Requisitos

### 4.1 Theme

> Tornar o CRM Renove a fonte única de verdade para decisões de marketing e vendas dos tenants

### 4.2 Epic

> Dashboard analítico de funil que funciona sem configuração adicional, mas que se expande com dados de investimento para análise de custo completo

### 4.3 Features e User Stories

---

**Feature: Funil de Conversão (CRM-Only Mode)**

Como Admin,
Quero visualizar as taxas de conversão entre cada etapa do meu funil,
Para que eu identifique onde estou perdendo oportunidades sem precisar de planilha.

Critérios de Aceitação:
- [ ] Exibe 5 etapas: Leads → MQLs → SQLs → Reuniões → Ganhos
- [ ] Cada etapa mostra volume absoluto e taxa de conversão em relação à anterior
- [ ] Filtros funcionam: período (7d, 30d, 90d, personalizado) e funil específico
- [ ] Comparação automática com período anterior (▲ ▼ %)
- [ ] Estado vazio inteligente: se etapa não tem dados, exibe dica contextual

**Prioridade:** Must-have

---

**Feature: KPIs Estratégicos**

Como Admin,
Quero ver ticket médio, valor gerado, tempo médio de ciclo e forecast ponderado,
Para que eu tenha uma visão financeira do desempenho comercial do período.

Critérios de Aceitação:
- [ ] Ticket Médio = média de `oportunidades.valor` onde etapa é `tipo = 'ganho'`
- [ ] Valor Gerado = soma de `oportunidades.valor` onde etapa é `tipo = 'ganho'` no período
- [ ] Tempo Médio de Ciclo = média de dias entre `contatos.criado_em` e `oportunidades.fechado_em`
- [ ] Forecast Ponderado = soma de `oportunidades.valor * etapas_funil.probabilidade / 100` para etapas ativas (tipo != 'ganho' e != 'perda')
- [ ] Cada KPI exibe variação vs período anterior

**Prioridade:** Must-have

---

**Feature: Breakdown por Canal de Origem**

Como Admin,
Quero ver qual canal (utm_source) gera mais leads e mais conversões,
Para que eu direcione investimento para os canais mais eficientes.

Critérios de Aceitação:
- [ ] Agrupa leads por `oportunidades.utm_source` (valores comuns: meta_ads, google, organico, indicacao, direto)
- [ ] Exibe: canal, volume de leads, % do total, taxa de fechamento por canal
- [ ] Leads sem UTM aparecem como "Direto/Outros"
- [ ] Com Invest Mode ativo: exibe CPL por canal

**Prioridade:** Must-have

---

**Feature: Invest Mode — Desbloqueio de CPL/CAC**

Como Admin,
Quero informar quanto investi em cada canal no período,
Para que o CRM calcule automaticamente CPL, CPMQL, CAC e ROMI.

Critérios de Aceitação:
- [ ] Widget "Desbloqueie métricas de custo" visível sem bloqueio de conteúdo
- [ ] Campos: Meta Ads (R$), Google Ads (R$), Outros (R$)
- [ ] Ao salvar, CPL e CAC aparecem no funil e no breakdown por canal
- [ ] Investimento salvo em `investimentos_marketing` por período e canal
- [ ] ROMI = (Valor Gerado - Total Investido) / Total Investido × 100

**Prioridade:** Should-have

---

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceitação |
|----|-----------|------------|-----------------------|
| RF-001 | Backend endpoint `GET /relatorio/funil` com parâmetros `periodo`, `funil_id`, `canal` | Must | Retorna JSON com todas as métricas calculadas |
| RF-002 | Funil horizontal com 5 etapas e taxas de conversão entre etapas | Must | Exibe números reais do banco (não "—") |
| RF-003 | Filtro de período (7d/30d/90d/personalizado) | Must | Dados mudam ao selecionar período diferente |
| RF-004 | Filtro por funil específico (`funis.id`) | Must | Apenas dados do funil selecionado exibidos |
| RF-005 | KPIs: Ticket Médio, Valor Gerado, Tempo de Ciclo, Forecast | Must | Valores calculados via SQL, não mock |
| RF-006 | Breakdown por `utm_source` com volume e taxa de fechamento | Must | Agrupa oportunidades por canal de origem |
| RF-007 | Comparação automática com período anterior equivalente | Must | Exibe ▲ +X% ou ▼ -X% em cada métrica |
| RF-008 | Widget de entrada de investimento por canal | Should | Campos: Meta Ads, Google Ads, Outros |
| RF-009 | Persistência de investimentos em `investimentos_marketing` | Should | Dados salvos e reutilizados ao navegar |
| RF-010 | CPL por etapa desbloqueado com investimento informado | Should | CPL = Total Investido / Leads do período |
| RF-011 | ROMI calculado automaticamente | Should | ROMI = (Receita - Investimento) / Investimento |
| RF-012 | Estado vazio inteligente por etapa com dica contextual | Could | "Configure tarefas do tipo 'reunião'..." |
| RF-013 | Breakdown por vendedor (`usuario_responsavel_id`) | Could | Valor gerado e negócios por usuário |

---

## 6. Requisitos Não-Funcionais

### 6.1 Performance

- Endpoint `/relatorio/funil` deve responder em < 800ms no P95 para tenants com até 10.000 contatos
- Cache de 5 minutos no backend (TTL por `organizacao_id + periodo + funil_id`)
- Nenhuma query sem índice em `organizacao_id` (índices compostos já existem no schema)

### 6.2 Segurança

- Endpoint protegido por JWT — extrai `organizacao_id` do token (nunca do request body)
- RLS ativo em `investimentos_marketing` (usuário só vê dados da sua organização)
- Member: visualiza apenas métricas dos seus próprios negócios (`usuario_responsavel_id = user.id`)
- Admin: visualiza métricas de toda a organização

### 6.3 Usabilidade

- Dashboard utilizável em desktop (mínimo 1024px) e tablet (768px)
- Primeiro carregamento com skeleton loader (sem flash de "—")
- Responsivo: funil horizontal colapsa para cards verticais em < 768px
- Tooltips explicativos em cada métrica (ex: "O que é CPL?", "Como é calculado?")

### 6.4 Sistema/Ambiente

- Stack: React + TanStack Query (frontend) / Node.js + Express + PostgreSQL (backend)
- Componentes Recharts para gráficos (já na stack)
- shadcn/ui para componentes de UI (já na stack)
- Sem novas dependências obrigatórias

---

## 7. Escopo

### 7.1 O que ESTÁ no escopo (MVP — Fase 1)

- Transformação do `/dashboard` placeholder em relatório funcional
- Funil de 5 etapas com conversões (CRM-Only)
- 4 KPIs estratégicos com comparação temporal
- Filtros: período + funil
- Breakdown por canal (utm_source)
- Backend endpoint de métricas com SQL otimizado
- PRD e migration da tabela `investimentos_marketing` (preparação para Fase 2)

### 7.2 O que NÃO está no escopo (Fase 1)

- **CPL/CAC/ROMI**: requer `investimentos_marketing` — reservado para Fase 2
- **Breakdown por vendedor com metas**: complexidade de metas é outro PRD
- **Funil Reverso** ("quanto investir para R$X?"): pós-MVP
- **Integração automática Meta Ads para puxar gasto**: a integração existe, mas sincronizar gastos automaticamente requer mapeamento de campanha → funil — Fase 3
- **Drill-down clicável** (clique no número → lista de oportunidades): UX avançada, Fase 2
- **Relatório multi-tenant** para Super Admin: PRD separado

### 7.3 Escopo futuro (backlog)

- Fase 2: Widget de investimento manual + CPL/CAC/ROMI
- Fase 3: Puxar gastos automaticamente da API Meta Ads
- Fase 3: Funil Reverso (calculadora de metas)
- Fase 3: Drill-down nos números do funil
- PRD futuro: Relatório multi-tenant para Super Admin

---

## 8. Suposições, Dependências e Restrições

### 8.1 Suposições

- Os campos `qualificado_mql`, `qualificado_sql`, `qualificado_mql_em`, `qualificado_sql_em` em `oportunidades` estão sendo utilizados pelos Admins (ao qualificar leads no Kanban)
- `tarefas.tipo = 'reuniao'` e `tarefas.data_conclusao` são populados pelo processo comercial dos tenants
- `etapas_funil.probabilidade` (0-100) está configurada pelo Admin ao criar etapas do funil
- `oportunidades.utm_source` é populado via integração de formulário ou entrada manual

### 8.2 Dependências

| Dependência | Responsável | Status | Risco |
|-------------|-------------|--------|-------|
| Tabelas `oportunidades`, `contatos`, `etapas_funil`, `tarefas` | Core CRM | Confirmado (produção) | Baixo |
| Backend Express existente | PRD-07 | Implementado | Baixo |
| TanStack Query e Recharts no frontend | PRD-07 | Implementado | Baixo |
| Rota `/dashboard` no App.tsx | Core | Linha 168 confirmada | Baixo |
| RLS em `investimentos_marketing` (Fase 2) | Migration PRD-18 | A criar | Médio |

### 8.3 Restrições

- **Técnicas**: Usar stack existente (Express + Supabase + React). Sem Prisma, GraphQL ou tRPC
- **Nomenclatura**: Tabela nova em PT-BR: `investimentos_marketing` (não `marketing_investments`)
- **Isolamento**: `organizacao_id` obrigatório em todas as queries e na nova tabela
- **Roles**: Member vê apenas seus dados; Admin vê toda a organização

---

## 9. Design e UX

### 9.1 Fluxo do Usuário

**CRM-Only Mode (MVP):**
1. Admin clica em "Dashboard" no menu lateral → carrega `/dashboard`
2. Skeleton loader exibido por ≤ 800ms
3. Funil horizontal renderizado com dados reais
4. Admin seleciona "Últimos 90 dias" no filtro → dados atualizam
5. Admin seleciona funil "Consultoria 2025" → dados filtrados por funil
6. Admin visualiza KPIs abaixo do funil
7. Admin visualiza breakdown por canal

**Invest Mode (Fase 2):**
1. Admin vê banner/widget "Desbloqueie métricas de custo" abaixo do funil
2. Admin clica → abre formulário inline (não modal)
3. Admin preenche: Meta Ads R$5.000, Google R$2.000, Outros R$0
4. Admin clica "Salvar e calcular" → CPL/CAC/ROMI aparecem no funil
5. Na próxima vez que acessar o mesmo período, os valores já estão salvos

### 9.2 Wireframes

```
┌─────────────────────────────────────────────────────────────────┐
│ Dashboard                    [Últimos 30 dias ▼] [Todos funis ▼]│
├─────────────────────────────────────────────────────────────────┤
│  FUNIL DE CONVERSÃO                                              │
│                                                                  │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────┐ │
│ │  LEADS   │→ │   MQL    │→ │   SQL    │→ │REUNIÕES  │→ │ ✓  │ │
│ │   312    │  │   56     │  │   18     │  │   11     │  │  8 │ │
│ │  100%    │  │  18% ↑   │  │  32% ↓   │  │  61% ─   │  │73% │ │
│ └──────────┘  └──────────┘  └──────────┘  └──────────┘  └────┘ │
│                                                                  │
│  [🔓 Informar investimento para calcular CPL e CAC →]           │
├─────────────────────────────────────────────────────────────────┤
│ ┌───────────────┐  ┌───────────────┐  ┌──────────┐  ┌────────┐ │
│ │ TICKET MÉDIO  │  │ VALOR GERADO  │  │  CICLO   │  │FORECAST│ │
│ │  R$ 3.200     │  │  R$ 25.600    │  │  22 dias │  │R$48.7k │ │
│ │  ▲ +12%       │  │  ▲ +8%        │  │  ▼ -3d   │  │ 15 op. │ │
│ └───────────────┘  └───────────────┘  └──────────┘  └────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ POR CANAL DE ORIGEM                                              │
│ ■ meta_ads     45%  312 leads    8 fechados (2.5%)              │
│ ■ organico     30%  210 leads    12 fechados (5.7%)             │
│ ■ google       15%  105 leads    4 fechados (3.8%)              │
│ ■ indicacao    10%   70 leads    6 fechados (8.6%)              │
└─────────────────────────────────────────────────────────────────┘
```

### 9.3 Considerações de UX

1. **Progressive Disclosure**: CPL/CAC não bloqueiam a visualização — são uma camada adicional
2. **Semântica de cores**: Verde (▲ positivo), Vermelho (▼ negativo), Cinza (neutro)
3. **Estado vazio**: Cada etapa sem dados exibe ícone + dica de como popular (ex: "Qualifique leads como MQL no Kanban")
4. **Skeleton loading**: Nenhum "—" aparece — skeleton substitui enquanto carrega
5. **Tooltips**: Cada métrica tem ícone (?) com explicação e fórmula de cálculo

---

## 10. Métricas de Sucesso

### 10.1 KPIs Primários

| Métrica | Baseline atual | Meta | Prazo |
|---------|----------------|------|-------|
| DAU do módulo Dashboard | ~0 (placeholder) | 60% dos Admins ativos/semana | 1 mês após lançamento |
| Tempo médio na tela | 0s | > 2 min/sessão | 1 mês |
| Tenants com investimento informado (Fase 2) | 0 | 30% dos tenants ativos | 2 meses |

### 10.2 KPIs Secundários

- Taxa de retenção 30d de Admins que usam o Dashboard vs que não usam
- NPS: pergunta específica "O Dashboard te ajuda a tomar decisões?" (alvo: ≥ 8/10)

### 10.3 Critérios de Lançamento

- [ ] Endpoint `/relatorio/funil` retorna dados reais (P95 < 800ms)
- [ ] Funil renderiza com dados reais em tenant de homologação
- [ ] Filtros de período e funil funcionam corretamente
- [ ] Sem regressão nas outras rotas (`/negocios`, `/contatos`, etc.)
- [ ] RLS da nova tabela `investimentos_marketing` validado

---

## 11. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Queries lentas para tenants com muitos dados | Média | Alto | Índices compostos confirmados; cache de 5 min no backend |
| `qualificado_mql`/`qualificado_sql` não utilizados por tenants | Alta | Médio | Estado vazio inteligente + dica contextual nas etapas MQL/SQL |
| `utm_source` não populado (leads sem UTM) | Alta | Baixo | Agrupa como "Direto/Outros"; não quebra o breakdown |
| Admin confunde "Funil" (produto) com "Funil de conversão" (relatório) | Baixa | Baixo | Filtro de funil rotulado como "Pipeline" para clareza |
| Migration `investimentos_marketing` com RLS mal configurado | Baixa | Alto | Review de RLS obrigatório antes de deploy |

---

## 12. Time to Value (TTV)

### 12.1 MVP — O que resolve o problema core

- Funil de conversão com dados reais (sem "—")
- 4 KPIs estratégicos
- Filtros de período e funil
- Breakdown por canal

### 12.2 Fases de Entrega

| Fase | Escopo | TTV estimado |
|------|--------|-------------|
| **MVP** | Funil CRM-Only + KPIs + Filtros + Breakdown Canal | 1 sprint |
| **V1.1 (Invest Mode)** | Widget investimento + CPL/CAC/ROMI + `investimentos_marketing` | 1 sprint |
| **V2.0 (Avançado)** | Funil Reverso + Drill-down + Integração Meta Ads automática | 2-3 sprints |

---

## 13. Plano de Validação

### 13.1 Validação Pré-Desenvolvimento

- [x] Tabelas e colunas confirmadas via Supabase MCP
- [x] Rota `/dashboard` e arquivo existentes confirmados
- [x] Scopo de MVP aprovado pelo stakeholder (este PRD)
- [ ] Review técnico do SQL base com o Tech Lead

### 13.2 Validação Durante Desenvolvimento

- [ ] Testar endpoint com tenant de homologação (dados reais)
- [ ] Validar RLS da tabela `investimentos_marketing`
- [ ] Testar em tenant sem dados (estados vazios)
- [ ] Validar responsividade em 768px (tablet)
- [ ] Review de tipos Zod no backend

### 13.3 Validação Pós-Lançamento

- [ ] Monitorar DAU do Dashboard (meta: 60% Admins ativos)
- [ ] Coletar feedback qualitativo dos primeiros 5 Admins que usarem
- [ ] Medir tempo de resposta do endpoint em produção (P95 < 800ms)

---

## 14. Referência Técnica: Dados Reais das Tabelas

### Tabelas Confirmadas via Supabase MCP

**`oportunidades`** — campos relevantes:
```
id, organizacao_id, funil_id, etapa_id, contato_id,
titulo, valor, previsao_fechamento, fechado_em,
qualificado_mql (boolean), qualificado_mql_em (timestamptz),
qualificado_sql (boolean), qualificado_sql_em (timestamptz),
utm_source, utm_campaign, utm_medium, utm_term, utm_content,
usuario_responsavel_id, criado_em, deletado_em
```

**`contatos`** — campos relevantes:
```
id, organizacao_id, tipo, status, origem, nome,
criado_em, deletado_em, owner_id
```

**`etapas_funil`** — campos relevantes:
```
id, organizacao_id, funil_id, nome,
tipo (entrada | normal | ganho | perda),
probabilidade (int 0-100), ordem, ativo
```

**`funis`**:
```
id, organizacao_id, nome, arquivado, ativo, criado_em
```

**`tarefas`** — campos relevantes:
```
id, organizacao_id, oportunidade_id, contato_id,
tipo (ligacao | reuniao | tarefa | email | whatsapp),
status (pendente | concluida | cancelada),
data_vencimento, data_conclusao, owner_id
```

**`usuarios`**:
```
id, organizacao_id, auth_id, nome, email, role
```

### Migration Nova: `investimentos_marketing` (Fase 2)

```sql
CREATE TABLE investimentos_marketing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id) ON DELETE CASCADE,
  periodo_inicio date NOT NULL,
  periodo_fim date NOT NULL,
  canal varchar(50) NOT NULL,  -- 'meta_ads' | 'google_ads' | 'outros' | 'total'
  valor numeric(12,2) NOT NULL DEFAULT 0,
  criado_por_id uuid REFERENCES usuarios(id),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),

  UNIQUE(organizacao_id, periodo_inicio, periodo_fim, canal)
);

CREATE INDEX idx_investimentos_marketing_org_periodo
  ON investimentos_marketing(organizacao_id, periodo_inicio, periodo_fim);

ALTER TABLE investimentos_marketing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_investimentos"
  ON investimentos_marketing
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### Query Base do Backend (SQL real)

```sql
-- RF-001: Query principal para o funil
WITH base AS (
  SELECT
    c.id as contato_id,
    c.criado_em as lead_criado_em,
    o.id as oportunidade_id,
    o.qualificado_mql,
    o.qualificado_sql,
    o.valor,
    o.fechado_em,
    o.utm_source,
    o.usuario_responsavel_id,
    e.tipo as etapa_tipo,
    e.probabilidade,
    t.id as tarefa_id,
    t.data_conclusao as reuniao_data
  FROM contatos c
  LEFT JOIN oportunidades o
    ON o.contato_id = c.id
    AND o.organizacao_id = c.organizacao_id
    AND o.deletado_em IS NULL
    AND ($funil_id IS NULL OR o.funil_id = $funil_id)
  LEFT JOIN etapas_funil e ON e.id = o.etapa_id
  LEFT JOIN tarefas t
    ON t.oportunidade_id = o.id
    AND t.tipo = 'reuniao'
    AND t.status = 'concluida'
  WHERE c.organizacao_id = $org_id
    AND c.criado_em BETWEEN $inicio AND $fim
    AND c.deletado_em IS NULL
    AND ($canal IS NULL OR o.utm_source = $canal)
)
SELECT
  COUNT(DISTINCT contato_id)                                             AS total_leads,
  COUNT(DISTINCT oportunidade_id) FILTER (WHERE qualificado_mql = true) AS mqls,
  COUNT(DISTINCT oportunidade_id) FILTER (WHERE qualificado_sql = true) AS sqls,
  COUNT(DISTINCT tarefa_id)       FILTER (WHERE reuniao_data IS NOT NULL) AS reunioes,
  COUNT(DISTINCT oportunidade_id) FILTER (WHERE etapa_tipo = 'ganho')   AS fechados,
  COALESCE(SUM(valor)  FILTER (WHERE etapa_tipo = 'ganho'), 0)          AS valor_gerado,
  COALESCE(AVG(valor)  FILTER (WHERE etapa_tipo = 'ganho'), 0)          AS ticket_medio,
  COALESCE(SUM(valor * probabilidade / 100.0)
    FILTER (WHERE etapa_tipo NOT IN ('ganho','perda')), 0)              AS forecast,
  COALESCE(AVG(
    EXTRACT(EPOCH FROM (fechado_em - lead_criado_em)) / 86400.0
  ) FILTER (WHERE etapa_tipo = 'ganho' AND fechado_em IS NOT NULL), 0) AS ciclo_medio_dias
FROM base;
```

---

## 15. Histórico de Versões

| Versão | Data | Autor | Mudanças |
|--------|------|-------|----------|
| v1.0 | 2026-02-25 | Carlos Andia | Versão inicial — MVP CRM-Only + planejamento Invest Mode |

---

> **AIDEV-NOTE**: Este PRD define a transformação do `/dashboard` placeholder. A rota já existe em `src/App.tsx:168`. O arquivo de página é `src/modules/app/pages/DashboardPage.tsx`. Novos componentes vão em `src/modules/app/components/dashboard/`. O backend endpoint vai em `backend/src/routes/relatorio.ts`.
