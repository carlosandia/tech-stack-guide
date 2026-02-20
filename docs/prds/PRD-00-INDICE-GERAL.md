# PRD-00: Indice Geral de PRDs - CRM Renove

| Campo | Valor |
|-------|-------|
| **Autor** | Arquiteto de Produto |
| **Data de criacao** | 2026-01-31 |
| **Ultima atualizacao** | 2026-02-09 |
| **Versao** | v2.16 |
| **Status** | Em desenvolvimento |

---

## Visao Geral do Projeto

**Produto:** CRM Renove
**Tipo:** SaaS Multi-Tenant B2B
**Meta:** 500-1000 tenants em 1 ano
**Stack:** React 18 + TypeScript + Vite + TailwindCSS + Node.js + Supabase (PostgreSQL)

---

## Mapa de PRDs

### Fase 0: Fundacao + Bootstrap (CRITICA)

| PRD | Nome | Status | Dependencias | Descricao |
|-----|------|--------|--------------|-----------|
| PRD-01 | Visao do Produto | Em desenvolvimento | Nenhuma | Visao geral, personas, diferenciais |
| PRD-02 | Multi-Tenant | Em desenvolvimento | PRD-01 | Arquitetura de isolamento por tenant |
| PRD-03 | Autenticacao | Em desenvolvimento | PRD-02 | Roles, permissoes, OAuth |
| PRD-04 | Database Schema | Em desenvolvimento | PRD-02, PRD-03 | Tabelas base com organizacao_id |
| PRD-14 | Super Admin | Em desenvolvimento | PRD-02, PRD-03, PRD-04 | **BOOTSTRAP**: Painel administrativo global, cria tenants e Admins |

**IMPORTANTE - Bootstrap do Sistema:**
- Usuario Super Admin pre-criado: `superadmin@renovedigital.com.br` / `carlos455460`
- Super Admin DEVE existir antes de criar qualquer tenant
- Super Admin cria a organizacao (tenant) e o primeiro Admin de cada empresa
- Sem Super Admin funcionando, nao ha como iniciar o sistema

### Fase 1: Configuracoes do Tenant

| PRD | Nome | Status | Dependencias | Descricao |
|-----|------|--------|--------------|-----------|
| PRD-05 | Configuracoes | Em desenvolvimento | PRD-04, PRD-14 | Campos, Produtos, Etapas, Tarefas, Regras, Cards, Webhooks, Equipe, Metas |

**NOTA:** Este modulo so pode ser acessado apos o Admin ser criado pelo Super Admin. Alimenta os modulos subsequentes (Contatos, Negocios, Conversas).

### Fase 2: Core CRM

| PRD | Nome | Status | Dependencias | Descricao |
|-----|------|--------|--------------|-----------|
| PRD-06 | Contatos | Aprovado | PRD-04, PRD-05 | Pessoas + Empresas, Segmentacao, Importacao/Exportacao, Duplicatas |
| PRD-07 | Negocios | Em desenvolvimento | PRD-05, PRD-06 | Pipeline/Kanban, Oportunidades, Distribuicao, Pre-Oportunidades |
| PRD-08 | Conexoes | Em desenvolvimento | PRD-04, PRD-05 | WhatsApp WAHA, Meta Ads (Lead Ads, CAPI, Audiences), Google, Email |

### Fase 3: Comunicacao

| PRD | Nome | Status | Dependencias | Descricao |
|-----|------|--------|--------------|-----------|
| PRD-09 | Conversas | Rascunho | PRD-06, PRD-07, PRD-08 | Chat multicanal WhatsApp/Instagram, mensagens prontas, notas, agendamento |
| PRD-10 | Tarefas | Aprovado | PRD-04, PRD-05, PRD-07 | Modulo Acompanhamento: visao centralizada de tarefas, metricas, filtros, conclusao rapida |

### Fase 4: Avancado

| PRD | Nome | Status | Dependencias | Descricao |
|-----|------|--------|--------------|-----------|
| PRD-11 | Caixa de Entrada Email | Rascunho | PRD-06, PRD-08 | Receber, ler e responder emails via IMAP/Gmail API |
| PRD-12 | Automacoes | Pendente | PRD-07, PRD-10 | Motor de automacao |
| PRD-13 | Dashboard | Pendente | Todos | Relatorios e metricas |
| PRD-15 | Feedback/Evolucao | Rascunho | PRD-02, PRD-03, PRD-14 | Botao flutuante feedback, modulo /evolucao Super Admin, notificacoes |
| PRD-17 | Formularios | Em desenvolvimento | PRD-06 | Builder avancado, Logica Condicional, Progressive Profiling, A/B Testing, Webhooks |

**NOTA:** PRD-14 (Super Admin) foi movido para Fase 0 por ser pre-requisito do bootstrap do sistema.

---

## Glossario de Termos

| Termo | Definicao | Tabela/Entidade |
|-------|-----------|-----------------|
| **Organizacao** | Empresa cliente do SaaS (tenant) | `organizacoes_saas` |
| **Contato** | Pessoa ou empresa cadastrada no CRM | `contatos` |
| **Pessoa** | Contato do tipo pessoa fisica | `contatos_pessoas` |
| **Empresa** | Contato do tipo pessoa juridica | `contatos_empresas` |
| **Lead** | Status de um contato que demonstrou interesse | Campo `status` em contatos |
| **MQL** | Lead qualificado pelo marketing | Badge quando atende regras |
| **SQL** | Lead qualificado para vendas | Badge quando vendedor aceita |
| **Oportunidade** | Negocio em andamento no funil | `oportunidades` |
| **Funil** | Pipeline de vendas com etapas | `funis` |
| **Etapa** | Fase do funil (ex: Qualificacao, Proposta) | `etapas_funil` |
| **Tarefa** | Acao a ser executada | `tarefas` |

---

## Regras Arquiteturais Imutaveis

1. **Multi-tenant obrigatorio** - Toda tabela CRM tem `organizacao_id`
2. **RLS ativo** - Row Level Security em todas tabelas com tenant
3. **Nomenclatura PT-BR** - Tabelas em portugues sem acento, snake_case
4. **Soft delete** - Preferir soft delete; DELETE fisico apenas em Contatos (PRD-06) com confirmacao
5. **Audit log** - Todo CRUD registrado para rastreabilidade
6. **Zod validation** - Schemas validados no front e back

---

## Ordem de Implementacao Recomendada (CORRIGIDA v2.14)

### Diagrama de Fases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FASE 0: FUNDAÇÃO + BOOTSTRAP (CRÍTICA)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   PRD-01 ──→ PRD-02 ──→ PRD-03 ──→ PRD-04 ──→ PRD-14                       │
│   (Visao)   (Multi)    (Auth)     (Schema)   (Super Admin)                 │
│                                                     │                       │
│                                                     │ Cria tenant + Admin   │
│                                                     ▼                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                      FASE 1: CONFIGURAÇÕES DO TENANT                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              PRD-05                                         │
│                         (Configuracoes)                                     │
│                    Campos, Etapas, Produtos, Metas                          │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                           FASE 2: CORE CRM                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│            PRD-06 ──────→ PRD-07 ──────→ PRD-08                            │
│          (Contatos)     (Negocios)     (Conexoes)                          │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                 FASE 3: COMUNICAÇÃO E PRODUTIVIDADE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                   PRD-09 ──────→ PRD-10                                     │
│                 (Conversas)     (Tarefas)                                   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                         FASE 4: AVANÇADO                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│       PRD-11 ──→ PRD-12 ──→ PRD-13 ──→ PRD-15 ──→ PRD-17                   │
│      (Email)   (Automacoes) (Dashboard) (Feedback) (Forms)                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Justificativa da Ordem

1. **Fase 0 - Bootstrap**: PRD-14 (Super Admin) DEVE vir apos PRD-04 porque:
   - Super Admin cria tenants (`organizacoes_saas`)
   - Super Admin cria o primeiro Admin de cada empresa
   - Sem Super Admin, nao ha forma de iniciar o sistema

2. **Fase 1 - Configuracoes**: PRD-05 alimenta todos os modulos CRM:
   - Campos personalizados → Contatos, Negocios
   - Etapas do funil → Negocios
   - Produtos → Negocios
   - Metas → Dashboard

3. **Fase 2 - Core CRM**: Dependencias sequenciais:
   - Contatos sao base para Negocios
   - Negocios usa configuracoes de etapas/campos
   - Conexoes depende de configuracoes

4. **Fase 3 - Comunicacao**: Requer modulos anteriores:
   - Conversas depende de Conexoes + Contatos
   - Tarefas depende de Negocios

5. **Fase 4 - Avancado**: Pos-MVP, funcionalidades complementares

### Usuario Super Admin Pre-Criado (Seed)

| Campo | Valor |
|-------|-------|
| Email | superadmin@renovedigital.com.br |
| Senha | carlos455460 |
| Role | super_admin |
| Status | ativo |

**IMPORTANTE:** Este usuario deve ser criado via migration/seed ANTES de qualquer operacao no sistema. Em producao, a senha deve ser alterada no primeiro login.

---

## Convencoes de Nomenclatura

| Camada | Padrao | Exemplo |
|--------|--------|---------|
| Banco de dados | snake_case PT-BR | `contatos_pessoas` |
| API endpoints | kebab-case | `/api/v1/contatos-pessoas` |
| Codigo backend | camelCase | `contatosPessoas` |
| Codigo frontend | camelCase | `contatosPessoas` |
| Componentes React | PascalCase | `ContatosPessoas` |
| Interface usuario | PT-BR com acentos | "Contatos > Pessoas" |

---

## Links Rapidos

- [PRD-01: Visao do Produto](./PRD-01-VISAO-PRODUTO.md)
- [PRD-02: Multi-Tenant](./PRD-02-MULTI-TENANT.md)
- [PRD-03: Autenticacao](./PRD-03-AUTENTICACAO.md)
- [PRD-04: Database Schema](./PRD-04-DATABASE-SCHEMA.md)
- [PRD-05: Configuracoes](./PRD-05-CONFIGURACOES.md)
- [PRD-06: Contatos](./PRD-06-CONTATOS.md)
- [PRD-07: Negocios](./PRD-07-NEGOCIOS.md)
- [PRD-08: Conexoes](./PRD-08-CONEXOES.md)
- [PRD-09: Conversas](./PRD-09-CONVERSAS.md)
- [PRD-10: Tarefas](./PRD-10-TAREFAS.md)
- [PRD-14: Super Admin](./PRD-14-SUPER-ADMIN.md)
- [PRD-15: Feedback/Evolucao](./PRD-15-FEEDBACK.md)
- [PRD-17: Formularios](./PRD-17-FORMULARIOS.md)
- [Padrao de PRD](../prdpadrao.md)
- [Arquiteto de Produto](../arquitetodeproduto.md)

---

## Controle de Versoes dos PRDs

| PRD | Versao Atual | Ultima Atualizacao | Principais Mudancas |
|-----|--------------|--------------------|--------------------|
| PRD-00 | v2.14 | 2026-02-03 | Correcao ordem implementacao: PRD-14 movido para Fase 0 (bootstrap) |
| PRD-01 | v1.1 | 2026-01-31 | Adicionado Fluxo de Inicializacao |
| PRD-02 | v1.1 | 2026-02-01 | Adicionada secao Correlation ID |
| PRD-03 | v1.3 | 2026-02-03 | Interface de Login (RF-021 a RF-023): Tela login com titulo "Informe seus dados abaixo", campos E-mail/Senha, "Lembrar por 30 dias", "Esqueci minha senha", links Politica/Termos |
| PRD-04 | v1.7 | 2026-02-03 | Adicionadas tabelas segmentos, contatos_segmentos, importacoes_contatos (PRD-06) |
| PRD-05 | v1.4 | 2026-02-03 | Adicionado "Nome da Empresa" como campo bloqueado de sistema |
| PRD-06 | v1.2 | 2026-02-03 | RF-016: Selecao em Lote e Acoes em Massa (checkbox, barra flutuante, Exportar/Excluir todos, Atribuir Vendedor/Segmentacao apenas Pessoas); Novos endpoints API em massa; Matriz permissoes atualizada |
| PRD-07 | v1.4 | 2026-02-02 | RF-15: Funcionalidades Complementares (Dropdown Pipeline, Toggle Valor, UTMs, Popover Metricas/Tarefas); Nova tabela preferencias_metricas |
| PRD-08 | v1.3 | 2026-02-01 | Adicionada secao Retry e Resiliencia |
| PRD-09 | v1.0 | 2026-02-03 | Modulo Conversas: chat multicanal (WhatsApp WAHA + Instagram Direct), 15 RFs, lista de conversas, janela de chat, drawer lateral, mensagens prontas (/comando), notas privadas, agendamento, ticks de entrega, tipos de mensagem (texto/imagem/video/audio/documento/localizacao/contato/enquete), webhooks WAHA, 6 tabelas (conversas, mensagens, mensagens_prontas, notas_contato, mensagens_agendadas, log_webhooks_conversas) |
| PRD-10 | v1.0 | 2026-02-03 | Modulo Acompanhamento de Tarefas: visao centralizada, metricas (4 cards), filtros, conclusao rapida, visibilidade por role (Admin ve equipe, Member ve apenas suas) |
| PRD-14 | v1.2 | 2026-02-03 | RF-012 a RF-019: Detalhes do Tenant (3 tabs), rastreamento de ultimo acesso, relatorios de vendas (15 metricas em 5 categorias) |
| PRD-15 | v1.0 | 2026-02-03 | Modulo Feedback/Evolucao: botao flutuante para Admin/Member, popover envio (tipo+descricao), modulo /evolucao exclusivo Super Admin, lista feedbacks com filtros, modal detalhes, marcar como resolvido, sistema notificacoes (sino header), 2 novas tabelas (feedbacks, notificacoes), 7 RFs |
| PRD-17 | v1.0 | 2026-02-09 | Modulo Formularios Backend: 4 tipos (padrao, popup, newsletter, multi-etapas), 16 tabelas, logica condicional, progressive profiling, A/B testing, webhooks com retry, analytics, lead scoring, integracao pipeline, rate limiting + captcha |

---

## Historico de Versoes do Indice

| Versao | Data | Mudancas |
|--------|------|----------|
| v1.0 | 2026-01-31 | Versao inicial com PRDs 01-14 |
| v1.1 | 2026-01-31 | Adicionado glossario de termos |
| v1.2 | 2026-01-31 | Adicionada ordem de implementacao |
| v1.3 | 2026-01-31 | Adicionado controle de versoes dos PRDs |
| v1.4 | 2026-01-31 | Atualizadas versoes PRD-03 e PRD-05 (restricoes Member) |
| v1.5 | 2026-01-31 | Adicionado PRD-08 Conexoes (WhatsApp WAHA, Meta Ads completo) |
| v1.6 | 2026-01-31 | Atualizadas versoes PRD-04 (v1.4), PRD-08 (v1.1) - Google Calendar |
| v1.7 | 2026-01-31 | Atualizadas versoes PRD-04 (v1.5), PRD-08 (v1.2) - Email Pessoal e Instagram Direct |
| v1.8 | 2026-02-01 | Atualizadas versoes PRD-02 (v1.1 - Correlation ID), PRD-04 (v1.6 - audit_log detalhado), PRD-08 (v1.3 - Retry e Resiliencia) |
| v1.9 | 2026-02-01 | Adicionado PRD-07 Negocios v1.0 (Pipeline/Kanban, 6 abas config, Distribuicao, Pre-Oportunidades WhatsApp) |
| v2.0 | 2026-02-01 | PRD-07 v1.1: Regras criticas (Solicitacoes = triagem WhatsApp, Novos Negocios = Etapa 0, modal motivos, badges qualificacao) |
| v2.1 | 2026-02-01 | PRD-07 v1.2: RF-12 Barra de Acoes (Buscar, Metricas toggle, Filtros, Periodo) e RF-13 Painel de Metricas (reflete cards filtrados) |
| v2.2 | 2026-02-01 | PRD-07 v1.3: RF-14 Modal de Detalhes da Oportunidade (Header com etapas clicaveis, Bloco Campos, 5 Abas: Anotacoes/Tarefas/Documentos/Email/Agenda, Timeline/Historico); 5 novas tabelas: anotacoes_oportunidades, documentos_oportunidades, emails_oportunidades, reunioes_oportunidades, motivos_noshow |
| v2.3 | 2026-02-02 | PRD-07 v1.4: RF-15 Funcionalidades Complementares (Dropdown Pipeline com Arquivar/Editar, Toggle Produtos/Manual para Valor, Campos UTM, Popover Filtrar Metricas, Popover Tarefas no Card, Engrenagem Contato no Modal Criacao); Nova tabela: preferencias_metricas; Alteracoes em funis e oportunidades |
| v2.4 | 2026-02-03 | PRD-05 v1.3: Secao 3.3.3 Metas e Objetivos (RF-015 a RF-019) - Sistema hierarquico de metas (Empresa/Equipe/Individual), 15 tipos de metricas em 5 categorias, distribuicao automatica, 4 novas tabelas (equipes, equipes_membros, metas, metas_progresso), visualizacao Member no Dashboard |
| v2.5 | 2026-02-03 | PRD-14 v1.2: RF-012 a RF-019 - Detalhes do Tenant (3 tabs: Usuarios, Relatorios, Configuracoes), rastreamento de ultimo acesso (Admin + Members), relatorios de vendas por tenant (15 metricas em 5 categorias: RECEITA, QUANTIDADE, ATIVIDADES, LEADS, TEMPO), nova tabela historico_acessos, novos endpoints de API |
| v2.6 | 2026-02-03 | PRD-03 v1.2: Gerenciamento de Perfil de Usuario (RF-011 a RF-020) - Admin e Member podem editar proprio perfil (nome, sobrenome, telefone, foto), email bloqueado, alteracao de senha com validacao, novos endpoints /api/v1/perfil/*, bucket avatars no Storage, schemas Zod |
| v2.7 | 2026-02-03 | Adicionado PRD-10 Tarefas v1.0 - Modulo Acompanhamento: pagina /tarefas, 4 cards metricas, filtros por pipeline/etapa/status/prioridade/responsavel/periodo, lista paginada, conclusao rapida, visibilidade por role (Admin ve todas tarefas da equipe, Member ve apenas suas) |
| v2.8 | 2026-02-03 | Adicionado PRD-06 Contatos v1.0 - Modulo Contatos: sub-menu Pessoas/Empresas, busca e filtros, toggle de colunas (campos globais), sistema de segmentacao (nome+cor), deteccao de duplicatas, importacao CSV/XLSX (max 5MB, 4 etapas), exportacao, modal novo contato, criacao de oportunidade, 3 novas tabelas (segmentos, contatos_segmentos, importacoes_contatos), 12 RFs |
| v2.9 | 2026-02-03 | PRD-05 v1.4: Adicionado "Nome da Empresa" como campo bloqueado; PRD-06 v1.1: Colunas fixas para Pessoas/Empresas, "Sem oportunidades +" clicavel, Modal de Visualizacao (2 abas Pessoas, 1 aba Empresas), Exclusao fisica com confirmacao e bloqueio, Performance para 100k+ contatos (cursor-based pagination, virtualizacao, indices) |
| v2.10 | 2026-02-03 | PRD-06 v1.2: RF-016 Selecao em Lote e Acoes em Massa - checkbox por linha, barra flutuante com contagem, Exportar/Excluir para Pessoas e Empresas, Atribuir Vendedor/Segmentacao exclusivos para Pessoas; Admin pode atribuir a Members, Member nao pode atribuir; Novos endpoints API em massa (DELETE/PATCH/POST /lote); Rate limit 10 req/min; Max 100 IDs por request; Matriz de permissoes atualizada |
| v2.11 | 2026-02-03 | PRD-09 v1.0: Modulo de Conversas multicanal - chat WhatsApp (WAHA Plus) e Instagram Direct, lista de conversas com foto/nome/preview/status/data, janela de chat com ticks (enviado/recebido/lido), drawer lateral com info do contato, mensagens prontas com /comando, notas privadas, agendamento de mensagens, gravacao de audio, todos tipos de mensagem suportados (texto/imagem/video/audio/documento/localizacao/contato/enquete), webhooks WAHA (message/message.ack/message.reaction), integracao com Contatos (PRD-06) e Negocios (PRD-07), 15 RFs, 6 novas tabelas, 25+ endpoints API |
| v2.12 | 2026-02-03 | PRD-15 v1.0: Modulo Feedback/Evolucao - botao flutuante para Admin/Member enviar feedback (bug/sugestao/duvida), popover com tipo e descricao, modulo /evolucao exclusivo Super Admin para gerenciar feedbacks de todos tenants, lista com filtros (empresa/tipo/status), modal detalhes, marcar como resolvido notifica usuario automaticamente, sistema de notificacoes com sino no header, 2 novas tabelas (feedbacks, notificacoes), 7 RFs, integracao com PRD-14 Super Admin |
| v2.13 | 2026-02-03 | PRD-03 v1.3: Interface de Login (RF-021 a RF-023) - Tela de login com titulo "Informe seus dados abaixo", campos E-mail e Senha obrigatorios, checkbox "Lembrar por 30 dias" (expira refresh token em 30d vs 7d), link "Esqueci minha senha" com fluxo completo de recuperacao (2 telas), links de Politica de Privacidade e Termos de Servico no rodape, especificacoes visuais detalhadas, mensagens de erro em PT-BR, sem opcao de criar conta |
| v2.14 | 2026-02-03 | **CORRECAO ORDEM DE IMPLEMENTACAO**: PRD-14 (Super Admin) movido para Fase 0 (apos PRD-04) - Super Admin cria tenants e Admins, e pre-requisito do bootstrap do sistema; Usuario seed superadmin@renovedigital.com.br documentado; PRD-05 agora depende de PRD-14; Diagrama de fases atualizado com justificativas |
| v2.15 | 2026-02-08 | Atualizacoes gerais |
| v2.16 | 2026-02-09 | **PRD-17 Formularios v1.0**: Modulo completo de formularios backend com 16 tabelas, logica condicional (100 regras como HubSpot), progressive profiling, A/B testing, webhooks com retry, analytics granular, lead scoring, integracao pipeline, 4 tipos de formulario (padrao, popup_saida, newsletter, multi_etapas), 48 requisitos funcionais, comparativo com HubSpot/RD Station |
