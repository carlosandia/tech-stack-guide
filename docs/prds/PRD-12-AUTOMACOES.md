# PRD-12: Módulo de Automações

| Campo | Valor |
|-------|-------|
| **Autor** | CRM Renove - Product Team |
| **Data de criação** | 2026-02-11 |
| **Última atualização** | 2026-02-11 |
| **Versão** | v1.0 |
| **Status** | Rascunho |
| **Stakeholders** | Product, Engineering, CS |
| **Revisor técnico** | Tech Lead |

---

## 1. Resumo Executivo

O Módulo de Automações permite que usuários Admin criem fluxos automatizados baseados em eventos do CRM, eliminando tarefas repetitivas e garantindo que nenhuma oportunidade seja perdida por falta de ação.

O sistema segue o modelo **Trigger → Condição → Ação**, amplamente adotado por CRMs líderes (HubSpot, RD Station, Kommo). O diferencial é a simplicidade: o usuário monta automações em uma interface visual intuitiva, sem necessidade de conhecimento técnico.

O impacto esperado é redução de 60%+ em tarefas manuais repetitivas, aumento na velocidade de resposta a leads e padronização dos processos de vendas por tenant.

---

## 2. Contexto e Motivação

### 2.1 Problema

- Vendedores esquecem de fazer follow-up em oportunidades paradas
- Redistribuição manual de leads quando SLA expira é lenta e propensa a erros
- Não há notificação automática quando metas são batidas ou eventos importantes ocorrem
- Tarefas repetitivas (criar tarefa ao mover etapa, notificar responsável) consomem tempo
- Sem automação, o CRM depende 100% da disciplina manual do time

### 2.2 Oportunidade de Mercado

- 85% dos CRMs modernos oferecem automação como feature core
- RD Station, HubSpot, Kommo, Pipedrive todos possuem automações visuais
- É um diferencial competitivo decisivo na escolha de CRM por PMEs
- Automação é o segundo recurso mais solicitado após relatórios

### 2.3 Alinhamento Estratégico

- Aumenta retenção: usuários com automações ativas têm 3x mais engajamento
- Aumenta percepção de valor do produto
- Habilita upsell para planos superiores (mais automações = plano maior)
- Prepara a base para automações avançadas (IA, scoring dinâmico)

---

## 3. Usuários e Personas

### 3.1 Persona Primária

**Nome:** Gestor de Vendas (Admin)
**Role:** Admin do tenant
**Contexto:** Gerencia equipe de 3-15 vendedores, precisa padronizar processos
**Dores:**
- Perde tempo configurando manualmente cada etapa do processo
- Não consegue garantir que todos sigam o mesmo fluxo
- Descobre tarde demais que oportunidades estão paradas

**Objetivos:**
- Automatizar tarefas repetitivas do time
- Ser notificado de eventos críticos em tempo real
- Garantir que nenhum lead fique sem resposta

**Citação representativa:** "Preciso que o CRM trabalhe por mim, não que eu trabalhe para o CRM."

### 3.2 Persona Secundária

**Nome:** Vendedor (Member)
**Role:** Member do tenant
**Contexto:** Opera leads diariamente, recebe ações automáticas
**Dores:**
- Esquece de criar tarefas de follow-up
- Não sabe quando uma oportunidade está parada há muito tempo

### 3.3 Anti-personas

- **Super Admin:** Não cria automações de tenant (pode visualizar métricas globais)
- **Usuário técnico:** O módulo NÃO é um workflow engine programável (sem código customizado)

---

## 4. Hierarquia de Requisitos

### 4.1 Theme

> Automação de processos de vendas para eliminar tarefas repetitivas e aumentar a produtividade.

### 4.2 Epic

> Motor de automação baseado em eventos com interface visual de configuração.

### 4.3 Features e User Stories

#### Feature: Criação de Automação

**User Story:**
Como Admin,
Quero criar uma automação com trigger, condições e ações,
Para que processos repetitivos sejam executados automaticamente.

**Critérios de Aceitação:**
- [ ] Posso selecionar um trigger de uma lista categorizada
- [ ] Posso adicionar condições opcionais (filtros)
- [ ] Posso adicionar 1 ou mais ações sequenciais
- [ ] Posso ativar/desativar a automação
- [ ] A automação executa em tempo real quando o trigger dispara

**Prioridade:** Must-have

---

#### Feature: Ações de Notificação

**User Story:**
Como Admin,
Quero que automações enviem notificações por WhatsApp e Email,
Para que meu time seja alertado de eventos importantes sem depender do CRM.

**Critérios de Aceitação:**
- [ ] Posso enviar mensagem WhatsApp via conexão existente (API4COM/WAHA)
- [ ] Posso enviar email via conexão SMTP/Gmail configurada
- [ ] Posso usar variáveis dinâmicas no corpo da mensagem ({{contato.nome}}, {{oportunidade.valor}})
- [ ] Posso definir destinatários fixos ou dinâmicos (responsável, criador, email específico)

**Prioridade:** Must-have

---

#### Feature: Ações de CRM

**User Story:**
Como Admin,
Quero que automações executem ações no CRM (criar tarefa, alterar responsável, mover etapa),
Para que o fluxo de vendas avance automaticamente.

**Critérios de Aceitação:**
- [ ] Posso criar tarefa automaticamente com título, descrição e prazo configuráveis
- [ ] Posso alterar o responsável de uma oportunidade
- [ ] Posso mover oportunidade para outra etapa
- [ ] Posso atualizar campos da oportunidade ou contato

**Prioridade:** Must-have

---

#### Feature: Ações Temporais (Delay)

**User Story:**
Como Admin,
Quero adicionar pausas entre ações de uma automação,
Para que ações sejam executadas no momento certo (ex: enviar WhatsApp 30min após abertura de email).

**Critérios de Aceitação:**
- [ ] Posso configurar delay em segundos, minutos, horas ou dias
- [ ] A execução pendente é persistida no banco (sobrevive a restarts)
- [ ] Posso cancelar execuções pendentes

**Prioridade:** Should-have

---

#### Feature: Logs e Monitoramento

**User Story:**
Como Admin,
Quero visualizar o histórico de execuções de cada automação,
Para que eu saiba se estão funcionando corretamente.

**Critérios de Aceitação:**
- [ ] Cada execução gera um log com status (sucesso/erro/pulado)
- [ ] Posso ver o log detalhado de cada ação executada
- [ ] Posso filtrar por automação, status, período

**Prioridade:** Must-have

---

## 5. Requisitos Funcionais

### 5.1 Triggers (Gatilhos)

| ID | Trigger | Categoria | Prioridade |
|----|---------|-----------|------------|
| TRG-01 | Oportunidade criada | Oportunidades | Must |
| TRG-02 | Oportunidade movida de etapa | Oportunidades | Must |
| TRG-03 | Oportunidade ganha | Oportunidades | Must |
| TRG-04 | Oportunidade perdida | Oportunidades | Must |
| TRG-05 | Responsável alterado | Oportunidades | Must |
| TRG-06 | Valor da oportunidade alterado | Oportunidades | Should |
| TRG-07 | Oportunidade parada há X dias | Oportunidades | Must |
| TRG-08 | Campo customizado alterado | Oportunidades | Could |
| TRG-09 | Contato criado | Contatos | Must |
| TRG-10 | Contato atualizado | Contatos | Should |
| TRG-11 | Segmento adicionado ao contato | Contatos | Should |
| TRG-12 | Tarefa criada | Tarefas | Should |
| TRG-13 | Tarefa concluída | Tarefas | Must |
| TRG-14 | Tarefa vencida (não concluída) | Tarefas | Must |
| TRG-15 | Email aberto pelo contato | Comunicação | Should |
| TRG-16 | Email respondido | Comunicação | Could |
| TRG-17 | Mensagem WhatsApp recebida | Comunicação | Should |
| TRG-18 | Formulário preenchido | Formulários | Must |
| TRG-19 | Meta individual batida | Metas | Should |
| TRG-20 | Meta de equipe batida | Metas | Should |
| TRG-21 | Meta da empresa batida | Metas | Should |
| TRG-22 | SLA de distribuição expirado | Distribuição | Must |
| TRG-23 | Máx. redistribuições atingido | Distribuição | Must |
| TRG-24 | X oportunidades com MQL na pipeline | Pipeline | Should |
| TRG-25 | Nenhuma interação com contato há X dias | Contatos | Should |
| TRG-26 | Oportunidade sem tarefa aberta | Oportunidades | Should |

### 5.2 Condições (Filtros)

| ID | Condição | Prioridade |
|----|----------|------------|
| CND-01 | Funil específico | Must |
| CND-02 | Etapa específica (origem e/ou destino) | Must |
| CND-03 | Responsável específico | Must |
| CND-04 | Valor da oportunidade (maior/menor/entre) | Must |
| CND-05 | Origem do contato (manual, formulário, API) | Should |
| CND-06 | Tipo de contato (pessoa/empresa) | Must |
| CND-07 | Segmento do contato | Should |
| CND-08 | Campo customizado (qualquer operador) | Could |
| CND-09 | Dia da semana / horário | Should |
| CND-10 | Equipe do responsável | Should |

### 5.3 Ações

| ID | Ação | Categoria | Prioridade |
|----|------|-----------|------------|
| ACT-01 | Enviar mensagem WhatsApp | Notificação | Must |
| ACT-02 | Enviar email | Notificação | Must |
| ACT-03 | Criar notificação interna | Notificação | Must |
| ACT-04 | Criar tarefa | CRM | Must |
| ACT-05 | Alterar responsável da oportunidade | CRM | Must |
| ACT-06 | Mover oportunidade para etapa | CRM | Must |
| ACT-07 | Atualizar campo da oportunidade | CRM | Should |
| ACT-08 | Atualizar campo do contato | CRM | Should |
| ACT-09 | Adicionar segmento ao contato | CRM | Should |
| ACT-10 | Aguardar X tempo (delay) | Controle | Should |
| ACT-11 | Enviar webhook externo | Integração | Could |
| ACT-12 | Duplicar oportunidade em outro funil | CRM | Could |
| ACT-13 | Marcar oportunidade como MQL/SQL | CRM | Should |
| ACT-14 | Atribuir para equipe (distribuição) | CRM | Should |
| ACT-15 | Arquivar contato | CRM | Could |

### 5.4 Variáveis Dinâmicas

Todas as ações de texto suportam variáveis:

| Variável | Descrição |
|----------|-----------|
| `{{contato.nome}}` | Nome do contato |
| `{{contato.email}}` | Email do contato |
| `{{contato.telefone}}` | Telefone do contato |
| `{{oportunidade.titulo}}` | Título da oportunidade |
| `{{oportunidade.valor}}` | Valor formatado |
| `{{oportunidade.etapa}}` | Nome da etapa atual |
| `{{oportunidade.funil}}` | Nome do funil |
| `{{responsavel.nome}}` | Nome do responsável |
| `{{responsavel.email}}` | Email do responsável |
| `{{tarefa.titulo}}` | Título da tarefa (quando trigger é de tarefa) |
| `{{meta.nome}}` | Nome da meta (quando trigger é de meta) |
| `{{meta.valor_atingido}}` | Valor atingido da meta |
| `{{data.hoje}}` | Data atual formatada |
| `{{link.oportunidade}}` | Link direto para a oportunidade no CRM |

---

## 6. Requisitos Não-Funcionais

### 6.1 Performance

- Triggers em tempo real devem executar em < 5 segundos
- Triggers temporais (cron) executam a cada 5 minutos
- Máximo de 50 automações ativas por tenant (plano básico)
- Log de execuções retido por 90 dias

### 6.2 Segurança

- RLS obrigatório em todas as tabelas (`organizacao_id`)
- Apenas Admin pode criar/editar/excluir automações
- Members podem visualizar automações (somente leitura)
- Proteção contra loops infinitos (max 5 execuções da mesma automação por entidade em 1 hora)
- Tokens de API (WhatsApp, Email) nunca expostos no frontend

### 6.3 Usabilidade

- Interface de criação em 3 passos: Trigger → Condição → Ação
- Preview de variáveis dinâmicas antes de salvar
- Teste manual de automação (dry-run) antes de ativar
- Mensagens de erro claras quando ações falham

### 6.4 Confiabilidade

- Execuções pendentes (delay) persistidas no banco
- Retry automático com backoff em caso de falha (max 3 tentativas)
- Fila de execução para evitar sobrecarga

---

## 7. Escopo

### 7.1 O que ESTÁ no escopo (MVP)

- CRUD de automações (criar, editar, ativar/desativar, excluir)
- Triggers em tempo real via database triggers/webhooks
- Triggers temporais via pg_cron ou Edge Function scheduled
- Ações: WhatsApp, Email, Notificação interna, Criar tarefa, Alterar responsável, Mover etapa
- Condições básicas (funil, etapa, responsável, valor)
- Variáveis dinâmicas em mensagens
- Log de execuções
- Proteção anti-loop

### 7.2 O que NÃO está no escopo

- **Editor visual drag-and-drop** (será interface de formulário estruturado no MVP)
- **Branching condicional** (if/else dentro do fluxo) - futuro
- **Automações entre tenants** - nunca
- **Execução de código customizado** - nunca
- **Integração com Zapier/Make** - futuro
- **Templates de automação pré-prontos** - v1.1

### 7.3 Escopo futuro (backlog)

- Editor visual com canvas drag-and-drop (v2.0)
- Templates de automação por segmento
- Branching condicional (if/else/switch)
- Integração com Zapier/Make
- Métricas de automação (quantas vezes disparou, taxa de sucesso)
- Automações baseadas em scoring de lead

---

## 8. Modelagem de Dados

### 8.1 Tabela: `automacoes`

```sql
CREATE TABLE public.automacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  nome text NOT NULL,
  descricao text,
  ativo boolean NOT NULL DEFAULT false,
  
  -- Trigger
  trigger_tipo text NOT NULL,           -- 'oportunidade_criada', 'etapa_movida', etc.
  trigger_config jsonb NOT NULL DEFAULT '{}', -- Config específica do trigger
  
  -- Condições (array de condições AND)
  condicoes jsonb NOT NULL DEFAULT '[]',
  
  -- Ações (array ordenado de ações)
  acoes jsonb NOT NULL DEFAULT '[]',
  
  -- Controle
  max_execucoes_hora integer DEFAULT 50,
  execucoes_ultima_hora integer DEFAULT 0,
  ultima_execucao_em timestamptz,
  total_execucoes integer DEFAULT 0,
  total_erros integer DEFAULT 0,
  
  criado_por uuid REFERENCES usuarios(id),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz
);
```

### 8.2 Tabela: `log_automacoes`

```sql
CREATE TABLE public.log_automacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  automacao_id uuid NOT NULL REFERENCES automacoes(id),
  
  trigger_tipo text NOT NULL,
  entidade_tipo text,                -- 'oportunidade', 'contato', 'tarefa'
  entidade_id uuid,
  
  status text NOT NULL DEFAULT 'executando', -- 'executando', 'sucesso', 'erro', 'pulado'
  
  acoes_executadas jsonb DEFAULT '[]',  -- Log detalhado de cada ação
  erro_mensagem text,
  
  dados_trigger jsonb,                 -- Snapshot dos dados no momento do trigger
  duracao_ms integer,
  
  criado_em timestamptz NOT NULL DEFAULT now()
);
```

### 8.3 Tabela: `execucoes_pendentes_automacao`

```sql
CREATE TABLE public.execucoes_pendentes_automacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  automacao_id uuid NOT NULL REFERENCES automacoes(id),
  log_id uuid REFERENCES log_automacoes(id),
  
  acao_index integer NOT NULL,          -- Qual ação executar após o delay
  dados_contexto jsonb NOT NULL,        -- Dados necessários para a execução
  
  executar_em timestamptz NOT NULL,     -- Quando executar
  status text NOT NULL DEFAULT 'pendente', -- 'pendente', 'executado', 'cancelado', 'erro'
  
  tentativas integer DEFAULT 0,
  max_tentativas integer DEFAULT 3,
  ultimo_erro text,
  
  criado_em timestamptz NOT NULL DEFAULT now(),
  executado_em timestamptz
);
```

### 8.4 Tabela: `eventos_automacao`

```sql
CREATE TABLE public.eventos_automacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  
  tipo text NOT NULL,                   -- Mesmo que trigger_tipo
  entidade_tipo text NOT NULL,
  entidade_id uuid NOT NULL,
  
  dados jsonb NOT NULL DEFAULT '{}',    -- Dados do evento
  processado boolean DEFAULT false,
  processado_em timestamptz,
  
  criado_em timestamptz NOT NULL DEFAULT now()
);
```

### 8.5 Índices

```sql
CREATE INDEX idx_automacoes_org_ativo ON automacoes(organizacao_id, ativo) WHERE deletado_em IS NULL;
CREATE INDEX idx_automacoes_trigger ON automacoes(organizacao_id, trigger_tipo, ativo) WHERE deletado_em IS NULL;
CREATE INDEX idx_log_automacoes_org_automacao ON log_automacoes(organizacao_id, automacao_id, criado_em DESC);
CREATE INDEX idx_execucoes_pendentes_executar ON execucoes_pendentes_automacao(executar_em, status) WHERE status = 'pendente';
CREATE INDEX idx_eventos_automacao_processar ON eventos_automacao(organizacao_id, tipo, processado) WHERE processado = false;
```

### 8.6 RLS

```sql
ALTER TABLE automacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_automacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE execucoes_pendentes_automacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_automacao ENABLE ROW LEVEL SECURITY;

-- Policies baseadas em organizacao_id (padrão do sistema)
```

---

## 9. Arquitetura de Execução

### 9.1 Fluxo de Execução em Tempo Real

```
Evento no CRM (ex: oportunidade movida)
  ↓
Database Trigger → INSERT em eventos_automacao
  ↓
pg_notify('evento_automacao', payload)
  ↓
Edge Function listener (ou polling a cada 5s)
  ↓
Busca automações ativas com trigger_tipo correspondente
  ↓
Avalia condições (AND)
  ↓
Se condições OK → Executa ações sequencialmente
  ↓
Para cada ação:
  - Se delay → INSERT em execucoes_pendentes_automacao
  - Se WhatsApp → Chama API4COM/WAHA
  - Se Email → Chama SMTP/Gmail
  - Se CRM → UPDATE direto no banco
  ↓
INSERT log em log_automacoes
```

### 9.2 Fluxo de Triggers Temporais

```
pg_cron (a cada 5 minutos)
  ↓
Edge Function: verifica condições temporais
  - Oportunidades paradas há X dias
  - Tarefas vencidas
  - SLA expirado
  - Contatos sem interação há X dias
  ↓
Para cada match → INSERT em eventos_automacao
  ↓
(segue fluxo normal de execução)
```

### 9.3 Proteção Anti-Loop

```
Antes de executar automação:
  1. Verificar execucoes_ultima_hora < max_execucoes_hora
  2. Verificar se a mesma entidade não disparou a mesma automação nos últimos 60s
  3. Se loop detectado → status = 'pulado', log com motivo
```

---

## 10. Design e UX

### 10.1 Fluxo do Usuário - Criar Automação

1. Admin acessa Configurações → Automações
2. Clica em "Nova Automação"
3. Define nome e descrição
4. **Passo 1 - Trigger:** Seleciona o evento gatilho de uma lista categorizada
5. **Passo 2 - Condições (opcional):** Adiciona filtros para refinar quando a automação dispara
6. **Passo 3 - Ações:** Adiciona uma ou mais ações em sequência, configurando cada uma
7. Salva a automação (inativa por padrão)
8. Testa com dry-run (opcional)
9. Ativa a automação

### 10.2 Tela de Listagem

- Cards com: nome, trigger, status (ativo/inativo), última execução, total de execuções
- Toggle para ativar/desativar inline
- Filtros por status e categoria de trigger
- Busca por nome

### 10.3 Considerações de UX

- Interface de formulário estruturado (não canvas drag-and-drop no MVP)
- Categorias visuais para triggers (ícones + cores por categoria)
- Preview em tempo real das variáveis dinâmicas
- Validação inline (ex: "Nenhuma conexão WhatsApp configurada" ao selecionar ação WhatsApp)
- Confirmação ao excluir automação com execuções recentes

---

## 11. Métricas de Sucesso

### 11.1 KPIs Primários

| Métrica | Baseline atual | Meta | Prazo |
|---------|----------------|------|-------|
| Tenants com automações ativas | 0% | 40% | 3 meses |
| Automações criadas por tenant | 0 | 3+ | 3 meses |
| Taxa de sucesso de execuções | N/A | > 95% | Contínuo |

### 11.2 KPIs Secundários

- Tempo médio de resposta a leads (espera-se redução de 50%)
- Redução de oportunidades paradas sem ação
- NPS do módulo

### 11.3 Critérios de Lançamento

- [ ] CRUD completo funcionando com RLS
- [ ] Pelo menos 5 triggers implementados
- [ ] Pelo menos 5 ações implementadas
- [ ] Proteção anti-loop validada
- [ ] Log de execuções funcional
- [ ] Testes com 3 cenários reais end-to-end

---

## 12. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Loop infinito de automações | Alta | Alto | Proteção anti-loop com max execuções/hora + dedup 60s |
| Sobrecarga do banco com eventos | Média | Alto | Fila de processamento + batch processing |
| Falha silenciosa em ações | Alta | Alto | Log detalhado + retry com backoff + alerta ao Admin |
| WhatsApp/Email indisponível | Média | Médio | Retry 3x + notificação interna como fallback |
| Complexidade excessiva para usuário | Média | Alto | Interface simplificada em 3 passos + templates futuros |
| Dados sensíveis em logs | Baixa | Alto | Sanitizar dados pessoais nos logs (mascarar telefone/email) |

---

## 13. Time to Value (TTV)

### 13.1 MVP (Mínimo Viável)

- CRUD de automações
- 8 triggers essenciais (TRG-01 a TRG-07, TRG-18, TRG-22, TRG-23)
- 6 ações essenciais (ACT-01 a ACT-06)
- Condições básicas (funil, etapa, responsável)
- Log de execuções
- Proteção anti-loop

### 13.2 Fases de Entrega

| Fase | Escopo | TTV |
|------|--------|-----|
| **MVP** | Schema + CRUD + Engine de eventos + 8 triggers + 6 ações | 3 semanas |
| **v1.1** | Delay (ACT-10) + Variáveis dinâmicas + Triggers temporais | 2 semanas |
| **v1.2** | Triggers de comunicação (email aberto, WhatsApp recebido) + Triggers de metas | 2 semanas |
| **v2.0** | Editor visual canvas + Templates + Branching | 4 semanas |

---

## 14. Suposições, Dependências e Restrições

### 14.1 Suposições

- Conexões WhatsApp (API4COM/WAHA) já estão funcionando no tenant
- Conexões de Email (SMTP/Gmail) já estão configuradas
- O sistema de metas já está implementado (PRD-05)
- O sistema de distribuição/rodízio já está implementado

### 14.2 Dependências

| Dependência | Responsável | Status | Risco |
|-------------|-------------|--------|-------|
| PRD-08 (Conexões WhatsApp/Email) | Engineering | Implementado | Baixo |
| PRD-07 (Negócios/Oportunidades) | Engineering | Implementado | Baixo |
| PRD-10 (Tarefas) | Engineering | Implementado | Baixo |
| PRD-05 (Configurações - Metas) | Engineering | Implementado | Baixo |
| Edge Functions (Supabase) | Infrastructure | Disponível | Baixo |

### 14.3 Restrições

- **Técnica:** Deve usar stack existente (Supabase + Edge Functions)
- **Performance:** Execução em tempo real < 5s
- **Segurança:** RLS obrigatório, isolamento total entre tenants

---

## 15. Estrutura de Código

```
src/modules/automacoes/
  components/
    AutomacaoCard.tsx
    AutomacaoForm.tsx
    TriggerSelector.tsx
    CondicaoBuilder.tsx
    AcaoBuilder.tsx
    VariaveisPreview.tsx
    LogExecucaoTable.tsx
  hooks/
    useAutomacoes.ts
    useLogAutomacoes.ts
  services/
    automacoes.api.ts
  schemas/
    automacoes.schema.ts
  pages/
    AutomacoesPage.tsx
    AutomacaoEditorPage.tsx
    AutomacaoLogsPage.tsx

backend/src/
  routes/automacoes.routes.ts
  services/automacoes.service.ts
  services/automacao-engine.service.ts
  schemas/automacoes.ts

supabase/functions/
  processar-eventos-automacao/
  executar-pendentes-automacao/
```

---

## 16. Histórico de Versões

| Versão | Data | Autor | Mudanças |
|--------|------|-------|----------|
| v1.0 | 2026-02-11 | Product Team | Versão inicial |

---

## Referências

- [HubSpot Workflows](https://www.hubspot.com/products/marketing/marketing-automation)
- [RD Station Automação](https://www.rdstation.com/marketing/automacao/)
- [Kommo Salesbot](https://www.kommo.com/features/salesbot/)
- [Pipedrive Automations](https://www.pipedrive.com/en/features/automations)
