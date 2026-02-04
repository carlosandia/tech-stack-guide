# PRD-10: Modulo de Tarefas (Acompanhamento)

| Campo | Valor |
|-------|-------|
| **Autor** | Arquiteto de Produto |
| **Data de criacao** | 2026-02-03 |
| **Ultima atualizacao** | 2026-02-03 |
| **Versao** | v1.1 |
| **Status** | Aprovado |
| **Dependencias** | PRD-04, PRD-05, PRD-07 |
| **Revisor tecnico** | Equipe Backend/Frontend |

---

## Resumo Executivo

O Modulo de Tarefas fornece uma visao centralizada de todas as tarefas vinculadas a oportunidades em pipelines, permitindo que gestores (Admin) acompanhem a equipe e vendedores (Member) gerenciem suas proprias atividades de forma eficiente.

Este modulo resolve o GAP identificado: atualmente tarefas so podem ser visualizadas dentro do modal de cada oportunidade (PRD-07), nao existindo uma visao consolidada para acompanhamento e gestao.

**Impacto esperado:** Aumento de produtividade da equipe comercial, reducao de tarefas atrasadas e melhor visibilidade para gestores sobre a operacao.

---

## Contexto e Motivacao

### Problema

Atualmente no CRM Renove:
- Tarefas sao criadas automaticamente quando oportunidades entram em etapas (templates de PRD-05)
- Tarefas so podem ser visualizadas na aba "Tarefas" do modal de oportunidade (PRD-07)
- **NAO existe visao consolidada** de todas as tarefas do usuario ou da equipe
- Gestores (Admin) nao conseguem acompanhar tarefas pendentes/atrasadas da equipe
- Vendedores (Member) precisam abrir cada oportunidade para ver suas tarefas

### Oportunidade

- Centralizar gestao de tarefas aumenta produtividade
- Metricas de tarefas permitem identificar gargalos operacionais
- Visibilidade para gestores melhora acompanhamento da equipe
- Conclusao rapida de tarefas reduz fricao no processo de vendas

---

## Usuarios e Personas

### Persona Primaria: Admin (Gestor Comercial)

**Role:** Admin
**Contexto:** Gerencia equipe de vendedores e precisa acompanhar execucao das tarefas
**Dores:**
- Nao sabe quais tarefas estao atrasadas na equipe
- Precisa abrir cada oportunidade para ver status
- Sem metricas de produtividade da equipe

**Objetivos:**
- Ver todas as tarefas de todos os Members da organizacao
- Identificar rapidamente tarefas atrasadas
- Acompanhar tempo medio de conclusao

**Citacao:** "Preciso saber o que minha equipe esta fazendo sem ter que perguntar um por um"

### Persona Secundaria: Member (Vendedor)

**Role:** Member
**Contexto:** Executa tarefas diarias de follow-up com leads/oportunidades
**Dores:**
- Nao tem visao unificada das suas tarefas do dia
- Esquece tarefas quando tem muitas oportunidades

**Objetivos:**
- Ver lista de tarefas organizadas por vencimento
- Concluir tarefas rapidamente sem navegar em cada oportunidade

**Citacao:** "Quero ver tudo que tenho para fazer hoje em um lugar so"

### Anti-personas

- **Super Admin:** Nao participa da operacao de vendas do tenant, nao utiliza este modulo
- **Leads/Contatos:** Nao tem acesso ao sistema

---

## Infraestrutura Existente

### Tabela `tarefas` (PRD-04)

A tabela ja existe e sera reutilizada sem alteracoes:

```sql
CREATE TABLE tarefas (
  id uuid PRIMARY KEY,
  organizacao_id uuid NOT NULL,
  oportunidade_id uuid,           -- IMPORTANTE: este modulo mostra APENAS tarefas com oportunidade_id NOT NULL
  contato_id uuid,
  titulo varchar(255) NOT NULL,
  descricao text,
  tipo varchar(50) NOT NULL,      -- ligacao, email, reuniao, whatsapp, visita, outro
  canal varchar(50),
  owner_id uuid NOT NULL,         -- responsavel pela tarefa
  criado_por_id uuid NOT NULL,
  data_vencimento timestamptz,
  data_conclusao timestamptz,
  status varchar(20) DEFAULT 'pendente',  -- pendente, em_andamento, concluida, cancelada
  prioridade varchar(20) DEFAULT 'media', -- baixa, media, alta, urgente
  tarefa_template_id uuid,        -- Origem do template (automatica)
  etapa_origem_id uuid,           -- Etapa que disparou criacao
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz
);
```

### Fluxo Atual

1. Admin cria templates de tarefa em Configuracoes > Pipeline (PRD-05)
2. Admin vincula templates a etapas via tabela `etapas_tarefas`
3. Quando oportunidade entra na etapa, tarefas sao criadas automaticamente
4. Usuario visualiza tarefas na aba Tarefas do modal de oportunidade (PRD-07)
5. **GAP:** Nao existe visao centralizada

---

## Requisitos Funcionais

### RF-001: Interface Principal do Modulo

**User Story:**
Como Admin ou Member,
Quero acessar uma pagina dedicada para ver todas as tarefas,
Para que eu possa gerenciar meu trabalho de forma centralizada.

**Especificacao:**
- **Acesso:** Menu lateral item "Tarefas" ou "Acompanhamento"
- **Rota:** `/tarefas`
- **Titulo:** "Acompanhamento de Tarefas"

**Criterios de Aceitacao:**
- [ ] Pagina acessivel via menu lateral
- [ ] Rota `/tarefas` funciona corretamente
- [ ] Layout responsivo

**Prioridade:** Must-have

---

### RF-002: Cards de Metricas

**User Story:**
Como Admin ou Member,
Quero ver metricas resumidas das minhas tarefas,
Para que eu tenha visao rapida do status geral.

**Especificacao:**

| Card | Metrica | Calculo | Cor |
|------|---------|---------|-----|
| Em Aberto | Tarefas pendentes | `COUNT WHERE status IN ('pendente', 'em_andamento')` | Azul |
| Atrasadas | Vencidas nao concluidas | `COUNT WHERE status = 'pendente' AND data_vencimento < now()` | Vermelho |
| Concluidas | Finalizadas no periodo | `COUNT WHERE status = 'concluida' AND data_conclusao BETWEEN inicio AND fim` | Verde |
| Tempo Medio | Media de conclusao | `AVG(data_conclusao - criado_em)` em dias | Cinza |

**Comportamento:**
- Clique no card filtra a lista pelo criterio correspondente
- Card "Atrasadas" com destaque visual (borda vermelha, icone alerta)
- Metricas respeitam filtros aplicados

**Criterios de Aceitacao:**
- [ ] 4 cards exibidos corretamente
- [ ] Calculos precisos
- [ ] Clique filtra lista
- [ ] Card Atrasadas com destaque visual
- [ ] Atualizacao em tempo real ao concluir tarefa

**Prioridade:** Must-have

---

### RF-003: Filtros

**User Story:**
Como Admin ou Member,
Quero filtrar tarefas por diversos criterios,
Para que eu possa focar nas tarefas mais relevantes.

**Especificacao:**

| Filtro | Tipo | Opcoes | Obrigatorio |
|--------|------|--------|-------------|
| Pipeline | Select | Lista de pipelines do tenant | NAO |
| Etapa | Select dependente | Todas / Etapas da pipeline selecionada | NAO |
| Status | Multi-select | Pendente, Em Andamento, Concluida, Cancelada | NAO |
| Prioridade | Multi-select | Baixa, Media, Alta, Urgente | NAO |
| Responsavel | Select | Todos / Lista de members | **APENAS ADMIN** |
| Periodo | Date Range | Hoje, Esta Semana, Este Mes, Personalizado | NAO |
| Busca | Text | Titulo ou nome da oportunidade | NAO |

**Regras Criticas:**
- O filtro **"Responsavel"** so aparece para role **Admin**
- **Member** NAO ve o filtro Responsavel pois ja visualiza apenas suas proprias tarefas
- Botao "Limpar Filtros" reseta todos os filtros

**Criterios de Aceitacao:**
- [ ] Todos os filtros funcionam corretamente
- [ ] Etapa carrega dinamicamente baseado na pipeline
- [ ] Filtro Responsavel visivel apenas para Admin
- [ ] Member nao ve filtro Responsavel
- [ ] Limpar Filtros funciona
- [ ] Filtros persistem durante a sessao

**Prioridade:** Must-have

---

### RF-004: Lista de Tarefas

**User Story:**
Como Admin ou Member,
Quero ver uma lista detalhada das tarefas,
Para que eu possa identificar rapidamente o que precisa ser feito.

**Especificacao de cada item:**

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  [ ] ICONE Titulo da tarefa                                         [ATRASADA]  │
│      Oportunidade: Nome - #codigo  •  Pipeline: Nome  •  Etapa: Nome           │
│      Vencimento: Data/Hora  •  Prioridade: [Badge]  •  Responsavel: Nome       │
│      [Automatica/Manual]                                            [Concluir] │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Icones por tipo:**
- Ligacao: telefone
- Email: envelope
- Reuniao: calendario
- WhatsApp: mensagem
- Visita: carro/localizacao
- Outro: clipboard

**Informacoes exibidas:**
- Checkbox para concluir (a esquerda)
- Icone do tipo de tarefa
- Titulo da tarefa (clicavel - abre modal oportunidade)
- Badge [ATRASADA] se `data_vencimento < now() AND status = 'pendente'`
- Link para oportunidade (clicavel - abre modal)
- Pipeline e Etapa atual
- Data de vencimento (destaque vermelho se atrasada)
- Prioridade (badge colorido: baixa=cinza, media=azul, alta=laranja, urgente=vermelho)
- Responsavel (nome do owner)
- Badge [Automatica] se `tarefa_template_id IS NOT NULL`, senao [Manual]
- Botao "Concluir" (a direita)

**Ordenacao padrao:** data_vencimento ASC (mais urgentes primeiro)

**Criterios de Aceitacao:**
- [ ] Todas informacoes exibidas corretamente
- [ ] Icones corretos por tipo
- [ ] Badge ATRASADA aparece quando aplicavel
- [ ] Clique no titulo abre modal da oportunidade na aba Tarefas
- [ ] Clique na oportunidade abre modal de detalhes
- [ ] Paginacao funciona (20 itens por pagina)
- [ ] Loading state enquanto carrega
- [ ] Empty state quando nao ha tarefas

**Prioridade:** Must-have

---

### RF-005: Conclusao Rapida de Tarefa

**User Story:**
Como Admin ou Member,
Quero concluir tarefas diretamente da lista,
Para que eu nao precise abrir cada oportunidade.

**Especificacao:**

Ao clicar em "Concluir" ou no checkbox, exibe modal de confirmacao:

```
┌───────────────────────────────────────────┐
│  ✓ Concluir Tarefa                    X  │
├───────────────────────────────────────────┤
│                                           │
│  Deseja concluir esta tarefa?             │
│                                           │
│  ICONE Titulo da tarefa                   │
│  Oportunidade: Nome - #codigo             │
│                                           │
│  Observacao (opcional)                    │
│  [______________________________]         │
│                                           │
│  [Cancelar]        [✓ Concluir Tarefa]   │
│                                           │
└───────────────────────────────────────────┘
```

**Comportamento:**
- Atualiza `status` para `'concluida'`
- Define `data_conclusao = now()`
- Salva observacao em campo `descricao` se preenchida (append)
- Lista e metricas atualizam em tempo real (optimistic update)
- Toast de confirmacao "Tarefa concluida com sucesso"

**Criterios de Aceitacao:**
- [ ] Modal de confirmacao exibido
- [ ] Observacao opcional funciona
- [ ] Tarefa atualizada no banco
- [ ] Lista remove/atualiza item
- [ ] Metricas atualizam
- [ ] Toast de sucesso exibido

**Prioridade:** Must-have

---

### RF-006: Visibilidade por Role

**REGRA CRITICA - CORRECAO:**

| Role | Ve | Filtra por Responsavel | Pode Concluir |
|------|----|-----------------------|---------------|
| **Super Admin** | NAO USA este modulo | - | - |
| **Admin** | Todas tarefas de todos Members do tenant | SIM (filtro disponivel) | Qualquer tarefa do tenant |
| **Member** | APENAS suas proprias tarefas | NAO (filtro oculto) | Apenas suas proprias |

**Justificativa:**
- **Admin** e o gestor/gerente da equipe comercial, precisa visibilidade total para acompanhar a operacao
- **Member** e o vendedor operacional, foca apenas nas suas proprias tarefas
- **Super Admin** gerencia a plataforma SaaS, nao a operacao de vendas

**Implementacao Backend:**

```typescript
// Logica de filtragem no endpoint GET /api/v1/tarefas
async function listarTarefas(req: Request, res: Response) {
  const { organizacao_id, role, user_id } = req.user;

  let query = supabase
    .from('tarefas')
    .select('*, oportunidades(*), usuarios!owner_id(*)')
    .eq('organizacao_id', organizacao_id)
    .not('oportunidade_id', 'is', null)  // APENAS tarefas com oportunidade
    .is('deletado_em', null);

  // REGRA DE VISIBILIDADE
  if (role === 'member') {
    // Member ve APENAS suas proprias tarefas
    query = query.eq('owner_id', user_id);
  }
  // Admin ve todas as tarefas do tenant (nao adiciona filtro por owner_id)

  // ... aplicar demais filtros da query
}
```

**Criterios de Aceitacao:**
- [ ] Super Admin nao tem acesso ao modulo /tarefas
- [ ] Admin ve todas tarefas de todos Members do tenant
- [ ] Admin pode filtrar por responsavel
- [ ] Member ve APENAS suas proprias tarefas
- [ ] Member NAO ve filtro de responsavel
- [ ] Todas tarefas exibidas tem `oportunidade_id NOT NULL`

**Prioridade:** Must-have (CRITICO)

---

## Requisitos Nao-Funcionais

### Performance

- Tempo de carregamento inicial: < 2 segundos
- Resposta de filtros: < 500ms
- Paginacao: 20 itens por pagina
- Otimizar query com indices existentes

### Seguranca

- Validacao de `organizacao_id` via RLS
- Validacao de `role` no backend antes de retornar dados
- Nao expor dados de outros tenants
- Audit log para conclusao de tarefas

### Usabilidade

- Interface responsiva (desktop e tablet)
- Loading states em todas operacoes
- Empty states informativos
- Feedback visual em acoes (toast, animacoes)

---

## Escopo

### O que ESTA no escopo

- Pagina `/tarefas` com listagem centralizada
- Cards de metricas (4 cards)
- Filtros por pipeline, etapa, status, prioridade, responsavel, periodo, busca
- Lista paginada de tarefas
- Conclusao rapida com modal de confirmacao
- Visibilidade por role (Admin ve todos, Member ve apenas suas)

### O que NAO esta no escopo

- Criacao de tarefas (continua sendo via modal de oportunidade ou automatico)
- Edicao de tarefas (continua sendo via modal de oportunidade)
- Exclusao de tarefas
- Tarefas sem oportunidade vinculada (tarefas "soltas")
- Notificacoes de tarefas atrasadas
- Reagendamento de tarefas
- Delegacao de tarefas entre usuarios

### Escopo futuro (backlog)

- PRD-12 (Automacoes): Notificacoes de tarefas atrasadas
- Criacao de tarefas diretamente neste modulo
- Reagendamento em lote
- Dashboard de produtividade da equipe

---

## Endpoints de API

### GET /api/v1/tarefas

Lista tarefas com filtros.

**Query Params:**

```typescript
interface TarefasQueryParams {
  pipeline_id?: string;           // Filtrar por pipeline
  etapa_id?: string;              // Filtrar por etapa
  status?: string[];              // Filtrar por status
  prioridade?: string[];          // Filtrar por prioridade
  owner_id?: string;              // APENAS ADMIN pode usar
  data_inicio?: string;           // ISO date
  data_fim?: string;              // ISO date
  busca?: string;                 // Busca em titulo e oportunidade
  page?: number;                  // Default: 1
  limit?: number;                 // Default: 20, max: 100
}
```

**Response:**

```typescript
interface TarefasResponse {
  data: Tarefa[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
```

---

### GET /api/v1/tarefas/metricas

Retorna metricas agregadas.

**Query Params:** Mesmos filtros de listagem (exceto page/limit)

**Response:**

```typescript
interface TarefasMetricas {
  em_aberto: number;        // status IN ('pendente', 'em_andamento')
  atrasadas: number;        // status = 'pendente' AND data_vencimento < now()
  concluidas: number;       // status = 'concluida' no periodo
  tempo_medio_dias: number; // AVG(data_conclusao - criado_em)
}
```

---

### PATCH /api/v1/tarefas/:id/concluir

Marca tarefa como concluida.

**Body:**

```typescript
interface ConcluirTarefaBody {
  observacao?: string;  // Opcional, sera adicionada a descricao
}
```

**Response:**

```typescript
interface ConcluirTarefaResponse {
  success: boolean;
  tarefa: Tarefa;
}
```

**Validacoes:**
- Tarefa pertence ao tenant do usuario
- Se role = 'member', `owner_id` deve ser igual ao `user_id`
- Tarefa nao pode estar com `status = 'concluida'` ou `status = 'cancelada'`

---

## Design e UX

### Layout da Pagina

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  Acompanhamento de Tarefas                                                              │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │     12       │  │      8       │  │     28       │  │    2.5d      │                │
│  │   Em Aberto  │  │   Atrasadas  │  │  Concluidas  │  │  Tempo Medio │                │
│  │   tarefas    │  │   ⚠ alerta   │  │   este mes   │  │  de conclusao│                │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘                │
│                                                                                          │
│  ── FILTROS ────────────────────────────────────────────────────────────────────────   │
│                                                                                          │
│  [Pipeline v]  [Etapa v]  [Status v]  [Prioridade v]  [Responsavel v*]  [Periodo v]    │
│                                                        * apenas Admin                   │
│  [Buscar tarefa...]                                          [Limpar Filtros]           │
│                                                                                          │
│  ── LISTA DE TAREFAS ───────────────────────────────────────────────────────────────   │
│                                                                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐   │
│  │  [ ] 📞 Ligar para cliente - Retorno proposta                                    │   │
│  │      Oportunidade: Joao Silva - #001  •  Pipeline: Vendas B2B  •  Etapa: Lead   │   │
│  │      Vencimento: Amanha, 10:00  •  Prioridade: [Alta]  •  Responsavel: Carlos   │   │
│  │      [Automatica]                                                    [Concluir] │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐   │
│  │  [ ] ✉ Enviar proposta por email                                     ⚠ ATRASADA │   │
│  │      Oportunidade: Maria Santos - #005  •  Pipeline: Pre-Vendas  •  Etapa: Prop │   │
│  │      Vencimento: Ontem  •  Prioridade: [Urgente]  •  Responsavel: Ana          │   │
│  │      [Automatica]                                                    [Concluir] │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│  Mostrando 15 de 48 tarefas                                      [1] [2] [3] [>]       │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Consideracoes de UX

- Cards clicaveis funcionam como filtros rapidos
- Filtros side-by-side em desktop, empilhados em mobile/tablet
- Lista com hover states para indicar interatividade
- Badge de atrasada sempre visivel (vermelho)
- Botao Concluir com destaque (cor primaria)
- Modal de confirmacao simples e direto

---

## Metricas de Sucesso

### KPIs Primarios

| Metrica | Baseline | Meta | Prazo |
|---------|----------|------|-------|
| Tarefas concluidas via modulo | 0% | 60% | 1 mes |
| Reducao de tarefas atrasadas | - | -30% | 2 meses |

### KPIs Secundarios

- Tempo medio no modulo por sessao
- Taxa de uso do modulo vs modal de oportunidade
- Filtros mais utilizados

### Criterios de Lancamento

- [ ] Todos os RF implementados
- [ ] Testes de visibilidade por role passando
- [ ] Performance < 2s no carregamento
- [ ] Zero vazamento de dados entre tenants

---

## Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| Confusao de visibilidade por role | Media | Alto | Documentacao clara, testes extensivos |
| Performance com muitas tarefas | Media | Medio | Paginacao, indices, lazy loading |
| Usuarios preferem modal de oportunidade | Baixa | Baixo | UX intuitiva, acesso rapido |

---

## Dependencias

| Dependencia | Responsavel | Status | Risco |
|-------------|-------------|--------|-------|
| Tabela `tarefas` (PRD-04) | Backend | Implementado | Baixo |
| Templates de tarefas (PRD-05) | Backend | Implementado | Baixo |
| Modal de oportunidade (PRD-07) | Frontend | Implementado | Baixo |
| Sistema de roles (PRD-03) | Backend | Implementado | Baixo |

---

## Checklist de Implementacao

### Backend

- [ ] GET /api/v1/tarefas com filtros
- [ ] GET /api/v1/tarefas/metricas
- [ ] PATCH /api/v1/tarefas/:id/concluir
- [ ] RLS respeitando tenant isolation (organizacao_id)
- [ ] Filtro automatico por owner_id para Member
- [ ] Admin pode ver todas tarefas do tenant
- [ ] Garantir oportunidade_id NOT NULL em todas tarefas retornadas
- [ ] Validacao de permissao antes de concluir tarefa
- [ ] Audit log para conclusao

### Frontend

- [ ] Pagina /tarefas
- [ ] Componente TarefasMetricasCards
- [ ] Componente TarefasFiltros (condicional por role)
- [ ] Componente TarefasLista
- [ ] Componente TarefaItem
- [ ] Modal de confirmacao de conclusao
- [ ] TanStack Query integration (queries e mutations)
- [ ] Paginacao
- [ ] Loading states
- [ ] Empty states
- [ ] Responsividade

---

## Plano de Validacao

### Pre-Lancamento

| Item | Validacao | Responsavel |
|------|-----------|-------------|
| Teste de isolamento | Member ve apenas suas tarefas | QA + Security |
| Teste de Admin | Admin ve todas tarefas do tenant | QA |
| Teste de conclusao | Status atualiza corretamente | QA |
| Teste de SLA | Alertas de vencimento funcionando | QA |
| Performance | Lista com 1000+ tarefas em < 1s | DevOps |

### Durante Lancamento

| Item | Validacao | Responsavel |
|------|-----------|-------------|
| Erros de permissao | 0 vazamentos entre users | Security |
| Latencia de listagem | < 500ms | DevOps |
| Conclusao de tarefas | Taxa de sucesso >= 99% | QA |
| Logs de auditoria | Todas conclusoes registradas | Security |

### Pos-Lancamento

| Item | Validacao | Frequencia |
|------|-----------|------------|
| Taxa de conclusao | Tarefas concluidas vs criadas | Semanal |
| Tarefas vencidas | % de tarefas em atraso | Diario |
| Tempo medio de conclusao | Por tipo de tarefa | Semanal |
| Feedback de usuarios | NPS do modulo | Mensal |
| Performance queries | Analise de slow queries | Quinzenal |

---

## Historico de Versoes

| Versao | Data | Autor | Mudancas |
|--------|------|-------|----------|
| v1.0 | 2026-02-03 | Arquiteto de Produto | Versao inicial - Modulo de Tarefas com visibilidade por role (Admin ve equipe, Member ve apenas suas) |
| v1.1 | 2026-02-03 | Arquiteto de Produto | Adicionada secao Plano de Validacao formal (Pre/Durante/Pos-Lancamento) conforme prdpadrao.md |
