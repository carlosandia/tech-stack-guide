# PRD-08: Conexoes - CRM Renove

| Campo | Valor |
|-------|-------|
| **Autor** | Arquiteto de Produto |
| **Data de criacao** | 2026-01-31 |
| **Ultima atualizacao** | 2026-01-31 |
| **Versao** | v1.4 |
| **Status** | Em desenvolvimento |
| **Dependencias** | PRD-04, PRD-05, PRD-14 |
| **Revisor tecnico** | Tech Lead |

---

## Resumo Executivo

Este documento detalha as **conexoes de integracao** disponiveis no CRM Renove a nivel de tenant (Admin/Member). Complementa o PRD-05 (Configuracoes) com especificacoes tecnicas completas para cada tipo de conexao.

**Conexoes documentadas:**
1. WhatsApp (Nao Oficial) via WAHA Plus
2. Meta Ads (Lead Ads, Conversions API, Custom Audiences)
3. Google Calendar
4. Email Pessoal (Gmail OAuth + SMTP Manual)
5. Instagram Direct

---

## Hierarquia de Requisitos

### Theme

**Integracoes Omnichannel para Automacao de Vendas**

Sistema de conexoes externas que permite captura automatica de leads (Meta Ads), comunicacao multicanal (WhatsApp, Instagram, Email) e sincronizacao de agenda (Google Calendar) para equipes de vendas.

### Epic

**Conexoes OAuth com Resiliencia e Seguranca Multi-Tenant**

Implementar sistema de integracoes OAuth para Meta, Google e WAHA com credenciais globais gerenciadas pelo Super Admin, permitindo Admin/Member conectar suas contas pessoais com retry automatico, circuit breaker e auditoria completa.

### Features

#### Feature 1: WhatsApp via WAHA Plus

**User Story:** Como vendedor, quero conectar meu WhatsApp ao CRM para enviar e receber mensagens diretamente na plataforma.

**Criterios de Aceite:**
- QR Code para autenticacao
- Sessao por usuario isolada
- Webhooks para mensagens recebidas
- Status de conexao em tempo real

#### Feature 2: Meta Ads (Lead Ads, CAPI, Audiences)

**User Story:** Como Admin, quero integrar Meta Ads para capturar leads automaticamente e rastrear conversoes.

**Criterios de Aceite:**
- OAuth com Facebook Pages
- Mapeamento de formularios Lead Ads
- Conversions API com eventos de pipeline
- Custom Audiences sincronizadas

#### Feature 3: Google Calendar

**User Story:** Como vendedor, quero sincronizar meu calendario Google para agendar reunioes diretamente pelo CRM.

**Criterios de Aceite:**
- OAuth com Google Account
- Selecao de calendario especifico
- Criacao de eventos vinculados a oportunidades
- Sincronizacao bidirecional

#### Feature 4: Email (Gmail OAuth + SMTP Manual)

**User Story:** Como vendedor, quero enviar emails pelo CRM usando minha conta Gmail ou servidor SMTP.

**Criterios de Aceite:**
- OAuth para Gmail com permissoes de envio
- Configuracao SMTP manual com auto-deteccao
- Teste de conexao antes de salvar
- Tracking de abertura (opcional)

#### Feature 5: Instagram Direct

**User Story:** Como vendedor, quero receber mensagens do Instagram Direct no CRM para atender clientes pelo canal.

**Criterios de Aceite:**
- OAuth via Meta (requer Facebook Page vinculada)
- Webhooks para mensagens recebidas
- Janela de 24h para resposta
- Conversao para pre-oportunidade

---

## Separacao de Responsabilidades

### Arquitetura de Credenciais: Global vs Tenant

**IMPORTANTE:** Todas as conexoes OAuth (Meta, Google, Instagram) utilizam credenciais de aplicativo configuradas pelo **Super Admin** no PRD-14. Os usuarios Admin/Member apenas fazem o fluxo OAuth para autorizar suas proprias contas, mas NAO configuram Client ID ou App Secret.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CONEXOES: GLOBAL vs TENANT                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SUPER ADMIN (PRD-14)                    ADMIN/MEMBER (Este PRD)            │
│  ─────────────────────                   ──────────────────────             │
│  Credenciais do APP                      OAuth com conta pessoal            │
│  (obrigatorio para OAuth funcionar)      (usa credenciais globais)          │
│                                                                             │
│  Meta App:                               Meta (Admin faz OAuth):            │
│  - App ID ────────────────────────────>  - Autoriza paginas do Facebook    │
│  - App Secret ────────────────────────>  - Configura Pixel ID (CAPI)       │
│  - Webhook Verify Token                  - Configura Ad Account ID          │
│                                          - Mapeia Formularios Lead Ads      │
│                                          - Gerencia Custom Audiences        │
│                                                                             │
│  Google App:                             Google (Admin/Member faz OAuth):   │
│  - Client ID ─────────────────────────>  - Autoriza calendario pessoal     │
│  - Client Secret ─────────────────────>  - Seleciona qual calendario usar  │
│                                          - Sincroniza eventos/reunioes      │
│                                                                             │
│  WAHA:                                   WhatsApp (Admin/Member):           │
│  - URL da instancia ──────────────────>  - Conecta proprio numero          │
│  - API Key ───────────────────────────>  - Escaneia QR Code                │
│                                          - Sessao por usuario               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Fluxo simplificado:**
1. Super Admin configura credenciais do App no PRD-14 (uma vez)
2. Admin/Member clica "Conectar" no CRM
3. Sistema usa credenciais globais para gerar URL OAuth
4. Usuario autoriza sua conta pessoal no provedor (Meta/Google)
5. Sistema salva tokens do usuario no tenant

---

## Roles e Permissoes

### Matriz de Permissoes por Conexao

| Conexao | Super Admin | Admin | Member |
|---------|-------------|-------|--------|
| WhatsApp (WAHA) | Config global (WAHA URL, API Key) | Conectar/Desconectar | Conectar proprio numero |
| Meta Ads - Lead Ads | Config global (App ID, Secret) | OAuth + CRUD completo | **SE PERMITIDO*** |
| Meta Ads - Conversions API | Config global (App ID, Secret) | CRUD completo | **BLOQUEADO** |
| Meta Ads - Custom Audiences | Config global (App ID, Secret) | CRUD completo | **BLOQUEADO** |
| Instagram Direct | Config global (App ID, Secret) | OAuth + Conectar | **SE PERMITIDO*** |
| Google Calendar | Config global (Client ID, Secret) | OAuth + Conectar | Conectar proprio |
| Email Pessoal - Gmail OAuth | Config global (Client ID, Secret) | OAuth + Conectar | Conectar proprio |
| Email Pessoal - SMTP Manual | N/A | Configurar proprio | Configurar proprio |

### Modelo de Permissoes para Member

**Regra geral:** Admin pode fazer conexoes por padrao. Member **apenas pode** se Admin conceder permissao explicita.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PERMISSOES DE CONEXAO PARA MEMBER                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Conexao              Padrao Member    Admin pode permitir?                 │
│  ───────────────────  ──────────────   ─────────────────────                │
│  WhatsApp             PERMITIDO        N/A (sempre permitido)               │
│  Google Calendar      PERMITIDO        N/A (sempre permitido)               │
│  Meta Lead Ads        BLOQUEADO        SIM - via permissao especifica       │
│  Meta CAPI            BLOQUEADO        NAO - apenas Admin                   │
│  Meta Audiences       BLOQUEADO        NAO - apenas Admin                   │
│  Instagram Direct     BLOQUEADO        SIM - via permissao especifica       │
│  Email Gmail OAuth    PERMITIDO        N/A (sempre permitido)               │
│  Email SMTP Manual    PERMITIDO        N/A (sempre permitido)               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Implementacao da permissao:**

O Admin pode conceder permissao a Members especificos via configuracao de equipe:

```sql
-- Em usuarios ou permissoes_usuarios
ALTER TABLE usuarios ADD COLUMN permissoes_conexoes jsonb DEFAULT '{
  "meta_lead_ads": false,
  "instagram_direct": false
}';
```

Ou via tabela de permissoes (se usar sistema de permissoes granulares):

```sql
-- permissoes_usuarios
INSERT INTO permissoes_usuarios (usuario_id, permissao, valor)
VALUES
  ('member-uuid', 'conexao.meta_lead_ads', true),
  ('member-uuid', 'conexao.instagram_direct', true);
```

**Nota:** WhatsApp, Google Calendar e Email Pessoal (Gmail OAuth ou SMTP) sao sempre permitidos para Members pois sao conexoes pessoais que beneficiam o trabalho diario do vendedor.

---

## 1. WhatsApp via WAHA Plus

### 1.1 Visao Geral

Integracao com WhatsApp usando WAHA Plus (WhatsApp HTTP API) - solucao nao-oficial que permite conectar numeros pessoais via QR Code.

**Caracteristicas principais:**
- Cada Admin ou Member pode conectar seu proprio numero
- Sessao isolada por `organizacao_id` + `usuario_id`
- QR Code gerado sob demanda
- Webhooks para receber mensagens em tempo real
- Suporte a multi-device (WhatsApp Web)

### 1.2 Fluxo de Conexao

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUXO DE CONEXAO WHATSAPP                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Usuario clica "Conectar WhatsApp" no CRM                                │
│     └─> POST /api/v1/conexoes/whatsapp/iniciar                              │
│         └─> Backend cria sessao no WAHA: POST /api/sessions                 │
│         └─> Retorna session_name: "wpp-{org_id}-{user_id}"                  │
│                                                                             │
│  2. Frontend solicita QR Code                                               │
│     └─> GET /api/v1/conexoes/whatsapp/qr-code                               │
│         └─> Backend busca: GET /api/{session}/auth/qr                       │
│         └─> Retorna imagem base64 para exibir                               │
│                                                                             │
│  3. Usuario escaneia QR Code no celular                                     │
│     └─> WhatsApp valida e conecta                                           │
│     └─> WAHA envia webhook: session.status = "CONNECTED"                    │
│     └─> Backend atualiza sessoes_whatsapp.status = "connected"              │
│     └─> Frontend detecta via polling e fecha modal                          │
│                                                                             │
│  4. Conexao estabelecida - Operacao normal                                  │
│     └─> Mensagens recebidas via webhook: "message"                          │
│     └─> Backend processa e salva em tabela conversas                        │
│     └─> Frontend atualiza via Realtime                                      │
│                                                                             │
│  5. Desconexao (logout)                                                     │
│     └─> POST /api/v1/conexoes/whatsapp/desconectar                          │
│     └─> Backend: POST /api/{session}/logout                                 │
│     └─> Backend: DELETE /api/sessions/{session}                             │
│     └─> Atualiza sessoes_whatsapp.status = "disconnected"                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Interface do Usuario

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Configuracoes > Conexoes > WhatsApp                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  [WhatsApp Icon]  Minha Conexao WhatsApp                              │  │
│  │                                                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                                                                 │  │  │
│  │  │  Status: [verde] Conectado                                      │  │  │
│  │  │  Numero: +55 11 99999-9999                                      │  │  │
│  │  │  Conectado em: 28/01/2026, 14:30                                │  │  │
│  │  │  Ultima mensagem: Hoje, 16:45                                   │  │  │
│  │  │                                                                 │  │  │
│  │  │  [Desconectar]                                                  │  │  │
│  │  │                                                                 │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  -- OU se nao conectado --                                                  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  [WhatsApp Icon]  Conectar WhatsApp                                   │  │
│  │                                                                       │  │
│  │  Conecte seu numero do WhatsApp para enviar e receber mensagens      │  │
│  │  diretamente pelo CRM.                                               │  │
│  │                                                                       │  │
│  │  [Conectar WhatsApp]                                                  │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Modal de QR Code:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Conectar WhatsApp                                                      [X]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Escaneie o QR Code com seu WhatsApp:                                       │
│                                                                             │
│  1. Abra o WhatsApp no seu celular                                          │
│  2. Toque em Configuracoes > Dispositivos conectados                        │
│  3. Toque em "Conectar um dispositivo"                                      │
│  4. Aponte a camera para o QR Code abaixo                                   │
│                                                                             │
│                    ┌─────────────────────┐                                  │
│                    │                     │                                  │
│                    │    [QR CODE IMG]    │                                  │
│                    │                     │                                  │
│                    └─────────────────────┘                                  │
│                                                                             │
│  QR Code expira em: 00:45                                                   │
│                                                                             │
│  [Gerar Novo QR Code]                                                       │
│                                                                             │
│  Aguardando conexao...                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Modelo de Dados

```sql
-- Sessoes WhatsApp por usuario
CREATE TABLE sessoes_whatsapp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),

  -- Identificacao da sessao no WAHA
  session_name varchar(100) NOT NULL, -- formato: wpp-{org_id}-{user_id}

  -- Dados do numero conectado
  phone_number varchar(20),           -- numero do WhatsApp
  phone_name varchar(255),            -- nome no perfil

  -- Status da conexao
  status varchar(20) NOT NULL DEFAULT 'disconnected',
    -- disconnected: nao conectado
    -- qr_pending: aguardando escaneamento do QR
    -- connecting: conectando
    -- connected: conectado e operacional
    -- failed: falha na conexao

  -- Timestamps de conexao
  ultimo_qr_gerado timestamptz,
  conectado_em timestamptz,
  desconectado_em timestamptz,
  ultima_mensagem_em timestamptz,

  -- Webhook config
  webhook_url text,
  webhook_events text[] DEFAULT ARRAY['message', 'message.ack', 'session.status'],

  -- Estatisticas
  total_mensagens_enviadas integer DEFAULT 0,
  total_mensagens_recebidas integer DEFAULT 0,

  -- Timestamps padrao
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  -- Constraint: um usuario por tenant
  UNIQUE(organizacao_id, usuario_id)
);

-- Indices
CREATE INDEX idx_sessoes_wpp_org ON sessoes_whatsapp(organizacao_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_sessoes_wpp_status ON sessoes_whatsapp(organizacao_id, status) WHERE deletado_em IS NULL;
CREATE INDEX idx_sessoes_wpp_session ON sessoes_whatsapp(session_name);

-- RLS
ALTER TABLE sessoes_whatsapp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON sessoes_whatsapp
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### 1.5 Endpoints de API

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| POST | /api/v1/conexoes/whatsapp/iniciar | Criar sessao no WAHA | Admin/Member |
| GET | /api/v1/conexoes/whatsapp/qr-code | Obter QR code base64 | Admin/Member |
| GET | /api/v1/conexoes/whatsapp/status | Status atual da conexao | Admin/Member |
| POST | /api/v1/conexoes/whatsapp/desconectar | Logout e remover sessao | Admin/Member |
| POST | /webhooks/waha/:tenant_id | Receber eventos do WAHA | Sistema (WAHA) |

#### Detalhamento dos Endpoints

**POST /api/v1/conexoes/whatsapp/iniciar**

Request:
```json
{}
```

Response (201):
```json
{
  "id": "uuid",
  "session_name": "wpp-abc123-def456",
  "status": "qr_pending",
  "message": "Sessao criada. Solicite o QR Code para continuar."
}
```

**GET /api/v1/conexoes/whatsapp/qr-code**

Response (200):
```json
{
  "qr_code": "data:image/png;base64,iVBORw0KGgo...",
  "expires_in": 60,
  "status": "qr_pending"
}
```

**GET /api/v1/conexoes/whatsapp/status**

Response (200):
```json
{
  "id": "uuid",
  "status": "connected",
  "phone_number": "+5511999999999",
  "phone_name": "Joao Silva",
  "conectado_em": "2026-01-28T14:30:00Z",
  "ultima_mensagem_em": "2026-01-28T16:45:00Z"
}
```

### 1.6 Webhooks WAHA

O WAHA envia eventos para `POST /webhooks/waha/:tenant_id`:

**Evento: session.status**
```json
{
  "event": "session.status",
  "session": "wpp-abc123-def456",
  "payload": {
    "status": "CONNECTED"
  }
}
```

**Evento: message**
```json
{
  "event": "message",
  "session": "wpp-abc123-def456",
  "payload": {
    "id": "msg_id",
    "from": "5511999999999@c.us",
    "to": "5511888888888@c.us",
    "body": "Ola, gostaria de saber mais sobre...",
    "timestamp": 1706456700,
    "type": "chat"
  }
}
```

---

## 2. Meta Ads - Lead Ads

### 2.1 Visao Geral

Integracao com Facebook Lead Ads para captura automatica de leads de formularios de anuncios do Facebook e Instagram.

**Caracteristicas principais:**
- OAuth para conectar paginas do Facebook
- Listagem de formularios ativos
- Mapeamento de campos do formulario para campos do CRM
- Criacao automatica de contatos na pipeline selecionada
- Webhooks para receber leads em tempo real

### 2.2 Fluxo de Integracao

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUXO LEAD ADS                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Admin clica "Conectar Meta Ads"                                         │
│     └─> GET /api/v1/conexoes/meta/auth-url                                  │
│     └─> Redirect para Facebook OAuth                                        │
│     └─> Usuario autoriza permissoes: leads_retrieval, pages_manage_ads      │
│     └─> Callback: POST /api/v1/conexoes/meta/callback                       │
│     └─> Backend salva tokens em conexoes_meta                               │
│                                                                             │
│  2. Admin seleciona pagina                                                  │
│     └─> GET /api/v1/conexoes/meta/paginas                                   │
│     └─> Mostra lista de paginas com permissao                               │
│     └─> Admin seleciona pagina desejada                                     │
│     └─> Backend salva em paginas_meta                                       │
│                                                                             │
│  3. Admin configura formulario                                              │
│     └─> GET /api/v1/conexoes/meta/formularios/:page_id                      │
│     └─> Mostra formularios de Lead Ads ativos                               │
│     └─> Admin seleciona formulario                                          │
│     └─> Admin mapeia campos: form_field → campo_crm                         │
│     └─> Admin seleciona pipeline e etapa destino                            │
│     └─> POST /api/v1/conexoes/meta/formularios                              │
│                                                                             │
│  4. Lead chega (webhook)                                                    │
│     └─> Meta envia webhook para /webhooks/meta-leads                        │
│     └─> Backend busca dados do lead via Graph API                           │
│     └─> Backend cria contato com campos mapeados                            │
│     └─> Backend cria oportunidade na pipeline/etapa configurada             │
│     └─> Notifica owner via Realtime                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Interface do Usuario

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Configuracoes > Conexoes > Meta Ads > Lead Ads                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Conta conectada: Renove Marketing           [Trocar Conta]                 │
│                                                                             │
│  Pagina: [Renove Consultoria v]                                             │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Formularios Mapeados:                                                      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ [form] Captacao Site Principal                                      │    │
│  │        Form ID: 123456789012345                                     │    │
│  │        Pipeline: Vendas Principais → Etapa: Novos Leads             │    │
│  │        Leads recebidos: 127 | Ultimo: Hoje, 14:30                   │    │
│  │        Status: [verde] Ativo                                        │    │
│  │        [Editar Mapeamento] [Desativar]                              │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ [form] Ebook Marketing Digital                                      │    │
│  │        Form ID: 987654321098765                                     │    │
│  │        Pipeline: Inbound → Etapa: MQL                               │    │
│  │        Leads recebidos: 45 | Ultimo: Ontem, 18:20                   │    │
│  │        Status: [verde] Ativo                                        │    │
│  │        [Editar Mapeamento] [Desativar]                              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  [+ Adicionar Formulario]                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Modal de Mapeamento:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Configurar Formulario Lead Ads                                         [X]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Formulario: Captacao Site Principal                                        │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Destino do Lead:                                                           │
│                                                                             │
│  Pipeline: [Vendas Principais v]                                            │
│  Etapa:    [Novos Leads v]                                                  │
│  Owner:    [Distribuicao automatica v]                                      │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Mapeamento de Campos:                                                      │
│                                                                             │
│  ┌───────────────────────────┬───────────────────────────┐                  │
│  │ Campo do Formulario       │ Campo do CRM              │                  │
│  ├───────────────────────────┼───────────────────────────┤                  │
│  │ full_name                 │ [Nome v]                  │                  │
│  │ email                     │ [Email v]                 │                  │
│  │ phone_number              │ [Telefone v]              │                  │
│  │ company_name              │ [Empresa v]               │                  │
│  │ job_title                 │ [Cargo v]                 │                  │
│  │ city                      │ [Cidade v]                │                  │
│  │ custom_question_1         │ [Origem do Lead v]        │                  │
│  └───────────────────────────┴───────────────────────────┘                  │
│                                                                             │
│  [Cancelar]                                    [Salvar Configuracao]        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 Modelo de Dados

```sql
-- Conexao OAuth com Meta (por tenant)
CREATE TABLE conexoes_meta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  -- OAuth tokens (criptografados)
  access_token_encrypted text NOT NULL,
  refresh_token_encrypted text,
  token_expires_at timestamptz,

  -- Dados da conta conectada
  meta_user_id varchar(50),
  meta_user_name varchar(255),
  meta_user_email varchar(255),

  -- Status
  status varchar(20) NOT NULL DEFAULT 'active',
    -- active, expired, revoked
  ultimo_sync timestamptz,
  ultimo_erro text,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  UNIQUE(organizacao_id)
);

-- Paginas do Facebook conectadas
CREATE TABLE paginas_meta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conexao_id uuid NOT NULL REFERENCES conexoes_meta(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL,

  -- Dados da pagina
  page_id varchar(50) NOT NULL,
  page_name varchar(255),
  page_access_token_encrypted text,

  -- Permissoes verificadas
  leads_retrieval boolean DEFAULT false,
  pages_manage_ads boolean DEFAULT false,

  -- Status
  ativo boolean DEFAULT true,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),

  UNIQUE(organizacao_id, page_id)
);

-- Mapeamento de formularios Lead Ads
CREATE TABLE formularios_lead_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  pagina_id uuid NOT NULL REFERENCES paginas_meta(id) ON DELETE CASCADE,

  -- Dados do formulario no Meta
  form_id varchar(50) NOT NULL,
  form_name varchar(255),

  -- Destino no CRM
  funil_id uuid REFERENCES funis(id),
  etapa_destino_id uuid REFERENCES etapas_funil(id),
  owner_id uuid REFERENCES usuarios(id), -- NULL = distribuicao automatica

  -- Mapeamento de campos (form_field → campo_crm)
  mapeamento_campos jsonb NOT NULL DEFAULT '{}',
  -- Exemplo:
  -- {
  --   "full_name": "nome",
  --   "email": "email",
  --   "phone_number": "telefone",
  --   "company_name": "empresa",
  --   "custom_question_1": "campo_customizado_uuid"
  -- }

  -- Configuracoes adicionais
  criar_oportunidade boolean DEFAULT true,
  tags_automaticas text[] DEFAULT '{}',
  notificar_owner boolean DEFAULT true,

  -- Estatisticas
  total_leads_recebidos integer DEFAULT 0,
  ultimo_lead_recebido timestamptz,

  -- Status
  ativo boolean DEFAULT true,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  UNIQUE(organizacao_id, form_id)
);

-- Indices
CREATE INDEX idx_conexoes_meta_org ON conexoes_meta(organizacao_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_paginas_meta_org ON paginas_meta(organizacao_id);
CREATE INDEX idx_form_lead_ads_org ON formularios_lead_ads(organizacao_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_form_lead_ads_form ON formularios_lead_ads(form_id);

-- RLS
ALTER TABLE conexoes_meta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON conexoes_meta
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);

ALTER TABLE paginas_meta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON paginas_meta
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);

ALTER TABLE formularios_lead_ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON formularios_lead_ads
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### 2.5 Endpoints de API

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/conexoes/meta/auth-url | URL para OAuth Meta | Admin |
| GET | /api/v1/conexoes/meta/callback | Callback do OAuth | Sistema |
| GET | /api/v1/conexoes/meta | Status da conexao | Admin |
| DELETE | /api/v1/conexoes/meta | Desconectar conta | Admin |
| GET | /api/v1/conexoes/meta/paginas | Listar paginas | Admin |
| POST | /api/v1/conexoes/meta/paginas/:page_id/selecionar | Selecionar pagina | Admin |
| GET | /api/v1/conexoes/meta/formularios/:page_id | Listar formularios | Admin |
| POST | /api/v1/conexoes/meta/formularios | Criar mapeamento | Admin |
| GET | /api/v1/conexoes/meta/formularios/:id | Detalhes do mapeamento | Admin |
| PATCH | /api/v1/conexoes/meta/formularios/:id | Atualizar mapeamento | Admin |
| DELETE | /api/v1/conexoes/meta/formularios/:id | Remover mapeamento | Admin |
| POST | /webhooks/meta-leads | Webhook para leads | Sistema (Meta) |

---

## 3. Meta Ads - Conversions API

### 3.1 Visao Geral

A Conversions API (CAPI) permite enviar eventos do CRM de volta para o Meta, melhorando a otimizacao de campanhas e atribuicao de conversoes.

**Eventos suportados:**
- `Lead` - Novo contato criado
- `Schedule` - Reuniao agendada
- `CompleteRegistration` - Lead qualificado (MQL)
- `Purchase` - Oportunidade ganha
- `Other` (lead_lost) - Oportunidade perdida

### 3.2 Fluxo de Eventos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUXO CONVERSIONS API                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CRM Renove                                  Meta Ads                       │
│  ──────────                                  ────────                       │
│                                                                             │
│  [Contato Criado] ─────────────────────────> Lead                           │
│       │                                                                     │
│       v                                                                     │
│  [Reuniao Agendada] ───────────────────────> Schedule                       │
│       │                                                                     │
│       v                                                                     │
│  [Badge MQL] ──────────────────────────────> CompleteRegistration           │
│       │                                                                     │
│       v                                                                     │
│  [Oportunidade Ganha] ─────────────────────> Purchase (valor)               │
│       │                                                                     │
│       v                                                                     │
│  [Oportunidade Perdida] ───────────────────> Other (lead_lost)              │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Dados enviados em cada evento:                                             │
│  - event_name: tipo do evento                                               │
│  - event_time: timestamp unix                                               │
│  - user_data: email, telefone, nome (hashados SHA256)                       │
│  - custom_data: valor, moeda, conteudo                                      │
│  - action_source: "crm"                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Interface do Usuario

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Configuracoes > Conexoes > Meta Ads > Conversions API                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Configuracao do Pixel:                                                     │
│                                                                             │
│  Pixel ID:      [1234567890123456        ]                                  │
│  Access Token:  [************************] [Mostrar]                        │
│                                                                             │
│  [Testar Conexao]  Status: [verde] Conectado                                │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Eventos para Enviar ao Meta:                                               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ [x] Lead                                                            │    │
│  │     Gatilho: Quando um novo contato e criado no CRM                 │    │
│  │     Evento Meta: Lead                                               │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ [x] Agendamento                                                     │    │
│  │     Gatilho: Quando uma reuniao e agendada                          │    │
│  │     Evento Meta: Schedule                                           │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ [x] Lead Qualificado (MQL)                                          │    │
│  │     Gatilho: Quando contato recebe badge MQL                        │    │
│  │     Evento Meta: CompleteRegistration                               │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ [x] Venda Fechada (Won)                                             │    │
│  │     Gatilho: Oportunidade marcada como ganha                        │    │
│  │     Evento Meta: Purchase                                           │    │
│  │     Opcao: [x] Enviar valor da oportunidade                         │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ [x] Oportunidade Perdida                                            │    │
│  │     Gatilho: Oportunidade marcada como perdida                      │    │
│  │     Evento Meta: Other (custom: lead_lost)                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Estatisticas (ultimos 30 dias):                                            │
│  - Eventos enviados: 1,234                                                  │
│  - Taxa de sucesso: 98.5%                                                   │
│  - Ultimo envio: Hoje, 16:45                                                │
│                                                                             │
│  [Ver Logs de Envio]                                                        │
│                                                                             │
│  [Cancelar]                                   [Salvar Configuracao]         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Modelo de Dados

```sql
-- Configuracao Conversions API por tenant
CREATE TABLE config_conversions_api (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  -- Credenciais do Pixel
  pixel_id varchar(50) NOT NULL,
  access_token_encrypted text NOT NULL,

  -- Eventos habilitados
  eventos_habilitados jsonb NOT NULL DEFAULT '{
    "lead": true,
    "schedule": true,
    "mql": true,
    "won": true,
    "lost": true
  }',

  -- Configuracoes por evento
  config_eventos jsonb DEFAULT '{
    "won": { "enviar_valor": true }
  }',

  -- Status
  ativo boolean DEFAULT false,
  ultimo_teste timestamptz,
  ultimo_teste_sucesso boolean,

  -- Estatisticas
  total_eventos_enviados integer DEFAULT 0,
  total_eventos_sucesso integer DEFAULT 0,
  ultimo_evento_enviado timestamptz,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),

  UNIQUE(organizacao_id)
);

-- Log de eventos enviados para Conversions API
CREATE TABLE log_conversions_api (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL,
  config_id uuid REFERENCES config_conversions_api(id),

  -- Dados do evento
  event_name varchar(50) NOT NULL,
  event_time timestamptz NOT NULL,

  -- Entidade origem
  entidade_tipo varchar(50), -- contato, oportunidade, tarefa
  entidade_id uuid,

  -- Payload enviado (sem dados sensiveis)
  payload_resumo jsonb,

  -- Resposta do Meta
  status varchar(20) NOT NULL, -- sent, failed, pending
  response_code integer,
  response_body text,
  fbrq_event_id varchar(100), -- ID do evento retornado pelo Meta

  criado_em timestamptz NOT NULL DEFAULT now()
);

-- Indices para consultas de log
CREATE INDEX idx_log_capi_org ON log_conversions_api(organizacao_id, criado_em DESC);
CREATE INDEX idx_log_capi_status ON log_conversions_api(organizacao_id, status);
CREATE INDEX idx_log_capi_event ON log_conversions_api(organizacao_id, event_name);

-- RLS
ALTER TABLE config_conversions_api ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON config_conversions_api
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);

ALTER TABLE log_conversions_api ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON log_conversions_api
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### 3.5 Endpoints de API

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/conexoes/meta/capi | Obter configuracao | Admin |
| POST | /api/v1/conexoes/meta/capi | Criar/atualizar config | Admin |
| POST | /api/v1/conexoes/meta/capi/testar | Enviar evento teste | Admin |
| GET | /api/v1/conexoes/meta/capi/logs | Historico de envios | Admin |
| GET | /api/v1/conexoes/meta/capi/stats | Estatisticas | Admin |

### 3.6 Payload de Evento

```javascript
// Exemplo de payload enviado para Conversions API
{
  "data": [{
    "event_name": "Purchase",
    "event_time": 1706456700,
    "action_source": "system_generated",
    "user_data": {
      "em": "sha256_hash_do_email",
      "ph": "sha256_hash_do_telefone",
      "fn": "sha256_hash_do_primeiro_nome",
      "ln": "sha256_hash_do_sobrenome",
      "client_ip_address": "192.168.1.1",
      "client_user_agent": "CRM-Renove/1.0"
    },
    "custom_data": {
      "currency": "BRL",
      "value": 5000.00,
      "content_name": "Consultoria Premium"
    }
  }]
}
```

---

## 4. Meta Ads - Custom Audiences

### 4.1 Visao Geral

Permite criar e sincronizar publicos personalizados no Meta Ads baseados em eventos do CRM.

**Casos de uso:**
- Criar publico de leads novos para remarketing
- Criar publico de MQLs para lookalike
- Criar publico de clientes (Won) para exclusao ou upsell
- Criar publico de perdidos para reconquista

### 4.2 Interface do Usuario

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Configuracoes > Conexoes > Meta Ads > Publicos Personalizados                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Conta de Anuncios: [act_123456789 v]                                       │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Publicos Sincronizados:                                                    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ CRM - Leads Novos                                                   │    │
│  │ Audience ID: 987654321012345                                        │    │
│  │ Sincronizar quando: Novo contato criado                             │    │
│  │ Usuarios: 1,234 | Ultimo sync: Hoje, 14:30                          │    │
│  │ Status: [verde] Ativo                                               │    │
│  │ [Editar] [Sincronizar Agora] [Desativar]                            │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ CRM - Leads Qualificados (MQL)                                      │    │
│  │ Audience ID: 123789456012345                                        │    │
│  │ Sincronizar quando: Contato recebe badge MQL                        │    │
│  │ Usuarios: 456 | Ultimo sync: Hoje, 14:30                            │    │
│  │ Status: [verde] Ativo                                               │    │
│  │ [Editar] [Sincronizar Agora] [Desativar]                            │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ CRM - Clientes (Won)                                                │    │
│  │ Audience ID: 456123789012345                                        │    │
│  │ Sincronizar quando: Oportunidade marcada como ganha                 │    │
│  │ Usuarios: 89 | Ultimo sync: Ontem, 18:00                            │    │
│  │ Status: [verde] Ativo                                               │    │
│  │ [Editar] [Sincronizar Agora] [Desativar]                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  [+ Criar Novo Publico]                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Modelo de Dados

```sql
-- Publicos customizados sincronizados com Meta
CREATE TABLE custom_audiences_meta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  conexao_meta_id uuid REFERENCES conexoes_meta(id),

  -- Dados do publico no Meta
  audience_id varchar(50) NOT NULL,
  audience_name varchar(255) NOT NULL,
  ad_account_id varchar(50) NOT NULL, -- act_123456789

  -- Regra de sincronizacao
  tipo_sincronizacao varchar(20) NOT NULL DEFAULT 'evento',
    -- 'evento': adiciona quando evento ocorre
    -- 'manual': apenas sync manual

  -- Se tipo = 'evento', qual evento dispara
  evento_gatilho varchar(50),
    -- 'lead': novo contato
    -- 'mql': badge MQL
    -- 'schedule': reuniao agendada
    -- 'won': oportunidade ganha
    -- 'lost': oportunidade perdida

  -- Estatisticas
  total_usuarios integer DEFAULT 0,
  ultimo_sync timestamptz,
  ultimo_sync_sucesso boolean,

  -- Status
  ativo boolean DEFAULT true,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  UNIQUE(organizacao_id, audience_id)
);

-- Membros do publico (controle local de quem foi adicionado)
CREATE TABLE custom_audience_membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audience_id uuid NOT NULL REFERENCES custom_audiences_meta(id) ON DELETE CASCADE,
  contato_id uuid NOT NULL REFERENCES contatos(id),

  -- Hashes enviados (para referencia, nao sao os dados reais)
  email_hash varchar(64),
  phone_hash varchar(64),

  -- Status de sincronizacao
  sincronizado boolean DEFAULT false,
  sincronizado_em timestamptz,
  erro_sincronizacao text,

  criado_em timestamptz NOT NULL DEFAULT now(),

  UNIQUE(audience_id, contato_id)
);

-- Indices
CREATE INDEX idx_audiences_meta_org ON custom_audiences_meta(organizacao_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_audience_membros_audience ON custom_audience_membros(audience_id);
CREATE INDEX idx_audience_membros_contato ON custom_audience_membros(contato_id);
CREATE INDEX idx_audience_membros_sync ON custom_audience_membros(audience_id, sincronizado);

-- RLS
ALTER TABLE custom_audiences_meta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON custom_audiences_meta
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### 4.4 Endpoints de API

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/conexoes/meta/audiences | Listar publicos | Admin |
| POST | /api/v1/conexoes/meta/audiences | Criar publico | Admin |
| GET | /api/v1/conexoes/meta/audiences/:id | Detalhes do publico | Admin |
| PATCH | /api/v1/conexoes/meta/audiences/:id | Atualizar publico | Admin |
| DELETE | /api/v1/conexoes/meta/audiences/:id | Remover publico | Admin |
| POST | /api/v1/conexoes/meta/audiences/:id/sync | Forcar sincronizacao | Admin |
| GET | /api/v1/conexoes/meta/audiences/:id/membros | Listar membros | Admin |

---

## 5. Outras Conexoes

### 5.1 Instagram Direct

Similar ao Meta Ads, utiliza OAuth via Facebook Login.

**Permissoes necessarias:**
- `instagram_basic`
- `instagram_manage_messages`

**Tabela:** Reutiliza `conexoes_meta` com flag `instagram_connected`.

### 5.2 Google Calendar

#### 5.2.1 Visao Geral

Integracao com Google Calendar para sincronizacao de reunioes e eventos diretamente no CRM.

**Arquitetura de Credenciais:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GOOGLE CALENDAR: CONFIG GLOBAL vs TENANT                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SUPER ADMIN (PRD-14)                    ADMIN/MEMBER (Este PRD)            │
│  ─────────────────────                   ──────────────────────             │
│  Credenciais do App Google               Conta pessoal Google               │
│                                                                             │
│  - Google Client ID                      - OAuth para autorizacao           │
│  - Google Client Secret                  - Access Token (criptografado)     │
│  - Callback URL configurada              - Refresh Token (criptografado)    │
│                                          - Selecao de calendario            │
│                                          - Sincronizacao de eventos         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Caracteristicas principais:**
- Usa credenciais globais do App Google (configuradas pelo Super Admin no PRD-14)
- Admin/Member apenas faz OAuth para conectar sua propria conta Google
- Selecao de qual calendario usar (se usuario tem multiplos)
- Criacao de eventos do CRM diretamente no Google Calendar
- Sincronizacao automatica de reunioes agendadas
- Suporte a Google Meet para links de reuniao

**Scopes necessarios:**
- `https://www.googleapis.com/auth/calendar` - Acesso total ao calendario
- `https://www.googleapis.com/auth/calendar.events` - Gerenciar eventos

#### 5.2.2 Fluxo de Conexao

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUXO CONEXAO GOOGLE CALENDAR                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Pre-requisito: Super Admin configurou Client ID e Secret no PRD-14         │
│                                                                             │
│  1. Usuario clica "Conectar Google Calendar"                                │
│     └─> GET /api/v1/conexoes/google/auth-url                                │
│     └─> Backend monta URL OAuth com Client ID global                        │
│     └─> Redirect para Google OAuth                                          │
│                                                                             │
│  2. Usuario autoriza no Google                                              │
│     └─> Google redireciona para callback                                    │
│     └─> GET /api/v1/conexoes/google/callback?code=XXX                       │
│     └─> Backend troca code por access_token e refresh_token                 │
│     └─> Backend salva tokens criptografados em conexoes_google              │
│                                                                             │
│  3. Sistema lista calendarios do usuario                                    │
│     └─> GET https://www.googleapis.com/calendar/v3/users/me/calendarList    │
│     └─> Mostra lista de calendarios para selecao                            │
│     └─> Usuario seleciona calendario padrao                                 │
│     └─> Backend salva calendar_id selecionado                               │
│                                                                             │
│  4. Conexao estabelecida - Operacao normal                                  │
│     └─> Criar evento: POST /api/v1/conexoes/google/eventos                  │
│     └─> Backend cria no Google Calendar                                     │
│     └─> Campos google_event_id e google_meet_link salvos na reuniao         │
│                                                                             │
│  5. Desconexao                                                              │
│     └─> DELETE /api/v1/conexoes/google                                      │
│     └─> Backend revoga token no Google                                      │
│     └─> Remove registro de conexoes_google                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.2.3 Interface do Usuario

**Estado Conectado:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Configuracoes > Conexoes > Google Calendar                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Google Icon]  Google Calendar                                             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │  Conta conectada: joao.silva@gmail.com                              │    │
│  │  Conectado em: 28/01/2026, 14:30                                    │    │
│  │                                                                     │    │
│  │  Calendario selecionado: [Calendario Principal v]                   │    │
│  │                                                                     │    │
│  │  Recursos disponiveis:                                              │    │
│  │  ✓ Criar eventos diretamente do CRM                                 │    │
│  │  ✓ Agendar reunioes com leads                                       │    │
│  │  ✓ Sincronizacao automatica de eventos                              │    │
│  │  ✓ Notificacoes de reunioes                                         │    │
│  │                                                                     │    │
│  │  [Abrir Calendar]  [Desconectar]                                    │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Estado Desconectado:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Configuracoes > Conexoes > Google Calendar                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Google Icon]  Google Calendar                                             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │  Conecte seu Google Calendar para agendar reunioes                  │    │
│  │  diretamente pelo CRM.                                              │    │
│  │                                                                     │    │
│  │  Voce podera:                                                       │    │
│  │  • Criar eventos diretamente do CRM                                 │    │
│  │  • Agendar reunioes com leads                                       │    │
│  │  • Sincronizar eventos automaticamente                              │    │
│  │  • Receber notificacoes de reunioes                                 │    │
│  │                                                                     │    │
│  │  [Conectar Google Calendar]                                         │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Modal de Selecao de Calendario:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Selecionar Calendario                                                   [X]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Conta: joao.silva@gmail.com                                                │
│                                                                             │
│  Selecione o calendario onde os eventos serao criados:                      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ (•) Calendario Principal                                           │    │
│  │     joao.silva@gmail.com                                           │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ ( ) Trabalho                                                        │    │
│  │     trabalho@empresa.com                                           │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ ( ) Reunioes Comerciais                                            │    │
│  │     joao.silva@gmail.com (secundario)                              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  [Cancelar]                                           [Confirmar Selecao]   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.2.4 Modelo de Dados

```sql
-- Conexoes Google Calendar por usuario
CREATE TABLE conexoes_google (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),

  -- OAuth tokens (criptografados)
  access_token_encrypted text NOT NULL,
  refresh_token_encrypted text,
  token_expires_at timestamptz,

  -- Dados da conta conectada
  google_user_id varchar(50),
  google_user_email varchar(255),
  google_user_name varchar(255),

  -- Calendario selecionado
  calendar_id varchar(255), -- ID do calendario no Google (pode ser email ou ID)
  calendar_name varchar(255),

  -- Configuracoes
  criar_google_meet boolean DEFAULT true, -- Adicionar link do Meet automaticamente
  sincronizar_eventos boolean DEFAULT true, -- Sincronizar eventos existentes

  -- Status
  status varchar(20) NOT NULL DEFAULT 'active',
    -- active: conectado e operacional
    -- expired: token expirado (precisa refresh)
    -- revoked: acesso revogado pelo usuario
    -- error: erro na conexao

  ultimo_sync timestamptz,
  ultimo_erro text,

  -- Timestamps
  conectado_em timestamptz DEFAULT now(),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  -- Constraint: um usuario por tenant pode ter uma conexao
  UNIQUE(organizacao_id, usuario_id)
);

-- Indices
CREATE INDEX idx_conexoes_google_org ON conexoes_google(organizacao_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_conexoes_google_user ON conexoes_google(usuario_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_conexoes_google_status ON conexoes_google(organizacao_id, status);

-- RLS
ALTER TABLE conexoes_google ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON conexoes_google
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);

-- Politica adicional: usuario so ve sua propria conexao (exceto Admin)
CREATE POLICY "user_own_connection" ON conexoes_google
  FOR SELECT USING (
    usuario_id = current_setting('app.current_user')::uuid
    OR current_setting('app.current_role') = 'admin'
  );
```

#### 5.2.5 Endpoints de API

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/conexoes/google/auth-url | URL para OAuth Google | Admin/Member* |
| GET | /api/v1/conexoes/google/callback | Callback do OAuth | Sistema |
| GET | /api/v1/conexoes/google | Status da conexao | Admin/Member |
| DELETE | /api/v1/conexoes/google | Desconectar conta | Admin/Member |
| GET | /api/v1/conexoes/google/calendarios | Listar calendarios | Admin/Member |
| PATCH | /api/v1/conexoes/google/calendario | Selecionar calendario | Admin/Member |
| POST | /api/v1/conexoes/google/eventos | Criar evento | Admin/Member |
| PATCH | /api/v1/conexoes/google/eventos/:id | Atualizar evento | Admin/Member |
| DELETE | /api/v1/conexoes/google/eventos/:id | Cancelar evento | Admin/Member |

*Member pode conectar apenas se Admin conceder permissao

#### 5.2.6 Integracao com Reunioes

A tabela `meetings` (ver agendamentoprd.md) possui campos para integracao:

```sql
-- Campos em meetings para Google Calendar
google_event_id   text    -- ID do evento no Google Calendar
google_meet_link  text    -- Link do Google Meet (se habilitado)
```

**Fluxo de criacao de reuniao:**

1. Usuario cria reuniao no CRM (ScheduleMeetingModal)
2. Se usuario tem Google Calendar conectado:
   - Sistema cria evento no Google Calendar
   - Se `criar_google_meet = true`, Google gera link do Meet
   - Sistema salva `google_event_id` e `google_meet_link` na reuniao
3. Lead recebe convite com link do Meet
4. Atualizacoes no CRM sincronizam com Google Calendar

#### 5.2.7 Payload de Criacao de Evento

```javascript
// POST /api/v1/conexoes/google/eventos
{
  "meeting_id": "uuid",           // ID da reuniao no CRM
  "summary": "Reuniao com Joao",  // Titulo do evento
  "description": "Discussao sobre proposta comercial",
  "start": "2026-01-30T14:00:00-03:00",
  "end": "2026-01-30T15:00:00-03:00",
  "attendees": [
    { "email": "lead@empresa.com" }
  ],
  "add_google_meet": true         // Adicionar link do Meet
}

// Response
{
  "event_id": "abc123xyz",
  "html_link": "https://calendar.google.com/event?eid=abc123",
  "google_meet_link": "https://meet.google.com/abc-defg-hij"
}
```

---

## 6. Email Pessoal

### 6.1 Visao Geral

Duas opcoes de conexao para envio de emails diretamente do CRM:

1. **Gmail OAuth** (Recomendado) - Conexao segura via OAuth 2.0
2. **SMTP Manual** - Configuracao com email e senha

**Arquitetura de Credenciais:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EMAIL: CONFIG GLOBAL vs TENANT                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SUPER ADMIN (PRD-14)                    ADMIN/MEMBER (Este PRD)            │
│  ─────────────────────                   ──────────────────────             │
│  Google App credentials                  Conta de email pessoal             │
│                                                                             │
│  Gmail OAuth:                            Gmail OAuth:                       │
│  - Client ID ─────────────────────────>  - OAuth para autorizacao          │
│  - Client Secret ─────────────────────>  - Access Token (criptografado)    │
│                                          - Refresh Token (criptografado)   │
│                                          - Email conectado                  │
│                                                                             │
│  SMTP Manual:                            SMTP Manual:                       │
│  (nao requer config global)              - Email e senha do usuario        │
│                                          - Auto-deteccao de servidor       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Gmail OAuth (Recomendado)

#### 6.2.1 Caracteristicas

- Usa credenciais globais do Google App (configuradas pelo Super Admin no PRD-14)
- Usuario apenas clica "Conectar com Google" e autoriza
- Sem necessidade de senha de aplicativo
- Renovacao automatica de credenciais
- Configuracao instantanea

**Scopes necessarios:**
- `https://www.googleapis.com/auth/gmail.send` - Enviar emails
- `https://www.googleapis.com/auth/userinfo.email` - Identificar email do usuario

#### 6.2.2 Fluxo de Conexao

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUXO CONEXAO GMAIL OAUTH                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Pre-requisito: Super Admin configurou Client ID e Secret no PRD-14         │
│                                                                             │
│  1. Usuario clica "Gmail OAuth" e depois "Conectar com Google"              │
│     └─> GET /api/v1/conexoes/email/google/auth-url                          │
│     └─> Backend monta URL OAuth com Client ID global                        │
│     └─> Redirect para Google OAuth                                          │
│                                                                             │
│  2. Usuario autoriza no Google                                              │
│     └─> Google redireciona para callback                                    │
│     └─> GET /api/v1/conexoes/email/google/callback?code=XXX                 │
│     └─> Backend troca code por access_token e refresh_token                 │
│     └─> Backend salva tokens criptografados em conexoes_email               │
│                                                                             │
│  3. Conexao estabelecida                                                    │
│     └─> Sistema pode enviar emails via Gmail API                            │
│     └─> Refresh automatico quando token expira                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 SMTP Manual

#### 6.3.1 Caracteristicas

- Usuario informa apenas email e senha
- Sistema detecta automaticamente configuracoes SMTP baseado no dominio
- Botao "Testar Conexao" para validar antes de salvar
- Suporte a qualquer provedor de email

#### 6.3.2 Auto-deteccao de Configuracoes SMTP

O sistema reconhece automaticamente as configuracoes dos principais provedores:

| Provedor | Dominios | SMTP Host | Porta | TLS |
|----------|----------|-----------|-------|-----|
| Gmail | gmail.com, googlemail.com | smtp.gmail.com | 587 | Sim |
| Outlook | outlook.com, hotmail.com, live.com | smtp.office365.com | 587 | Sim |
| Yahoo | yahoo.com, yahoo.com.br | smtp.mail.yahoo.com | 587 | Sim |
| iCloud | icloud.com, me.com, mac.com | smtp.mail.me.com | 587 | Sim |
| Zoho | zoho.com | smtp.zoho.com | 587 | Sim |
| UOL | uol.com.br | smtps.uol.com.br | 587 | Sim |
| Terra | terra.com.br | smtp.terra.com.br | 587 | Sim |
| BOL | bol.com.br | smtps.bol.com.br | 587 | Sim |

**Dominios nao reconhecidos:**
- Sistema tenta auto-descoberta via MX records
- Fallback: solicita configuracao manual (host, porta)

### 6.4 Interface do Usuario

**Modal de Conexao (Estado Inicial):**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ E-mail Pessoal                                                         [X]  │
│ Configure seu e-mail para envio direto da pipeline                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                         [Email Icon]                                        │
│                                                                             │
│                    E-mail nao conectado                                     │
│                                                                             │
│     Conecte seu e-mail para enviar mensagens diretamente do CRM.            │
│                                                                             │
│     ┌──────────────────────┐  ┌──────────────────────┐                      │
│     │  [Globe] Gmail OAuth │  │  [Gear] SMTP Manual  │  <- Tabs             │
│     └──────────────────────┘  └──────────────────────┘                      │
│                                                                             │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │ [Globe] Recomendado: Conecte diretamente com sua conta Google   │     │
│     │ sem precisar configurar SMTP.                                   │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│     Vantagens:                                                              │
│     • Conexao segura via OAuth 2.0                                          │
│     • Sem necessidade de senha de aplicativo                                │
│     • Configuracao instantanea                                              │
│     • Renovacao automatica de credenciais                                   │
│                                                                             │
│                    [Conectar com Google]                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Modal de Conexao (Aba SMTP Manual):**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ E-mail Pessoal                                                         [X]  │
│ Configure seu e-mail para envio direto da pipeline                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│     ┌──────────────────────┐  ┌──────────────────────┐                      │
│     │  [Globe] Gmail OAuth │  │  [Gear] SMTP Manual  │  <- Tab ativa        │
│     └──────────────────────┘  └──────────────────────┘                      │
│                                                                             │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │ [Gear] Configure manualmente as credenciais SMTP para qualquer  │     │
│     │ provedor de e-mail.                                             │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│     E-mail *                          Senha *                               │
│     ┌─────────────────────────┐       ┌─────────────────────────┐ [Eye]     │
│     │ seu@email.com           │       │ Senha ou senha de app   │           │
│     └─────────────────────────┘       └─────────────────────────┘           │
│                                                                             │
│     [Testar Conexao]                                    [Salvar]            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Estado Conectado:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Configuracoes > Conexoes > E-mail Pessoal                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Email Icon]  E-mail Pessoal                      [verde] Conectado        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │  Conta conectada: joao.silva@gmail.com                              │    │
│  │  Tipo: Gmail OAuth                                                  │    │
│  │  Conectado em: 28/01/2026, 14:30                                    │    │
│  │  Ultimo envio: Hoje, 16:45                                          │    │
│  │                                                                     │    │
│  │  [Desconectar]                                                      │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.5 Modelo de Dados

```sql
-- Conexoes de email por usuario
CREATE TABLE conexoes_email (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),

  -- Tipo de conexao
  tipo varchar(20) NOT NULL, -- 'gmail_oauth' ou 'smtp_manual'

  -- Dados comuns
  email varchar(255) NOT NULL,
  nome_remetente varchar(255),

  -- Gmail OAuth (se tipo = 'gmail_oauth')
  google_user_id varchar(50),
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,

  -- SMTP Manual (se tipo = 'smtp_manual')
  smtp_host varchar(255),
  smtp_port integer DEFAULT 587,
  smtp_user varchar(255),
  smtp_pass_encrypted text,
  smtp_tls boolean DEFAULT true,
  smtp_auto_detected boolean DEFAULT false, -- Se config foi auto-detectada

  -- Status
  status varchar(20) NOT NULL DEFAULT 'active',
    -- active: conectado e operacional
    -- expired: token OAuth expirado
    -- error: erro na conexao
    -- testing: em teste

  ultimo_envio timestamptz,
  total_emails_enviados integer DEFAULT 0,
  ultimo_erro text,

  -- Timestamps
  conectado_em timestamptz DEFAULT now(),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  -- Um usuario por tenant pode ter uma conexao de email
  UNIQUE(organizacao_id, usuario_id)
);

-- Indices
CREATE INDEX idx_conexoes_email_org ON conexoes_email(organizacao_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_conexoes_email_user ON conexoes_email(usuario_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_conexoes_email_status ON conexoes_email(organizacao_id, status);

-- RLS
ALTER TABLE conexoes_email ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON conexoes_email
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);

-- Politica: usuario so ve sua propria conexao (exceto Admin)
CREATE POLICY "user_own_connection" ON conexoes_email
  FOR SELECT USING (
    usuario_id = current_setting('app.current_user')::uuid
    OR current_setting('app.current_role') = 'admin'
  );
```

### 6.6 Endpoints de API

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/conexoes/email/google/auth-url | URL para OAuth Gmail | Admin/Member |
| GET | /api/v1/conexoes/email/google/callback | Callback do OAuth | Sistema |
| POST | /api/v1/conexoes/email/smtp | Salvar configuracao SMTP | Admin/Member |
| POST | /api/v1/conexoes/email/smtp/testar | Testar conexao SMTP | Admin/Member |
| POST | /api/v1/conexoes/email/smtp/detectar | Auto-detectar config | Admin/Member |
| GET | /api/v1/conexoes/email | Status da conexao | Admin/Member |
| DELETE | /api/v1/conexoes/email | Desconectar | Admin/Member |
| POST | /api/v1/conexoes/email/enviar | Enviar email | Admin/Member |

#### Detalhamento dos Endpoints

**POST /api/v1/conexoes/email/smtp**

Request:
```json
{
  "email": "usuario@email.com",
  "senha": "senha_ou_app_password",
  "nome_remetente": "Joao Silva"
}
```

Response (201):
```json
{
  "id": "uuid",
  "tipo": "smtp_manual",
  "email": "usuario@email.com",
  "smtp_host": "smtp.gmail.com",
  "smtp_port": 587,
  "smtp_auto_detected": true,
  "status": "active",
  "message": "Conexao configurada com sucesso."
}
```

**POST /api/v1/conexoes/email/smtp/detectar**

Request:
```json
{
  "email": "usuario@email.com"
}
```

Response (200):
```json
{
  "detected": true,
  "provider": "Gmail",
  "smtp_host": "smtp.gmail.com",
  "smtp_port": 587,
  "smtp_tls": true,
  "requires_app_password": true,
  "help_url": "https://support.google.com/accounts/answer/185833"
}
```

---

## 7. Instagram Direct

### 7.1 Visao Geral

Integracao com Instagram Messaging API para envio e recebimento de mensagens diretas (DMs) diretamente no CRM.

**Arquitetura de Credenciais:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    INSTAGRAM: CONFIG GLOBAL vs TENANT                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SUPER ADMIN (PRD-14)                    ADMIN/MEMBER (Este PRD)            │
│  ─────────────────────                   ──────────────────────             │
│  Meta App credentials                    Conta Instagram Business           │
│                                                                             │
│  - App ID ────────────────────────────>  - OAuth para autorizacao          │
│  - App Secret ────────────────────────>  - Instagram User ID                │
│                                          - Access Token (criptografado)     │
│                                          - Permissoes concedidas            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Caracteristicas principais:**
- Usa credenciais globais do Meta App (configuradas pelo Super Admin no PRD-14)
- Admin/Member faz OAuth para conectar sua conta Instagram Business/Creator
- Recebe mensagens via webhook do Meta
- Envia mensagens via Instagram Messaging API
- Tokens long-lived (60 dias, renovaveis)

**Requisitos:**
- Conta Instagram Business ou Creator
- App Meta com permissoes aprovadas (App Review)
- HTTPS para webhooks

### 7.2 Permissoes Necessarias (Scopes)

| Scope | Descricao | Obrigatorio |
|-------|-----------|-------------|
| `instagram_business_basic` | Acesso basico a conta Business | Sim |
| `instagram_business_manage_messages` | Enviar/receber mensagens | Sim |

**Nota:** Os scopes antigos (`instagram_basic`, `instagram_manage_messages`) serao deprecados em Janeiro 2025. Usar os novos scopes `instagram_business_*`.

### 7.3 Fluxo de Conexao (OAuth)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUXO CONEXAO INSTAGRAM                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Pre-requisito: Super Admin configurou App ID e Secret no PRD-14            │
│                                                                             │
│  1. Usuario clica "Conectar Instagram"                                      │
│     └─> GET /api/v1/conexoes/instagram/auth-url                             │
│     └─> Backend monta URL OAuth:                                            │
│         https://www.instagram.com/oauth/authorize                           │
│         ?client_id=YOUR_APP_ID                                              │
│         &redirect_uri=https://crm.renove.com/api/v1/conexoes/instagram/cb   │
│         &response_type=code                                                 │
│         &scope=instagram_business_basic,instagram_business_manage_messages  │
│     └─> Redirect para Instagram OAuth                                       │
│                                                                             │
│  2. Usuario autoriza no Instagram                                           │
│     └─> Usuario faz login (se necessario)                                   │
│     └─> Usuario aceita permissoes solicitadas                               │
│     └─> Instagram redireciona para callback com code                        │
│                                                                             │
│  3. Backend troca code por tokens                                           │
│     └─> POST https://api.instagram.com/oauth/access_token                   │
│         - client_id, client_secret, grant_type, redirect_uri, code          │
│     └─> Obtem short-lived token (valido por 1 hora)                         │
│     └─> Troca por long-lived token (valido por 60 dias)                     │
│     └─> Salva tokens criptografados em conexoes_instagram                   │
│                                                                             │
│  4. Conexao estabelecida                                                    │
│     └─> Sistema configura webhook para receber mensagens                    │
│     └─> Usuario pode enviar/receber DMs pelo CRM                            │
│                                                                             │
│  5. Renovacao de token (antes de expirar)                                   │
│     └─> Job agenda renovacao antes dos 60 dias                              │
│     └─> GET https://graph.instagram.com/refresh_access_token                │
│     └─> Atualiza token no banco                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.4 Interface do Usuario

**Estado Desconectado:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Configuracoes > Conexoes > Instagram Direct                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Instagram Icon]  Instagram Direct                  [cinza] Desconectado   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │  Conecte sua conta Instagram Business para enviar e receber         │    │
│  │  mensagens diretas pelo CRM.                                        │    │
│  │                                                                     │    │
│  │  Requisitos:                                                        │    │
│  │  • Conta Instagram Business ou Creator                              │    │
│  │  • Pagina do Facebook vinculada (opcional)                          │    │
│  │                                                                     │    │
│  │  [Conectar Instagram]                                               │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Estado Conectado:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Configuracoes > Conexoes > Instagram Direct                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Instagram Icon]  Instagram Direct                  [verde] Conectado      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │  [Avatar] @renove_consultoria                                       │    │
│  │           Renove Consultoria                                        │    │
│  │                                                                     │    │
│  │  Conectado em: 28/01/2026, 14:30                                    │    │
│  │  Token expira em: 58 dias                                           │    │
│  │  Mensagens recebidas: 127                                           │    │
│  │  Ultima mensagem: Hoje, 16:45                                       │    │
│  │                                                                     │    │
│  │  Permissoes ativas:                                                 │    │
│  │  ✓ Acesso basico a conta                                            │    │
│  │  ✓ Gerenciar mensagens                                              │    │
│  │                                                                     │    │
│  │  [Abrir Instagram]  [Desconectar]                                   │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.5 Modelo de Dados

```sql
-- Conexoes Instagram por usuario
CREATE TABLE conexoes_instagram (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),

  -- Dados da conta Instagram
  instagram_user_id varchar(50) NOT NULL,
  instagram_username varchar(255),
  instagram_name varchar(255),
  profile_picture_url text,
  account_type varchar(20), -- 'BUSINESS' ou 'CREATOR'

  -- OAuth tokens (criptografados)
  access_token_encrypted text NOT NULL,
  token_type varchar(20) DEFAULT 'long_lived',
    -- 'short_lived': 1 hora
    -- 'long_lived': 60 dias
  token_expires_at timestamptz,

  -- Permissoes concedidas
  permissions text[] DEFAULT ARRAY[
    'instagram_business_basic',
    'instagram_business_manage_messages'
  ],

  -- Webhook config
  webhook_subscribed boolean DEFAULT false,

  -- Estatisticas
  total_mensagens_recebidas integer DEFAULT 0,
  total_mensagens_enviadas integer DEFAULT 0,
  ultima_mensagem_em timestamptz,

  -- Status
  status varchar(20) NOT NULL DEFAULT 'active',
    -- active: conectado e operacional
    -- expired: token expirado
    -- revoked: acesso revogado pelo usuario
    -- error: erro na conexao

  ultimo_sync timestamptz,
  ultimo_erro text,

  -- Timestamps
  conectado_em timestamptz DEFAULT now(),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  -- Um usuario por tenant pode ter uma conexao Instagram
  UNIQUE(organizacao_id, usuario_id)
);

-- Indices
CREATE INDEX idx_conexoes_ig_org ON conexoes_instagram(organizacao_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_conexoes_ig_user ON conexoes_instagram(usuario_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_conexoes_ig_status ON conexoes_instagram(organizacao_id, status);
CREATE INDEX idx_conexoes_ig_igid ON conexoes_instagram(instagram_user_id);

-- RLS
ALTER TABLE conexoes_instagram ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON conexoes_instagram
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);

-- Politica: usuario so ve sua propria conexao (exceto Admin)
CREATE POLICY "user_own_connection" ON conexoes_instagram
  FOR SELECT USING (
    usuario_id = current_setting('app.current_user')::uuid
    OR current_setting('app.current_role') = 'admin'
  );
```

### 7.6 Endpoints de API

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/conexoes/instagram/auth-url | URL para OAuth Instagram | Admin* |
| GET | /api/v1/conexoes/instagram/callback | Callback do OAuth | Sistema |
| GET | /api/v1/conexoes/instagram | Status da conexao | Admin/Member |
| DELETE | /api/v1/conexoes/instagram | Desconectar conta | Admin/Member |
| POST | /api/v1/conexoes/instagram/mensagens | Enviar mensagem | Admin/Member |
| GET | /api/v1/conexoes/instagram/conversas | Listar conversas | Admin/Member |
| GET | /api/v1/conexoes/instagram/conversas/:id | Mensagens de uma conversa | Admin/Member |
| POST | /api/v1/conexoes/instagram/refresh-token | Renovar token | Sistema/Admin |

*Member pode conectar SE Admin conceder permissao (ver matriz de permissoes)

#### Detalhamento dos Endpoints

**POST /api/v1/conexoes/instagram/mensagens**

Request:
```json
{
  "recipient_id": "IGSID_DO_DESTINATARIO",
  "message": {
    "text": "Ola! Obrigado pelo contato."
  }
}
```

Response (200):
```json
{
  "message_id": "aWdfZAG1faW..."
}
```

**Enviar imagem:**
```json
{
  "recipient_id": "IGSID_DO_DESTINATARIO",
  "message": {
    "attachment": {
      "type": "image",
      "payload": {
        "url": "https://storage.crm.renove.com/imagem.jpg"
      }
    }
  }
}
```

### 7.7 Webhooks

O Meta envia notificacoes de novas mensagens via webhook:

**Endpoint:** `POST /webhooks/instagram`

**Payload de mensagem recebida:**
```json
{
  "object": "instagram",
  "entry": [{
    "id": "<PAGE_ID>",
    "time": 1706456700,
    "messaging": [{
      "sender": {
        "id": "<SENDER_IGSID>"
      },
      "recipient": {
        "id": "<RECIPIENT_IGSID>"
      },
      "timestamp": 1706456700000,
      "message": {
        "mid": "aWdfZAG1faW...",
        "text": "Ola, gostaria de saber mais sobre seus servicos"
      }
    }]
  }]
}
```

**Processamento do webhook:**
1. Validar assinatura (X-Hub-Signature-256)
2. Identificar tenant pelo instagram_user_id do recipient
3. Buscar/criar contato pelo sender IGSID
4. Salvar mensagem na tabela de conversas
5. Notificar usuario via Realtime
6. Responder 200 OK imediatamente

### 7.8 Janela de Resposta (24 horas)

**Regra do Instagram:**
- Pode responder ate 24 horas apos ultima mensagem do usuario
- Apos 24h, precisa de Human Agent tag (permite 7 dias)
- Sistema deve alertar quando janela estiver proxima de fechar

**Implementacao:**
```sql
-- Controle de janela de resposta
ALTER TABLE conversas ADD COLUMN instagram_window_expires_at timestamptz;

-- Trigger para calcular expiracao
CREATE OR REPLACE FUNCTION update_instagram_window()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.canal = 'instagram' AND NEW.direcao = 'inbound' THEN
    NEW.instagram_window_expires_at := NEW.criado_em + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Requisitos Funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-001 | Admin/Member pode conectar WhatsApp via QR Code | Must |
| RF-002 | Sessao WhatsApp isolada por usuario | Must |
| RF-003 | Admin pode conectar Meta Ads via OAuth | Must |
| RF-004 | Admin pode mapear formularios Lead Ads | Must |
| RF-005 | Leads de Lead Ads criam contatos automaticamente | Must |
| RF-006 | Admin pode configurar Conversions API | Should |
| RF-007 | Eventos do CRM sao enviados para Conversions API | Should |
| RF-008 | Admin pode criar Custom Audiences | Should |
| RF-009 | Custom Audiences sincronizam automaticamente | Should |
| RF-010 | Admin/Member pode conectar Google Calendar via OAuth | Should |
| RF-011 | Usuario pode selecionar qual calendario usar | Should |
| RF-012 | Reunioes do CRM criam eventos no Google Calendar | Should |
| RF-013 | Sistema gera link do Google Meet automaticamente | Should |
| RF-014 | Admin/Member pode conectar Gmail via OAuth | Should |
| RF-015 | Admin/Member pode configurar SMTP manual com auto-deteccao | Should |
| RF-016 | Sistema detecta configuracoes SMTP automaticamente pelo dominio | Should |
| RF-017 | Admin pode conectar Instagram Direct via OAuth | Should |
| RF-018 | Sistema recebe mensagens do Instagram via webhook | Should |
| RF-019 | Sistema envia mensagens do Instagram via API | Should |
| RF-020 | Sistema renova tokens Instagram automaticamente | Should |

---

## Requisitos Nao-Funcionais

### Performance

- QR Code deve ser gerado em < 2 segundos
- OAuth callback deve completar em < 5 segundos
- Webhooks devem ser processados em < 1 segundo

### Seguranca

- Tokens OAuth armazenados criptografados (AES-256)
- Dados pessoais hashados (SHA256) antes de enviar para Meta
- Webhooks validados com signature verification
- Rate limiting em endpoints publicos

### Disponibilidade

- Retry automatico em caso de falha de envio para Meta
- Fila de eventos para Conversions API
- Log de todas as operacoes para auditoria

---

## Retry e Resiliencia

### Visao Geral

Todas as integracoes externas (Meta, Google, WAHA, Instagram) estao sujeitas a falhas temporarias. O sistema implementa estrategias de retry e circuit breaker para garantir resiliencia.

### Estrategia de Retry por Tipo de Operacao

| Operacao | Max Retries | Intervalo Base | Backoff | Timeout |
|----------|-------------|----------------|---------|---------|
| OAuth Token Refresh | 3 | 1s | Exponential | 10s |
| Envio CAPI | 5 | 2s | Exponential | 30s |
| Custom Audience Sync | 3 | 5s | Exponential | 60s |
| Lead Ads Webhook Process | 3 | 1s | Linear | 10s |
| WhatsApp Send Message | 3 | 2s | Exponential | 15s |
| Instagram Send Message | 3 | 2s | Exponential | 15s |
| Google Calendar Create | 3 | 1s | Exponential | 10s |
| Email Send (SMTP/Gmail) | 3 | 3s | Exponential | 30s |
| Webhook Saida (outbound) | 5 | 5s | Exponential | 30s |

### Implementacao do Retry

#### 1. Exponential Backoff com Jitter

```typescript
// Calculo do delay com jitter para evitar thundering herd
function calculateRetryDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number = 60000
): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, maxDelay);
  const jitter = Math.random() * 0.3 * cappedDelay; // 0-30% jitter
  return cappedDelay + jitter;
}

// Exemplo de uso
const delays = [1, 2, 3, 4, 5].map(n => calculateRetryDelay(n, 2000));
// [~2s, ~4s, ~8s, ~16s, ~32s] + jitter
```

#### 2. Wrapper de Retry Generico

```typescript
interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay?: number;
  retryableErrors?: string[];
  onRetry?: (error: Error, attempt: number) => void;
}

async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay = 60000, retryableErrors, onRetry } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isRetryable = isRetryableError(error, retryableErrors);
      const isLastAttempt = attempt === maxRetries;

      if (!isRetryable || isLastAttempt) {
        throw error;
      }

      const delay = calculateRetryDelay(attempt, baseDelay, maxDelay);
      onRetry?.(error, attempt);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
}
```

#### 3. Erros Retryable vs Non-Retryable

```typescript
// Erros que devem gerar retry
const RETRYABLE_ERRORS = [
  'ECONNRESET',       // Conexao resetada
  'ETIMEDOUT',        // Timeout
  'ENOTFOUND',        // DNS nao encontrado (temporario)
  'EAI_AGAIN',        // DNS temporariamente indisponivel
  'RATE_LIMITED',     // Rate limit atingido
  '429',              // HTTP Too Many Requests
  '500',              // Internal Server Error
  '502',              // Bad Gateway
  '503',              // Service Unavailable
  '504',              // Gateway Timeout
];

// Erros que NAO devem gerar retry (falha definitiva)
const NON_RETRYABLE_ERRORS = [
  'INVALID_TOKEN',    // Token invalido (precisa re-auth)
  'PERMISSION_DENIED', // Sem permissao
  '400',              // Bad Request (payload invalido)
  '401',              // Unauthorized (precisa re-auth)
  '403',              // Forbidden
  '404',              // Not Found
  '422',              // Unprocessable Entity
];

function isRetryableError(error: any, customRetryable?: string[]): boolean {
  const errorCode = error.code || error.status || error.response?.status;
  const retryable = customRetryable || RETRYABLE_ERRORS;
  return retryable.some(code =>
    String(errorCode).includes(String(code))
  );
}
```

### Circuit Breaker

Para evitar sobrecarga em servicos externos com problemas, implementamos circuit breaker:

```typescript
interface CircuitBreakerConfig {
  failureThreshold: number;  // Falhas para abrir circuito
  resetTimeout: number;      // Tempo para tentar novamente (ms)
}

const CIRCUIT_BREAKER_CONFIG: Record<string, CircuitBreakerConfig> = {
  meta_capi: { failureThreshold: 5, resetTimeout: 60000 },
  meta_audiences: { failureThreshold: 3, resetTimeout: 120000 },
  waha: { failureThreshold: 3, resetTimeout: 30000 },
  google_calendar: { failureThreshold: 3, resetTimeout: 60000 },
  gmail: { failureThreshold: 3, resetTimeout: 60000 },
  instagram: { failureThreshold: 3, resetTimeout: 60000 },
  smtp: { failureThreshold: 3, resetTimeout: 30000 },
};
```

**Estados do Circuit Breaker:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CIRCUIT BREAKER STATES                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   CLOSED (Normal)                                                           │
│   └─> Requests passam normalmente                                           │
│   └─> Contador de falhas incrementa a cada erro                             │
│   └─> Se falhas >= threshold → vai para OPEN                                │
│                                                                             │
│   OPEN (Bloqueado)                                                          │
│   └─> Requests falham imediatamente (fail fast)                             │
│   └─> Apos resetTimeout → vai para HALF_OPEN                                │
│                                                                             │
│   HALF_OPEN (Testando)                                                      │
│   └─> Permite 1 request de teste                                            │
│   └─> Se sucesso → vai para CLOSED                                          │
│   └─> Se falha → volta para OPEN                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Fila de Eventos (Dead Letter Queue)

Eventos que falharam apos todos os retries vao para uma fila de processamento posterior:

```sql
-- Tabela para eventos pendentes de retry
CREATE TABLE eventos_pendentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  -- Tipo e destino
  tipo varchar(50) NOT NULL,  -- 'capi_event', 'audience_sync', 'webhook_saida', etc.
  destino varchar(255) NOT NULL,  -- URL ou identificador do destino

  -- Payload
  payload jsonb NOT NULL,

  -- Controle de retry
  tentativas integer DEFAULT 0,
  max_tentativas integer DEFAULT 5,
  proxima_tentativa timestamptz,
  ultimo_erro text,

  -- Status
  status varchar(20) DEFAULT 'pending',  -- 'pending', 'processing', 'failed', 'completed'

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_eventos_pendentes_status ON eventos_pendentes(status, proxima_tentativa)
  WHERE status IN ('pending', 'processing');
CREATE INDEX idx_eventos_pendentes_org ON eventos_pendentes(organizacao_id);

ALTER TABLE eventos_pendentes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON eventos_pendentes
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### Monitoramento de Falhas

```sql
-- View para monitorar saude das integracoes
CREATE VIEW integracao_health AS
SELECT
  organizacao_id,
  tipo,
  COUNT(*) FILTER (WHERE status = 'pending') as pendentes,
  COUNT(*) FILTER (WHERE status = 'failed') as falhas_permanentes,
  COUNT(*) FILTER (WHERE status = 'completed') as sucesso,
  AVG(tentativas) FILTER (WHERE status = 'completed') as media_tentativas,
  MAX(criado_em) FILTER (WHERE status = 'failed') as ultima_falha
FROM eventos_pendentes
WHERE criado_em > now() - interval '24 hours'
GROUP BY organizacao_id, tipo;
```

### Alertas

| Condicao | Acao |
|----------|------|
| Circuit breaker OPEN | Notificar Super Admin via email |
| > 10 eventos na fila de retry | Notificar Admin do tenant |
| Falha permanente (max retries) | Registrar em audit_log, notificar Admin |
| Token OAuth expirado + refresh falhou | Marcar conexao como 'error', notificar Admin |

### Idempotencia

Para evitar duplicacao de operacoes em caso de retry:

```typescript
// Gerar idempotency key unica por operacao
function generateIdempotencyKey(
  organizacao_id: string,
  tipo: string,
  entidade_id: string,
  acao: string
): string {
  return `${organizacao_id}:${tipo}:${entidade_id}:${acao}`;
}

// Exemplo: envio CAPI
const idempotencyKey = generateIdempotencyKey(
  org.id,
  'capi',
  oportunidade.id,
  'won'
);

// Meta aceita header X-Idempotency-Key
await axios.post(CAPI_URL, payload, {
  headers: {
    'X-Idempotency-Key': idempotencyKey
  }
});
```

### Configuracao por Tenant

Admins podem ajustar configuracoes de retry via `configuracoes_tenant`:

```sql
-- Em configuracoes_tenant.configuracoes_extra
{
  "retry_config": {
    "capi_max_retries": 5,
    "webhook_max_retries": 3,
    "desativar_retry_capi": false
  }
}
```

---

## Metricas de Sucesso

### KPIs Primarios

| Metrica | Meta | Medicao |
|---------|------|---------|
| Taxa de conexoes ativas | >= 70% | Tenants com pelo menos 1 integracao |
| Uptime das conexoes | >= 99% | Tempo com status "conectado" |
| Taxa de entrega de webhooks | >= 99% | Webhooks entregues / recebidos |
| Tempo de reconexao | < 5 min | Tempo para restabelecer conexao perdida |

### KPIs Secundarios

| Metrica | Meta | Medicao |
|---------|------|---------|
| Leads capturados via Meta Ads | Monitorar | COUNT por tenant/mes |
| Mensagens WhatsApp processadas | Monitorar | COUNT por tenant/dia |
| Emails enviados pelo CRM | Monitorar | COUNT por tenant/mes |
| Taxa de refresh de token | >= 99% | Tokens renovados antes de expirar |

### Criterios de Lancamento

| Criterio | Requisito |
|----------|-----------|
| OAuth funcionando | Fluxo completo para Meta e Google |
| WhatsApp estavel | QR Code + sessao persistente |
| Retry implementado | Exponential backoff funcionando |
| Circuit breaker ativo | Protecao contra falhas em cascata |
| Logs de auditoria | Todas conexoes registradas |

---

## Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| Token OAuth expirado sem refresh | Media | Alto | Refresh proativo, notificacao ao Admin, fallback |
| WAHA fora do ar | Media | Critico | Health check, alertas, documentacao de troubleshoot |
| Rate limiting da Meta API | Alta | Medio | Backoff automatico, cache de dados, filas |
| Webhook perdido | Media | Alto | Fila de eventos, retry 3x, DLQ para analise |
| Vazamento de tokens entre tenants | Baixa | Critico | Criptografia AES-256, RLS, audit logs |
| Instagram janela 24h expirada | Alta | Medio | Alerta ao vendedor, template de resposta rapida |
| SMTP bloqueado por provedor | Media | Medio | Teste de conexao, orientacoes de config, fallback |
| Circuit breaker abrindo muito | Media | Alto | Tuning de thresholds, monitoramento, alertas |

---

## Time to Value

### MVP (4 dias)

| Dia | Entrega |
|-----|---------|
| 1 | WhatsApp WAHA (QR Code + sessao) |
| 2 | Meta Ads Lead Ads (OAuth + mapeamento) |
| 3 | Google Calendar (OAuth + eventos) |
| 4 | Interface de gerenciamento de conexoes |

**Funcionalidades MVP:**
- WhatsApp conectado via QR Code
- Leads do Meta Ads capturados automaticamente
- Google Calendar sincronizado
- Dashboard de status das conexoes

### Versao 1.0 (+ 3 dias)

| Dia | Entrega |
|-----|---------|
| 5 | Email (Gmail OAuth + SMTP manual) |
| 6 | Instagram Direct (OAuth + webhooks) |
| 7 | Retry, circuit breaker, DLQ |

**Funcionalidades V1.0:**
- Email integrado (OAuth + SMTP)
- Instagram Direct funcionando
- Resiliencia com retry automatico
- Circuit breaker para APIs externas

### Versao 1.1 (+ 2 dias)

| Dia | Entrega |
|-----|---------|
| 8 | Conversions API (CAPI) |
| 9 | Custom Audiences |

**Funcionalidades V1.1:**
- Eventos de conversao enviados ao Meta
- Sincronizacao de audiencias para remarketing
- Dashboard de eventos CAPI

---

## Plano de Validacao

### Pre-Lancamento

| Item | Validacao | Responsavel |
|------|-----------|-------------|
| OAuth Meta | Fluxo completo com Facebook Test User | QA |
| OAuth Google | Fluxo completo em sandbox | QA |
| WhatsApp WAHA | Conexao estavel por 24h+ | DevOps |
| Criptografia de tokens | AES-256 validado | Security |
| Isolamento de tenant | Tokens nao vazam entre tenants | Security |

### Durante Lancamento

| Item | Validacao | Responsavel |
|------|-----------|-------------|
| Monitoramento de conexoes | Dashboard de status em tempo real | DevOps |
| Alertas de desconexao | Notificacao em < 5 min | DevOps |
| Logs de webhook | Todos eventos registrados | Security |
| Taxa de erro | < 1% de falhas | DevOps |

### Pos-Lancamento

| Item | Validacao | Frequencia |
|------|-----------|------------|
| Health check WAHA | Sessoes ativas | A cada 5 min |
| Refresh de tokens | Renovacao proativa | Diario |
| Auditoria de acessos | Revisar logs de OAuth | Semanal |
| Performance webhooks | Tempo de processamento | Diario |
| Feedback de usuarios | NPS das integracoes | Mensal |

---

## Checklist de Implementacao

### Backend

- [ ] CRUD sessoes_whatsapp
- [ ] Integracao com WAHA API
- [ ] OAuth flow para Meta
- [ ] CRUD conexoes_meta e paginas_meta
- [ ] CRUD formularios_lead_ads
- [ ] Webhook handler para Lead Ads
- [ ] Service Conversions API
- [ ] CRUD config_conversions_api
- [ ] Event dispatcher para CAPI
- [ ] CRUD custom_audiences_meta
- [ ] Sync service para audiences
- [ ] OAuth flow para Gmail
- [ ] Service envio email via Gmail API
- [ ] CRUD conexoes_email (Gmail + SMTP)
- [ ] Auto-deteccao configuracoes SMTP
- [ ] OAuth flow para Instagram
- [ ] CRUD conexoes_instagram
- [ ] Webhook handler para Instagram Direct
- [ ] Service envio mensagem Instagram

### Frontend

- [ ] Pagina de conexao WhatsApp com QR Code
- [ ] Modal de QR Code com polling
- [ ] Pagina de conexao Meta Ads
- [ ] Wizard de mapeamento Lead Ads
- [ ] Pagina Conversions API com toggles
- [ ] Pagina Custom Audiences
- [ ] Logs de eventos CAPI
- [ ] Modal conexao Email (tabs Gmail OAuth + SMTP)
- [ ] Formulario SMTP com auto-deteccao
- [ ] Teste de conexao SMTP em tempo real
- [ ] Modal conexao Instagram Direct
- [ ] Status e metricas da conexao Instagram

---

## Historico de Versoes

| Versao | Data | Autor | Mudancas |
|--------|------|-------|----------|
| v1.0 | 2026-01-31 | Arquiteto de Produto | Versao inicial com WhatsApp WAHA, Meta Lead Ads, Conversions API e Custom Audiences |
| v1.1 | 2026-01-31 | Arquiteto de Produto | Adicionada secao completa Google Calendar (OAuth, selecao de calendario, integracao com reunioes). Clarificado que Meta Ads usa config global do Super Admin. Atualizado modelo de permissoes (Admin por padrao, Member com permissao) |
| v1.2 | 2026-01-31 | Arquiteto de Produto | Adicionada secao Email Pessoal (Gmail OAuth + SMTP Manual com auto-deteccao). Adicionada secao Instagram Direct (OAuth via Meta, webhooks, janela 24h). Atualizada matriz de permissoes e requisitos funcionais |
| v1.3 | 2026-02-01 | Arquiteto de Produto | Adicionada secao Retry e Resiliencia: exponential backoff, circuit breaker, fila de eventos (DLQ), idempotencia, monitoramento de falhas, tabela eventos_pendentes |
| v1.4 | 2026-02-03 | Arquiteto de Produto | Adicionadas secoes conforme prdpadrao.md: Hierarquia de Requisitos (Theme/Epic/5 Features), Metricas de Sucesso (KPIs e criterios lancamento), Riscos e Mitigacoes (8 riscos identificados), Time to Value (MVP 4 dias, V1.0 +3 dias, V1.1 +2 dias), Plano de Validacao (Pre/Durante/Pos-Lancamento) |
