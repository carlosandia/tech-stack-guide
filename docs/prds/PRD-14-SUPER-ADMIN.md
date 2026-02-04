# PRD-14: Painel Super Admin - CRM Renove

| Campo | Valor |
|-------|-------|
| **Autor** | Arquiteto de Produto |
| **Data de criacao** | 2026-01-31 |
| **Ultima atualizacao** | 2026-02-03 |
| **Versao** | v1.4 |
| **Status** | Em desenvolvimento |
| **Dependencias** | PRD-02, PRD-03, PRD-04 |
| **Revisor tecnico** | Tech Lead |

---

## Resumo Executivo

Este documento define o Painel do Super Admin, a interface exclusiva para administradores da plataforma CRM Renove. O Super Admin gerencia tenants (organizacoes clientes), planos de assinatura, modulos disponiveis, configuracoes globais de integracoes e metricas da plataforma.

O painel permite criar organizacoes em um wizard de 3 etapas, gerenciar quais modulos cada tenant acessa com base no plano, e configurar integracoes globais (Meta Ads, Google, Stripe).

**IMPORTANTE - Bootstrap do Sistema:** Este modulo e CRITICO e deve ser implementado na Fase 0 (apos PRD-04), pois e atraves do Super Admin que se cria o primeiro tenant e Admin do sistema.

---

## Bootstrap do Sistema

### Contexto

O Super Admin e o ponto de partida para toda a operacao do CRM. Sem ele, nao existe forma de:
- Criar organizacoes (tenants)
- Criar o primeiro Admin de cada empresa
- Configurar planos e modulos
- Configurar integracoes globais

Por isso, PRD-14 deve ser implementado **LOGO APOS** PRD-04 (Database Schema), na Fase 0 de fundacao.

### Usuario Super Admin Pre-Criado (Seed)

O sistema deve ter um usuario Super Admin pre-criado via migration/seed:

| Campo | Valor |
|-------|-------|
| Email | superadmin@renovedigital.com.br |
| Senha inicial | carlos455460 |
| Role | super_admin |
| Status | ativo |
| Criado em | Via migration |

### Script de Seed (Migration)

```sql
-- 00001_seed_super_admin.sql
-- CRITICO: Este seed deve ser executado ANTES de qualquer operacao no sistema

-- Criar usuario Super Admin no Supabase Auth
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'superadmin@renovedigital.com.br',
  crypt('carlos455460', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"role": "super_admin", "nome": "Super", "sobrenome": "Admin"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Nota: Em producao, a senha DEVE ser alterada no primeiro login
```

### Fluxo de Primeiro Acesso

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE BOOTSTRAP                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Deploy da aplicacao                                          │
│                    ↓                                             │
│  2. Migration cria usuario Super Admin seed                      │
│                    ↓                                             │
│  3. Super Admin faz login em /login                             │
│     Email: superadmin@renovedigital.com.br                       │
│     Senha: carlos455460                                          │
│                    ↓                                             │
│  4. Sistema detecta role=super_admin e redireciona para /admin   │
│                    ↓                                             │
│  5. [RECOMENDADO] Alterar senha no primeiro acesso               │
│                    ↓                                             │
│  6. Super Admin cria primeira organizacao via wizard             │
│                    ↓                                             │
│  7. Wizard cria tenant + Admin vinculado                         │
│                    ↓                                             │
│  8. Admin recebe email de boas-vindas e pode fazer login         │
│                    ↓                                             │
│  9. Sistema operacional para o tenant                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Redirecionamento por Role

| Role | URL de Redirecionamento Apos Login |
|------|-----------------------------------|
| super_admin | /admin (Painel Super Admin) |
| admin | /app (Painel do Tenant) |
| member | /app (Painel do Tenant) |

### Seguranca do Bootstrap

1. **Senha deve ser alterada**: Exibir alerta no primeiro login recomendando alteracao de senha
2. **Audit log**: Registrar todas acoes do Super Admin seed
3. **MFA recomendado**: Habilitar autenticacao de dois fatores para Super Admin
4. **IP whitelist (opcional)**: Restringir acesso ao painel /admin por IP em producao

---

## Hierarquia de Requisitos

### Theme (Objetivo Estrategico)

> Criar painel administrativo completo para gerenciar a plataforma SaaS, permitindo operacao autonoma de tenants, planos e integracoes globais.

### Epic (Iniciativa)

> Desenvolver interface Super Admin com gestao de organizacoes, planos modulares e metricas consolidadas da plataforma.

### Features

**Feature 1: Gestao de Organizacoes**
- Wizard de criacao de tenant em 3 etapas
- Listagem com filtros e busca
- Detalhes completos do tenant (usuarios, relatorios, configuracoes)
- Suspensao/reativacao de tenants

**Feature 2: Sistema de Planos e Modulos**
- CRUD de planos com limites configuraveis
- Catalogo de modulos com dependencias
- Vinculo plano-modulos automatico
- Override de modulos por tenant

**Feature 3: Configuracoes Globais**
- OAuth Meta (App ID, App Secret)
- OAuth Google (Client ID, Client Secret)
- Stripe (API Keys)
- Configuracoes de seguranca (reCAPTCHA)

**Feature 4: Metricas e Dashboard**
- Resumo geral da plataforma
- Metricas financeiras (MRR, Churn)
- Metricas de uso por tenant
- Graficos de evolucao

**Feature 5: Suporte e Impersonacao**
- Impersonar tenant com auditoria
- Historico de acessos
- Acesso cross-tenant para suporte

---

## Arquitetura de Acesso

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPER ADMIN PANEL                        │
│                   (app.crmrenove.com/admin)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Organizacoes│  │   Planos    │  │ Config Global│         │
│  │   (CRUD)    │  │   (CRUD)    │  │ (Integracoes)│         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Modulos    │  │  Metricas   │  │   Suporte   │         │
│  │ (Catalogo)  │  │ (Dashboard) │  │ (Impersonar)│         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Gestao de Organizacoes (Tenants)

### 1.1 Listagem de Organizacoes

#### Colunas da Tabela

| Coluna | Descricao | Ordenavel | Filtravel |
|--------|-----------|-----------|-----------|
| Empresa | Nome + Badge de status (Ativa/Suspensa/Trial) | Sim | Sim |
| Administrador | Nome do Admin + Badge de status | Sim | Sim |
| Segmento | Segmento de mercado | Sim | Sim |
| Plano | Nome do plano atual | Sim | Sim |
| Criado em | Data de criacao | Sim | Sim |
| Acoes | Visualizar, Configurar, Impersonar | - | - |

#### Acoes Disponiveis

| Acao | Icone | Descricao |
|------|-------|-----------|
| Visualizar | Eye | Ver detalhes da organizacao |
| Configurar | Settings | Gerenciar modulos e plano |
| Impersonar | User | Acessar como Admin do tenant (auditado) |

#### Interface da Listagem

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Organizacoes                                           [+ Nova Organizacao] │
├─────────────────────────────────────────────────────────────────────────────┤
│ Buscar: [________________]  Filtros: [Status v] [Plano v] [Segmento v]      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Empresa              Administrador      Segmento        Plano    Criado em  │
│─────────────────────────────────────────────────────────────────────────────│
│ [L] LitoralPlace     Keven              software        Pro      14/01/2026 │
│     [Ativa]          [Ativo]                                                │
│─────────────────────────────────────────────────────────────────────────────│
│ [E] Empresa Teste    Admin              saas            Starter  09/01/2026 │
│     [Ativa]          [Ativo]                                                │
│─────────────────────────────────────────────────────────────────────────────│
│ [R] Renove Digital   Carlos             marketing       Enterprise 15/08/25 │
│     [Ativa]          [Ativo]                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 1.2 Criacao de Organizacao (Wizard 3 Etapas)

#### Etapa 1: Dados da Empresa

| Campo | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| Nome da Empresa | texto | Sim | min: 2, max: 255 |
| Segmento | select | Sim | Lista pre-definida |
| Website | url | Nao | Formato URL |
| Telefone | telefone | Nao | Formato brasileiro |
| Email da Empresa | email | Sim | Formato email |
| **Endereco (opcional)** | | | |
| CEP | texto | Nao | 8 digitos |
| Rua/Logradouro | texto | Nao | - |
| Numero | texto | Nao | - |
| Complemento | texto | Nao | - |
| Bairro | texto | Nao | - |
| Cidade/Estado | select | Nao | Lista IBGE |

#### Etapa 2: Expectativas

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| Numero de Usuarios | select | Sim | 1-5, 6-10, 11-25, 26-50, 50+ |
| Volume de Leads/Mes | select | Sim | <100, 100-500, 500-1000, 1000+ |
| Principal Objetivo | select | Sim | Vendas, Marketing, Atendimento, Todos |
| Como conheceu o CRM | select | Nao | Google, Indicacao, Redes Sociais, Outro |
| Observacoes | texto_longo | Nao | Anotacoes do Super Admin |

#### Etapa 3: Dados do Administrador

| Campo | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| Nome | texto | Sim | min: 2 |
| Sobrenome | texto | Sim | min: 2 |
| Email | email | Sim | Unico no sistema |
| Telefone | telefone | Nao | Formato brasileiro |
| Enviar convite por email | boolean | Sim | Default: true |
| Senha inicial | senha | Condicional | Se nao enviar convite |

#### Interface do Wizard

```
┌─────────────────────────────────────────────────────────────┐
│ [icon] Criar nova empresa                              [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│         [Empresa]      [Expectativas]      [Admin]          │
│            ●               ○                  ○              │
│                                                             │
│  Nome da Empresa *           Segmento *                     │
│  [Ex: Empresa LTDA    ]      [Selecione o segmento...  v]   │
│                                                             │
│  Website                     Telefone                       │
│  [https://www.empresa.com]   [(__) ____-____           ]    │
│                                                             │
│  Email da Empresa *                                         │
│  [contato@empresa.com.br  ]                                 │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  [pin] Endereco (opcional)                                  │
│                                                             │
│  CEP              Rua/Logradouro                            │
│  [00000-000]      [Rua, Avenida, etc.                  ]    │
│                                                             │
│  Numero      Complemento        Bairro                      │
│  [123  ]     [Sala, Andar...]   [Bairro             ]       │
│                                                             │
│  Cidade/Estado                                              │
│  [Digite a cidade...                               v]       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Cancelar]                                    [Proximo ->] │
└─────────────────────────────────────────────────────────────┘
```

#### Fluxo Pos-Criacao

1. Criar registro em `organizacoes_saas`
2. Criar registro em `usuarios` (Admin do tenant)
3. Criar registro em `configuracoes_tenant` (defaults)
4. Criar perfis de permissao padrao
5. Vincular plano inicial (trial ou definido)
6. Ativar modulos conforme plano
7. Enviar email de boas-vindas (se configurado)

---

### 1.3 Gerenciamento de Modulos por Tenant

#### Catalogo de Modulos

| Modulo | Icone | Descricao | Obrigatorio | Dependencias |
|--------|-------|-----------|-------------|--------------|
| Negocios | Building | Pipeline Kanban | Sim | Contatos |
| Contatos | Users | Gestao de leads | Sim | - |
| Conversas | MessageSquare | Central multi-canal | Nao | Conexoes |
| Formularios | FileText | Form Builder | Nao | - |
| Conexoes | Link | WhatsApp, Instagram | Nao | - |
| Atividades | CheckSquare | Tarefas e follow-ups | Nao | Negocios |
| Dashboard | PieChart | Metricas | Nao | - |
| Automacoes | Zap | Motor de automacao | Nao | Negocios |

#### Regras de Dependencia

```
Negocios → requer → Contatos
Conversas → requer → Conexoes
Atividades → requer → Negocios
```

#### Interface de Gerenciamento

```
┌─────────────────────────────────────────────────────────────┐
│ [gear] Gerenciar Modulos                               [X]  │
│ :: Arraste os modulos para alterar a ordem no menu lateral  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ :: [icon] Negocios              [Obrigatorio]    [ON] │  │
│  │          Pipeline Kanban para gestao de oportunidades │  │
│  │          Requer: Contatos                             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ :: [icon] Contatos              [Obrigatorio]    [ON] │  │
│  │          Gestao de leads e contatos comerciais        │  │
│  │          Obrigatorio porque e requerido por modulos   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ :: [icon] Conversas                              [ON] │  │
│  │          Central de mensagens multi-canal             │  │
│  │          Requer: Conexoes                             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ :: [icon] Formularios                           [OFF] │  │
│  │          Form Builder com lead scoring                │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Cancelar]                              [Salvar Alteracoes]│
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Sistema de Planos e Assinaturas

### 2.1 Estrutura de Planos

#### Planos Padrao

| Plano | Preco | Usuarios | Oportunidades | Storage | Modulos |
|-------|-------|----------|---------------|---------|---------|
| Trial | Gratis | 2 | 50 | 100MB | Basicos |
| Starter | R$ 99/mes | 5 | 500 | 1GB | Basicos |
| Pro | R$ 249/mes | 15 | 2.000 | 5GB | Todos |
| Enterprise | R$ 599/mes | 50 | Ilimitado | 20GB | Todos + Suporte |

#### Modulos por Plano

| Modulo | Trial | Starter | Pro | Enterprise |
|--------|-------|---------|-----|------------|
| Negocios | Sim | Sim | Sim | Sim |
| Contatos | Sim | Sim | Sim | Sim |
| Conversas | Nao | Sim | Sim | Sim |
| Formularios | Nao | Nao | Sim | Sim |
| Conexoes | Nao | Sim | Sim | Sim |
| Atividades | Sim | Sim | Sim | Sim |
| Dashboard | Nao | Basico | Completo | Completo |
| Automacoes | Nao | Nao | Sim | Sim |
| API Access | Nao | Nao | Nao | Sim |
| Suporte Prioritario | Nao | Nao | Nao | Sim |

### 2.2 Integracao com Stripe

#### Fluxo de Assinatura

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Super Admin cria organizacao com plano Trial             │
│                         ↓                                   │
│ 2. Admin do tenant acessa area de Billing                   │
│                         ↓                                   │
│ 3. Seleciona plano desejado                                 │
│                         ↓                                   │
│ 4. Redirect para Stripe Checkout                            │
│                         ↓                                   │
│ 5. Pagamento processado                                     │
│                         ↓                                   │
│ 6. Webhook Stripe notifica backend                          │
│                         ↓                                   │
│ 7. Backend atualiza plano e ativa modulos                   │
│                         ↓                                   │
│ 8. Tenant tem acesso aos novos modulos                      │
└─────────────────────────────────────────────────────────────┘
```

#### Eventos Stripe Monitorados

| Evento | Acao |
|--------|------|
| checkout.session.completed | Ativar plano, liberar modulos |
| invoice.paid | Renovar periodo, manter acesso |
| invoice.payment_failed | Notificar Admin, marcar pendente |
| customer.subscription.deleted | Rebaixar para Trial ou suspender |
| customer.subscription.updated | Atualizar plano (upgrade/downgrade) |

#### Configuracao Global Stripe

| Campo | Descricao |
|-------|-----------|
| Stripe Public Key | Chave publica para frontend |
| Stripe Secret Key | Chave secreta (criptografada) |
| Webhook Secret | Para validar webhooks |
| Modo | test / live |

---

## 3. Configuracoes Globais

O Super Admin configura apenas as **credenciais do aplicativo** (App/OAuth) para que Admin/Member possam fazer autenticacao e conectar suas proprias contas.

### 3.1 Separacao de Responsabilidades

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CONFIGURACOES: GLOBAL vs TENANT                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SUPER ADMIN (Configuracao Global)         ADMIN/MEMBER (Por Tenant)        │
│  ─────────────────────────────────         ──────────────────────────       │
│  Credenciais do APP da plataforma          Contas pessoais/empresa          │
│                                                                             │
│  Meta:                                     Meta (via OAuth):                │
│  - App ID                                  - Paginas do Facebook            │
│  - App Secret                              - Business Manager               │
│  - Webhook Verify Token                    - Pixel ID (CAPI)                │
│  - Webhook Base URL                        - Ad Account ID                  │
│                                            - Access Token da conta          │
│                                            - Publicos Personalizados        │
│                                                                             │
│  Google:                                   Google (via OAuth):              │
│  - Client ID                               - Calendario pessoal             │
│  - Client Secret                           - Gmail pessoal                  │
│  - Redirect URI                            - Access/Refresh Tokens          │
│                                                                             │
│  reCAPTCHA:                                                                 │
│  - Site Key (usado em todos forms)                                          │
│  - Secret Key                                                               │
│                                                                             │
│  Stripe:                                                                    │
│  - Chaves da conta da plataforma                                            │
│                                                                             │
│  Email Sistema:                            Email (por tenant):              │
│  - SMTP master da plataforma               - SMTP pessoal (opcional)        │
│                                                                             │
│  WAHA:                                     WhatsApp (por tenant):           │
│  - URL da instancia                        - Sessao/numero conectado        │
│  - API Key                                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Integracoes de Plataforma (Super Admin)

#### Meta App (Facebook/Instagram)

Credenciais do **aplicativo Meta** registrado no Facebook Developers.
Permite que Admin/Member facam OAuth e conectem suas proprias Paginas/Business Manager.

| Campo | Tipo | Descricao | Obrigatorio |
|-------|------|-----------|-------------|
| app_id | string | ID do aplicativo Meta | Sim |
| app_secret_encrypted | string | Segredo do app (criptografado) | Sim |
| webhook_verify_token_encrypted | string | Token verificacao webhooks | Sim |
| webhook_base_url | string | URL base para callbacks | Sim |
| modo_sandbox | boolean | Ambiente de desenvolvimento | Nao |

**Permissoes do App (App Review):**
- `leads_retrieval` - Receber leads de Lead Ads
- `pages_manage_ads` - Gerenciar anuncios das paginas
- `pages_read_engagement` - Ler engajamento
- `instagram_basic` - Acesso basico ao Instagram
- `instagram_manage_messages` - Instagram Direct

**O que Admin/Member configura depois (tabela `integracoes` por tenant):**
- Page ID e Page Access Token (via OAuth)
- Business Manager ID
- Ad Account ID
- Pixel ID (para Conversions API)
- Access Token pessoal para CAPI

#### Google OAuth App

Credenciais do **projeto Google Cloud** da plataforma.
Permite que Admin/Member facam OAuth e conectem Calendar/Gmail pessoal.

| Campo | Tipo | Descricao | Obrigatorio |
|-------|------|-----------|-------------|
| client_id | string | OAuth Client ID | Sim |
| client_secret_encrypted | string | OAuth Secret (criptografado) | Sim |
| redirect_uri | string | URI de callback | Sim |
| servicos.calendar | boolean | Habilitar Calendar | Nao |
| servicos.gmail | boolean | Habilitar Gmail | Nao |

**Scopes disponiveis:**
| Servico | Scopes |
|---------|--------|
| Calendar | `calendar`, `calendar.events` |
| Gmail | `gmail.send`, `gmail.readonly` |

**O que Admin/Member configura depois (tabela `integracoes` por tenant):**
- Access Token e Refresh Token pessoal
- Calendario selecionado
- Email conectado

#### Google reCAPTCHA v3

Configuracao **global** usada por todos os formularios da plataforma.

| Campo | Tipo | Descricao | Obrigatorio |
|-------|------|-----------|-------------|
| site_key | string | Chave publica (frontend) | Sim |
| secret_key_encrypted | string | Chave privada (criptografada) | Sim |
| score_threshold | decimal | 0.0 - 1.0 (default: 0.5) | Sim |
| ativo_globalmente | boolean | Aplicar em todos formularios | Sim |

**Comportamento do Score:**
- 1.0 = muito provavelmente humano
- 0.0 = muito provavelmente bot
- Score < threshold = bloquear submissao
- Recomendado comecar com 0.5

#### Stripe

Credenciais da **conta Stripe da plataforma** para cobranca de assinaturas.

| Campo | Tipo | Descricao | Obrigatorio |
|-------|------|-----------|-------------|
| public_key | string | Chave publica | Sim |
| secret_key_encrypted | string | Chave secreta (criptografada) | Sim |
| webhook_secret_encrypted | string | Para validar eventos | Sim |
| ambiente | string | "test" ou "live" | Sim |

#### Email Sistema

SMTP **master da plataforma** para emails transacionais (boas-vindas, recuperacao de senha, notificacoes do sistema).

| Campo | Tipo | Descricao | Obrigatorio |
|-------|------|-----------|-------------|
| smtp_host | string | Host do servidor SMTP | Sim |
| smtp_port | integer | Porta (default: 587) | Sim |
| smtp_user | string | Usuario SMTP | Sim |
| smtp_pass_encrypted | string | Senha (criptografada) | Sim |
| from_email | string | Email remetente | Sim |
| from_name | string | Nome exibido | Sim |

**Nota:** Admin pode configurar SMTP proprio por tenant para emails de vendas.

#### WAHA (WhatsApp)

Configuracao da **instancia WAHA** da plataforma.

| Campo | Tipo | Descricao | Obrigatorio |
|-------|------|-----------|-------------|
| api_url | string | URL da instancia WAHA | Sim |
| api_key_encrypted | string | Chave de autenticacao | Sim |
| webhook_url | string | URL para receber mensagens | Sim |

**O que Admin/Member configura depois (tabela `integracoes` por tenant):**
- Sessao/numero WhatsApp conectado
- QR Code para pareamento

### 3.3 Tabela configuracoes_globais

Armazena apenas as **credenciais do aplicativo** da plataforma (nao dados de tenants).

```sql
CREATE TABLE configuracoes_globais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  plataforma varchar(50) NOT NULL UNIQUE,
  configuracoes jsonb NOT NULL DEFAULT '{}',

  -- Status
  configurado boolean DEFAULT false,
  ultimo_teste timestamptz,
  ultimo_erro text,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

-- Dados iniciais (apenas credenciais de APP, nao de contas)
INSERT INTO configuracoes_globais (plataforma, configuracoes) VALUES
  ('meta', '{
    "app_id": null,
    "app_secret_encrypted": null,
    "webhook_verify_token_encrypted": null,
    "webhook_base_url": null,
    "modo_sandbox": false
  }'),
  ('google', '{
    "client_id": null,
    "client_secret_encrypted": null,
    "redirect_uri": null,
    "servicos": {
      "calendar": false,
      "gmail": false
    }
  }'),
  ('recaptcha', '{
    "site_key": null,
    "secret_key_encrypted": null,
    "score_threshold": 0.5,
    "ativo_globalmente": false
  }'),
  ('stripe', '{
    "public_key": null,
    "secret_key_encrypted": null,
    "webhook_secret_encrypted": null,
    "ambiente": "test"
  }'),
  ('waha', '{
    "api_url": null,
    "api_key_encrypted": null,
    "webhook_url": null
  }'),
  ('email_sistema', '{
    "smtp_host": null,
    "smtp_port": 587,
    "smtp_user": null,
    "smtp_pass_encrypted": null,
    "from_email": null,
    "from_name": "CRM Renove"
  }');

CREATE INDEX idx_config_globais_plataforma ON configuracoes_globais(plataforma);
```

**Nota:** Dados de contas pessoais (Pixel ID, Business Manager, Page Access Token, etc.) sao armazenados na tabela `integracoes` por tenant (ver PRD-05 e PRD-08).

### 3.4 Endpoints de Configuracoes Globais

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/admin/config-global | Listar todas configuracoes | Super Admin |
| GET | /api/v1/admin/config-global/:plataforma | Obter config especifica | Super Admin |
| PATCH | /api/v1/admin/config-global/:plataforma | Atualizar configuracao | Super Admin |
| POST | /api/v1/admin/config-global/:plataforma/testar | Testar conexao | Super Admin |
| POST | /api/v1/admin/config-global/meta/regenerar-token | Regenerar webhook token | Super Admin |

---

## 4. Dashboard de Metricas (Super Admin)

```
┌─────────────────────────────────────────────────────────────┐
│ Configuracoes Globais                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Meta] [Google] [WhatsApp] [Stripe] [Email]       <- Tabs  │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  Meta Ads / Facebook / Instagram                            │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  App ID                                                     │
│  [123456789012345                              ]            │
│                                                             │
│  App Secret                                                 │
│  [********************************            ] [Mostrar]   │
│                                                             │
│  Webhook Verify Token                                       │
│  [meu_token_verificacao_123                   ]             │
│                                                             │
│  Webhook Base URL                                           │
│  [https://api.crmrenove.com/webhooks/meta     ]             │
│                                                             │
│  Status: [verde] Configurado                                │
│                                                             │
│  [Testar Conexao]                        [Salvar Alteracoes]│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Dashboard de Metricas (Super Admin)

### 4.1 Metricas da Plataforma

| Metrica | Descricao |
|---------|-----------|
| Total de Tenants | Quantidade de organizacoes ativas |
| Tenants por Plano | Distribuicao Trial/Starter/Pro/Enterprise |
| MRR (Monthly Recurring Revenue) | Receita recorrente mensal |
| Churn Rate | Taxa de cancelamento mensal |
| Novos Tenants (7/30 dias) | Crescimento recente |
| Tenants em Trial Expirando | Alertas de conversao |

### 4.2 Metricas de Uso

| Metrica | Descricao |
|---------|-----------|
| Total de Usuarios | Soma de todos usuarios |
| Usuarios Ativos (DAU/MAU) | Engajamento |
| Total de Oportunidades | Volume de negocios |
| Mensagens Enviadas | Volume de comunicacao |
| Storage Utilizado | Consumo de armazenamento |

### 4.3 Interface do Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard da Plataforma                     Periodo: [30d v]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────┐│
│  │ 247         │ │ R$ 45.2k    │ │ 2.3%        │ │ 12     ││
│  │ Tenants     │ │ MRR         │ │ Churn       │ │ Novos  ││
│  │ Ativos      │ │ +15% mes    │ │ -0.5% mes   │ │ 7 dias ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────┘│
│                                                             │
│  Distribuicao por Plano              Crescimento Mensal     │
│  ┌─────────────────────────┐        ┌─────────────────────┐│
│  │ [Grafico Pizza]         │        │ [Grafico Linha]     ││
│  │ Trial: 45 (18%)         │        │                     ││
│  │ Starter: 120 (49%)      │        │    /\    /\         ││
│  │ Pro: 65 (26%)           │        │   /  \  /  \        ││
│  │ Enterprise: 17 (7%)     │        │  /    \/    \       ││
│  └─────────────────────────┘        └─────────────────────┘│
│                                                             │
│  Alertas                                                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [!] 8 tenants com trial expirando em 3 dias            ││
│  │ [!] 3 pagamentos falharam - acao necessaria            ││
│  │ [i] 5 novos tenants aguardando primeiro login          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Suporte e Impersonacao

### 5.1 Acesso a Tenant (Impersonar)

O Super Admin pode acessar qualquer tenant para suporte, com auditoria completa.

#### Fluxo de Impersonacao

```
1. Super Admin clica em "Impersonar" na listagem
2. Sistema registra em audit_log:
   - usuario_id do Super Admin
   - organizacao_id do tenant acessado
   - timestamp
   - IP e user agent
3. Super Admin ve interface do Admin do tenant
4. Todas acoes sao registradas com flag "impersonated"
5. Banner visivel: "Voce esta acessando como suporte"
6. Botao "Sair do modo suporte" sempre visivel
```

#### Restricoes de Impersonacao

| Acao | Permitido |
|------|-----------|
| Visualizar dados | Sim |
| Editar configuracoes | Sim (auditado) |
| Criar/editar contatos | Sim (auditado) |
| Excluir dados | Nao |
| Alterar plano | Nao (apenas via painel Super Admin) |
| Exportar dados em massa | Nao |

---

## 6. Tabelas de Banco de Dados

### 6.1 planos

```sql
CREATE TABLE planos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  nome varchar(100) NOT NULL UNIQUE,
  descricao text,

  -- Precos
  preco_mensal decimal(10,2),
  preco_anual decimal(10,2),
  moeda varchar(3) DEFAULT 'BRL',

  -- Limites
  limite_usuarios int NOT NULL,
  limite_oportunidades int, -- NULL = ilimitado
  limite_storage_mb int NOT NULL,
  limite_contatos int, -- NULL = ilimitado

  -- Stripe
  stripe_price_id_mensal varchar(255),
  stripe_price_id_anual varchar(255),

  -- Status
  ativo boolean DEFAULT true,
  visivel boolean DEFAULT true, -- Mostrar na pagina de precos
  ordem int DEFAULT 0,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

-- Dados iniciais
INSERT INTO planos (nome, preco_mensal, limite_usuarios, limite_oportunidades, limite_storage_mb) VALUES
  ('Trial', 0, 2, 50, 100),
  ('Starter', 99, 5, 500, 1024),
  ('Pro', 249, 15, 2000, 5120),
  ('Enterprise', 599, 50, NULL, 20480);
```

### 6.2 modulos

```sql
CREATE TABLE modulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  slug varchar(50) NOT NULL UNIQUE,
  nome varchar(100) NOT NULL,
  descricao text,
  icone varchar(50),

  obrigatorio boolean DEFAULT false,
  ordem int DEFAULT 0,

  -- Dependencias (array de slugs)
  requer text[] DEFAULT '{}',

  criado_em timestamptz NOT NULL DEFAULT now()
);

-- Dados iniciais
INSERT INTO modulos (slug, nome, descricao, icone, obrigatorio, ordem, requer) VALUES
  ('negocios', 'Negocios', 'Pipeline Kanban para gestao de oportunidades', 'Building', true, 1, ARRAY['contatos']),
  ('contatos', 'Contatos', 'Gestao de leads e contatos comerciais', 'Users', true, 2, ARRAY[]::text[]),
  ('conversas', 'Conversas', 'Central de mensagens multi-canal', 'MessageSquare', false, 3, ARRAY['conexoes']),
  ('formularios', 'Formularios', 'Form Builder com lead scoring', 'FileText', false, 4, ARRAY[]::text[]),
  ('conexoes', 'Conexoes', 'WhatsApp, Instagram e configuracoes de canais', 'Link', false, 5, ARRAY[]::text[]),
  ('atividades', 'Atividades', 'Lista de tarefas e follow-ups comerciais', 'CheckSquare', false, 6, ARRAY['negocios']),
  ('dashboard', 'Dashboard', 'Painel de metricas e indicadores', 'PieChart', false, 7, ARRAY[]::text[]),
  ('automacoes', 'Automacoes', 'Motor de automacao de processos', 'Zap', false, 8, ARRAY['negocios']);
```

### 6.3 planos_modulos

```sql
CREATE TABLE planos_modulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id uuid NOT NULL REFERENCES planos(id) ON DELETE CASCADE,
  modulo_id uuid NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,

  -- Configuracoes especificas do modulo no plano
  configuracoes jsonb DEFAULT '{}',

  criado_em timestamptz NOT NULL DEFAULT now(),

  UNIQUE(plano_id, modulo_id)
);
```

### 6.4 organizacoes_modulos

```sql
CREATE TABLE organizacoes_modulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id) ON DELETE CASCADE,
  modulo_id uuid NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,

  ativo boolean DEFAULT true,
  ordem int DEFAULT 0,

  -- Configuracoes especificas do tenant
  configuracoes jsonb DEFAULT '{}',

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),

  UNIQUE(organizacao_id, modulo_id)
);
```

### 6.5 assinaturas

```sql
CREATE TABLE assinaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  plano_id uuid NOT NULL REFERENCES planos(id),

  -- Stripe
  stripe_customer_id varchar(255),
  stripe_subscription_id varchar(255),

  -- Periodo
  periodo varchar(20) NOT NULL DEFAULT 'mensal',
  inicio_em timestamptz NOT NULL DEFAULT now(),
  expira_em timestamptz,

  -- Status
  status varchar(20) NOT NULL DEFAULT 'trial',

  -- Trial
  trial_inicio timestamptz,
  trial_fim timestamptz,

  -- Cancelamento
  cancelado_em timestamptz,
  motivo_cancelamento text,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_periodo CHECK (periodo IN ('mensal', 'anual')),
  CONSTRAINT chk_status CHECK (status IN ('trial', 'ativo', 'pendente', 'cancelado', 'suspenso'))
);

CREATE INDEX idx_assinaturas_org ON assinaturas(organizacao_id);
CREATE INDEX idx_assinaturas_status ON assinaturas(status);
CREATE INDEX idx_assinaturas_stripe ON assinaturas(stripe_subscription_id);
```

### 6.6 organizacoes_expectativas

```sql
CREATE TABLE organizacoes_expectativas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL UNIQUE REFERENCES organizacoes_saas(id),

  numero_usuarios varchar(20),
  volume_leads_mes varchar(20),
  principal_objetivo varchar(50),
  como_conheceu varchar(50),
  observacoes text,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
```

---

## 7. Endpoints de API

### Organizacoes

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/admin/organizacoes | Listar tenants | Super Admin |
| POST | /api/v1/admin/organizacoes | Criar tenant | Super Admin |
| GET | /api/v1/admin/organizacoes/:id | Detalhes do tenant | Super Admin |
| PATCH | /api/v1/admin/organizacoes/:id | Atualizar tenant | Super Admin |
| POST | /api/v1/admin/organizacoes/:id/suspender | Suspender tenant | Super Admin |
| POST | /api/v1/admin/organizacoes/:id/reativar | Reativar tenant | Super Admin |
| POST | /api/v1/admin/organizacoes/:id/impersonar | Iniciar impersonacao | Super Admin |

### Planos

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/admin/planos | Listar planos | Super Admin |
| POST | /api/v1/admin/planos | Criar plano | Super Admin |
| PATCH | /api/v1/admin/planos/:id | Atualizar plano | Super Admin |
| GET | /api/v1/admin/planos/:id/modulos | Modulos do plano | Super Admin |
| PUT | /api/v1/admin/planos/:id/modulos | Definir modulos | Super Admin |

### Modulos

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/admin/modulos | Listar modulos | Super Admin |
| GET | /api/v1/admin/organizacoes/:id/modulos | Modulos do tenant | Super Admin |
| PUT | /api/v1/admin/organizacoes/:id/modulos | Atualizar modulos | Super Admin |

### Configuracoes Globais

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/admin/config-global | Listar configuracoes | Super Admin |
| PATCH | /api/v1/admin/config-global/:plataforma | Atualizar config | Super Admin |
| POST | /api/v1/admin/config-global/:plataforma/testar | Testar conexao | Super Admin |

### Metricas

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/admin/metricas/resumo | Dashboard resumido | Super Admin |
| GET | /api/v1/admin/metricas/tenants | Metricas por tenant | Super Admin |
| GET | /api/v1/admin/metricas/financeiro | MRR, Churn, etc | Super Admin |

### Webhooks Stripe

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| POST | /api/v1/webhooks/stripe | Receber eventos Stripe | Webhook Secret |

---

## 8. Requisitos Funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-001 | Super Admin pode criar organizacoes em wizard 3 etapas | Must |
| RF-002 | Super Admin pode listar e filtrar organizacoes | Must |
| RF-003 | Super Admin pode gerenciar modulos por tenant | Must |
| RF-004 | Super Admin pode criar e editar planos | Must |
| RF-005 | Planos definem modulos disponiveis | Must |
| RF-006 | Integracao com Stripe para pagamentos | Must |
| RF-007 | Configuracoes globais de integracoes | Must |
| RF-008 | Dashboard de metricas da plataforma | Should |
| RF-009 | Impersonacao auditada de tenants | Should |
| RF-010 | Alertas de trials expirando | Should |
| RF-011 | Exportar lista de tenants | Could |
| RF-012 | Super Admin pode visualizar detalhes completos do tenant | Must |
| RF-013 | Super Admin pode ver Admin e todos Members do tenant | Must |
| RF-014 | Sistema rastreia ultimo acesso de Admin e Members | Must |
| RF-015 | Super Admin pode ver relatorios de vendas por tenant | Must |
| RF-016 | Relatorios incluem 15 metricas em 5 categorias | Must |
| RF-017 | Super Admin pode exportar relatorios (PDF/Excel) | Should |
| RF-018 | Super Admin pode ver limites de uso vs utilizacao | Should |
| RF-019 | Super Admin pode ver historico de acessos do tenant | Could |

---

## 9. Detalhes do Tenant (Nova Pagina)

### 9.1 Acesso

Ao clicar em "Visualizar" na listagem de organizacoes, abre pagina de detalhes completa do tenant.

### 9.2 Interface da Pagina de Detalhes

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  < Voltar para Organizacoes                                                             │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐   │
│  │  [Logo] Empresa Exemplo LTDA                               [Ativa] badge         │   │
│  │  contato@empresa.com.br • (11) 99999-9999 • www.empresa.com.br                   │   │
│  │  Plano: Pro • Criado em: 15/01/2026                                              │   │
│  │                                                                                   │   │
│  │  [Editar Empresa]  [Gerenciar Modulos]  [Impersonar]  [Suspender]                │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│  [Usuarios] [Relatorios] [Configuracoes]                           <- Tabs              │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 9.3 Tab Usuarios

Exibe o Administrador do tenant e todos os Members criados por ele.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  TAB: USUARIOS                                                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ── ADMINISTRADOR ──────────────────────────────────────────────────────────────────   │
│                                                                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐   │
│  │  [Avatar] Carlos Silva                    [Admin] badge                          │   │
│  │           carlos@empresa.com.br                                                  │   │
│  │           Criado em: 15/01/2026 • Ultimo acesso: Hoje, 14:30                    │   │
│  │           Status: [Ativo]                                                        │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│  ── MEMBROS (5 usuarios) ───────────────────────────────────────────────────────────   │
│                                                                                          │
│  [Buscar membro...]                              Ordenar: [Ultimo Acesso v]             │
│                                                                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐   │
│  │  Usuario           Email                    Criado em    Ultimo Acesso   Status  │   │
│  ├──────────────────────────────────────────────────────────────────────────────────┤   │
│  │  Maria Santos      maria@empresa.com.br     16/01/2026   Hoje, 10:15     [Ativo] │   │
│  │  Joao Pereira      joao@empresa.com.br      17/01/2026   Ontem, 18:30    [Ativo] │   │
│  │  Ana Oliveira      ana@empresa.com.br       18/01/2026   20/01/2026      [Ativo] │   │
│  │  Pedro Lima        pedro@empresa.com.br     20/01/2026   Nunca           [Pendente]│   │
│  │  Julia Costa       julia@empresa.com.br     22/01/2026   22/01/2026      [Inativo]│   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│  Mostrando 5 de 5 membros                                      [1] [2] [>]              │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Campos Exibidos

| Campo | Descricao | Fonte |
|-------|-----------|-------|
| Nome | Nome completo | `usuarios.nome` |
| Email | Email do usuario | `usuarios.email` |
| Role | Admin ou Member | `usuarios.role` ou `user_metadata.role` |
| Criado em | Data de criacao | `usuarios.criado_em` |
| Ultimo acesso | Data/hora do ultimo login | `usuarios.ultimo_acesso` |
| Status | Ativo, Pendente, Inativo | `usuarios.status` |

---

## 10. Relatorios de Vendas por Tenant

### 10.1 Interface da Tab Relatorios

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  TAB: RELATORIOS                                    Periodo: [Fevereiro 2026 v]         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ── RECEITA ────────────────────────────────────────────────────────────────────────   │
│                                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                                     │
│  │ R$ 156.000  │  │ R$ 12.500   │  │ R$ 26.000   │                                     │
│  │ Valor de    │  │ MRR         │  │ Ticket      │                                     │
│  │ Vendas      │  │             │  │ Medio       │                                     │
│  │ +23% vs mes │  │ +5% vs mes  │  │ +8% vs mes  │                                     │
│  └─────────────┘  └─────────────┘  └─────────────┘                                     │
│                                                                                          │
│  ── QUANTIDADE ─────────────────────────────────────────────────────────────────────   │
│                                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                                     │
│  │ 6           │  │ 45          │  │ 13.3%       │                                     │
│  │ Vendas      │  │ Novos       │  │ Taxa de     │                                     │
│  │ Fechadas    │  │ Negocios    │  │ Conversao   │                                     │
│  └─────────────┘  └─────────────┘  └─────────────┘                                     │
│                                                                                          │
│  ── ATIVIDADES ─────────────────────────────────────────────────────────────────────   │
│                                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                    │
│  │ 32          │  │ 156         │  │ 89          │  │ 245         │                    │
│  │ Reunioes    │  │ Ligacoes    │  │ E-mails     │  │ Tarefas     │                    │
│  │ Realizadas  │  │ Feitas      │  │ Enviados    │  │ Concluidas  │                    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘                    │
│                                                                                          │
│  ── LEADS ──────────────────────────────────────────────────────────────────────────   │
│                                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                                     │
│  │ 245         │  │ 89          │  │ 45          │                                     │
│  │ Novos       │  │ MQLs        │  │ SQLs        │                                     │
│  │ Contatos    │  │ Gerados     │  │ Gerados     │                                     │
│  └─────────────┘  └─────────────┘  └─────────────┘                                     │
│                                                                                          │
│  ── TEMPO ──────────────────────────────────────────────────────────────────────────   │
│                                                                                          │
│  ┌─────────────┐  ┌─────────────┐                                                      │
│  │ 18 dias     │  │ R$ 8.667    │                                                      │
│  │ Tempo Medio │  │ Velocidade  │                                                      │
│  │ Fechamento  │  │ Pipeline/dia│                                                      │
│  └─────────────┘  └─────────────┘                                                      │
│                                                                                          │
│  ── GRAFICO DE EVOLUCAO ────────────────────────────────────────────────────────────   │
│                                                                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐   │
│  │  [Grafico de linha: Valor de Vendas nos ultimos 6 meses]                         │   │
│  │                                                                                   │   │
│  │     R$ 200k │                                    ┌─●                              │   │
│  │     R$ 150k │                           ┌───────┘                                 │   │
│  │     R$ 100k │              ┌────────────┘                                         │   │
│  │     R$  50k │  ────────────┘                                                      │   │
│  │            └──────────────────────────────────────────────────────────           │   │
│  │             Set    Out    Nov    Dez    Jan    Fev                                │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│  [Exportar PDF]  [Exportar Excel]                                                       │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Metricas por Categoria (15 Metricas em 5 Categorias)

| Categoria | Metrica | Descricao | Calculo |
|-----------|---------|-----------|---------|
| **RECEITA** | Valor de Vendas | Soma monetaria das vendas | SUM(oportunidades.valor) WHERE status='ganha' |
| | MRR | Receita mensal recorrente | SUM(produtos.valor) WHERE recorrente=true |
| | Ticket Medio | Valor medio por venda | AVG(oportunidades.valor) WHERE status='ganha' |
| **QUANTIDADE** | Vendas Fechadas | Negocios ganhos | COUNT(oportunidades) WHERE status='ganha' |
| | Novos Negocios | Oportunidades criadas | COUNT(oportunidades) criadas no periodo |
| | Taxa de Conversao | % de ganhos vs total | (ganhos / total) * 100 |
| **ATIVIDADES** | Reunioes Realizadas | Reunioes concluidas | COUNT(reunioes) WHERE status='realizada' |
| | Ligacoes Feitas | Tarefas tipo ligacao | COUNT(tarefas) WHERE tipo='ligacao' AND concluida |
| | E-mails Enviados | E-mails pelo CRM | COUNT(emails_oportunidades) |
| | Tarefas Concluidas | Total de tarefas | COUNT(tarefas) WHERE concluida=true |
| **LEADS** | Novos Contatos | Contatos criados | COUNT(contatos) criados no periodo |
| | MQLs Gerados | Leads qualificados MKT | COUNT(contatos) WHERE qualificacao='mql' |
| | SQLs Gerados | Leads qualificados Vendas | COUNT(contatos) WHERE qualificacao='sql' |
| **TEMPO** | Tempo Medio de Fechamento | Dias ate ganhar | AVG(dias entre criacao e ganho) |
| | Velocidade do Pipeline | Valor/tempo | SUM(valor) / AVG(dias_no_funil) |

### 10.3 Payload de Resposta da API

```typescript
interface RelatorioTenant {
  periodo: {
    inicio: Date;
    fim: Date;
  };
  receita: {
    valor_vendas: number;
    mrr: number;
    ticket_medio: number;
    variacao_mes_anterior: {
      valor_vendas: number; // percentual
      mrr: number;
      ticket_medio: number;
    };
  };
  quantidade: {
    vendas_fechadas: number;
    novos_negocios: number;
    taxa_conversao: number;
  };
  atividades: {
    reunioes_realizadas: number;
    ligacoes_feitas: number;
    emails_enviados: number;
    tarefas_concluidas: number;
  };
  leads: {
    novos_contatos: number;
    mqls_gerados: number;
    sqls_gerados: number;
  };
  tempo: {
    tempo_medio_fechamento_dias: number;
    velocidade_pipeline_dia: number;
  };
}
```

---

## 11. Tab Configuracoes do Tenant

### 11.1 Interface

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  TAB: CONFIGURACOES                                                                     │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ── INFORMACOES DA EMPRESA ─────────────────────────────────────────────────────────   │
│                                                                                          │
│  Nome da Empresa               Segmento                                                 │
│  [Empresa Exemplo LTDA___]     [Marketing Digital_____v]                                │
│                                                                                          │
│  Website                       Telefone                                                 │
│  [www.empresa.com.br____]      [(11) 99999-9999______]                                  │
│                                                                                          │
│  Email                         CNPJ                                                     │
│  [contato@empresa.com.br]      [12.345.678/0001-00___]                                  │
│                                                                                          │
│  ── PLANO E ASSINATURA ─────────────────────────────────────────────────────────────   │
│                                                                                          │
│  Plano Atual: Pro (R$ 249/mes)                                                          │
│  Status: [Ativo]                                                                        │
│  Proximo faturamento: 15/03/2026                                                        │
│  Stripe Customer ID: cus_xxxxx                                                          │
│                                                                                          │
│  [Alterar Plano]  [Ver Faturas]  [Cancelar Assinatura]                                 │
│                                                                                          │
│  ── MODULOS ATIVOS ─────────────────────────────────────────────────────────────────   │
│                                                                                          │
│  [✓] Negocios   [✓] Contatos   [✓] Conversas   [✓] Formularios                        │
│  [✓] Conexoes   [✓] Atividades [✓] Dashboard   [ ] Automacoes                          │
│                                                                                          │
│  [Gerenciar Modulos]                                                                    │
│                                                                                          │
│  ── LIMITES DE USO ─────────────────────────────────────────────────────────────────   │
│                                                                                          │
│  Usuarios:       5 / 15 (33%)      [████████░░░░░░░░░░░░░░░░░░░░░░░░░]                 │
│  Oportunidades:  856 / 2000 (43%)  [█████████████░░░░░░░░░░░░░░░░░░░]                  │
│  Storage:        2.3GB / 5GB (46%) [██████████████░░░░░░░░░░░░░░░░░░]                  │
│  Contatos:       1.245 / ilim.     [ilimitado]                                          │
│                                                                                          │
│  ── EXPECTATIVAS (cadastro inicial) ────────────────────────────────────────────────   │
│                                                                                          │
│  Numero de usuarios esperados: 11-25                                                    │
│  Volume de leads/mes: 500-1000                                                          │
│  Principal objetivo: Vendas                                                             │
│  Como conheceu: Google                                                                  │
│  Observacoes: "Empresa em crescimento, migrando de planilhas"                          │
│                                                                                          │
│  ─────────────────────────────────────────────────────────────────────────────────────  │
│                                                                                          │
│  [Salvar Alteracoes]                                                                    │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Rastreamento de Ultimo Acesso

### 12.1 Alteracao na Tabela usuarios

```sql
-- Adicionar colunas para rastrear ultimo acesso
ALTER TABLE usuarios ADD COLUMN ultimo_acesso timestamptz;
ALTER TABLE usuarios ADD COLUMN ultimo_ip inet;
ALTER TABLE usuarios ADD COLUMN ultimo_user_agent text;
```

### 12.2 Tabela de Historico de Acessos (Opcional - Para Auditoria)

```sql
CREATE TABLE historico_acessos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  tipo varchar(20) NOT NULL DEFAULT 'login', -- 'login', 'logout', 'session_expired'
  ip inet,
  user_agent text,
  localizacao jsonb, -- cidade, pais (opcional, via IP)

  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_historico_acessos_usuario ON historico_acessos(usuario_id, criado_em DESC);
CREATE INDEX idx_historico_acessos_org ON historico_acessos(organizacao_id, criado_em DESC);

ALTER TABLE historico_acessos ENABLE ROW LEVEL SECURITY;
```

### 12.3 Funcao para Atualizar Ultimo Acesso

```sql
-- Funcao chamada apos login bem-sucedido
CREATE OR REPLACE FUNCTION atualizar_ultimo_acesso(
  p_usuario_id uuid,
  p_ip inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE usuarios
  SET
    ultimo_acesso = now(),
    ultimo_ip = p_ip,
    ultimo_user_agent = p_user_agent,
    atualizado_em = now()
  WHERE id = p_usuario_id;

  -- Opcional: Registrar no historico
  INSERT INTO historico_acessos (usuario_id, organizacao_id, tipo, ip, user_agent)
  SELECT p_usuario_id, organizacao_id, 'login', p_ip, p_user_agent
  FROM usuarios WHERE id = p_usuario_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 13. Novos Endpoints de API

### 13.1 Detalhes do Tenant

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/admin/organizacoes/:id/usuarios | Listar Admin + Members do tenant | Super Admin |
| GET | /api/v1/admin/organizacoes/:id/relatorios | Metricas de vendas do tenant | Super Admin |
| GET | /api/v1/admin/organizacoes/:id/relatorios/evolucao | Grafico de evolucao | Super Admin |
| GET | /api/v1/admin/organizacoes/:id/limites | Limites de uso vs utilizacao | Super Admin |
| GET | /api/v1/admin/organizacoes/:id/historico-acessos | Historico de logins | Super Admin |

---

## 14. Metricas de Sucesso

### KPIs Primarios

| Metrica | Baseline | Meta | Prazo |
|---------|----------|------|-------|
| Tempo de criacao de tenant | - | < 2 minutos | Lancamento |
| Taxa de adocao de modulos | - | > 60% tenants com 4+ modulos | 3 meses |
| Erros de impersonacao | 0 | 0 | Sempre |
| Uptime do painel admin | - | 99.9% | Continuo |

### KPIs Secundarios

| Metrica | Meta |
|---------|------|
| Tempo medio de suspensao/reativacao | < 5 segundos |
| Cobertura de testes admin | > 80% |
| Latencia de metricas dashboard | < 2 segundos |
| Taxa de sucesso webhooks Stripe | > 99% |

### Criterios de Lancamento

- [ ] Wizard de criacao de tenant funcionando (3 etapas)
- [ ] Listagem de organizacoes com filtros
- [ ] CRUD completo de planos e modulos
- [ ] Impersonacao auditada funcionando
- [ ] Metricas basicas do dashboard
- [ ] Integracao Stripe em sandbox validada

---

## 15. Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| Impersonacao usada indevidamente | Baixa | Alto | Auditoria completa, alertas, revisao periodica |
| Configuracao global incorreta quebra tenants | Media | Alto | Validacao pre-save, ambiente de teste |
| Stripe webhook falha | Media | Alto | Retry automatico, alertas, reconciliacao diaria |
| Performance do dashboard com muitos tenants | Media | Medio | Paginacao, cache, aggregations otimizadas |
| Super Admin perde acesso | Baixa | Critico | Processo de recovery documentado, MFA |

---

## 16. Time to Value (TTV)

### MVP (Dias 1-5)

**Objetivo:** Operacao basica de tenants

| Dia | Entrega |
|-----|---------|
| Dia 1-2 | Listagem de organizacoes + wizard etapa 1 e 2 |
| Dia 3 | Wizard etapa 3 + criacao de Admin |
| Dia 4 | CRUD basico de planos e modulos |
| Dia 5 | Vinculo organizacoes_modulos + teste E2E |

**Criterio de sucesso:** Super Admin consegue criar tenant e Admin recebe email.

### V1.0 (Dias 6-10)

**Objetivo:** Painel completo com metricas

| Dia | Entrega |
|-----|---------|
| Dia 6-7 | Configuracoes globais (Meta, Google, Stripe) |
| Dia 8 | Dashboard de metricas basicas |
| Dia 9 | Impersonacao auditada |
| Dia 10 | Testes, ajustes e deploy |

**Criterio de sucesso:** Painel operacional para gerenciar multiplos tenants.

### V1.1+ (Pos-lancamento)

| Fase | Escopo |
|------|--------|
| V1.1 | Detalhes do tenant (tabs usuarios, relatorios, config) |
| V1.2 | Integracao Stripe completa (checkout, webhooks) |
| V1.3 | Exportacao de relatorios (PDF/Excel) |

---

## 17. Checklist de Implementacao

### Backend - Funcionalidades Existentes
- [ ] CRUD organizacoes (wizard 3 etapas)
- [ ] CRUD planos
- [ ] CRUD modulos
- [ ] Vinculo planos_modulos
- [ ] Vinculo organizacoes_modulos
- [ ] CRUD configuracoes_globais
- [ ] Integracao Stripe (Checkout, Webhooks)
- [ ] CRUD assinaturas
- [ ] Endpoint de impersonacao
- [ ] Metricas agregadas

### Backend - Detalhes do Tenant (v1.2)
- [ ] Endpoint GET /organizacoes/:id/usuarios
- [ ] Endpoint GET /organizacoes/:id/relatorios
- [ ] Endpoint GET /organizacoes/:id/relatorios/evolucao
- [ ] Endpoint GET /organizacoes/:id/limites
- [ ] Endpoint GET /organizacoes/:id/historico-acessos
- [ ] Adicionar coluna ultimo_acesso em usuarios
- [ ] Criar tabela historico_acessos
- [ ] Funcao atualizar_ultimo_acesso
- [ ] Middleware para registrar acesso apos login
- [ ] Queries de metricas por tenant (15 metricas em 5 categorias)

### Frontend - Funcionalidades Existentes
- [ ] Listagem de organizacoes
- [ ] Wizard criar organizacao (3 etapas)
- [ ] Modal gerenciar modulos
- [ ] Pagina de planos
- [ ] Pagina configuracoes globais
- [ ] Dashboard de metricas
- [ ] Modo impersonacao (banner + restricoes)

### Frontend - Detalhes do Tenant (v1.2)
- [ ] Pagina de detalhes do tenant (/admin/organizacoes/:id)
- [ ] Tab Usuarios (Admin + Members com ultimo acesso)
- [ ] Tab Relatorios (15 metricas + grafico de evolucao)
- [ ] Tab Configuracoes (plano, modulos, limites)
- [ ] Componente de cards de metricas por categoria
- [ ] Grafico de evolucao temporal (Recharts)
- [ ] Exportacao PDF/Excel

### Stripe
- [ ] Criar produtos e precos no Stripe
- [ ] Implementar Checkout Session
- [ ] Implementar webhooks
- [ ] Testar fluxo completo em sandbox

---

## Historico de Versoes

| Versao | Data | Autor | Mudancas |
|--------|------|-------|----------|
| v1.0 | 2026-01-31 | Arquiteto de Produto | Versao inicial |
| v1.1 | 2026-01-31 | Arquiteto de Produto | Adicionada tabela configuracoes_globais, separacao clara entre config global (App/OAuth) e config por tenant (contas pessoais), adicionado Google reCAPTCHA v3 |
| v1.2 | 2026-02-03 | Arquiteto de Produto | RF-012 a RF-019: Detalhes do Tenant (3 tabs: Usuarios, Relatorios, Configuracoes), rastreamento de ultimo acesso (Admin + Members), relatorios de vendas por tenant (15 metricas em 5 categorias: RECEITA, QUANTIDADE, ATIVIDADES, LEADS, TEMPO), limites de uso, historico de acessos, novos endpoints de API |
| v1.3 | 2026-02-03 | Arquiteto de Produto | Adicionado: Hierarquia de Requisitos, Metricas de Sucesso, Riscos e Mitigacoes, Time to Value |
| v1.4 | 2026-02-03 | Arquiteto de Produto | **BOOTSTRAP DO SISTEMA**: Nova secao documentando usuario Super Admin pre-criado (superadmin@renovedigital.com.br), script de seed, fluxo de primeiro acesso, redirecionamento por role, seguranca do bootstrap. PRD-14 movido para Fase 0 de implementacao (apos PRD-04) por ser pre-requisito do sistema |
