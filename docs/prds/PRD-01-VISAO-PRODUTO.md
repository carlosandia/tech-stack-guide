# PRD-01: Visao do Produto - CRM Renove

| Campo | Valor |
|-------|-------|
| **Autor** | Arquiteto de Produto |
| **Data de criacao** | 2026-01-31 |
| **Ultima atualizacao** | 2026-02-03 |
| **Versao** | v1.2 |
| **Status** | Em desenvolvimento |
| **Stakeholders** | Product Owner, Tech Lead, Design Lead |
| **Revisor tecnico** | Tech Lead |

---

## Resumo Executivo

O **CRM Renove** e uma plataforma SaaS multi-tenant B2B que centraliza a gestao de relacionamento com clientes, integrando multiplos canais de marketing e vendas em uma interface unificada e intuitiva.

O produto resolve a dor de empresas que precisam gerenciar leads vindos de diferentes fontes (WhatsApp, Instagram, Meta Ads, formularios) sem a complexidade de CRMs tradicionais, oferecendo uma experiencia de usuario simplificada com atualizacoes em tempo real e automacoes que reduzem trabalho manual.

O impacto esperado e atingir 500-1000 tenants (organizacoes clientes) no primeiro ano, estabelecendo o CRM Renove como referencia em usabilidade e integracao multi-canal no mercado brasileiro de pequenas e medias empresas.

---

## Contexto e Motivacao

### Problema

**Dor do usuario:**
- CRMs tradicionais sao complexos e exigem muito tempo de configuracao
- Leads chegam por multiplos canais (WhatsApp, Instagram, Facebook) e se perdem
- Falta de visibilidade em tempo real sobre o pipeline de vendas
- Automacoes basicas exigem integracao com ferramentas externas (Zapier, Make)
- Interfaces desatualizadas que exigem refresh constante

**Impacto no negocio:**
- Perda de oportunidades por falta de acompanhamento
- Tempo desperdicado em tarefas manuais repetitivas
- Dificuldade em medir ROI de campanhas de marketing
- Equipe de vendas desmotivada com ferramentas ruins

**Evidencias:**
- Mercado de CRM brasileiro cresce 15% ao ano
- 67% das PMEs ainda usam planilhas para gestao de clientes
- Principais reclamacoes em reviews de CRMs: complexidade e falta de integracao

### Oportunidade de Mercado

**Tamanho do mercado:**
- Brasil: ~6 milhoes de PMEs ativas
- Mercado de CRM: R$ 2.5 bilhoes (2025)
- Segmento-alvo (PMEs com 5-50 funcionarios): ~500 mil empresas

**Tendencias relevantes:**
- Crescimento do WhatsApp Business como canal de vendas
- Meta Ads como principal fonte de leads para PMEs
- Demanda por integracao nativa (sem no-code externo)
- Preferencia por interfaces modernas e responsivas

**Analise competitiva:**

| Concorrente | Forca | Fraqueza | Diferencial Renove |
|-------------|-------|----------|-------------------|
| RD Station CRM | Integracao com RD Marketing | Interface datada, lento | UX moderna, real-time |
| Pipedrive | Pipeline visual | Caro, sem WhatsApp nativo | Preco competitivo, multi-canal |
| HubSpot | Completo | Complexo, em ingles | Simplicidade, PT-BR nativo |
| Moskit | WhatsApp | Interface basica | UX superior, automacoes |

### Alinhamento Estrategico

**Conexao com objetivos da empresa:**
- Estabelecer presenca no mercado de SaaS B2B
- Criar receita recorrente previsivel (MRR)
- Construir base de clientes para futuros produtos

**Impacto em metricas:**
- Receita: Meta de R$ 500k MRR em 12 meses
- Retencao: Target de 90% de retencao mensal
- NPS: Meta de NPS > 50

---

## Usuarios e Personas

### Persona Primaria: Admin (Gerente/Dono)

```
Nome: Marina Silva
Role: Gerente Comercial / Dona de agencia
Contexto: Gerencia equipe de 3-10 vendedores, precisa de visibilidade do pipeline

Dores:
- Nao sabe em tempo real como esta o funil de vendas
- Perde tempo cobrando atualizacoes da equipe
- Leads do Instagram e WhatsApp se perdem em conversas pessoais
- Precisa exportar dados manualmente para relatorios

Objetivos:
- Ter visao consolidada de todas oportunidades
- Automatizar tarefas repetitivas
- Integrar todos os canais em um lugar so
- Tomar decisoes baseadas em dados

Citacao representativa:
"Eu preciso saber o que ta acontecendo sem ter que perguntar pra todo mundo."
```

### Persona Secundaria: Member (Vendedor)

```
Nome: Carlos Santos
Role: Vendedor / SDR
Contexto: Atende leads diariamente, precisa de agilidade

Dores:
- CRM atual e lento e trava
- Precisa alternar entre WhatsApp, email e CRM
- Esquece de fazer follow-up
- Sistema nao avisa quando lead responde

Objetivos:
- Responder leads rapidamente
- Ter lembretes automaticos de tarefas
- Ver historico completo do cliente em um lugar
- Fechar mais negocios com menos esforco

Citacao representativa:
"Quanto menos clique pra fazer uma coisa, melhor."
```

### Persona Terciaria: Super Admin (Operador da Plataforma)

```
Nome: Equipe Renove
Role: Administrador do SaaS
Contexto: Gerencia a plataforma, cria tenants, monitora saude

Dores:
- Precisa criar tenants manualmente
- Dificuldade em identificar problemas por tenant
- Falta de metricas consolidadas

Objetivos:
- Criar e gerenciar organizacoes facilmente
- Configurar integracoes globais (Meta, Google)
- Monitorar uso e saude da plataforma
- Identificar e resolver problemas rapidamente

Citacao representativa:
"Preciso ter controle total sem acessar o banco direto."
```

### Anti-Personas

- **Empresas Enterprise (500+ funcionarios):** Produto nao e para grandes corporacoes
- **Usuarios tecnicos avancados:** Nao oferecemos API aberta para customizacao profunda
- **Empresas B2C de alto volume:** Foco e B2B com vendas consultivas

---

## Diferenciais Competitivos

### 1. UX/UI Moderna e Intuitiva

**O que e:**
Interface limpa, moderna, inspirada em produtos consumer-grade (Notion, Linear).

**Por que importa:**
Usuarios de PME nao tem tempo para treinamento extensivo.

**Como entrega:**
- Onboarding guiado em 5 minutos
- Zero refresh - atualizacoes em tempo real via WebSocket
- Drag-and-drop no Kanban
- Design system consistente (shadcn/ui)

### 2. Multi-Canal Nativo

**O que e:**
Integracao direta com WhatsApp, Instagram Direct, Meta Ads, Google Calendar, Email.

**Por que importa:**
Leads chegam por multiplos canais e se perdem.

**Como entrega:**
- WhatsApp via WAHA (com plano de migracao)
- Instagram Direct via Meta Graph API
- Meta Lead Ads com mapeamento de campos
- Google Calendar para agendamentos
- SMTP para email pessoal

### 3. Automacoes Sem Codigo

**O que e:**
Motor de automacao interno com gatilhos, condicoes e acoes.

**Por que importa:**
Elimina dependencia de Zapier/Make.

**Como entrega:**
- Gatilhos: lead criado, etapa mudou, tarefa venceu
- Condicoes: campo igual a, contem, maior que
- Acoes: criar tarefa, enviar mensagem, mover etapa, notificar

### 4. Tempo Real (Real-Time)

**O que e:**
Todas mudancas refletem instantaneamente na UI.

**Por que importa:**
Usuarios odeiam dar F5 e esperar carregamento.

**Como entrega:**
- Supabase Realtime para subscriptions
- Optimistic updates no frontend
- TanStack Query para cache inteligente

---

## Fluxo de Inicializacao do Sistema (CRITICO)

O CRM Renove segue uma hierarquia estrita de inicializacao. Este fluxo e **imutavel** e define como o sistema e provisionado do zero ate estar operacional.

### Diagrama do Fluxo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUXO DE INICIALIZACAO                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FASE 1: SUPER ADMIN (Plataforma)                                           │
│  ─────────────────────────────────                                          │
│  1. Super Admin acessa painel administrativo                                │
│  2. Cria nova organizacao (tenant) via wizard 3 etapas:                     │
│     - Etapa 1: Dados da empresa                                             │
│     - Etapa 2: Expectativas (volume, objetivos)                             │
│     - Etapa 3: Dados do primeiro Admin                                      │
│  3. Sistema cria tenant com plano inicial (Trial ou definido)               │
│  4. Sistema ativa modulos conforme plano                                    │
│  5. Admin recebe email de boas-vindas com credenciais                       │
│                                                                             │
│                              ↓                                              │
│                                                                             │
│  FASE 2: ADMIN (Configuracao do Tenant)                                     │
│  ──────────────────────────────────────                                     │
│  1. Admin faz primeiro login no CRM                                         │
│  2. Onboarding guiado apresenta o sistema                                   │
│  3. Admin DEVE configurar antes de operar:                                  │
│     a) Campos personalizados (Contatos, Oportunidades)                      │
│     b) Produtos e categorias                                                │
│     c) Motivos de ganho/perda                                               │
│     d) Templates de tarefas                                                 │
│     e) Templates de etapas                                                  │
│     f) Regras de qualificacao (MQL)                                         │
│  4. Admin cria a primeira Pipeline:                                         │
│     - Seleciona etapas (dos templates ou cria novas)                        │
│     - Vincula tarefas automaticas por etapa                                 │
│     - Configura distribuicao de leads                                       │
│  5. Admin conecta integracoes (WhatsApp, Meta, Google)                      │
│  6. Admin cria Members (vendedores) e atribui perfis                        │
│                                                                             │
│                              ↓                                              │
│                                                                             │
│  FASE 3: MEMBER (Operacao Diaria)                                           │
│  ────────────────────────────────                                           │
│  1. Member recebe convite por email                                         │
│  2. Member faz primeiro login                                               │
│  3. Member ve apenas pipelines atribuidos                                   │
│  4. Member opera:                                                           │
│     - Gerencia oportunidades no Kanban                                      │
│     - Executa tarefas                                                       │
│     - Envia mensagens (WhatsApp, Email)                                     │
│     - Registra atividades                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Regras de Dependencia

| Acao | Requer | Responsavel |
|------|--------|-------------|
| Criar organizacao | - | Super Admin |
| Criar Admin | Organizacao existir | Super Admin |
| Configurar campos | Ser Admin | Admin |
| Criar pipeline | Ter etapas configuradas | Admin |
| Criar Member | Ser Admin | Admin |
| Atribuir Member a pipeline | Pipeline existir | Admin |
| Operar no CRM | Estar atribuido a pipeline | Member |

### Checklist de Primeiro Acesso (Admin)

Quando um Admin faz primeiro login, o sistema deve guia-lo por:

- [ ] Boas-vindas e tour do sistema
- [ ] Configurar campos personalizados (minimo: origem do lead)
- [ ] Criar pelo menos 1 produto
- [ ] Criar primeira pipeline com etapas
- [ ] Conectar pelo menos 1 canal (WhatsApp ou Email)
- [ ] Criar primeiro Member (opcional, pode operar sozinho)

**O Admin so consegue criar oportunidades apos ter pelo menos 1 pipeline configurada.**

---

## Hierarquia de Requisitos

### Theme (Objetivo Estrategico)

> Construir o CRM mais facil de usar do mercado brasileiro, integrando marketing e vendas em uma plataforma unificada.

### Epic 1: Fundacao Multi-Tenant

> Criar arquitetura escalavel para 1000+ organizacoes com isolamento total de dados.

**Features:**
- Isolamento por organizacao_id em todas tabelas
- Row Level Security (RLS) ativo
- Sistema de roles (Super Admin, Admin, Member)
- Perfis de permissao configuraveis

### Epic 2: Gestao de Contatos

> Permitir cadastro e gestao de pessoas e empresas com campos customizaveis.

**Features:**
- CRUD de pessoas e empresas
- Campos do sistema (Nome, Email, Telefone) bloqueados
- Campos personalizados por tenant
- Vinculo pessoa-empresa
- Status de qualificacao (Lead, MQL, SQL)

### Epic 3: Pipeline de Vendas

> Visualizar e gerenciar oportunidades em formato Kanban com etapas customizaveis.

**Features:**
- Funis multiplos por tenant
- Etapas arrastaveis (drag-and-drop)
- Cards de oportunidade personalizaveis
- Etapas obrigatorias (Novos Negocios, Ganho, Perda)
- Vinculo oportunidade-contato (1:N)

### Epic 4: Integracoes

> Conectar canais de marketing e comunicacao ao CRM.

**Features:**
- WhatsApp (WAHA)
- Instagram Direct
- Meta Lead Ads
- Google Calendar
- Email SMTP
- Webhooks entrada/saida

### Epic 5: Automacoes

> Automatizar tarefas repetitivas baseadas em eventos.

**Features:**
- Motor de regras (gatilho + condicao + acao)
- Tarefas automaticas por etapa
- Notificacoes configuraveis
- Cadencias de follow-up

---

## Requisitos Nao-Funcionais

### Performance

| Metrica | Target |
|---------|--------|
| Tempo de carregamento inicial | < 3s |
| Tempo de resposta API (P95) | < 200ms |
| Tempo de atualizacao real-time | < 500ms |
| Uptime | 99.5% |

### Seguranca

- Autenticacao JWT com refresh token
- RLS em todas tabelas com organizacao_id
- Criptografia de senhas (bcrypt)
- HTTPS obrigatorio
- Rate limiting por tenant
- Audit log de todas acoes

### Usabilidade

- Interface 100% em PT-BR
- Responsivo (desktop-first, mobile-friendly)
- Acessibilidade WCAG 2.1 AA
- Onboarding guiado para novos usuarios

### Sistema/Ambiente

- Navegadores: Chrome, Firefox, Safari, Edge (ultimas 2 versoes)
- Dispositivos: Desktop (1280px+), Tablet (768px+)
- Mobile: Suporte basico (nao e foco v1)

---

## Metricas de Sucesso

### KPIs Primarios

| Metrica | Baseline | Meta 6 meses | Meta 12 meses |
|---------|----------|--------------|---------------|
| Tenants ativos | 0 | 200 | 500-1000 |
| MRR | R$ 0 | R$ 150k | R$ 500k |
| Churn mensal | - | < 5% | < 3% |

### KPIs Secundarios

| Metrica | Meta |
|---------|------|
| NPS | > 50 |
| Tempo medio de onboarding | < 15 min |
| Tickets de suporte/tenant/mes | < 2 |
| DAU/MAU ratio | > 40% |

---

## Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| WAHA descontinuado | Media | Alto | Arquitetura com adapter pattern, plano de migracao |
| Meta muda API | Alta | Medio | Monitorar changelog, testes automatizados |
| Performance com volume | Media | Alto | Indices compostos, paginacao, caching |
| Concorrente copia features | Alta | Baixo | Foco em UX como diferencial dificil de copiar |

---

## Escopo

### O que ESTA no escopo (v1)

- Arquitetura multi-tenant com isolamento total (RLS)
- Sistema de roles (Super Admin, Admin, Member)
- Gestao de contatos (Pessoas e Empresas)
- Pipeline de vendas (Kanban drag-and-drop)
- Integracoes: WhatsApp (WAHA), Meta Lead Ads, Instagram Direct, Google Calendar, Email SMTP
- Tarefas e atividades com lembretes
- Distribuicao automatica de leads (rodizio)
- Qualificacao de leads (Lead, MQL, SQL)
- Dashboard basico com metricas
- Real-time updates via Supabase Realtime
- Interface 100% PT-BR

### O que NAO esta no escopo (v1)

- App mobile nativo (PWA responsivo apenas)
- API publica para desenvolvedores externos
- Marketplace de integracoes de terceiros
- Multi-idioma (somente PT-BR)
- White-label para revenda
- IA/ML para scoring automatico
- Automacoes avancadas com builder visual
- Relatorios customizaveis

### Escopo Futuro (v2+)

- Automacoes com builder visual no-code
- Conversions API (CAPI) Meta completo
- Custom Audiences Meta Ads
- Relatorios e dashboards customizaveis
- Webhooks de entrada e saida
- Integracao com mais canais (Telegram, etc)
- App mobile nativo (iOS/Android)

---

## Suposicoes, Dependencias e Restricoes

### Suposicoes

| Suposicao | Justificativa |
|-----------|---------------|
| Usuarios tem WhatsApp Business ou numero pessoal | WAHA suporta ambos os tipos de conta |
| PMEs tem computador com internet estavel | CRM e desktop-first, responsivo para tablet |
| Usuarios entendem conceito de funil/pipeline | Mercado brasileiro ja conhece CRMs basicos |
| Meta/Google OAuth esta disponivel no Brasil | APIs acessiveis sem restricao geografica |
| Supabase mantem servico estavel (99.9% uptime) | Dependencia critica do sistema |
| Equipe de vendas tem 2-15 pessoas por tenant | Escala ideal para arquitetura v1 |
| WAHA Plus permanece funcional | Risco mitigado com adapter pattern |

### Dependencias Internas

| Dependencia | Tipo | Risco |
|-------------|------|-------|
| PRD-02-MULTI-TENANT | Pre-requisito | Baixo |
| PRD-03-AUTENTICACAO | Pre-requisito | Baixo |
| PRD-04-DATABASE-SCHEMA | Pre-requisito | Baixo |

### Dependencias Externas

| Dependencia | Responsavel | Status | Risco |
|-------------|-------------|--------|-------|
| Supabase (Auth, Database, Realtime) | Supabase Inc | Operacional | Baixo |
| WAHA Plus (WhatsApp API) | Comunidade | Ativo | Medio |
| Meta Graph API (Lead Ads, Instagram) | Meta | Estavel | Baixo |
| Google OAuth (Calendar) | Google | Estavel | Baixo |
| VPS com Docker para WAHA | Equipe interna | A provisionar | Baixo |

### Restricoes

| Restricao | Impacto |
|-----------|---------|
| Maximo 100 usuarios simultaneos por tenant (v1) | Limita grandes equipes |
| Historico de conversas WhatsApp limitado a 6 meses | Storage otimizado |
| Sem app mobile nativo, apenas PWA responsivo | UX mobile limitada |
| Integracao WhatsApp via WAHA (nao-oficial) | Requer plano de migracao |
| Backend Node.js apenas (sem microservicos) | Simplifica deploy, limita escala |

---

## Fluxos e Diagramas

### Diagrama de Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ARQUITETURA CRM RENOVE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   FRONTEND (React + Vite)           BACKEND (Node.js + Express)            │
│   ─────────────────────────         ─────────────────────────              │
│   localhost:8080                    localhost:3001                         │
│                                                                             │
│   ┌───────────────┐                 ┌───────────────────┐                  │
│   │ React App     │ ◄──────────────►│ REST API          │                  │
│   │ TanStack Query│    HTTP/JSON    │ JWT Auth          │                  │
│   │ Supabase RT   │                 │ Zod Validation    │                  │
│   └───────────────┘                 └─────────┬─────────┘                  │
│                                               │                            │
│                                               ▼                            │
│                           ┌─────────────────────────────────┐              │
│                           │         SUPABASE                │              │
│                           │  ┌────────┐ ┌────────┐ ┌─────┐  │              │
│                           │  │  Auth  │ │Database│ │ RT  │  │              │
│                           │  │  JWT   │ │Postgres│ │     │  │              │
│                           │  └────────┘ └────────┘ └─────┘  │              │
│                           └─────────────────────────────────┘              │
│                                                                             │
│   INTEGRACOES EXTERNAS                                                      │
│   ────────────────────                                                      │
│   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                             │
│   │ WAHA │ │ Meta │ │Google│ │ SMTP │ │Webhk │                             │
│   │ WPP  │ │ Ads  │ │ Cal  │ │ Mail │ │      │                             │
│   └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados: Lead do Meta Ads

```
┌───────────────────────────────────────────────────────────────────────────┐
│                         FLUXO: LEAD ADS → CRM                              │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1. Usuario preenche formulario no Facebook/Instagram                     │
│     └─► Meta envia webhook para /webhooks/meta-leads                      │
│                                                                           │
│  2. Backend recebe webhook                                                │
│     └─► Valida assinatura Meta                                            │
│     └─► Busca configuracao do formulario (mapeamento)                     │
│     └─► Identifica tenant pelo form_id                                    │
│                                                                           │
│  3. Backend busca dados completos do lead via Graph API                   │
│     └─► GET /lead/{lead_id}?fields=...                                    │
│                                                                           │
│  4. Backend cria registros no banco                                       │
│     └─► INSERT contatos (pessoa ou empresa)                               │
│     └─► INSERT oportunidades (pipeline + etapa destino)                   │
│     └─► INSERT atividade (origem: Meta Lead Ads)                          │
│                                                                           │
│  5. Sistema executa regras de distribuicao                                │
│     └─► Se rodizio: atribui ao proximo vendedor da fila                   │
│     └─► Se manual: deixa sem owner (Admin atribui)                        │
│                                                                           │
│  6. Supabase Realtime notifica frontend                                   │
│     └─► Kanban atualiza em tempo real                                     │
│     └─► Notificacao para vendedor atribuido                               │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados: Mensagem WhatsApp

```
┌───────────────────────────────────────────────────────────────────────────┐
│                         FLUXO: WHATSAPP (WAHA)                             │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  RECEBIMENTO (Inbound)                                                    │
│  ─────────────────────                                                    │
│  1. Contato envia mensagem para numero conectado                          │
│  2. WAHA recebe mensagem e dispara webhook                                │
│  3. Backend recebe em /webhooks/waha/:tenant_id                           │
│  4. Sistema identifica ou cria contato pelo telefone                      │
│  5. Mensagem salva em conversas                                           │
│  6. Realtime notifica frontend                                            │
│  7. Vendedor ve mensagem no chat integrado                                │
│                                                                           │
│  ENVIO (Outbound)                                                         │
│  ─────────────────                                                        │
│  1. Vendedor digita mensagem no CRM                                       │
│  2. Frontend chama POST /api/v1/mensagens/enviar                          │
│  3. Backend valida sessao WhatsApp ativa                                  │
│  4. Backend envia via WAHA API                                            │
│  5. Mensagem salva em conversas com status "enviada"                      │
│  6. WAHA retorna ACK, status atualiza para "entregue"                     │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Time to Value (TTV)

### MVP (Dias 1-10)

**Objetivo:** Sistema funcional basico para primeiros usuarios

| Entrega | Escopo |
|---------|--------|
| Auth + Multi-tenant | Login, roles, isolamento RLS |
| Contatos | CRUD pessoas/empresas, campos customizados |
| Pipeline basico | Kanban drag-and-drop, etapas, cards |
| 1 integracao | WhatsApp (WAHA) OU Email SMTP |

**Criterio de sucesso:** Admin consegue criar pipeline, adicionar contatos e gerenciar oportunidades.

### V1.0 (Dias 11-17)

**Objetivo:** Integracoes e automacoes essenciais

| Entrega | Escopo |
|---------|--------|
| Meta Lead Ads | OAuth, mapeamento formularios, webhook |
| Instagram Direct | Recebimento de DMs |
| Tarefas | Criacao manual e automatica por etapa |
| Distribuicao | Rodizio automatico de leads |

**Criterio de sucesso:** Leads do Meta Ads entram automaticamente no pipeline.

### V1.1 (Dias 18-20)

**Objetivo:** Estabilizacao e lancamento

| Entrega | Escopo |
|---------|--------|
| Ajustes UX | Correcoes de feedback interno |
| Testes E2E | Fluxos criticos validados |
| Deploy producao | VPS configurado, SSL, dominio |
| Documentacao | Guia de uso basico |

**Criterio de sucesso:** Sistema em producao recebendo primeiros usuarios reais.

### Pos-Lancamento (12 meses)

| Periodo | Foco |
|---------|------|
| Mes 1-3 | Estabilizacao, feedback early adopters, correcoes |
| Mes 4-6 | Automacoes avancadas, CAPI Meta, melhorias UX |
| Mes 7-9 | Custom Audiences, webhooks, dashboard analytics |
| Mes 10-12 | Relatorios customizaveis, escala para 1000 tenants |

---

## Plano de Validacao

### Pre-Lancamento

| Validacao | Metodo | Responsavel |
|-----------|--------|-------------|
| Testes unitarios | Jest + coverage > 70% | Dev Team |
| Testes E2E | Playwright fluxos criticos | QA |
| Revisao de seguranca | Checklist OWASP | Tech Lead |
| Performance | Load test 50 usuarios | DevOps |
| RLS validation | Testes de isolamento tenant | Backend |

### Durante Lancamento

| Validacao | Metodo | Responsavel |
|-----------|--------|-------------|
| Monitoramento erros | Sentry + alertas | DevOps |
| Metricas de uso | Analytics anonimizadas | Product |
| Feedback usuarios | Formulario in-app | Product |
| Uptime | Healthcheck automatico | DevOps |

### Pos-Lancamento

| Validacao | Metodo | Frequencia |
|-----------|--------|------------|
| NPS Survey | Email automatico | Mensal |
| Entrevistas usuarios | Calls 1:1 | Semanal (primeiras 4 semanas) |
| Analise de churn | Dashboard metricas | Semanal |
| Bugs reportados | Canal de suporte | Continuo |

---

## Proximos Passos

1. Aprovar PRD-01 (este documento)
2. Criar PRD-02 (Multi-Tenant)
3. Criar PRD-03 (Autenticacao)
4. Criar PRD-04 (Database Schema)
5. Iniciar implementacao da Fase 0

---

## Historico de Versoes

| Versao | Data | Autor | Mudancas |
|--------|------|-------|----------|
| v1.0 | 2026-01-31 | Arquiteto de Produto | Versao inicial |
| v1.1 | 2026-01-31 | Arquiteto de Produto | Adicionado Fluxo de Inicializacao do Sistema (Super Admin → Admin → Member) |
| v1.2 | 2026-02-03 | Arquiteto de Produto | Adicionado: Escopo formal, Suposicoes/Dependencias/Restricoes, Fluxos e Diagramas, Time to Value, Plano de Validacao |
