# PRD-07: Modulo de Negocios (Pipeline/Kanban) - CRM Renove

| Campo | Valor |
|-------|-------|
| **Autor** | Arquiteto de Produto |
| **Data de criacao** | 2026-02-01 |
| **Ultima atualizacao** | 2026-02-02 |
| **Versao** | v1.5 |
| **Status** | Em desenvolvimento |
| **Stakeholders** | Product Owner, Tech Lead, Design Lead |
| **Revisor tecnico** | Tech Lead |

---

## Resumo Executivo

O **Modulo de Negocios** e o nucleo operacional do CRM Renove, responsavel pela gestao visual de oportunidades de venda atraves de uma interface Kanban intuitiva. Este modulo permite que equipes de vendas acompanhem o progresso de cada negociacao atraves de etapas customizaveis, com distribuicao automatica de leads, tarefas por etapa e qualificacao automatica (MQL).

O modulo integra-se diretamente com o WhatsApp (WAHA) atraves de pre-oportunidades, permitindo que novos contatos sejam convertidos em oportunidades reais com um clique. A arquitetura segue o padrao de configuracoes globais reutilizaveis, onde etapas, campos, regras e motivos sao criados uma vez e vinculados a multiplas pipelines.

**Impacto esperado**: Aumento de 40% na produtividade das equipes de vendas atraves da automacao de distribuicao e tarefas, com visibilidade em tempo real do funil para gestores.

---

## Hierarquia de Requisitos

### Theme

**Gestao Visual de Vendas com Automacao Inteligente**

Pipeline Kanban completo com distribuicao automatica de leads, tarefas por etapa, qualificacao MQL, integracao WhatsApp e metricas em tempo real para equipes de vendas B2B.

### Epic

**Pipeline de Negocios com Kanban, Distribuicao e Pre-Oportunidades**

Implementar modulo de gestao de oportunidades em formato Kanban com etapas configuraveis, distribuicao automatica por round-robin ou regras, tarefas automaticas por etapa, pre-oportunidades do WhatsApp e metricas de funil.

### Features

#### Feature 1: Kanban de Oportunidades

**User Story:** Como vendedor, quero visualizar minhas oportunidades em colunas por etapa para acompanhar o progresso de cada negociacao.

**Criterios de Aceite:**
- Drag and drop entre etapas
- Cards com informacoes resumidas (valor, contato, tarefas)
- Filtros por periodo, vendedor, tags
- Atualizacao em tempo real (Supabase Realtime)

#### Feature 2: Configuracao de Pipeline (6 Abas)

**User Story:** Como Admin, quero configurar etapas, campos, distribuicao, tarefas, qualificacao e motivos para cada pipeline.

**Criterios de Aceite:**
- Etapas com probabilidade e cor customizavel
- Campos vinculados de campos_customizados
- Distribuicao round-robin ou por regras
- Tarefas automaticas por etapa
- Regras MQL configuráveis
- Motivos de ganho/perda

#### Feature 3: Pre-Oportunidades (WhatsApp)

**User Story:** Como vendedor, quero receber contatos do WhatsApp como pre-oportunidades para triagem antes de entrar no funil.

**Criterios de Aceite:**
- Aba "Solicitacoes" separada do Kanban
- Aceitar converte em oportunidade na etapa 0
- Rejeitar arquiva com motivo
- Atribuicao automatica ou manual

#### Feature 4: Modal de Detalhes da Oportunidade

**User Story:** Como vendedor, quero ver todos os detalhes de uma oportunidade em um modal completo com abas de atividades, tarefas, emails e documentos.

**Criterios de Aceite:**
- Header com etapas clicaveis para mover
- 5 abas: Historico, Tarefas, E-mails, Reunioes, Documentos
- Timeline de atividades
- Campos editaveis inline

#### Feature 5: Metricas e Filtros do Pipeline

**User Story:** Como gestor, quero visualizar metricas do funil (total, valor, conversao) com filtros por periodo e vendedor.

**Criterios de Aceite:**
- Painel de metricas responsivo a filtros
- Filtros por data, vendedor, tags, produto
- Busca por nome do contato/oportunidade
- Toggle de visibilidade das metricas

---

## Contexto e Motivacao

### Problema

**Dor do usuario:**
- Vendedores perdem tempo distribuindo leads manualmente
- Falta de padronizacao nas etapas do processo de vendas
- Tarefas de follow-up sao esquecidas sem lembretes automaticos
- Gestores nao tem visibilidade em tempo real do pipeline
- Leads do WhatsApp nao entram automaticamente no funil

**Impacto no negocio:**
- Leads frios por falta de atendimento rapido
- Perda de oportunidades por ausencia de follow-up
- Dificuldade em medir performance individual de vendedores
- Processos inconsistentes entre diferentes vendedores

**Evidencias:**
- 60% dos leads sao perdidos por falta de resposta em menos de 1 hora
- Equipes com pipeline visual tem 28% mais conversao
- Automacao de tarefas reduz tempo administrativo em 35%

### Oportunidade

O mercado brasileiro de PMEs demanda CRMs com:
- Interface visual moderna (Kanban)
- Integracao nativa com WhatsApp
- Automacoes sem necessidade de ferramentas externas
- Configuracao flexivel sem codigo

### Alinhamento Estrategico

**Conexao com objetivos:**
- Epic 3: Pipeline de Vendas (PRD-01)
- Integracao com WhatsApp WAHA (PRD-08)
- Configuracoes globais reutilizaveis (PRD-05)

**Metricas de sucesso:**
- Tempo medio de primeiro contato: < 5 min
- Taxa de conversao do funil: > 15%
- Adocao do Kanban: > 90% dos usuarios

---

## Usuarios e Personas

### Admin (Gerente/Dono)

**Necessidades neste modulo:**
- Criar e configurar pipelines com etapas customizadas
- Definir regras de distribuicao automatica
- Configurar tarefas por etapa
- Visualizar metricas de todos os vendedores
- Gerenciar acesso de Members as pipelines

**Acoes permitidas:**
- CRUD completo de pipelines
- Configuracao das 6 abas (Etapas, Campos, Distribuicao, Atividades, Qualificacao, Motivos)
- Visualizar todas oportunidades de todos Members
- Aceitar/rejeitar pre-oportunidades do WhatsApp
- Editar qualquer oportunidade

### Member (Vendedor)

**Necessidades neste modulo:**
- Visualizar apenas suas oportunidades atribuidas
- Mover cards entre etapas
- Executar tarefas automaticas
- Registrar atividades e notas
- Aceitar pre-oportunidades (se atribuido a pipeline)

**Restricoes CRITICAS:**
- **NAO pode** ver oportunidades de outros Members
- **NAO pode** ver contatos de outros Members
- **NAO pode** ver metricas globais (apenas proprias)
- **NAO pode** configurar pipeline ou etapas
- **NAO pode** alterar regras de distribuicao

---

## Requisitos Funcionais

### RF-01: Interface Kanban

**Descricao:** Visualizacao em colunas das etapas do funil com cards arrastaveris. O Kanban reflete TODAS as configuracoes feitas na pipeline selecionada (etapas, campos, tarefas, qualificacao, motivos).

**Principio Fundamental:** Cada pipeline tem sua propria configuracao. Ao selecionar uma pipeline, o Kanban exibe:
- As etapas configuradas para aquela pipeline
- Os campos personalizados vinculados
- As tarefas automaticas por etapa
- As regras de qualificacao (badges Lead/MQL/SQL)
- Os motivos de ganho/perda configurados

**Submenu do Modulo:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Pipeline: Vendas B2B v]                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Visao Geral  │  Negocios  │  Contatos  │  Configuracoes                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Tela do Kanban:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Pipeline: Vendas B2B                    [+ Nova Oportunidade] [⚙ Config]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────┐ ┌──────────┐ ┌─────┐ ┌─────┐│
│  │ Solicitacoes│ │Novos Negocios│ │ Contato  │ │ Proposta │ │Ganho│ │Perda││
│  │ [WhatsApp]  │ │  (Etapa 0)  │ │   (5)    │ │   (3)    │ │ (8) │ │ (2) ││
│  │    (3)      │ │    (12)     │ │          │ │          │ │     │ │     ││
│  ├─────────────┤ ├─────────────┤ ├──────────┤ ├──────────┤ ├─────┤ ├─────┤│
│  │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌──────┐ │ │ ┌──────┐ │ │     │ │     ││
│  │ │Pre-Opp  │ │ │ │  Card   │ │ │ │ Card │ │ │ │ Card │ │ │     │ │     ││
│  │ │[📱 WA]  │ │ │ │ [Lead]  │ │ │ │[MQL] │ │ │ │[SQL] │ │ │     │ │     ││
│  │ │[✓] [✗]  │ │ │ └─────────┘ │ │ └──────┘ │ │ └──────┘ │ │     │ │     ││
│  │ └─────────┘ │ │ ┌─────────┐ │ │          │ │          │ │     │ │     ││
│  │             │ │ │  Card   │ │ │          │ │          │ │     │ │     ││
│  │             │ │ └─────────┘ │ │          │ │          │ │     │ │     ││
│  └─────────────┘ └─────────────┘ └──────────┘ └──────────┘ └─────┘ └─────┘│
│    OPCIONAL         ETAPA 0       CUSTOMIZAVEL  CUSTOMIZAVEL  FIXO   FIXO  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Card da Oportunidade:**
```
┌────────────────────────────────────────┐
│  Joao Silva - #001                     │
│  ────────────────────────────────────  │
│  📧 joao@email.com                     │  ← Campos conforme PRD-05
│  📱 (11) 99999-9999                    │    (personalizacao de cards)
│  💰 R$ 15.000,00                       │
│  ────────────────────────────────────  │
│  👤 Carlos (vendedor)     ⏰ 2 dias    │
│  [Lead] [📋 2 tarefas]                 │  ← Badge de qualificacao + tarefas
└────────────────────────────────────────┘
```

**Ao Clicar no Card - Modal de Detalhes:**
- Abre modal com TODAS informacoes dos campos preenchidos
- Exibe tarefas pendentes/concluidas da etapa atual
- Mostra historico de movimentacoes
- Permite editar campos conforme configuracao da pipeline

**Regras:**
- Drag & drop para mover entre etapas
- Atualizacao em tempo real via Supabase Realtime
- Cores das etapas configuraveis
- Contador de oportunidades por etapa
- Filtros por vendedor, tag, valor, data
- **Campos visiveis no card conforme configuracao PRD-05 (personalizacao de cards)**
- **Badge de qualificacao (Lead/MQL/SQL) conforme regras configuradas**
- **Badge de tarefas pendentes da etapa atual**

**Criterios de aceite:**
- [ ] Cards sao arrastaveirs entre etapas
- [ ] Mover card atualiza banco e notifica outros usuarios
- [ ] Member ve apenas seus cards
- [ ] Admin ve todos os cards
- [ ] Card exibe campos conforme personalizacao (PRD-05)
- [ ] Card exibe badge de qualificacao correto
- [ ] Card exibe contador de tarefas pendentes
- [ ] Clicar no card abre modal com todos os campos

---

### RF-02: Criacao de Pipeline

**Descricao:** Wizard para criar nova pipeline com nome e membros.

**Modal Inicial:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  +  Nova Pipeline                                                           │
│     Defina o nome e quem tera acesso                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Nome da Pipeline *                                                         │
│  [Ex: Vendas B2B, Pre-Vendas, Suporte...___________________]               │
│  Nome da pipeline (min. 3 caracteres)                                       │
│                                                                             │
│  Membros Atribuidos                                                         │
│  [Selecione os membros que terao acesso..._______________]                 │
│  Selecione quem tera acesso a essa pipeline. Voce pode adicionar mais      │
│  membros depois.                                                            │
│                                                                             │
│  [Cancelar]                              [+ Criar e Configurar]             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Regras de Visibilidade (CRITICO):**
- Members atribuidos visualizam APENAS:
  - Seus proprios cards/oportunidades
  - Seus proprios contatos (pessoas/empresas)
  - Seus proprios resultados/metricas
- Admin ve tudo de todos os members

**Criterios de aceite:**
- [ ] Pipeline criada com nome e membros
- [ ] Pipeline vazia tem 3 etapas padrao: Lead, Ganho, Perdido
- [ ] Apos criar, abre tela de configuracao com 6 abas
- [ ] Member atribuido so ve seus proprios dados

---

### RF-03: Configuracao de Pipeline (6 Abas)

**Descricao:** Tela completa de configuracao com 6 abas organizadas em 3 grupos.

**Interface:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Editar: Pipeline Vendas B2B  [Ativa toggle]         [Gerenciar Acesso] :  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CONFIGURACAO           │  [Conteudo da aba selecionada]                    │
│  ┌─────────────────┐   │                                                    │
│  │ @ Etapas      > │   │                                                    │
│  ├─────────────────┤   │                                                    │
│  │ ≡ Campos        │   │                                                    │
│  └─────────────────┘   │                                                    │
│                        │                                                    │
│  AUTOMACAO             │                                                    │
│  ┌─────────────────┐   │                                                    │
│  │ ↻ Distribuicao  │   │                                                    │
│  ├─────────────────┤   │                                                    │
│  │ ⚡ Atividades   │   │                                                    │
│  └─────────────────┘   │                                                    │
│                        │                                                    │
│  QUALIFICACAO          │                                                    │
│  ┌─────────────────┐   │                                                    │
│  │ 👥 Qualificacao │   │                                                    │
│  ├─────────────────┤   │                                                    │
│  │ ☉ Motivos      │   │                                                    │
│  └─────────────────┘   │                                                    │
│                        │                                                    │
│  [Cancelar]            │                            [✓ Salvar Alteracoes]   │
│                        │                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Estrutura das Abas:**

| Grupo | Aba | Funcao |
|-------|-----|--------|
| CONFIGURACAO | Etapas | Gerenciar etapas do funil |
| CONFIGURACAO | Campos | Campos personalizados dos cards |
| AUTOMACAO | Distribuicao | Modo manual ou rodizio |
| AUTOMACAO | Atividades | Tarefas automaticas por etapa |
| QUALIFICACAO | Qualificacao | Regras de MQL |
| QUALIFICACAO | Motivos | Motivos de ganho/perda |

**Principio Arquitetural:**
Todas as abas seguem o mesmo padrao:
1. **Criar novo** → Cria configuracao global + vincula a esta pipeline
2. **Selecionar existente** → Vincula configuracao global existente

Isso permite reuso de configuracoes entre multiplas pipelines.

---

### RF-04: Aba Etapas

**Descricao:** Gerenciamento das etapas do funil de vendas.

**Interface:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚙ Etapas da Pipeline                                    [+ Nova Etapa]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 👥 Novos Negocios       [Sistema] [Etapa 0]                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ∧∨ Contato Realizado                                    [✎] [🗑]    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ∧∨ Visita Agendada                                      [✎] [🗑]    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ∧∨ Reserva                                              [✎] [🗑]    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ∧∨ Analise de credito                                   [✎] [🗑]    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ∧∨ Formalizacao Contrato                                [✎] [🗑]    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ☉ Ganho                 [Sistema]                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ✗ Perdido               [Sistema]                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Tipos de Etapas:**

| Etapa | Tipo | Comportamento |
|-------|------|---------------|
| **Novos Negocios** | entrada (Etapa 0) | Primeira etapa do funil, TODA oportunidade entra aqui. NAO pode ser removida/alterada |
| **Etapas Personalizadas** | normal | Usuario cria ou seleciona de templates globais |
| **Ganho** | ganho | Penultima posicao, NAO pode ser removida/alterada |
| **Perdido** | perda | Ultima posicao, NAO pode ser removida/alterada |

**REGRA CRITICA - Etapa "Novos Negocios" (Etapa 0):**

Esta e a etapa inicial OBRIGATORIA do funil. TODA oportunidade criada DEVE entrar nesta etapa, independente da origem:

| Origem da Oportunidade | Destino |
|------------------------|---------|
| Modal "Nova Oportunidade" | → Novos Negocios |
| Aceitar pre-oportunidade (WhatsApp) | → Novos Negocios |
| Webhook externo | → Novos Negocios |
| Formulario Meta Ads (Lead Ads) | → Novos Negocios |
| Importacao CSV | → Novos Negocios |
| API externa | → Novos Negocios |

**Configuracoes por Etapa:**
- Nome
- Cor
- Probabilidade (%) - usada para forecast
- Dias meta (tempo ideal na etapa)

**Criterios de aceite:**
- [ ] Etapa "Novos Negocios" e fixa e primeira do funil
- [ ] Etapas Ganho e Perdido sao fixas nas ultimas posicoes
- [ ] TODA oportunidade nova entra em "Novos Negocios"
- [ ] Etapas personalizadas podem ser criadas ou selecionadas de templates
- [ ] Drag & drop para reordenar (exceto fixas)
- [ ] Cada etapa pode ter cor, probabilidade e dias meta

---

### RF-05: Aba Campos

**Descricao:** Gerenciamento de campos personalizados que aparecem nos cards.

**Interface:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚙ Campos Personalizados                                                    │
│     Gerencie os campos que aparecem nos cards                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [+ Criar] [⚙ Gerenciar]  [Buscar campos...]  [Todos] [Contato] [Empresa]  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 👤 Nome                 [Sistema]                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 👤 E-mail               [Padrao] [Obrigatorio]                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 👤 Telefone             [Padrao] [Obrigatorio]                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🏢 Endereco             [Padrao]                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🏢 Nome da Empresa      [Sistema]                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🏢 Setor                [Padrao] [Obrigatorio]                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 👤 Cargo                [Personalizado]                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Tipos de Badges:**

| Badge | Descricao | Comportamento |
|-------|-----------|---------------|
| **Sistema** | Campos do sistema | NAO pode editar/remover (Nome, Nome da Empresa) |
| **Padrao** | Campos padrao | Pode configurar obrigatoriedade |
| **Obrigatorio** | Campo obrigatorio | Preenchimento exigido |
| **Personalizado** | Campo customizado | Criado pelo Admin, pode editar/remover |

**Modal de Criacao de Campo:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  +  Novo Campo Personalizado                                          X    │
│     Crie um campo global disponivel para todos os pipelines                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Tipo de Entidade                                                           │
│  [👤 Contato]  [🏢 Empresa]                                                 │
│                                                                             │
│  Nome do Campo *                                                            │
│  [Ex: Cargo, Data de Nascimento, LinkedIn________________]                 │
│                                                                             │
│  Identificador *                                     [Auto-gerar toggle]   │
│  [ex: cargo, data_nascimento, linkedin_______________] (disabled)          │
│  Usado internamente para identificar o campo (nao pode ser alterado depois)│
│                                                                             │
│  Tipo de Campo                                                              │
│  [T Texto     Campo de texto curto                          v]             │
│                                                                             │
│  Placeholder                                                                │
│  [Texto de exemplo exibido quando vazio__________________]                 │
│                                                                             │
│  Texto de Ajuda (?)                                                         │
│  [Instrucoes adicionais para preenchimento_______________]                 │
│                                                                             │
│  Campo Obrigatorio                                              [ toggle ] │
│  Exigir preenchimento                                                       │
│                                                                             │
│  Exibir no Card                                                 [ toggle ] │
│  Mostrar no card do Kanban                                                  │
│                                                                             │
│  [Cancelar]                                         [+ Criar Campo]        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Tipos de Campo Disponiveis:**
- Texto curto
- Texto longo (textarea)
- Numero
- Moeda
- Data
- Data/Hora
- Selecao unica (dropdown)
- Selecao multipla (tags)
- Checkbox
- URL
- Email
- Telefone

**Criterios de aceite:**
- [ ] Campos Sistema nao podem ser alterados
- [ ] Campos podem ser filtrados por entidade (Contato/Empresa)
- [ ] Novo campo cria globalmente + vincula a pipeline
- [ ] Toggle "Exibir no Card" controla visibilidade no Kanban

---

### RF-06: Aba Distribuicao

**Descricao:** Configuracao de como leads sao atribuidos aos vendedores.

**Modos Disponiveis:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ↻ Distribuicao de Leads                                                    │
│     Escolha como os leads serao atribuidos aos vendedores                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐        │
│  │         👥                   │  │         ↺                    │        │
│  │        Manual                │  │        Rodizio               │        │
│  │   Atribuicao manual         │  │   Distribuicao automatica    │  [✓]   │
│  └──────────────────────────────┘  └──────────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Modo Manual:**
- Admin ou Member atribui manualmente cada lead
- Sem automacao

**Modo Rodizio:**
- Distribuicao automatica sequencial entre membros ativos
- Configuracoes avancadas disponiveis

**Configuracoes do Rodizio:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚙ Configuracoes Avancadas                                                  │
│     Defina regras especificas para o rodizio automatico                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Apenas em Horario Especifico                                   [ toggle ] │
│  Distribuir leads apenas em horarios e dias especificos                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ⏰ Horario                           📅 Recorrencia                │   │
│  │  [09:00] as [18:00]                   [Dias uteis (Seg-Sex)    v]  │   │
│  │                                                                     │   │
│  │  ⏰ Resumo:  09:00 as 18:00  •  📅 Segunda, Terca, Quarta, ...     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Pular Vendedores Inativos                                      [ toggle ] │
│  Nao distribuir para vendedores marcados como inativos                      │
│                                                                             │
│  Fallback para Manual                                           [ toggle ] │
│  Se nao houver vendedores disponiveis, permitir atribuicao manual           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**SLA de Resposta:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⏰ SLA de Resposta                                                         │
│                                                                             │
│  Habilitar SLA de Resposta                                      [ toggle ] │
│  Redistribui automaticamente se vendedor nao mover de etapa no prazo        │
│                                                                             │
│  Tempo Limite                                                               │
│  Tempo para o vendedor mover o lead de etapa                   [30] min    │
│                                                                             │
│  Maximo de Redistribuicoes                                                  │
│  Quantas vezes o lead pode ser redistribuido                   [3] vezes   │
│                                                                             │
│  Apos atingir limite                                                        │
│  O que fazer quando o lead atingir o maximo de redistribuicoes              │
│  [👤 Manter com ultimo vendedor                                        v]  │
│                                                                             │
│  Opcoes:                                                                    │
│  - Manter com ultimo vendedor                                               │
│  - Retornar para Admin                                                      │
│  - Desatribuir lead                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Criterios de aceite:**
- [ ] Modo Manual permite atribuicao livre
- [ ] Modo Rodizio distribui sequencialmente
- [ ] SLA redistribui automaticamente apos timeout
- [ ] Configuracoes de horario respeitadas

---

### RF-07: Aba Atividades

**Descricao:** Tarefas automaticas criadas quando oportunidade entra em uma etapa.

**Interface:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚡ Automacao de Atividades                                                  │
│     Configure atividades automaticas por etapa da pipeline                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  + Adicionar Atividades por Etapa                                           │
│  Clique em uma etapa para criar atividade usando template ou manualmente    │
│                                                                             │
│  [+ Lead] [+ Contato Realizado] [+ Visita Agendada] [+ Reserva]            │
│  [+ Analise de credito] [+ Formalizacao Contrato] [+ Ganho] [+ Perdido]    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  > Lead               1 template                                     │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │    Contato Realizado  0 templates                                    │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │    Visita Agendada    0 templates                                    │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │    Reserva            0 templates                                    │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │    Analise de credito 0 templates                                    │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │    Formalizacao Cont. 0 templates                                    │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │    Ganho              0 templates                                    │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │    Perdido            0 templates                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Logica:**
- Ao clicar em etapa, abre modal para:
  - Criar nova tarefa (cria template global + vincula)
  - Selecionar template existente (vincula)
- Quando oportunidade entra na etapa, tarefas vinculadas sao criadas automaticamente
- Tarefas tem prazo relativo (ex: "2 dias apos entrada na etapa")

**Criterios de aceite:**
- [ ] Cada etapa pode ter N tarefas vinculadas
- [ ] Tarefas sao criadas automaticamente ao mover card
- [ ] Prazos calculados a partir da data de entrada

---

### RF-08: Aba Qualificacao

**Descricao:** Regras para qualificar leads automaticamente como MQL.

**Interface:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◎ Regras de Qualificacao                                                   │
│     Adicione regras para qualificar leads automaticamente como MQL          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Lista de regras selecionadas para esta pipeline]                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ✓ Lead com e-mail preenchido                                        │   │
│  │    [E-mail] Nao esta vazio                                           │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ✓ Lead com telefone valido                                          │   │
│  │    [Telefone] Contem 11 digitos                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [+ Adicionar Regra]                                                        │
│                                                                             │
│  ℹ As regras selecionadas serao aplicadas com logica E (AND). O lead sera  │
│    qualificado como MQL quando TODAS as regras forem atendidas.            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Modal de Adicionar Regra:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◎ Adicionar Regra de Qualificacao                                    X    │
│     Selecione uma regra existente ou crie uma nova regra global            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [+ Criar Nova Regra Global]                                                │
│                                                                             │
│  [Buscar regras...]                                                         │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ○ Lead com e-mail preenchido                                        │   │
│  │    [E-mail] Nao esta vazio                                           │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ○ Lead de campanha paga                                             │   │
│  │    [Origem] E igual a "Meta Ads"                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [Cancelar]                                              [⚙ Adicionar]     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Operadores Disponiveis:**
- E igual a
- Nao e igual a
- Contem
- Nao contem
- Comeca com
- Termina com
- Esta vazio
- Nao esta vazio
- Maior que
- Menor que
- Entre

**Logica:**
- Regras aplicadas com AND (todas devem ser verdadeiras)
- Quando todas regras = true, lead recebe badge **[MQL]**
- Avaliacao executada a cada atualizacao do lead

**Criterios de aceite:**
- [ ] Regras podem ser criadas ou selecionadas de templates
- [ ] Logica AND aplicada corretamente
- [ ] Badge MQL aparece no card quando qualificado

---

### RF-09: Aba Motivos

**Descricao:** Motivos obrigatorios para fechar oportunidade como Ganho ou Perdido.

**Interface:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◎ Motivos de Resultado                           [✓ 3 adicionados] [✗ 5] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Exigir motivo ao ganhar/perder lead                            [✓ toggle] │
│  Ao mover um lead para "Ganho" ou "Perdido", sera obrigatorio informar     │
│  o motivo.                                                                  │
│                                                                             │
│  ┌───────────────────────────────┐  ┌───────────────────────────────┐     │
│  │ ✓ Motivos de Ganho            │  │ ✗ Motivos de Perda            │     │
│  │   3 motivos adicionados       │  │   5 motivos adicionados       │     │
│  │                               │  │                               │     │
│  │   • Preco competitivo         │  │   • Preco alto                │     │
│  │   • Qualidade do produto      │  │   • Perdeu para concorrente   │     │
│  │   • Atendimento               │  │   • Sem orcamento             │     │
│  │                               │  │   • Timing inadequado         │     │
│  │   [+ Adicionar]               │  │   • Nao respondeu             │     │
│  │                               │  │                               │     │
│  │                               │  │   [+ Adicionar]               │     │
│  └───────────────────────────────┘  └───────────────────────────────┘     │
│                                                                             │
│  ℹ Motivos sao gerenciados globalmente e ajudam a identificar padroes de   │
│    ganho/perda entre todas as pipelines.                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**REGRA CRITICA - Acionamento de Motivos:**

Quando o usuario mover um card para etapa **Ganho** ou **Perdido**, o sistema DEVE:

1. Interceptar a acao de drag & drop
2. Abrir modal de fechamento ANTES de mover
3. Exibir APENAS os motivos do tipo correspondente:
   - Moveu para Ganho → Lista motivos de ganho vinculados a esta pipeline
   - Moveu para Perdido → Lista motivos de perda vinculados a esta pipeline
4. Exigir selecao de motivo (se toggle ativo)
5. Registrar motivo na oportunidade
6. Concluir a movimentacao

**Modal de Fechamento (Ganho):**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ✓ Fechar como Ganho                                                   X   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Parabens! Selecione o motivo do ganho:                                     │
│                                                                             │
│  ○ Preco competitivo                                                        │
│  ○ Qualidade do produto                                                     │
│  ○ Atendimento                                                              │
│                                                                             │
│  Observacoes (opcional)                                                     │
│  [________________________________________________________]                │
│                                                                             │
│  [Cancelar]                                    [✓ Confirmar Ganho]         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Modal de Fechamento (Perdido):**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ✗ Fechar como Perdido                                                 X   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Selecione o motivo da perda:                                               │
│                                                                             │
│  ○ Preco alto                                                               │
│  ○ Perdeu para concorrente                                                  │
│  ○ Sem orcamento                                                            │
│  ○ Timing inadequado                                                        │
│  ○ Nao respondeu                                                            │
│                                                                             │
│  Observacoes (opcional)                                                     │
│  [________________________________________________________]                │
│                                                                             │
│  [Cancelar]                                    [✗ Confirmar Perda]         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Logica:**
- Motivos sao globais (criados em Configuracoes > Motivos)
- Cada pipeline seleciona quais motivos usar
- Quando toggle ativo, usuario DEVE selecionar motivo ao mover para Ganho/Perdido
- Modal de fechamento exibe apenas motivos do tipo correspondente VINCULADOS A ESTA PIPELINE
- Se cancelar modal, card volta para posicao original

**Criterios de aceite:**
- [ ] Toggle controla obrigatoriedade do motivo
- [ ] Motivos separados por tipo (ganho/perda)
- [ ] Ao mover para Ganho, modal exibe APENAS motivos de ganho da pipeline
- [ ] Ao mover para Perdido, modal exibe APENAS motivos de perda da pipeline
- [ ] Cancelar modal cancela a movimentacao
- [ ] Historico registra motivo selecionado
- [ ] Oportunidade.motivo_id e preenchido corretamente

---

### RF-10: Criacao de Oportunidade

**Descricao:** Modal para criar nova oportunidade manualmente.

**Titulo Automatico:**
O titulo da oportunidade e gerado automaticamente no formato:
```
[Nome do Contato] - #[Sequencia]
```
Exemplo: "Joao Silva - #001", "Maria Santos - #002"

**Modal de Criacao (3 Secoes):**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  +  Nova Oportunidade                                                  X   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ── SECAO 1: CONTATO ──────────────────────────────────────────────────    │
│                                                                             │
│  Tipo de Contato                                                            │
│  [○ Pessoa]  [○ Empresa]                                                    │
│                                                                             │
│  [Buscar contato existente ou criar novo...]                               │
│                                                                             │
│  Nome *                          E-mail                                     │
│  [_________________________]     [_________________________]               │
│                                                                             │
│  Telefone *                      [Campos personalizados da pipeline...]    │
│  [_________________________]                                                │
│                                                                             │
│  ── SECAO 2: OPORTUNIDADE ─────────────────────────────────────────────    │
│                                                                             │
│  Valor da Oportunidade           Etapa Inicial                             │
│  [R$ 0,00_______________]        [Lead (padrao)_______________]            │
│                                                                             │
│  Responsavel                     Data de Fechamento Prevista               │
│  [Selecionar vendedor____]       [__/__/____]                              │
│                                                                             │
│  ── SECAO 3: PRODUTOS ─────────────────────────────────────────────────    │
│                                                                             │
│  [+ Adicionar Produto]                                                      │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │  Produto          │  Qtd  │  Preco Unit.  │  Total               │     │
│  ├───────────────────────────────────────────────────────────────────┤     │
│  │  Consultoria      │   2   │  R$ 5.000     │  R$ 10.000           │     │
│  │  Software Anual   │   1   │  R$ 12.000    │  R$ 12.000           │     │
│  ├───────────────────────────────────────────────────────────────────┤     │
│  │                                    TOTAL  │  R$ 22.000           │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  [Cancelar]                                  [+ Criar Oportunidade]        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Relacao Contato x Oportunidade:**
- 1 Contato pode ter N Oportunidades
- Cada oportunidade tem 1 contato vinculado
- Ao criar oportunidade para contato existente, dados sao reutilizados

**Criterios de aceite:**
- [ ] Titulo gerado automaticamente
- [ ] Busca de contato existente funciona
- [ ] Novo contato pode ser criado inline
- [ ] Produtos podem ser adicionados com calculo automatico
- [ ] Valor total atualiza em tempo real

---

### RF-11: Solicitacoes (Pre-Oportunidades WhatsApp)

**Descricao:** Leads vindos do WhatsApp que aguardam aceitacao para entrar no funil. Esta coluna NAO e uma etapa do funil, e uma area de triagem.

**IMPORTANTE:** A coluna "Solicitacoes" so aparece no Kanban quando:
- A pipeline tem conexao WhatsApp/WAHA configurada
- Existem pre-oportunidades pendentes

**Coluna Especial no Kanban:**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│  │ Solicitacoes│  │Novos Negocios│  │ Contato  │  │  Ganho   │  │ Perdido  ││
│  │  [📱 WA]    │  │  (Etapa 0)  │  │   (5)    │  │   (8)    │  │   (2)    ││
│  │    (5)      │  │    (12)     │  │          │  │          │  │          ││
│  ├─────────────┤  ├─────────────┤  ├──────────┤  ├──────────┤  ├──────────┤│
│  │ ┌─────────┐ │  │             │  │          │  │          │  │          ││
│  │ │ PreOpp  │ │  │             │  │          │  │          │  │          ││
│  │ │[📱 WA]  │ │  │             │  │          │  │          │  │          ││
│  │ │[✓] [✗]  │ │  │             │  │          │  │          │  │          ││
│  │ └─────────┘ │  │             │  │          │  │          │  │          ││
│  └─────────────┘  └─────────────┘  └──────────┘  └──────────┘  └──────────┘│
│    NAO E ETAPA       ETAPA 0         ETAPAS         FIXO         FIXO      │
│    (area triagem)   (entrada)     CUSTOMIZAVEIS                            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Card de Pre-Oportunidade (Solicitacao):**
```
┌────────────────────────────────────────┐
│  📱 +55 11 99999-9999                  │
│  ────────────────────────────────────  │
│  "Oi, vi o anuncio e quero saber..."  │
│  ────────────────────────────────────  │
│  Via: WhatsApp WAHA                    │
│  Ha 5 minutos                          │
│  ────────────────────────────────────  │
│  [📱 WhatsApp]                         │  ← Badge do WhatsApp
│  [✓ Aceitar]  [✗ Rejeitar]            │
└────────────────────────────────────────┘
```

**Fluxo:**
1. Mensagem chega no WhatsApp (WAHA)
2. Sistema cria pre_oportunidade com status "pendente"
3. Card aparece na coluna **Solicitacoes** com badge do WhatsApp
4. Vendedor clica em [✓ Aceitar]:
   - Sistema cria contato (se nao existe)
   - Sistema cria oportunidade na etapa **"Novos Negocios"** (Etapa 0)
   - Card some de Solicitacoes e aparece em Novos Negocios
5. Ou clica em [✗ Rejeitar]:
   - Sistema marca como rejeitado
   - Card some de Solicitacoes
   - Motivo de rejeicao opcional

**REGRA CRITICA - Destino ao Aceitar:**
Ao aceitar uma solicitacao, a oportunidade SEMPRE e criada na etapa **"Novos Negocios"** (Etapa 0), seguindo a regra de que toda oportunidade nova entra nesta etapa.

**Configuracao em Sessao WhatsApp:**
- Cada sessao WhatsApp tem uma pipeline destino configurada
- Pre-oportunidades vao para a pipeline configurada
- A coluna Solicitacoes so aparece se houver integracao ativa

**Criterios de aceite:**
- [ ] Coluna "Solicitacoes" so aparece se houver integracao WhatsApp
- [ ] Cards de solicitacao tem badge do WhatsApp
- [ ] Aceitar cria oportunidade em "Novos Negocios" (Etapa 0)
- [ ] Rejeitar remove da coluna com motivo opcional
- [ ] Solicitacoes NAO sao arrastaveirs para outras etapas (apenas Aceitar/Rejeitar)

---

### RF-12: Barra de Acoes do Kanban

**Descricao:** Barra de ferramentas acima do Kanban com busca, seletor de pipeline, metricas, filtros e periodo.

**Interface:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Q Buscar    Pipeline E2E Test Fields v    📊 Metricas    🔽 Filtros   📅 Periodo v  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Elementos da Barra:**

| Elemento | Tipo | Funcao |
|----------|------|--------|
| **Buscar** | Input texto | Busca por nome, telefone, email, valor nos cards |
| **Pipeline** | Dropdown | Seleciona qual pipeline exibir no Kanban |
| **Metricas** | Toggle button | Exibe/oculta painel de metricas acima do Kanban |
| **Filtros** | Popover | Abre popover com opcoes de filtro |
| **Periodo** | Dropdown | Filtra por data de criacao ou fechamento |

**Campo de Busca:**
- Busca em tempo real (debounce 300ms)
- Busca por: nome do contato, telefone, email, valor, titulo da oportunidade
- Filtra apenas cards visiveis no Kanban atual
- Highlight nos resultados encontrados

**Seletor de Pipeline:**
```
┌─────────────────────────────────────┐
│  Pipeline E2E Test Fields         v │
├─────────────────────────────────────┤
│  ○ Vendas B2B                       │
│  ● Pipeline E2E Test Fields         │
│  ○ Pre-Vendas                       │
│  ○ Suporte                          │
├─────────────────────────────────────┤
│  [+ Nova Pipeline]                  │
└─────────────────────────────────────┘
```

**Popover de Filtros:**
```
┌─────────────────────────────────────┐
│  🔽 Filtros                    [x]  │
├─────────────────────────────────────┤
│                                     │
│  Responsavel                        │
│  [Todos os vendedores          v]   │
│                                     │
│  Tags                               │
│  [Selecionar tags...           v]   │
│                                     │
│  Valor                              │
│  [R$ ____] ate [R$ ____]            │
│                                     │
│  Qualificacao                       │
│  [ ] Lead  [ ] MQL  [ ] SQL         │
│                                     │
│  Origem                             │
│  [Todas as origens             v]   │
│                                     │
│  [Limpar Filtros]    [Aplicar]      │
│                                     │
└─────────────────────────────────────┘
```

**Dropdown de Periodo:**
```
┌─────────────────────────────────────┐
│  📅 Periodo                    [x]  │
├─────────────────────────────────────┤
│                                     │
│  Filtrar por                        │
│  ○ Data de Criacao                  │
│  ○ Previsao de Fechamento           │
│                                     │
│  Periodo                            │
│  [Hoje                         v]   │
│  ┌─────────────────────────────┐    │
│  │ Hoje                        │    │
│  │ Ultimos 7 dias              │    │
│  │ Ultimos 30 dias             │    │
│  │ Este mes                    │    │
│  │ Mes passado                 │    │
│  │ Personalizado...            │    │
│  └─────────────────────────────┘    │
│                                     │
│  Personalizado:                     │
│  [__/__/____] ate [__/__/____]      │
│                                     │
│  [Limpar]            [Aplicar]      │
│                                     │
└─────────────────────────────────────┘
```

**Regras:**
- Busca e filtros sao aplicados SIMULTANEAMENTE (AND)
- Member ve apenas seus proprios dados nos filtros de "Responsavel"
- Admin ve todos os vendedores no filtro
- Filtros persistem durante a sessao (localStorage)
- Badge no botao Filtros indica quantidade de filtros ativos

**Criterios de aceite:**
- [ ] Campo de busca filtra cards em tempo real
- [ ] Seletor de pipeline alterna entre pipelines disponiveis
- [ ] Botao Metricas exibe/oculta painel de metricas
- [ ] Popover de filtros permite filtrar por responsavel, tags, valor, qualificacao, origem
- [ ] Dropdown de periodo permite filtrar por data de criacao ou fechamento
- [ ] Filtros sao aplicados com logica AND
- [ ] Badge indica quantidade de filtros ativos
- [ ] Member ve apenas seus dados no filtro de responsavel

---

### RF-13: Painel de Metricas

**Descricao:** Painel colapsavel exibindo metricas calculadas em tempo real baseadas nos cards FILTRADOS do Kanban.

**REGRA CRITICA:** As metricas DEVEM refletir APENAS os cards visiveis apos aplicar busca, filtros e periodo. Se nenhum filtro estiver ativo, reflete todos os cards da pipeline.

**Interface (Expandido):**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📊 METRICAS DA PIPELINE                                      [▲ Ocultar]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐│
│  │   Total   │  │  Abertas  │  │   Ganhas  │  │  Perdidas │  │ Em Novos  ││
│  │    35     │  │    25     │  │     8     │  │     2     │  │    12     ││
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘  └───────────┘│
│                                                                             │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐│
│  │Valor Total│  │Ticket Med.│  │ Conversao │  │Tempo Medio│  │ Forecast  ││
│  │R$ 450.000 │  │R$ 12.857  │  │   22.8%   │  │  15 dias  │  │R$ 120.000 ││
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘  └───────────┘│
│                                                                             │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐                               │
│  │Stagnadas  │  │ Vencendo  │  │  Atrasadas│                               │
│  │ 3 (>7d)   │  │ 5 (7 dias)│  │     2     │                               │
│  └───────────┘  └───────────┘  └───────────┘                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Metricas Disponiveis:**

| Metrica | Calculo | Descricao |
|---------|---------|-----------|
| **Total** | COUNT(*) | Total de oportunidades (filtradas) |
| **Abertas** | COUNT(status = 'aberta') | Oportunidades em andamento |
| **Ganhas** | COUNT(status = 'ganha') | Oportunidades fechadas como ganhas |
| **Perdidas** | COUNT(status = 'perdida') | Oportunidades fechadas como perdidas |
| **Em Novos Negocios** | COUNT(etapa = 'Novos Negocios') | Cards na etapa inicial |
| **Valor Total** | SUM(valor) | Soma dos valores de todas oportunidades |
| **Ticket Medio** | AVG(valor) | Media de valor por oportunidade |
| **Taxa de Conversao** | (Ganhas / Total) * 100 | Percentual de conversao |
| **Tempo Medio** | AVG(dias_no_funil) | Media de dias desde criacao |
| **Forecast** | SUM(valor * probabilidade_etapa) | Valor ponderado pela probabilidade |
| **Stagnadas** | COUNT(dias_na_etapa > 7) | Cards parados ha mais de 7 dias |
| **Vencendo** | COUNT(fechamento_previsto < hoje + 7d) | Previsao de fechamento em 7 dias |
| **Atrasadas** | COUNT(fechamento_previsto < hoje) | Fechamento previsto ja passou |

**Comportamento:**
- Painel inicia OCULTO por padrao
- Clicar em "Metricas" exibe o painel
- Clicar em "Ocultar" recolhe o painel
- Estado (aberto/fechado) persiste em localStorage
- Metricas atualizam automaticamente ao:
  - Mudar filtros
  - Mudar periodo
  - Alterar busca
  - Mover card entre etapas
  - Criar/editar/excluir oportunidade

**Calculo por Role:**
- **Admin:** Metricas de TODAS as oportunidades (respeitando filtros)
- **Member:** Metricas apenas das SUAS oportunidades (respeitando filtros)

**Indicadores Visuais:**
- Metricas positivas (Ganhas, Valor) em VERDE
- Metricas negativas (Perdidas, Atrasadas) em VERMELHO
- Metricas de alerta (Stagnadas, Vencendo) em AMARELO
- Metricas neutras em AZUL/CINZA

**Criterios de aceite:**
- [ ] Painel exibe metricas calculadas corretamente
- [ ] Metricas refletem APENAS cards visiveis (apos filtros)
- [ ] Toggle exibe/oculta o painel
- [ ] Estado do painel persiste em localStorage
- [ ] Member ve apenas metricas de suas oportunidades
- [ ] Admin ve metricas de todas oportunidades
- [ ] Metricas atualizam em tempo real ao mover cards
- [ ] Cores indicam natureza da metrica (positivo/negativo/alerta)
- [ ] Forecast calcula valor ponderado pela probabilidade da etapa

---

### RF-14: Modal de Detalhes da Oportunidade

**Descricao:** Modal completo que abre ao clicar em um card do Kanban, exibindo todos os detalhes da oportunidade com 4 areas principais: Header, Campos, Abas de Funcionalidades e Historico.

**Estrutura Geral:**
```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  HEADER: Nome da Oportunidade + Badge Qualificacao + Etapas Clicaveis                   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌───────────────────┐  ┌─────────────────────────────────────┐  ┌──────────────────┐  │
│  │                   │  │                                     │  │                  │  │
│  │  BLOCO 1          │  │  BLOCO 2                            │  │  BLOCO 3         │  │
│  │  Campos           │  │  Abas (5)                           │  │  Historico       │  │
│  │  Oportunidade +   │  │  - Anotacoes                        │  │                  │  │
│  │  Contato/Empresa  │  │  - Tarefas                          │  │  Timeline de     │  │
│  │                   │  │  - Documentos                       │  │  movimentacoes   │  │
│  │  [Engrenagem]     │  │  - E-mail                           │  │                  │  │
│  │  Show/Hide Fields │  │  - Agenda                           │  │                  │  │
│  │                   │  │                                     │  │                  │  │
│  └───────────────────┘  └─────────────────────────────────────┘  └──────────────────┘  │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

#### RF-14.1: Header do Modal

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  Joao Silva - #001                                [Lead]              [X]               │
│  ────────────────────────────────────────────────────────────────────────────────────── │
│  [Novos Negocios] → [Contato Realizado] → [Visita Agendada] → [Proposta] → [Ganho]    │
│       ●                    ○                     ○                ○          ○          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

**Elementos:**
- **Nome da Oportunidade:** Titulo gerado automaticamente (Nome do Contato + Sequencia)
- **Badge de Qualificacao:** [Lead], [MQL] ou [SQL] conforme regras da pipeline
- **Etapas Clicaveis:** Usuario pode clicar em qualquer etapa para mover a oportunidade
  - Etapa atual marcada com ● (preenchido)
  - Outras etapas com ○ (vazio)
  - Clicar em Ganho/Perdido abre modal de motivos (se configurado)

#### RF-14.2: Bloco 1 - Campos da Oportunidade e Contato

```
┌───────────────────────────────────────┐
│  OPORTUNIDADE              [⚙]       │
├───────────────────────────────────────┤
│                                       │
│  Valor Manual                         │
│  [R$ 15.000,00_______________]       │
│                                       │
│  Valor dos Produtos                   │
│  R$ 22.000,00 (somente leitura)      │
│                                       │
│  Responsavel                          │
│  [Carlos - Vendedor_________]         │
│                                       │
│  Previsao de Fechamento               │
│  [15/03/2026______________]          │
│                                       │
├───────────────────────────────────────┤
│  CONTATO (ou EMPRESA)                 │
├───────────────────────────────────────┤
│                                       │
│  Nome *                               │
│  [Joao Silva________________]         │
│                                       │
│  E-mail                               │
│  [joao@email.com____________]         │
│                                       │
│  Telefone *                           │
│  [(11) 99999-9999___________]         │
│                                       │
│  [Campos personalizados conforme      │
│   configuracao da pipeline...]        │
│                                       │
└───────────────────────────────────────┘
```

**Icone de Engrenagem [⚙] - Popover Show/Hide:**
```
┌─────────────────────────────────────┐
│  Campos Visiveis                    │
├─────────────────────────────────────┤
│  [✓] Valor Manual                   │
│  [✓] Valor dos Produtos             │
│  [✓] Responsavel                    │
│  [✓] Previsao de Fechamento         │
│  ─────────────────────────          │
│  [✓] Nome                           │
│  [✓] E-mail                         │
│  [ ] Telefone                       │
│  [✓] Endereco                       │
│  [ ] Campo Personalizado 1          │
└─────────────────────────────────────┘
```

**Regras:**
- Campos obrigatorios sempre visiveis (nao podem ser ocultados)
- Campos ocultos ainda existem, apenas nao aparecem na visualizacao
- Preferencia salva por usuario + oportunidade (localStorage ou banco)

#### RF-14.3: Bloco 2 - Abas de Funcionalidades

##### Aba 1: Anotacoes

```
┌─────────────────────────────────────────────────────────────────┐
│  [Anotacoes] [Tarefas] [Documentos] [E-mail] [Agenda]          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [+ Nova Anotacao]   [🎤 Gravar Audio]                          │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  📝 Texto                                  Hoje, 14:30    │  │
│  │  Cliente interessado no produto X, pediu para ligar       │  │
│  │  na proxima semana.                                       │  │
│  │  ─────────────────────────────────────────                │  │
│  │  Por: Carlos (vendedor)                      [✎] [🗑]    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  🎤 Audio (1:32)                          Ontem, 10:15    │  │
│  │  [▶ Play] ─────────────────────── 0:00 / 1:32            │  │
│  │  ─────────────────────────────────────────                │  │
│  │  Por: Carlos (vendedor)                      [✎] [🗑]    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Tipos de Anotacao:**
- **Texto:** Rich text com formatacao basica
- **Audio:** Gravacao de voz com player embutido

**Regras:**
- Ordenadas por data (mais recente primeiro)
- Cada anotacao mostra autor e data
- Apenas autor ou Admin pode editar/excluir

##### Aba 2: Tarefas (Atividades)

```
┌─────────────────────────────────────────────────────────────────┐
│  [Anotacoes] [Tarefas] [Documentos] [E-mail] [Agenda]          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [+ Nova Tarefa]                                                 │
│                                                                  │
│  ── TAREFAS DA ETAPA ATUAL ────────────────────────────────     │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  [ ] Ligar para cliente                   Vence: Amanha   │  │
│  │      Tarefa automatica da etapa "Contato Realizado"       │  │
│  │      [Automatica]                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  [✓] Enviar proposta por email           Concluida: Ontem │  │
│  │      [Automatica]                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ── TAREFAS GLOBAIS ───────────────────────────────────────     │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  [ ] Verificar credito do cliente         Vence: 20/02    │  │
│  │      Criada manualmente por Carlos                        │  │
│  │      [Manual]                                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Tipos de Tarefa:**
- **Automatica:** Criada quando oportunidade entra na etapa (via templates)
- **Manual/Global:** Criada manualmente pelo usuario

**Regras:**
- Tarefas automaticas da etapa atual aparecem primeiro
- Tarefas globais aparecem abaixo
- Checkbox marca como concluida
- Badge indica tipo [Automatica] ou [Manual]

##### Aba 3: Documentos

```
┌─────────────────────────────────────────────────────────────────┐
│  [Anotacoes] [Tarefas] [Documentos] [E-mail] [Agenda]          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [📎 Upload de Arquivo]                                         │
│                                                                  │
│  Arraste arquivos aqui ou clique para selecionar                │
│  Formatos aceitos: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, etc.   │
│                                                                  │
│  ── DOCUMENTOS ANEXADOS ───────────────────────────────────     │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  📄 Proposta_Comercial_v1.pdf          1.2 MB    Hoje     │  │
│  │      Por: Carlos                     [👁 Ver] [⬇ Baixar] [🗑]│
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  🖼 Foto_Produto.jpg                    850 KB   Ontem    │  │
│  │      Por: Maria                      [👁 Ver] [⬇ Baixar] [🗑]│
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Drag & drop para upload
- Preview de imagens e PDFs
- Download direto
- Armazenamento no Supabase Storage
- Limite de tamanho configuravel por tenant

##### Aba 4: E-mail

```
┌─────────────────────────────────────────────────────────────────┐
│  [Anotacoes] [Tarefas] [Documentos] [E-mail] [Agenda]          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ⚠ Para enviar e-mails, configure sua conexao de e-mail em     │
│     Configuracoes > Conexoes > E-mail Pessoal (PRD-05/PRD-08)  │
│     [Ir para Configuracoes]                                     │
│                                                                  │
│  ────────────────────────────────────────────────────────────   │
│                                                                  │
│  [✉ Novo E-mail]                                                │
│                                                                  │
│  Para: joao@email.com (do contato)                              │
│                                                                  │
│  Assunto: [Re: Proposta Comercial_______________]               │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  [Editor de texto rico com formatacao]                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [📎 Anexar]                              [Enviar E-mail]       │
│                                                                  │
│  ── HISTORICO DE E-MAILS ──────────────────────────────────     │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ✉ Proposta Comercial                    Enviado: Ontem   │  │
│  │    Para: joao@email.com                                   │  │
│  │    "Segue em anexo a proposta conforme solicitado..."     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**DEPENDENCIA CRITICA:**
- Requer conexao de e-mail configurada (PRD-05 Configuracoes > Conexoes > Email Pessoal)
- Se nao configurado, exibe aviso com link para configuracao
- Usa SMTP pessoal do usuario ou SMTP do tenant

**Funcionalidades:**
- Destinatario pre-preenchido com e-mail do contato
- Editor rich text
- Anexos de documentos
- Historico de e-mails enviados para esta oportunidade

##### Aba 5: Agenda

```
┌─────────────────────────────────────────────────────────────────┐
│  [Anotacoes] [Tarefas] [Documentos] [E-mail] [Agenda]          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [+ Agendar Reuniao]                                            │
│                                                                  │
│  ── PROXIMAS REUNIOES ─────────────────────────────────────     │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  📅 Visita ao Cliente                                     │  │
│  │     Amanha, 15/02/2026 as 10:00 - 11:00                  │  │
│  │     Local: Escritorio do cliente                         │  │
│  │     Status: [Agendada]                                   │  │
│  │                                                           │  │
│  │     [✓ Realizada] [✗ Nao Compareceu] [↻ Reagendar] [🗑]  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ── HISTORICO DE REUNIOES ─────────────────────────────────     │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  📅 Primeira Reuniao                    ✓ Realizada       │  │
│  │     10/02/2026 as 14:00                                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  📅 Follow-up                           ✗ Nao Compareceu  │  │
│  │     05/02/2026 as 09:00                                  │  │
│  │     Motivo: Cliente pediu remarcacao                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Modal de Nova Reuniao:**
```
┌─────────────────────────────────────────────────────────────────┐
│  📅 Agendar Reuniao                                        X   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Titulo da Reuniao *                                            │
│  [Visita ao cliente____________________]                        │
│                                                                  │
│  Data *                         Horario *                       │
│  [15/02/2026______]             [10:00] ate [11:00]             │
│                                                                  │
│  Local                                                           │
│  [Escritorio do cliente____________]                            │
│                                                                  │
│  Descricao                                                       │
│  [Reuniao para apresentar proposta final]                       │
│                                                                  │
│  Sincronizar com Google Calendar                    [ toggle ] │
│  (Requer conexao configurada em PRD-05/PRD-08)                  │
│                                                                  │
│  [Cancelar]                               [📅 Agendar]          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Status da Reuniao:**

| Status | Descricao | Acao |
|--------|-----------|------|
| **Agendada** | Reuniao futura | Pode marcar como Realizada, No-show ou Reagendar |
| **Realizada** | Reuniao aconteceu | Final, registrado no historico |
| **Nao Compareceu** | Cliente nao apareceu | Abre modal de motivo + opcao reagendar |
| **Cancelada** | Reuniao cancelada | Registra motivo |
| **Reagendada** | Foi remarcada | Nova reuniao criada, antiga marcada como reagendada |

**Modal de No-Show (Nao Compareceu):**
```
┌─────────────────────────────────────────────────────────────────┐
│  ✗ Marcar como Nao Compareceu                              X   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  O cliente nao compareceu a reuniao?                            │
│                                                                  │
│  Motivo do No-Show *                                            │
│  ○ Cliente pediu remarcacao                                     │
│  ○ Cliente nao atendeu/respondeu                                │
│  ○ Problema de agenda do cliente                                │
│  ○ Problema tecnico (video call)                                │
│  ○ Outro: [_________________________]                           │
│                                                                  │
│  ────────────────────────────────────────────────────────────   │
│                                                                  │
│  Deseja reagendar a reuniao?                                    │
│  [○ Sim, reagendar agora]  [○ Nao, apenas registrar]           │
│                                                                  │
│  ── SE "SIM, REAGENDAR" ────────────────────────────────────   │
│                                                                  │
│  Nova Data *                    Novo Horario *                  │
│  [__/__/____]                   [__:__] ate [__:__]             │
│                                                                  │
│  [Cancelar]                    [✗ Confirmar No-Show]            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Integracao Google Calendar:**
- Requer conexao configurada (PRD-05/PRD-08 Conexoes > Google Calendar)
- Se configurado, sincroniza automaticamente com agenda Google
- Alteracoes no CRM refletem no Google Calendar e vice-versa

#### RF-14.4: Bloco 3 - Historico (Timeline)

```
┌──────────────────────────────────────┐
│  HISTORICO                           │
├──────────────────────────────────────┤
│                                      │
│  Hoje                                │
│  ─────────────────────────────────   │
│                                      │
│  ● 14:30 - Anotacao adicionada       │
│    "Cliente interessado..."          │
│    Por: Carlos                       │
│                                      │
│  ● 14:25 - Reuniao agendada          │
│    Visita ao Cliente                 │
│    15/02/2026 as 10:00               │
│    Por: Carlos                       │
│                                      │
│  ● 14:20 - Tarefa concluida          │
│    Enviar proposta por email         │
│    Por: Carlos                       │
│                                      │
│  Ontem                               │
│  ─────────────────────────────────   │
│                                      │
│  ● 16:00 - Etapa alterada            │
│    Novos Negocios → Contato Real.    │
│    Por: Carlos                       │
│                                      │
│  ● 15:30 - Documento anexado         │
│    Proposta_Comercial_v1.pdf         │
│    Por: Carlos                       │
│                                      │
│  ● 10:00 - E-mail enviado            │
│    Assunto: Proposta Comercial       │
│    Para: joao@email.com              │
│    Por: Carlos                       │
│                                      │
│  15/01/2026                          │
│  ─────────────────────────────────   │
│                                      │
│  ● 09:00 - Oportunidade criada       │
│    Pipeline: Vendas B2B              │
│    Etapa: Novos Negocios             │
│    Por: Sistema (WhatsApp)           │
│                                      │
└──────────────────────────────────────┘
```

**Eventos Registrados no Historico:**

| Evento | Descricao | Dados Registrados |
|--------|-----------|-------------------|
| Oportunidade criada | Nova oportunidade | Pipeline, etapa, origem, criador |
| Etapa alterada | Moveu no Kanban | Etapa anterior → Nova etapa, usuario |
| Campo atualizado | Editou um campo | Campo, valor anterior → novo valor, usuario |
| Anotacao adicionada | Nova nota | Tipo (texto/audio), preview, usuario |
| Tarefa criada | Nova tarefa | Titulo, tipo (auto/manual), usuario |
| Tarefa concluida | Marcou como feita | Titulo, usuario |
| Documento anexado | Upload de arquivo | Nome do arquivo, tamanho, usuario |
| E-mail enviado | Enviou e-mail | Assunto, destinatario, usuario |
| Reuniao agendada | Nova reuniao | Titulo, data/hora, usuario |
| Reuniao realizada | Marcou realizada | Titulo, usuario |
| Reuniao no-show | Cliente nao veio | Titulo, motivo, usuario |
| Reuniao reagendada | Remarcou | Titulo, nova data, usuario |
| Responsavel alterado | Mudou vendedor | Anterior → Novo, usuario |
| Qualificacao alterada | Lead/MQL/SQL | Status anterior → novo |

**Regras do Historico:**
- Ordenado por data (mais recente primeiro)
- Agrupado por dia
- Scroll infinito ou paginacao
- Nao pode ser editado ou excluido (audit trail)
- Filtro opcional por tipo de evento

**Criterios de aceite RF-14:**
- [ ] Modal abre ao clicar em card do Kanban
- [ ] Header exibe nome, badge qualificacao e etapas clicaveis
- [ ] Clicar em etapa move a oportunidade (com modal de motivo se Ganho/Perdido)
- [ ] Bloco 1: Campos da oportunidade e contato editaveis
- [ ] Engrenagem abre popover de show/hide campos
- [ ] Aba Anotacoes: criar texto e audio, listar, editar, excluir
- [ ] Aba Tarefas: criar manual, listar automaticas e manuais, marcar concluida
- [ ] Aba Documentos: upload drag&drop, preview, download, excluir
- [ ] Aba E-mail: aviso se nao configurado, enviar, historico
- [ ] Aba Agenda: criar reuniao, marcar realizada/no-show, reagendar
- [ ] Modal de No-Show com motivos e opcao reagendar
- [ ] Bloco 3: Historico timeline com todos eventos
- [ ] Integracao Google Calendar (se configurado)

---

### RF-15: Funcionalidades Complementares

#### RF-15.1: Dropdown de Selecao de Pipeline

O dropdown de selecao de pipeline na barra de acoes deve exibir:

```
┌─────────────────────────────────────────────────────────────────┐
│  Pipeline Ativa                                            v    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Buscar pipeline...]                                           │
│                                                                  │
│  ── PIPELINES ATIVAS ─────────────────────────────────────      │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ○ Vendas B2B                              [✎] [📦]       │  │
│  │    12 oportunidades                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ● Pre-Vendas                              [✎] [📦]       │  │
│  │    5 oportunidades                                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ── PIPELINES ARQUIVADAS (2) ────────────────────────────────   │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ○ Pipeline Teste                          [↩] [🗑]        │  │
│  │    0 oportunidades (arquivada)                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  [+ Nova Pipeline]                                              │
│                                                                  │
│  Ativas: 2  •  Arquivadas: 1  •  Total: 3                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Icones de Acao por Pipeline:**

| Icone | Acao | Descricao |
|-------|------|-----------|
| [✎] | Editar | Abre modal de configuracao da pipeline (6 abas) |
| [📦] | Arquivar | Move pipeline para secao "Arquivadas" |
| [↩] | Desarquivar | Restaura pipeline arquivada para Ativas |
| [🗑] | Excluir | Remove pipeline (apenas se nao tiver oportunidades) |

**Regras:**
- Pipelines ativas aparecem primeiro, separadas das arquivadas
- Pipelines arquivadas ficam colapsadas por padrao (click para expandir)
- Contador de pipelines: Ativas / Arquivadas / Total
- Busca filtra pipelines pelo nome em tempo real
- Botao "+ Nova Pipeline" abre modal de criacao (RF-02)

---

#### RF-15.2: Toggle Produtos vs Manual para Valor

No modal de criacao de oportunidade (secao Oportunidade), o campo valor deve permitir escolha:

```
┌───────────────────────────────────────────────────────────────┐
│  OPORTUNIDADE                                                  │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  Valor da Oportunidade                                         │
│                                                                │
│  [⚪ Produtos] [● Manual]                                      │
│                                                                │
│  ── SE "PRODUTOS" ────────────────────────────────────────    │
│                                                                │
│  Produtos Vinculados                                           │
│  [Selecione produtos...________]                              │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Produto A                    x2      R$ 5.000,00      │   │
│  │  Produto B                    x1      R$ 3.000,00      │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│  Valor Total (calculado): R$ 13.000,00                        │
│                                                                │
│  ── SE "MANUAL" ─────────────────────────────────────────    │
│                                                                │
│  Valor Manual *                                                │
│  [R$ 15.000,00_________________________]                      │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

**Regras:**
- **Produtos:** Valor calculado automaticamente pela soma de `oportunidades_produtos`
- **Manual:** Valor digitado manualmente no campo `valor_estimado`
- Toggle salvo na oportunidade: campo `tipo_valor` ('produtos' ou 'manual')
- No modal de detalhes, exibir ambos valores (se produtos vinculados)

---

#### RF-15.3: Campos UTM na Criacao de Oportunidade

Na secao "Oportunidade" do modal de criacao, adicionar campos UTM:

```
┌───────────────────────────────────────────────────────────────┐
│  OPORTUNIDADE                                                  │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ...outros campos...                                           │
│                                                                │
│  ── RASTREAMENTO (opcional) ─────────────────────────────     │
│                                                                │
│  Fonte UTM                                                     │
│  [google, facebook, instagram, etc._________]                 │
│                                                                │
│  Campanha UTM                                                  │
│  [Nome da campanha________________________]                   │
│                                                                │
│  Midia UTM                                                     │
│  [cpc, organic, social, email, etc._________]                 │
│                                                                │
│  Termo UTM                                                     │
│  [Palavra-chave (opcional)________________]                   │
│                                                                │
│  Conteudo UTM                                                  │
│  [Variacao do anuncio (opcional)__________]                   │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

**Regras:**
- Campos UTM sao opcionais
- Preenchidos automaticamente quando lead vem de formulario com UTMs
- Exibidos no modal de detalhes da oportunidade
- Permitem filtrar oportunidades por origem de campanha

---

#### RF-15.4: Popover Filtrar Metricas

Na barra de acoes, adicionar botao "Filtrar Metricas" ao lado do toggle de exibicao:

```
┌───────────────────────────────────────────────────────────────┐
│  [Metricas ▼] [⚙ Filtrar]                                     │
├───────────────────────────────────────────────────────────────┤
│                                    │                          │
│                                    │  Metricas Visiveis       │
│                                    ├──────────────────────────┤
│                                    │                          │
│  (Painel de Metricas)             │  [✓] Total em Aberto     │
│                                    │  [✓] Quantidade          │
│                                    │  [✓] Ticket Medio        │
│                                    │  [ ] Taxa de Conversao   │
│                                    │  [✓] Ganhos (mes)        │
│                                    │  [ ] Perdidos (mes)      │
│                                    │  [✓] Valor Perdido       │
│                                    │                          │
│                                    │  ──────────────────────  │
│                                    │                          │
│                                    │  [Marcar Todos]          │
│                                    │  [Limpar]                │
│                                    │                          │
└───────────────────────────────────────────────────────────────┘
```

**Regras:**
- Preferencia salva por usuario + pipeline
- Metricas desmarcadas nao aparecem no painel
- Toggle "Metricas" colapsa/expande o painel inteiro
- Engrenagem "Filtrar" abre popover para escolher quais metricas exibir

---

#### RF-15.5: Popover de Tarefas no Card

Quando o card da oportunidade exibe badge de tarefas pendentes, ao clicar deve abrir popover:

```
┌─────────────────────────────────────────────────────────────────┐
│  Card: Joao Silva - #001                                        │
│  ┌────────────────────────┐                                     │
│  │ [2 Tarefas] ← clique   │                                     │
│  └────────────────────────┘                                     │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  📋 Tarefas Pendentes                              [X]      ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │                                                              ││
│  │  ┌────────────────────────────────────────────────────────┐ ││
│  │  │  [ ] Ligar para cliente            Vence: Amanha       │ ││
│  │  │      [Automatica]                                      │ ││
│  │  └────────────────────────────────────────────────────────┘ ││
│  │                                                              ││
│  │  ┌────────────────────────────────────────────────────────┐ ││
│  │  │  [ ] Enviar proposta               Vence: 20/02        │ ││
│  │  │      [Manual]                                          │ ││
│  │  └────────────────────────────────────────────────────────┘ ││
│  │                                                              ││
│  │  ─────────────────────────────────────────────────────────  ││
│  │                                                              ││
│  │  [Ver todas no modal]                                       ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Regras:**
- Popover exibe apenas tarefas pendentes (nao concluidas)
- Checkbox permite marcar como concluida sem abrir modal
- Badge indica tipo: [Automatica] ou [Manual]
- Link "Ver todas no modal" abre modal de detalhes na aba Tarefas
- Ao marcar tarefa concluida, badge do card atualiza em tempo real

---

#### RF-15.6: Engrenagem na Secao Contato (Modal Criacao)

No modal de criacao de oportunidade, a secao Contato deve ter icone de engrenagem:

```
┌───────────────────────────────────────────────────────────────┐
│  CONTATO                                             [⚙]     │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  Nome *                                                        │
│  [_____________________________]                              │
│                                                                │
│  E-mail                                                        │
│  [_____________________________]                              │
│                                                                │
│  Telefone *                                                    │
│  [_____________________________]                              │
│                                                                │
│  [+ Campos personalizados conforme engrenagem]                │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

**Popover da Engrenagem:**
```
┌─────────────────────────────────────┐
│  Campos Visiveis (Contato)          │
├─────────────────────────────────────┤
│  [✓] Nome *                         │
│  [✓] E-mail                         │
│  [✓] Telefone *                     │
│  [ ] CPF                            │
│  [ ] Data de Nascimento             │
│  [✓] Endereco                       │
│  [ ] Campo Personalizado 1          │
│  [ ] Campo Personalizado 2          │
│  ─────────────────────────          │
│  * Campos obrigatorios              │
└─────────────────────────────────────┘
```

**Regras:**
- Campos obrigatorios sempre visiveis (nao podem ser desmarcados)
- Campos opcionais podem ser ocultados para simplificar formulario
- Preferencia salva por usuario + pipeline
- Campos ocultos ainda podem ser preenchidos via "Mostrar todos"

---

**Criterios de aceite RF-15:**
- [ ] RF-15.1: Dropdown de pipeline com acoes de editar/arquivar/excluir
- [ ] RF-15.1: Contador de pipelines Ativas/Arquivadas/Total
- [ ] RF-15.2: Toggle Produtos vs Manual para valor da oportunidade
- [ ] RF-15.3: Campos UTM opcionais na criacao de oportunidade
- [ ] RF-15.4: Popover para filtrar quais metricas exibir
- [ ] RF-15.5: Popover de tarefas ao clicar no badge do card
- [ ] RF-15.6: Engrenagem na secao Contato do modal de criacao

---

## Requisitos Nao-Funcionais

### Performance

| Metrica | Target |
|---------|--------|
| Tempo de carregamento Kanban | < 1.5s |
| Tempo de drag & drop | < 300ms |
| Atualizacao real-time | < 500ms |
| Renderizacao de 100+ cards | < 2s |

### Seguranca

- RLS ativo em todas tabelas
- Member NUNCA pode ver dados de outros Members
- Audit log de todas movimentacoes de cards
- Validacao de permissao em cada operacao

### Escalabilidade

- Paginacao de cards por etapa
- Virtualizacao para pipelines com 500+ cards
- Indices otimizados para queries frequentes

---

## Modelo de Dados

### Tabelas Existentes (PRD-04)

Este modulo utiliza tabelas ja definidas no PRD-04:

| Tabela | Descricao |
|--------|-----------|
| `funis` | Pipelines |
| `etapas_funil` | Etapas vinculadas a cada funil |
| `oportunidades` | Negocios/oportunidades |
| `oportunidades_produtos` | Produtos vinculados |
| `contatos`, `contatos_pessoas`, `contatos_empresas` | Contatos |
| `campos_customizados`, `valores_campos_customizados` | Campos dinamicos |
| `motivos_resultado` | Motivos de ganho/perda |
| `regras_qualificacao` | Regras de MQL |
| `tarefas_templates` | Templates de tarefas |
| `etapas_templates` | Templates de etapas |

### Novas Tabelas

#### funis_membros

Vinculo entre Pipeline e Members com acesso.

```sql
CREATE TABLE funis_membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funil_id uuid NOT NULL REFERENCES funis(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  ativo boolean DEFAULT true,

  criado_em timestamptz NOT NULL DEFAULT now(),

  UNIQUE(funil_id, usuario_id)
);

CREATE INDEX idx_funis_membros_funil ON funis_membros(funil_id);
CREATE INDEX idx_funis_membros_usuario ON funis_membros(usuario_id);

ALTER TABLE funis_membros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON funis_membros
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

#### funis_campos

Vinculo entre Pipeline e Campos personalizados.

```sql
CREATE TABLE funis_campos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funil_id uuid NOT NULL REFERENCES funis(id) ON DELETE CASCADE,
  campo_id uuid NOT NULL REFERENCES campos_customizados(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  obrigatorio boolean DEFAULT false,
  visivel boolean DEFAULT true,
  exibir_card boolean DEFAULT false,
  ordem int DEFAULT 0,

  criado_em timestamptz NOT NULL DEFAULT now(),

  UNIQUE(funil_id, campo_id)
);

CREATE INDEX idx_funis_campos_funil ON funis_campos(funil_id);

ALTER TABLE funis_campos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON funis_campos
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

#### funis_regras_qualificacao

Vinculo entre Pipeline e Regras de Qualificacao.

```sql
CREATE TABLE funis_regras_qualificacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funil_id uuid NOT NULL REFERENCES funis(id) ON DELETE CASCADE,
  regra_id uuid NOT NULL REFERENCES regras_qualificacao(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  ativo boolean DEFAULT true,

  criado_em timestamptz NOT NULL DEFAULT now(),

  UNIQUE(funil_id, regra_id)
);

CREATE INDEX idx_funis_regras_funil ON funis_regras_qualificacao(funil_id);

ALTER TABLE funis_regras_qualificacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON funis_regras_qualificacao
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

#### funis_motivos

Vinculo entre Pipeline e Motivos de Resultado.

```sql
CREATE TABLE funis_motivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funil_id uuid NOT NULL REFERENCES funis(id) ON DELETE CASCADE,
  motivo_id uuid NOT NULL REFERENCES motivos_resultado(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  ativo boolean DEFAULT true,

  criado_em timestamptz NOT NULL DEFAULT now(),

  UNIQUE(funil_id, motivo_id)
);

CREATE INDEX idx_funis_motivos_funil ON funis_motivos(funil_id);

ALTER TABLE funis_motivos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON funis_motivos
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

#### etapas_tarefas

Vinculo entre Etapa e Templates de Tarefa.

```sql
CREATE TABLE etapas_tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etapa_id uuid NOT NULL REFERENCES etapas_funil(id) ON DELETE CASCADE,
  tarefa_template_id uuid NOT NULL REFERENCES tarefas_templates(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  ativo boolean DEFAULT true,
  ordem int DEFAULT 0,

  criado_em timestamptz NOT NULL DEFAULT now(),

  UNIQUE(etapa_id, tarefa_template_id)
);

CREATE INDEX idx_etapas_tarefas_etapa ON etapas_tarefas(etapa_id);

ALTER TABLE etapas_tarefas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON etapas_tarefas
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

#### configuracoes_distribuicao

Configuracao de distribuicao (rodizio) por Pipeline.

```sql
CREATE TABLE configuracoes_distribuicao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funil_id uuid NOT NULL UNIQUE REFERENCES funis(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  -- Modo
  modo varchar(20) NOT NULL DEFAULT 'manual', -- 'manual' ou 'rodizio'

  -- Horario especifico
  horario_especifico boolean DEFAULT false,
  horario_inicio time,
  horario_fim time,
  dias_semana int[] DEFAULT ARRAY[1,2,3,4,5], -- 0=domingo, 1=segunda, ...

  -- Opcoes
  pular_inativos boolean DEFAULT true,
  fallback_manual boolean DEFAULT true,

  -- SLA
  sla_ativo boolean DEFAULT false,
  sla_tempo_minutos int DEFAULT 30,
  sla_max_redistribuicoes int DEFAULT 3,
  sla_acao_limite varchar(30) DEFAULT 'manter_ultimo',
    -- 'manter_ultimo', 'retornar_admin', 'desatribuir'

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE configuracoes_distribuicao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON configuracoes_distribuicao
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

#### pre_oportunidades

Pre-oportunidades vindas do WhatsApp (Inbox).

```sql
CREATE TABLE pre_oportunidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  sessao_whatsapp_id uuid NOT NULL REFERENCES sessoes_whatsapp(id),

  -- Dados do contato WhatsApp
  phone_number varchar(20) NOT NULL,
  phone_name varchar(255),
  profile_picture_url text,

  -- Pipeline destino
  funil_destino_id uuid NOT NULL REFERENCES funis(id),

  -- Status
  status varchar(20) NOT NULL DEFAULT 'pendente',
    -- 'pendente', 'aceito', 'rejeitado'

  -- Se aceito
  oportunidade_id uuid REFERENCES oportunidades(id),

  -- Processamento
  processado_por uuid REFERENCES usuarios(id),
  processado_em timestamptz,
  motivo_rejeicao text,

  -- Dados da mensagem
  primeira_mensagem text,
  primeira_mensagem_em timestamptz,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz
);

CREATE INDEX idx_pre_opp_org_status ON pre_oportunidades(organizacao_id, status) WHERE deletado_em IS NULL;
CREATE INDEX idx_pre_opp_funil ON pre_oportunidades(funil_destino_id) WHERE status = 'pendente';

ALTER TABLE pre_oportunidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON pre_oportunidades
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

#### anotacoes_oportunidades

Anotacoes de texto e audio vinculadas a oportunidades.

```sql
CREATE TABLE anotacoes_oportunidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oportunidade_id uuid NOT NULL REFERENCES oportunidades(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),

  tipo varchar(20) NOT NULL DEFAULT 'texto', -- 'texto', 'audio'
  conteudo text, -- texto da anotacao
  audio_url text, -- URL do audio no storage
  audio_duracao_segundos int, -- duracao do audio

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz
);

CREATE INDEX idx_anotacoes_opp ON anotacoes_oportunidades(oportunidade_id) WHERE deletado_em IS NULL;

ALTER TABLE anotacoes_oportunidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON anotacoes_oportunidades
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

#### documentos_oportunidades

Documentos anexados a oportunidades.

```sql
CREATE TABLE documentos_oportunidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oportunidade_id uuid NOT NULL REFERENCES oportunidades(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),

  nome_arquivo varchar(255) NOT NULL,
  tipo_arquivo varchar(100), -- MIME type
  tamanho_bytes bigint,
  storage_path text NOT NULL, -- Caminho no Supabase Storage
  url_download text,

  criado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz
);

CREATE INDEX idx_documentos_opp ON documentos_oportunidades(oportunidade_id) WHERE deletado_em IS NULL;

ALTER TABLE documentos_oportunidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON documentos_oportunidades
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

#### emails_oportunidades

Emails enviados para contatos de oportunidades.

```sql
CREATE TABLE emails_oportunidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oportunidade_id uuid NOT NULL REFERENCES oportunidades(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),

  destinatario varchar(255) NOT NULL,
  assunto varchar(500),
  corpo text,
  anexos jsonb, -- [{nome, url, tamanho}]

  status varchar(20) NOT NULL DEFAULT 'enviado', -- 'enviado', 'falhou', 'rascunho'
  erro_mensagem text,

  enviado_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_emails_opp ON emails_oportunidades(oportunidade_id);

ALTER TABLE emails_oportunidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON emails_oportunidades
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

#### reunioes_oportunidades

Reunioes agendadas vinculadas a oportunidades.

```sql
CREATE TABLE reunioes_oportunidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oportunidade_id uuid NOT NULL REFERENCES oportunidades(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),

  titulo varchar(255) NOT NULL,
  descricao text,
  local varchar(500),

  data_inicio timestamptz NOT NULL,
  data_fim timestamptz NOT NULL,

  status varchar(20) NOT NULL DEFAULT 'agendada',
    -- 'agendada', 'realizada', 'nao_compareceu', 'cancelada', 'reagendada'

  motivo_noshow text,
  motivo_noshow_id uuid REFERENCES motivos_noshow(id),
  reuniao_reagendada_id uuid REFERENCES reunioes_oportunidades(id),

  -- Integracao Google Calendar
  google_event_id varchar(255),
  sincronizado_google boolean DEFAULT false,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz
);

CREATE INDEX idx_reunioes_opp ON reunioes_oportunidades(oportunidade_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_reunioes_data ON reunioes_oportunidades(data_inicio) WHERE deletado_em IS NULL;

ALTER TABLE reunioes_oportunidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON reunioes_oportunidades
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

#### motivos_noshow

Motivos pre-configurados para no-show em reunioes.

```sql
CREATE TABLE motivos_noshow (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  nome varchar(255) NOT NULL,
  ativo boolean DEFAULT true,
  ordem int DEFAULT 0,

  criado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz
);

CREATE INDEX idx_motivos_noshow_org ON motivos_noshow(organizacao_id) WHERE deletado_em IS NULL;

ALTER TABLE motivos_noshow ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON motivos_noshow
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### Alteracoes em Tabelas Existentes

```sql
-- Adicionar coluna em sessoes_whatsapp (PRD-08)
ALTER TABLE sessoes_whatsapp ADD COLUMN funil_destino_id uuid REFERENCES funis(id);

-- Adicionar coluna em funis para exigir motivo
ALTER TABLE funis ADD COLUMN exigir_motivo_resultado boolean DEFAULT true;

-- Expandir eventos suportados no audit_log para RF-14
-- acao: 'create', 'update', 'delete', 'move_stage', 'complete_task',
--       'send_email', 'schedule_meeting', 'meeting_realized', 'meeting_noshow',
--       'add_note', 'upload_document', 'change_owner', 'qualify'

-- RF-15.1: Arquivamento de pipelines
ALTER TABLE funis ADD COLUMN arquivado boolean DEFAULT false;
ALTER TABLE funis ADD COLUMN arquivado_em timestamptz;

-- RF-15.2: Toggle de valor (produtos vs manual)
ALTER TABLE oportunidades ADD COLUMN tipo_valor varchar(20) DEFAULT 'manual';
  -- 'manual' ou 'produtos'

-- RF-15.3: Campos UTM para rastreamento
ALTER TABLE oportunidades ADD COLUMN utm_source varchar(255);
ALTER TABLE oportunidades ADD COLUMN utm_campaign varchar(255);
ALTER TABLE oportunidades ADD COLUMN utm_medium varchar(255);
ALTER TABLE oportunidades ADD COLUMN utm_term varchar(255);
ALTER TABLE oportunidades ADD COLUMN utm_content varchar(255);
```

#### preferencias_metricas (Nova Tabela - RF-15.4)

Preferencias de metricas visiveis por usuario e pipeline.

```sql
CREATE TABLE preferencias_metricas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  funil_id uuid NOT NULL REFERENCES funis(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  metricas_visiveis text[] DEFAULT ARRAY[
    'total_aberto', 'quantidade', 'ticket_medio', 'ganhos_mes', 'valor_perdido'
  ],

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),

  UNIQUE(usuario_id, funil_id)
);

CREATE INDEX idx_pref_metricas_usuario ON preferencias_metricas(usuario_id);

ALTER TABLE preferencias_metricas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON preferencias_metricas
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### Diagrama de Relacionamentos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                          CONFIGURACOES GLOBAIS                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   campos     │  │   etapas     │  │   regras     │  │   motivos    │   │
│  │ customizados │  │  templates   │  │ qualificacao │  │  resultado   │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                 │                 │           │
│         │    VINCULOS     │                 │                 │           │
│         ↓                 ↓                 ↓                 ↓           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ funis_campos │  │ etapas_funil │  │funis_regras_ │  │ funis_motivos│   │
│  │              │  │              │  │ qualificacao │  │              │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                 │                 │           │
│         └────────────────┬┴─────────────────┴─────────────────┘           │
│                          │                                                 │
│                          ↓                                                 │
│                   ┌─────────────┐                                          │
│                   │    funis    │←─────── funis_membros ←── usuarios      │
│                   └──────┬──────┘                                          │
│                          │                                                 │
│         ┌────────────────┼────────────────┐                               │
│         ↓                ↓                ↓                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                        │
│  │ configuracoes│  │ etapas_funil│  │    pre_     │                        │
│  │ distribuicao │  │             │  │oportunidades│                        │
│  └─────────────┘  └──────┬──────┘  └──────┬──────┘                        │
│                          │                │                               │
│                          ↓                │                               │
│                   ┌─────────────┐         │                               │
│                   │etapas_tarefas│        │                               │
│                   └─────────────┘         │                               │
│                          │                │                               │
│                          ↓                ↓                               │
│                   ┌─────────────────────────┐                              │
│                   │      oportunidades      │←── contatos                  │
│                   └─────────────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Pipelines

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/v1/funis` | Listar pipelines do tenant |
| POST | `/api/v1/funis` | Criar pipeline |
| GET | `/api/v1/funis/:id` | Detalhes da pipeline |
| PUT | `/api/v1/funis/:id` | Atualizar pipeline |
| DELETE | `/api/v1/funis/:id` | Soft delete pipeline |
| GET | `/api/v1/funis/:id/kanban` | Dados do Kanban |

### Oportunidades

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/v1/oportunidades` | Listar oportunidades |
| POST | `/api/v1/oportunidades` | Criar oportunidade |
| GET | `/api/v1/oportunidades/:id` | Detalhes da oportunidade |
| PUT | `/api/v1/oportunidades/:id` | Atualizar oportunidade |
| DELETE | `/api/v1/oportunidades/:id` | Soft delete |
| PATCH | `/api/v1/oportunidades/:id/etapa` | Mover de etapa |
| PATCH | `/api/v1/oportunidades/:id/fechar` | Fechar (ganho/perda) |

### Pre-Oportunidades

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/v1/pre-oportunidades` | Listar pendentes |
| POST | `/api/v1/pre-oportunidades/:id/aceitar` | Aceitar e criar oportunidade |
| POST | `/api/v1/pre-oportunidades/:id/rejeitar` | Rejeitar |

### Configuracoes de Pipeline

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/v1/funis/:id/etapas` | Listar etapas |
| POST | `/api/v1/funis/:id/etapas` | Adicionar etapa |
| GET | `/api/v1/funis/:id/campos` | Listar campos vinculados |
| POST | `/api/v1/funis/:id/campos` | Vincular campo |
| GET | `/api/v1/funis/:id/distribuicao` | Config de distribuicao |
| PUT | `/api/v1/funis/:id/distribuicao` | Atualizar distribuicao |
| GET | `/api/v1/funis/:id/membros` | Listar membros |
| POST | `/api/v1/funis/:id/membros` | Adicionar membro |

---

## Integracao com Outros Modulos

### PRD-05: Configuracoes

- Campos customizados sao criados em Configuracoes e vinculados a pipelines
- Etapas templates sao criados em Configuracoes e vinculados a pipelines
- Tarefas templates sao criados em Configuracoes e vinculados a etapas
- Regras de qualificacao sao criadas em Configuracoes e vinculadas a pipelines
- Motivos de resultado sao criados em Configuracoes e vinculados a pipelines

### PRD-06: Contatos

- Oportunidades sao vinculadas a Contatos (1 contato : N oportunidades)
- Campos de contato aparecem no card da oportunidade
- Criar oportunidade pode criar contato inline

### PRD-08: Conexoes

- WhatsApp WAHA cria pre-oportunidades
- Sessao WhatsApp tem pipeline destino configurada
- Aceitar pre-oportunidade cria contato + oportunidade

### PRD-10: Tarefas

- Tarefas automaticas sao criadas por etapa
- Vinculo via `etapas_tarefas` + `tarefas_templates`
- Tarefas aparecem no detalhe da oportunidade

---

## Metricas de Sucesso

| Metrica | Baseline | Meta |
|---------|----------|------|
| Tempo medio primeiro contato | - | < 5 min |
| Taxa de conversao Lead → Ganho | - | > 15% |
| Tempo medio no funil | - | < 30 dias |
| Adocao do Kanban | - | > 90% usuarios |
| Pre-oportunidades aceitas | - | > 70% |

---

## Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| Performance com muitos cards | Media | Alto | Virtualizacao + paginacao |
| Conflito de drag & drop | Baixa | Medio | Optimistic UI + rollback |
| Member ve dados de outro | Critica | Alto | RLS + testes automatizados |
| Rodizio nao funciona | Media | Alto | Job scheduler + fallback manual |

---

## Fora do Escopo (v1)

- Multiplas pipelines em uma tela
- Forecast automatico
- IA para sugestao de proxima acao
- Gamificacao de vendedores
- Pipeline visual customizavel (cores de cards)

---

## Dependencias

| PRD | Dependencia | Tipo |
|-----|-------------|------|
| PRD-04 | Tabelas base | Requerido |
| PRD-05 | Configuracoes globais | Requerido |
| PRD-06 | Contatos | Requerido |
| PRD-08 | WhatsApp WAHA | Opcional |

---

## Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| Member vendo oportunidades de outros | Baixa | Critico | RLS rigoroso, filtro usuario_responsavel_id, testes automatizados |
| Performance com muitos cards | Media | Alto | Virtualizacao de lista, paginacao, lazy loading por etapa |
| Drag and drop quebrando em mobile | Media | Medio | Fallback com botoes de mover, testes em dispositivos reais |
| Distribuicao round-robin desbalanceada | Media | Medio | Algoritmo com peso por carga atual, logs de auditoria |
| Pre-oportunidades acumulando | Alta | Medio | SLA com alertas, dashboard de pendencias, notificacoes |
| Conflito de edicao simultanea | Media | Medio | Optimistic locking, Realtime updates, merge automatico |
| Perda de dados em movimento de etapa | Baixa | Alto | Transacao atomica, log de movimentacao, rollback disponivel |
| Webhook WhatsApp falhando | Media | Alto | Fila de retry, dead letter queue, monitoramento |

---

## Time to Value

### MVP (5 dias)

| Dia | Entrega |
|-----|---------|
| 1 | Kanban basico com etapas fixas e drag and drop |
| 2 | CRUD de oportunidades + modal de criacao |
| 3 | Configuracao de pipeline (Etapas + Campos) |
| 4 | Filtros basicos e busca |
| 5 | Pre-oportunidades do WhatsApp |

**Funcionalidades MVP:**
- Kanban funcional com drag and drop
- Etapas configuraveis por Admin
- Modal de criacao de oportunidade
- Filtro por periodo e busca
- Pre-oportunidades (aceitar/rejeitar)

### Versao 1.0 (+ 4 dias)

| Dia | Entrega |
|-----|---------|
| 6 | Distribuicao automatica (round-robin) |
| 7 | Tarefas automaticas por etapa |
| 8 | Modal de detalhes com 5 abas |
| 9 | Metricas do pipeline + Realtime |

**Funcionalidades V1.0:**
- Distribuicao automatica de leads
- Tarefas criadas ao mover etapa
- Modal completo com historico/timeline
- Painel de metricas responsivo
- Atualizacao em tempo real

### Versao 1.1 (+ 3 dias)

| Dia | Entrega |
|-----|---------|
| 10 | Qualificacao MQL automatica |
| 11 | Motivos de ganho/perda + relatorios |
| 12 | Emails/Reunioes integrados + Documentos |

**Funcionalidades V1.1:**
- Qualificacao automatica por regras
- Modal de motivos ao fechar
- Integracao email/calendario
- Upload de documentos

---

## Plano de Validacao

### Pre-Lancamento

| Item | Validacao | Responsavel |
|------|-----------|-------------|
| Teste de isolamento | Member ve apenas suas oportunidades | QA + Security |
| Teste de drag and drop | Funciona em desktop e mobile | QA |
| Teste de performance | 100+ cards sem lag | DevOps |
| Teste de distribuicao | Round-robin balanceado | QA |
| Teste de Realtime | Atualizacoes em < 1s | QA |

### Durante Lancamento

| Item | Validacao | Responsavel |
|------|-----------|-------------|
| Monitoramento de latencia | Drag and drop < 200ms | DevOps |
| Logs de movimentacao | Audit trail completo | Security |
| Alertas de SLA | Pre-oportunidades > 1h | DevOps |
| Erros de RLS | 0 vazamentos entre users | Security |

### Pos-Lancamento

| Item | Validacao | Frequencia |
|------|-----------|------------|
| NPS do modulo | Satisfacao dos vendedores | Mensal |
| Taxa de conversao | Comparar antes/depois | Semanal |
| Tempo medio de resposta | < 5 min para novos leads | Diario |
| Uso de filtros | Identificar padroes | Quinzenal |
| Performance queries | Slow queries do Kanban | Semanal |

---

## Checklist de Implementacao

### Backend

- [ ] Criar tabelas novas (migrations)
- [ ] Implementar RLS em todas tabelas
- [ ] Criar endpoints de Pipeline
- [ ] Criar endpoints de Oportunidade
- [ ] Criar endpoints de Pre-Oportunidade
- [ ] Implementar logica de rodizio
- [ ] Implementar SLA de resposta
- [ ] Implementar qualificacao MQL

### Backend - Modal de Detalhes (RF-14)

- [ ] Criar tabela anotacoes_oportunidades + RLS
- [ ] Criar tabela documentos_oportunidades + RLS
- [ ] Criar tabela emails_oportunidades + RLS
- [ ] Criar tabela reunioes_oportunidades + RLS
- [ ] Criar tabela motivos_noshow + RLS
- [ ] Endpoints CRUD anotacoes (texto e audio)
- [ ] Endpoints CRUD documentos (upload Supabase Storage)
- [ ] Endpoint envio de e-mail (integracao SMTP)
- [ ] Endpoints CRUD reunioes (com status no-show/reagendar)
- [ ] Endpoint integracao Google Calendar
- [ ] Endpoint historico/timeline da oportunidade
- [ ] Expandir audit_log com novos eventos

### Frontend

- [ ] Tela Kanban com drag & drop
- [ ] Modal de criacao de pipeline
- [ ] Tela de configuracao (6 abas)
- [ ] Modal de criacao de oportunidade
- [ ] Card de oportunidade
- [ ] Card de pre-oportunidade
- [ ] Barra de acoes (Buscar, Metricas, Filtros, Periodo)
- [ ] Campo de busca com debounce
- [ ] Seletor de pipeline (dropdown)
- [ ] Popover de filtros (responsavel, tags, valor, qualificacao, origem)
- [ ] Dropdown de periodo (data criacao, fechamento previsto, customizado)
- [ ] Painel de metricas colapsavel
- [ ] Metricas refletindo cards filtrados
- [ ] Realtime com Supabase

### Frontend - Modal de Detalhes (RF-14)

- [ ] Modal de detalhes da oportunidade (estrutura geral)
- [ ] Header com nome, badge qualificacao, etapas clicaveis
- [ ] Bloco 1: Campos da oportunidade e contato/empresa
- [ ] Popover show/hide campos (engrenagem)
- [ ] Aba Anotacoes: criar texto, gravar audio, listar, editar, excluir
- [ ] Aba Tarefas: criar manual, listar automaticas/manuais, marcar concluida
- [ ] Aba Documentos: upload drag&drop, preview, download, excluir
- [ ] Aba E-mail: aviso se nao configurado, enviar, anexar, historico
- [ ] Aba Agenda: criar reuniao, marcar realizada, no-show, reagendar
- [ ] Modal de No-Show com motivos e opcao reagendar
- [ ] Bloco 3: Historico timeline com todos eventos
- [ ] Integracao Google Calendar (se configurado)

### Backend - Funcionalidades Complementares (RF-15)

- [ ] Adicionar colunas `arquivado` e `arquivado_em` em funis
- [ ] Adicionar coluna `tipo_valor` em oportunidades
- [ ] Adicionar colunas UTM em oportunidades
- [ ] Criar tabela `preferencias_metricas` + RLS
- [ ] Endpoints de arquivar/desarquivar pipeline
- [ ] Endpoint de preferencias de metricas
- [ ] Endpoint de preferencias de campos do formulario

### Frontend - Funcionalidades Complementares (RF-15)

- [ ] Dropdown de selecao de pipeline com acoes (editar/arquivar/excluir)
- [ ] Contador de pipelines Ativas/Arquivadas/Total
- [ ] Toggle Produtos/Manual no modal de criacao de oportunidade
- [ ] Campos UTM no modal de criacao de oportunidade
- [ ] Popover Filtrar Metricas na barra de acoes
- [ ] Popover de Tarefas no click do badge do card
- [ ] Engrenagem na secao Contato do modal de criacao
- [ ] Persistencia de preferencias de usuario

### Integracao

- [ ] Webhook de WhatsApp para pre-oportunidades
- [ ] Supabase Realtime para atualizacoes
- [ ] Notificacoes de SLA

---

## Historico de Versoes

| Versao | Data | Autor | Mudancas |
|--------|------|-------|----------|
| v1.0 | 2026-02-01 | Arquiteto de Produto | Versao inicial completa |
| v1.1 | 2026-02-01 | Arquiteto de Produto | Regras criticas: "Solicitacoes" (triagem WhatsApp) vs "Novos Negocios" (Etapa 0), modal motivos, card badges |
| v1.2 | 2026-02-01 | Arquiteto de Produto | RF-12: Barra de Acoes (Buscar, Metricas toggle, Filtros, Periodo); RF-13: Painel de Metricas refletindo cards filtrados |
| v1.3 | 2026-02-01 | Arquiteto de Produto | RF-14: Modal de Detalhes da Oportunidade (Header com etapas clicaveis, Bloco Campos, 5 Abas funcionais, Historico/Timeline); Novas tabelas: anotacoes_oportunidades, documentos_oportunidades, emails_oportunidades, reunioes_oportunidades, motivos_noshow |
| v1.4 | 2026-02-02 | Arquiteto de Produto | RF-15: Funcionalidades Complementares (Dropdown pipeline com arquivar/editar, Toggle Produtos/Manual, Campos UTM, Popover Filtrar Metricas, Popover Tarefas no Card, Engrenagem Contato); Nova tabela: preferencias_metricas; Alteracoes em funis e oportunidades |
| v1.5 | 2026-02-03 | Arquiteto de Produto | Adicionadas secoes conforme prdpadrao.md: Hierarquia de Requisitos (Theme/Epic/5 Features), Riscos e Mitigacoes (8 riscos identificados), Time to Value (MVP 5 dias, V1.0 +4 dias, V1.1 +3 dias), Plano de Validacao (Pre/Durante/Pos-Lancamento) |
