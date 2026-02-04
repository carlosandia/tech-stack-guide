# PRD-03: Autenticacao e Autorizacao - CRM Renove

| Campo | Valor |
|-------|-------|
| **Autor** | Arquiteto de Produto |
| **Data de criacao** | 2026-01-31 |
| **Ultima atualizacao** | 2026-02-03 |
| **Versao** | v1.5 |
| **Status** | Em desenvolvimento |
| **Dependencias** | PRD-01, PRD-02 |
| **Revisor tecnico** | Tech Lead |

---

## Resumo Executivo

Este documento define o sistema de autenticacao e autorizacao do CRM Renove, incluindo os tres niveis de acesso (Super Admin, Admin, Member), fluxos de login, gestao de permissoes e integracao OAuth com plataformas externas.

O sistema utiliza JWT (JSON Web Tokens) com refresh tokens para sessoes seguras, e um modelo de permissoes baseado em perfis configuraveis pelo Admin de cada tenant.

---

## Hierarquia de Requisitos

### Theme

**Seguranca e Controle de Acesso Multi-Tenant**

Sistema de autenticacao e autorizacao robusto que garante isolamento completo entre tenants, controle granular de permissoes por role e integracao segura com provedores OAuth externos.

### Epic

**Autenticacao JWT com Hierarquia de Roles e Permissoes Configuraveis**

Implementar sistema completo de autenticacao baseado em JWT com refresh tokens, suportando tres niveis de acesso (Super Admin, Admin, Member), perfis de permissao configuraveis pelo Admin e integracao OAuth para Meta e Google.

### Features

#### Feature 1: Autenticacao JWT com Refresh Token

**User Story:** Como usuario do sistema, quero fazer login com email e senha para acessar o CRM de forma segura com tokens que renovam automaticamente.

**Criterios de Aceite:**
- Access token expira em 15 minutos
- Refresh token expira em 7 dias (ou 30 dias com "Lembrar")
- Renovacao automatica transparente ao usuario
- Logout invalida refresh token no banco

#### Feature 2: Sistema de Roles (Super Admin, Admin, Member)

**User Story:** Como plataforma SaaS, preciso de tres niveis de acesso com permissoes distintas para garantir isolamento e controle.

**Criterios de Aceite:**
- Super Admin acessa todos tenants e configura integracoes globais
- Admin tem controle total do seu tenant e cria Members
- Member tem acesso restrito conforme perfil atribuido
- RLS aplicado em todas tabelas com tenant_id

#### Feature 3: Perfis de Permissao Configuraveis

**User Story:** Como Admin, quero criar perfis de permissao customizados para atribuir a Members com diferentes niveis de acesso.

**Criterios de Aceite:**
- Admin pode criar/editar/deletar perfis
- Perfis definem acoes (CRUD) por modulo
- Perfis definem escopo (proprio/todos)
- 3 perfis padrao criados automaticamente por tenant

#### Feature 4: Integracao OAuth (Meta e Google)

**User Story:** Como Admin, quero conectar minhas contas Meta e Google para integrar Lead Ads e Calendar ao CRM.

**Criterios de Aceite:**
- Super Admin configura App ID/Secret globalmente
- Admin/Member autoriza via OAuth padrao
- Tokens armazenados criptografados (AES-256)
- Refresh automatico de tokens expirados

#### Feature 5: Gerenciamento de Perfil de Usuario

**User Story:** Como usuario (Admin ou Member), quero visualizar e editar meu perfil (nome, telefone, foto, senha) para manter minhas informacoes atualizadas.

**Criterios de Aceite:**
- Email e bloqueado para edicao (identificador unico)
- Alteracao de senha exige senha atual valida
- Upload de foto com limite de 5MB
- Todas alteracoes registradas em audit_log

---

## Arquitetura de Roles

### Hierarquia de Acesso

```
┌─────────────────────────────────────────────────────────────┐
│                      SUPER ADMIN                            │
│  - Acesso a todos os tenants                                │
│  - Cria organizacoes e admins                               │
│  - Configura integracoes globais                            │
│  - Visualiza metricas da plataforma                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        ADMIN                                │
│  - Acesso total ao seu tenant                               │
│  - Cria e gerencia members                                  │
│  - Configura pipelines, campos, integracoes                 │
│  - Define perfis de permissao                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        MEMBER                               │
│  - Acesso limitado ao seu tenant                            │
│  - Gerencia suas oportunidades e contatos                   │
│  - Permissoes definidas pelo Admin                          │
│  - Executa tarefas atribuidas                               │
└─────────────────────────────────────────────────────────────┘
```

### Detalhamento de Roles

#### Super Admin

| Area | Permissao |
|------|-----------|
| Organizacoes | Criar, visualizar, editar, suspender |
| Usuarios Admin | Criar primeiro admin de cada tenant |
| Integracoes Globais | Configurar Meta, Google (App ID, Secret) |
| Metricas | Visualizar dados de todos tenants |
| Suporte | Acessar dados de qualquer tenant (auditado) |
| Billing | Gerenciar planos e assinaturas (futuro) |

#### Admin

| Area | Permissao |
|------|-----------|
| Members | Criar, editar, desativar |
| Perfis | Criar e configurar perfis de permissao |
| Pipeline | Criar funis, etapas, campos |
| Contatos | Acesso total (CRUD) |
| Oportunidades | Acesso total (CRUD) |
| Integracoes | Conectar WhatsApp, Meta, Google |
| Configuracoes | Todas do tenant |
| Relatorios | Visualizar todos os dados do tenant |

#### Member

| Area | Permissao Base | Configuravel |
|------|----------------|--------------|
| Oportunidades | Apenas as suas | Sim |
| Contatos | Apenas os seus | Sim |
| Pipeline | Visualizar | Sim |
| Tarefas | Apenas as suas | Sim |
| Conversas | Apenas as suas | Sim |
| Relatorios | Apenas seus dados | Sim |

**RESTRICOES ABSOLUTAS DO MEMBER (nao configuraveis):**

| Area Bloqueada | Descricao |
|----------------|-----------|
| Equipe & Permissoes | Member NAO pode acessar, visualizar nem gerenciar |
| Criar Usuarios | Member NAO pode criar outros Members ou Admins |
| Perfis de Permissao | Member NAO pode criar, editar ou visualizar perfis |
| Configuracoes de Pipeline | Member NAO pode criar campos, etapas, produtos, regras |
| Integracoes | Member NAO pode conectar/desconectar OAuth ou webhooks |
| Configuracoes do Tenant | Member NAO pode alterar preferencias gerais |

**Nota:** Estas restricoes sao imutaveis e nao podem ser concedidas via perfil de permissao. Sao bloqueios arquiteturais do sistema.

---

## Sistema de Permissoes

### Perfis de Permissao

O Admin pode criar perfis de permissao para Members:

```typescript
interface PerfilPermissao {
  id: uuid;
  organizacao_id: uuid;
  nome: string;
  descricao: string;
  permissoes: {
    modulo: string;
    acoes: ('criar' | 'ler' | 'editar' | 'deletar')[];
    escopo: 'proprio' | 'equipe' | 'todos';
  }[];
  criado_em: timestamp;
}
```

### Modulos e Acoes

| Modulo | Acoes Disponiveis | Escopos |
|--------|-------------------|---------|
| contatos | criar, ler, editar, deletar | proprio, todos |
| empresas | criar, ler, editar, deletar | proprio, todos |
| oportunidades | criar, ler, editar, deletar, mover_etapa | proprio, todos |
| tarefas | criar, ler, editar, deletar, completar | proprio, todos |
| conversas | ler, enviar | proprio, todos |
| relatorios | ler | proprio, todos |
| configuracoes | ler, editar | - |

### Perfis Padrao (Criados Automaticamente)

#### Vendedor Padrao

```json
{
  "nome": "Vendedor",
  "permissoes": [
    { "modulo": "oportunidades", "acoes": ["criar", "ler", "editar"], "escopo": "proprio" },
    { "modulo": "contatos", "acoes": ["criar", "ler", "editar"], "escopo": "proprio" },
    { "modulo": "tarefas", "acoes": ["criar", "ler", "editar", "completar"], "escopo": "proprio" },
    { "modulo": "conversas", "acoes": ["ler", "enviar"], "escopo": "proprio" }
  ]
}
```

#### Gerente de Vendas

```json
{
  "nome": "Gerente de Vendas",
  "permissoes": [
    { "modulo": "oportunidades", "acoes": ["criar", "ler", "editar", "deletar"], "escopo": "todos" },
    { "modulo": "contatos", "acoes": ["criar", "ler", "editar", "deletar"], "escopo": "todos" },
    { "modulo": "tarefas", "acoes": ["criar", "ler", "editar", "deletar", "completar"], "escopo": "todos" },
    { "modulo": "relatorios", "acoes": ["ler"], "escopo": "todos" }
  ]
}
```

#### Visualizador

```json
{
  "nome": "Visualizador",
  "permissoes": [
    { "modulo": "oportunidades", "acoes": ["ler"], "escopo": "todos" },
    { "modulo": "contatos", "acoes": ["ler"], "escopo": "todos" },
    { "modulo": "relatorios", "acoes": ["ler"], "escopo": "todos" }
  ]
}
```

---

## Fluxo de Autenticacao

### Login com Email/Senha

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario acessa /login                                    │
│ 2. Preenche email e senha                                   │
│ 3. Frontend envia POST /api/v1/auth/login                   │
│ 4. Backend valida credenciais                               │
│ 5. Backend gera access_token (15min) + refresh_token (7d)   │
│ 6. Frontend armazena tokens (httpOnly cookie ou memory)     │
│ 7. Redireciona conforme role do usuario (ver tabela abaixo) │
└─────────────────────────────────────────────────────────────┘
```

### Redirecionamento por Role (Pos-Login)

Apos login bem-sucedido, o sistema redireciona o usuario para a area correta com base no seu role:

| Role | URL de Redirecionamento | Area |
|------|------------------------|------|
| super_admin | `/admin` | Painel Super Admin (gestao da plataforma) |
| admin | `/app` | Painel do Tenant (CRM do cliente) |
| member | `/app` | Painel do Tenant (CRM do cliente) |

#### Implementacao do Redirecionamento

```typescript
// Frontend: Apos login bem-sucedido
function handleLoginSuccess(user: JWTPayload) {
  const role = user.role;

  switch (role) {
    case 'super_admin':
      navigate('/admin');
      break;
    case 'admin':
    case 'member':
      navigate('/app');
      break;
    default:
      navigate('/login?error=invalid_role');
  }
}
```

#### Protecao de Rotas

```typescript
// Frontend: Middleware de protecao
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Super Admin tentando acessar /app → redireciona para /admin
    // Admin/Member tentando acessar /admin → redireciona para /app
    const redirectTo = user.role === 'super_admin' ? '/admin' : '/app';
    return <Navigate to={redirectTo} />;
  }

  return children;
};

// Uso nas rotas
<Route
  path="/admin/*"
  element={
    <ProtectedRoute allowedRoles={['super_admin']}>
      <SuperAdminLayout />
    </ProtectedRoute>
  }
/>

<Route
  path="/app/*"
  element={
    <ProtectedRoute allowedRoles={['admin', 'member']}>
      <TenantLayout />
    </ProtectedRoute>
  }
/>
```

#### Validacao no Backend

```typescript
// Middleware de validacao de role
function requireRole(...allowedRoles: string[]) {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Voce nao tem permissao para acessar este recurso'
      });
    }

    next();
  };
}

// Uso nas rotas
router.use('/admin/*', requireRole('super_admin'));
router.use('/api/v1/*', requireRole('admin', 'member'));
```

### Estrutura do JWT

```typescript
interface JWTPayload {
  sub: string;              // user_id
  email: string;
  nome: string;
  organizacao_id: string;   // tenant_id
  role: 'super_admin' | 'admin' | 'member';
  perfil_id?: string;       // para members
  iat: number;              // issued at
  exp: number;              // expiration
}
```

### Refresh Token

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Access token expira (401 Unauthorized)                   │
│ 2. Frontend detecta erro e chama POST /api/v1/auth/refresh  │
│ 3. Backend valida refresh_token                             │
│ 4. Backend gera novo access_token                           │
│ 5. Retorna novo token, request original e refeito           │
└─────────────────────────────────────────────────────────────┘
```

### Logout

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario clica em "Sair"                                  │
│ 2. Frontend chama POST /api/v1/auth/logout                  │
│ 3. Backend invalida refresh_token no banco                  │
│ 4. Frontend limpa tokens locais                             │
│ 5. Redireciona para /login                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## OAuth para Integracoes

### Fluxo de Integracao (Meta/Google)

A autenticacao OAuth para integracoes segue um modelo de **duas camadas**:

#### Camada 1: Configuracao Global (Super Admin)

```
1. Super Admin acessa painel de configuracoes globais
2. Cadastra App ID e App Secret do Meta/Google
3. Configura Webhook Base URL
4. Dados salvos em tabela configuracoes_globais
```

#### Camada 2: Autenticacao por Tenant (Admin/Member)

```
1. Admin acessa Configuracoes > Conexoes
2. Clica em "Conectar Meta Ads"
3. Sistema redireciona para OAuth do Meta (usando App ID global)
4. Usuario autoriza acesso
5. Meta retorna authorization_code
6. Backend troca por access_token
7. Token salvo em tabela integracoes (por tenant)
```

### Tabelas Envolvidas

```sql
-- Configuracoes globais (Super Admin)
CREATE TABLE configuracoes_globais (
  id uuid PRIMARY KEY,
  plataforma varchar(50) NOT NULL, -- 'meta', 'google'
  tipo varchar(50) NOT NULL,       -- 'lead_ads', 'calendar', 'gmail'
  app_id varchar(255),
  app_secret_encrypted text,       -- Criptografado
  webhook_verify_token varchar(255),
  webhook_base_url varchar(255),
  ambiente varchar(20) DEFAULT 'production',
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

-- Integracoes por tenant (Admin/Member)
CREATE TABLE integracoes (
  id uuid PRIMARY KEY,
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),
  plataforma varchar(50) NOT NULL,
  tipo varchar(50) NOT NULL,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expira_em timestamptz,
  conta_externa_id varchar(255),
  conta_externa_nome varchar(255),
  status varchar(20) DEFAULT 'conectado',
  ultimo_sync timestamptz,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);
```

---

## Fluxo de Criacao de Usuario

### Criacao de Admin (Super Admin)

```
1. Super Admin cria organizacao (PRD-02)
2. Super Admin preenche dados do primeiro Admin:
   - Nome
   - Sobrenome
   - Email
   - Senha (ou convite por email)
3. Sistema cria usuario com role 'admin'
4. Sistema vincula usuario a organizacao_id
5. Admin recebe email de boas-vindas
```

### Criacao de Member (Admin)

```
1. Admin acessa Configuracoes > Equipe
2. Clica em "Novo Membro"
3. Preenche dados:
   - Nome
   - Sobrenome
   - Email
   - Senha inicial
   - Perfil de permissao
4. Sistema cria usuario com role 'member'
5. Sistema vincula a organizacao_id do Admin
6. Member recebe email com credenciais
```

---

## Seguranca

### Armazenamento de Senhas

```typescript
// Hashing com bcrypt
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(senha, saltRounds);

// Verificacao
const isValid = await bcrypt.compare(senhaInformada, hashedPassword);
```

### Armazenamento de Tokens OAuth

```typescript
// Criptografia AES-256
import { createCipheriv, createDecipheriv } from 'crypto';

const algorithm = 'aes-256-gcm';
const key = process.env.ENCRYPTION_KEY; // 32 bytes

function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(algorithm, key, iv);
  // ...
}

function decrypt(encrypted: string): string {
  // ...
}
```

### Protecao contra Ataques

| Ataque | Mitigacao |
|--------|-----------|
| Brute force | Rate limiting (5 tentativas/15min) |
| SQL Injection | Prepared statements (Supabase) |
| XSS | Sanitizacao + CSP headers |
| CSRF | SameSite cookies + CSRF token |
| Token theft | httpOnly cookies + refresh rotation |

### Rate Limiting de Auth

```typescript
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    retry_after: 900
  }
});

app.post('/api/v1/auth/login', authRateLimiter, loginController);
```

---

## Endpoints de API

### Autenticacao

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| POST | /api/v1/auth/login | Login com email/senha | Nao |
| POST | /api/v1/auth/refresh | Renovar access token | Refresh Token |
| POST | /api/v1/auth/logout | Encerrar sessao | JWT |
| POST | /api/v1/auth/forgot-password | Solicitar reset | Nao |
| POST | /api/v1/auth/reset-password | Redefinir senha | Token de reset |

### Usuarios (Admin)

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/usuarios | Listar membros do tenant | **Admin ONLY** |
| POST | /api/v1/usuarios | Criar membro | **Admin ONLY** |
| GET | /api/v1/usuarios/:id | Detalhes do membro | **Admin ONLY** |
| PATCH | /api/v1/usuarios/:id | Atualizar membro | **Admin ONLY** |
| DELETE | /api/v1/usuarios/:id | Desativar membro | **Admin ONLY** |

**IMPORTANTE:** Member NAO tem acesso a nenhum endpoint de usuarios. Retorna 403 Forbidden.

### Perfis de Permissao (Admin ONLY)

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/perfis | Listar perfis | **Admin ONLY** |
| POST | /api/v1/perfis | Criar perfil | **Admin ONLY** |
| PATCH | /api/v1/perfis/:id | Editar perfil | **Admin ONLY** |
| DELETE | /api/v1/perfis/:id | Remover perfil | **Admin ONLY** |

**IMPORTANTE:** Member NAO tem acesso a nenhum endpoint de perfis. Retorna 403 Forbidden.

---

## Gerenciamento de Perfil de Usuario

### Visao Geral

Admin e Member podem visualizar e editar seu proprio perfil. O email e o unico campo bloqueado para edicao, pois serve como identificador unico do usuario no sistema.

### Hierarquia de Criacao de Usuarios

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FLUXO DE CRIACAO DE USUARIOS                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. SUPER ADMIN cria Tenant (organizacao_saas)                              │
│     └─> Wizard: Empresa → Expectativas → Admin                              │
│                                                                             │
│  2. SUPER ADMIN cria primeiro ADMIN do tenant                               │
│     └─> Admin recebe email de boas-vindas                                   │
│     └─> Admin pode fazer login                                              │
│                                                                             │
│  3. ADMIN cria MEMBERS dentro do seu tenant                                 │
│     └─> Acessa: Configuracoes > Equipe                                      │
│     └─> Cria usuario com role 'member'                                      │
│     └─> Define perfil de permissao                                          │
│     └─> Member recebe email com credenciais                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Quem Pode Editar o Que

| Campo | Admin (proprio perfil) | Member (proprio perfil) | Admin (outro usuario) |
|-------|------------------------|-------------------------|----------------------|
| Nome | ✅ Pode editar | ✅ Pode editar | ✅ Pode editar |
| Sobrenome | ✅ Pode editar | ✅ Pode editar | ✅ Pode editar |
| Email | ❌ **BLOQUEADO** | ❌ **BLOQUEADO** | ❌ **BLOQUEADO** |
| Telefone | ✅ Pode editar | ✅ Pode editar | ✅ Pode editar |
| Foto de Perfil | ✅ Pode editar | ✅ Pode editar | ❌ Nao pode |
| Senha | ✅ Pode alterar | ✅ Pode alterar | ❌ Pode resetar |

### Por que Email e Bloqueado?

| Razao | Impacto |
|-------|---------|
| **Identificador unico** | Email e o login do usuario |
| **Integridade de audit** | Logs referenciam email original |
| **Convites e notificacoes** | Sistema envia para email cadastrado |
| **OAuth vinculado** | Integracoes Google/Meta usam email |
| **Recuperacao de senha** | Token enviado para email original |

**Se precisar alterar email:** Deve solicitar ao Admin que crie novo usuario e desative o antigo.

### Acesso ao Perfil

O usuario (Admin ou Member) acessa seu perfil pelo menu do header:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CRM Renove                                    [Avatar] Carlos Silva ▼      │
│                                               ┌─────────────────────────────┤
│                                               │  👤 Meu Perfil               │
│                                               │  ⚙ Preferencias              │
│                                               │  ─────────────────────       │
│                                               │  🚪 Sair                     │
│                                               └─────────────────────────────┘
└─────────────────────────────────────────────────────────────────────────────┘
```

### Interface - Pagina/Modal "Meu Perfil"

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  👤 Meu Perfil                                                         X   │
│     Gerencie suas informacoes pessoais                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │              ┌─────────┐                                              │  │
│  │              │         │                                              │  │
│  │              │  [Foto] │                                              │  │
│  │              │         │                                              │  │
│  │              └─────────┘                                              │  │
│  │              [📷 Alterar Foto]                                        │  │
│  │                                                                       │  │
│  │  Carlos Silva                               [Admin] badge             │  │
│  │  Empresa: Renove Marketing LTDA                                       │  │
│  │  Membro desde: 15/01/2026                                             │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ── INFORMACOES PESSOAIS ───────────────────────────────────────────────   │
│                                                                             │
│  Nome *                                                                     │
│  [Carlos_____________________________]                                     │
│                                                                             │
│  Sobrenome *                                                                │
│  [Silva______________________________]                                     │
│                                                                             │
│  Email                                                      [🔒 Bloqueado] │
│  [carlos@renove.com.br_______________] (desabilitado, fundo cinza)        │
│  ℹ O email nao pode ser alterado. Contate o administrador se necessario.  │
│                                                                             │
│  Telefone                                                                   │
│  [(11) 99999-9999____________________]                                     │
│                                                                             │
│  ── SEGURANCA ──────────────────────────────────────────────────────────   │
│                                                                             │
│  Alterar Senha                                         [Alterar Senha]     │
│  Ultima alteracao: 10/01/2026                                               │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  [Cancelar]                                      [💾 Salvar Alteracoes]    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Interface - Modal de Alteracao de Senha

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔐 Alterar Senha                                                      X   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Senha Atual *                                                              │
│  [••••••••••••••_______________] [👁]                                      │
│                                                                             │
│  Nova Senha *                                                               │
│  [______________________________] [👁]                                      │
│  ℹ Minimo 8 caracteres, 1 maiuscula, 1 numero                              │
│                                                                             │
│  Confirmar Nova Senha *                                                     │
│  [______________________________] [👁]                                      │
│                                                                             │
│  ── REQUISITOS ─────────────────────────────────────────────────────────   │
│  [✓] Minimo 8 caracteres                                                   │
│  [✗] Pelo menos 1 letra maiuscula                                          │
│  [✗] Pelo menos 1 numero                                                   │
│  [✗] Senhas conferem                                                       │
│                                                                             │
│  [Cancelar]                                        [🔐 Alterar Senha]      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Interface - Upload de Foto de Perfil

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📷 Alterar Foto de Perfil                                             X   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │     Arraste uma imagem aqui ou clique para selecionar                │  │
│  │                                                                       │  │
│  │     Formatos aceitos: JPG, PNG, GIF                                   │  │
│  │     Tamanho maximo: 5MB                                               │  │
│  │     Dimensao recomendada: 200x200px                                   │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ── PREVIEW ────────────────────────────────────────────────────────────   │
│                                                                             │
│  ┌─────────┐                                                               │
│  │         │  [Preview da imagem com crop circular]                        │
│  │ [Foto]  │                                                               │
│  │         │                                                               │
│  └─────────┘                                                               │
│                                                                             │
│  [Remover Foto]  [Cancelar]                          [💾 Salvar Foto]      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Alteracoes no Banco de Dados

#### Alteracao na Tabela usuarios

```sql
-- Adicionar campos de perfil (se nao existirem)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefone varchar(20);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_url text;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_storage_path text;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS senha_alterada_em timestamptz;
```

#### Bucket no Supabase Storage

```sql
-- Criar bucket para fotos de perfil
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Politica de acesso: usuario pode fazer upload/update apenas da propria foto
CREATE POLICY "users_can_upload_own_avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "users_can_update_own_avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "users_can_delete_own_avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politica de leitura: avatares sao publicos
CREATE POLICY "avatars_are_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

#### Estrutura de Armazenamento de Fotos

```
avatars/
  └── {user_id}/
      └── avatar.{jpg|png|gif}
```

### Endpoints de API - Perfil

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/perfil | Obter dados do proprio perfil | JWT (Admin/Member) |
| PATCH | /api/v1/perfil | Atualizar proprio perfil | JWT (Admin/Member) |
| POST | /api/v1/perfil/foto | Upload de foto de perfil | JWT (Admin/Member) |
| DELETE | /api/v1/perfil/foto | Remover foto de perfil | JWT (Admin/Member) |
| POST | /api/v1/perfil/senha | Alterar propria senha | JWT (Admin/Member) |

### Payloads de API

#### GET /api/v1/perfil - Response

```typescript
interface PerfilResponse {
  id: string;
  nome: string;
  sobrenome: string;
  email: string;           // Apenas leitura
  telefone: string | null;
  foto_url: string | null;
  role: 'admin' | 'member';
  organizacao: {
    id: string;
    nome: string;
  };
  criado_em: string;
  senha_alterada_em: string | null;
}
```

#### PATCH /api/v1/perfil - Request

```typescript
interface AtualizarPerfilRequest {
  nome?: string;           // Min 2, Max 100 caracteres
  sobrenome?: string;      // Min 2, Max 100 caracteres
  telefone?: string | null; // Formato telefone brasileiro
}
// NOTA: Email NAO e aceito neste endpoint
```

#### POST /api/v1/perfil/senha - Request

```typescript
interface AlterarSenhaRequest {
  senha_atual: string;
  nova_senha: string;      // Min 8 chars, 1 upper, 1 number
  confirmar_senha: string; // Deve ser igual a nova_senha
}
```

### Validacao Zod (Backend)

```typescript
import { z } from 'zod';

// Schema de atualizacao de perfil
export const atualizarPerfilSchema = z.object({
  nome: z.string().min(2).max(100).optional(),
  sobrenome: z.string().min(2).max(100).optional(),
  telefone: z.string()
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Formato invalido: (XX) XXXXX-XXXX')
    .nullable()
    .optional(),
});

// Schema de alteracao de senha
export const alterarSenhaSchema = z.object({
  senha_atual: z.string().min(1, 'Senha atual obrigatoria'),
  nova_senha: z.string()
    .min(8, 'Minimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter pelo menos 1 letra maiuscula')
    .regex(/[0-9]/, 'Deve conter pelo menos 1 numero'),
  confirmar_senha: z.string(),
}).refine(data => data.nova_senha === data.confirmar_senha, {
  message: 'Senhas nao conferem',
  path: ['confirmar_senha'],
});

// Schema de upload de foto
export const uploadFotoSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.size <= 5 * 1024 * 1024, 'Tamanho maximo: 5MB')
    .refine(
      file => ['image/jpeg', 'image/png', 'image/gif'].includes(file.type),
      'Formato invalido: use JPG, PNG ou GIF'
    ),
});
```

### Seguranca do Perfil

#### Regras de Acesso

| Acao | Admin | Member | Validacao |
|------|-------|--------|-----------|
| Ver proprio perfil | ✅ | ✅ | JWT.sub == usuario_id |
| Editar proprio perfil | ✅ | ✅ | JWT.sub == usuario_id |
| Alterar propria senha | ✅ | ✅ | Validar senha_atual antes |
| Upload foto propria | ✅ | ✅ | JWT.sub == pasta destino |
| Ver perfil de outro | ✅ | ❌ | Admin apenas, mesmo tenant |
| Editar perfil de outro | ✅ (parcial) | ❌ | Admin apenas, exceto foto/senha |

#### Audit Trail

Todas alteracoes de perfil devem ser registradas na tabela `audit_log`:

```typescript
// Exemplo de registro
{
  organizacao_id: user.organizacao_id,
  usuario_id: user.id,
  acao: 'update',
  entidade: 'usuarios',
  entidade_id: user.id,
  dados_anteriores: { nome: 'Carlos', telefone: null },
  dados_novos: { nome: 'Carlos Eduardo', telefone: '(11) 99999-9999' },
  ip: request.ip,
  user_agent: request.headers['user-agent'],
}
```

#### Protecao de Alteracao de Senha

```typescript
// Middleware de validacao
async function validarSenhaAtual(req, res, next) {
  const { senha_atual } = req.body;
  const user = await getUsuarioById(req.user.sub);

  const isValid = await bcrypt.compare(senha_atual, user.senha_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Senha atual incorreta' });
  }

  next();
}
```

---

## Interface de Login

### Visao Geral

A tela de login e a porta de entrada do CRM Renove, utilizada por Super Admin, Admin e Member para autenticacao. O design prioriza simplicidade, seguranca e clareza, sem opcao de criacao de conta (usuarios sao criados internamente).

### RF-021: Tela de Login

**User Story:**
Como usuario (Super Admin, Admin ou Member),
Quero acessar uma tela de login simples e segura,
Para autenticar no sistema e acessar minhas funcionalidades.

**Rota:** `/login`
**Acesso:** Publico (usuarios nao autenticados)

**Layout da Tela:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                                                                             │
│                          [Logo Renove CRM]                                  │
│                                                                             │
│                    ┌─────────────────────────────────┐                      │
│                    │                                 │                      │
│                    │     Informe seus dados abaixo   │                      │
│                    │                                 │                      │
│                    │  E-mail *                       │                      │
│                    │  [_____________________________]│                      │
│                    │                                 │                      │
│                    │  Senha *                        │                      │
│                    │  [_____________________________]│ [👁]                 │
│                    │                                 │                      │
│                    │  [✓] Lembrar por 30 dias        │                      │
│                    │                                 │                      │
│                    │  [         Entrar              ]│                      │
│                    │                                 │                      │
│                    │        Esqueci minha senha      │                      │
│                    │                                 │                      │
│                    └─────────────────────────────────┘                      │
│                                                                             │
│               Politica de Privacidade  •  Termos de Servico                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Especificacoes Visuais:**

| Elemento | Especificacao |
|----------|---------------|
| Background | Gradiente suave ou imagem de fundo (configuravel) |
| Card de login | Fundo branco, sombra sutil, border-radius 8px, max-width 400px |
| Logo | Centralizado acima do card, altura max 60px |
| Titulo | "Informe seus dados abaixo", font-size 20px, font-weight 600, color gray-900 |
| Labels | font-size 14px, color gray-700, margin-bottom 4px |
| Inputs | Altura 44px, border gray-300, border-radius 6px, focus: ring-2 ring-blue-500 |
| Botao Entrar | Largura 100%, altura 44px, bg-blue-600, hover: bg-blue-700, font-weight 500 |
| Link Esqueci | font-size 14px, color blue-600, centralizado, cursor pointer, hover: underline |
| Links rodape | font-size 12px, color gray-500, separados por bullet (•) |

**Campos do Formulario:**

| Campo | Tipo | Obrigatorio | Validacao | Placeholder |
|-------|------|-------------|-----------|-------------|
| email | email | Sim | Formato email valido | "seu@email.com" |
| senha | password | Sim | Minimo 1 caractere | "••••••••" |
| lembrar | checkbox | Nao | Boolean, default false | - |

**Comportamento "Lembrar por 30 dias":**

| Estado | Expiracao refresh_token |
|--------|-------------------------|
| Marcado | 30 dias |
| Nao marcado | 7 dias (padrao) |

- Preferencia salva em localStorage: `rememberMe: true/false`
- Ao carregar pagina, checkbox reflete ultimo valor salvo

**Icone de Visibilidade da Senha:**

- Posicao: dentro do input, lado direito
- Icone padrao: Eye (olho fechado) - senha oculta
- Icone ativo: EyeOff (olho aberto) - senha visivel
- Toggle ao clicar

**Mensagens de Erro:**

| Situacao | Mensagem | Cor |
|----------|----------|-----|
| Campos vazios | "Preencha todos os campos obrigatorios" | Vermelho (#EF4444) |
| Email invalido | "Informe um e-mail valido" | Vermelho |
| Credenciais invalidas | "E-mail ou senha incorretos" | Vermelho |
| Muitas tentativas | "Muitas tentativas. Aguarde 15 minutos." | Vermelho |
| Erro de rede | "Erro de conexao. Tente novamente." | Vermelho |

**Nota de Seguranca:** Mensagem "E-mail ou senha incorretos" e propositalmente generica para nao revelar se o email existe no sistema.

**Estados do Botao Entrar:**

| Estado | Visual | Cursor |
|--------|--------|--------|
| Normal | bg-blue-600, texto branco | pointer |
| Hover | bg-blue-700 | pointer |
| Disabled (campos vazios) | bg-gray-300, texto gray-500 | not-allowed |
| Loading | bg-blue-600, spinner + "Entrando..." | wait |

**Fluxo Apos Login:**

```
[Usuario preenche credenciais]
           |
           v
[Clica "Entrar"]
           |
           v
[Sistema valida credenciais]
           |
    ┌──────┴──────┐
    |             |
    v             v
[Sucesso]    [Erro]
    |             |
    v             v
[Redireciona  [Exibe mensagem
 para /]       de erro]
```

**Redirecionamento por Role:**

| Role | Destino |
|------|---------|
| Super Admin | /admin (painel Super Admin) |
| Admin | / (dashboard do tenant) |
| Member | / (dashboard do tenant) |

**Criterios de Aceitacao:**
- [ ] Tela renderiza com logo, card e campos
- [ ] Titulo "Informe seus dados abaixo" visivel
- [ ] Campo E-mail com validacao de formato
- [ ] Campo Senha com icone toggle visibilidade (olho)
- [ ] Checkbox "Lembrar por 30 dias" funcional
- [ ] Botao "Entrar" desabilitado se campos vazios
- [ ] Loading state ao submeter
- [ ] Mensagens de erro claras e em portugues
- [ ] Link "Esqueci minha senha" redireciona para /recuperar-senha
- [ ] Links de rodape para Politica e Termos (href configuravel)
- [ ] Sem opcao de criar conta (apenas login)
- [ ] Responsivo para mobile (card centralizado, margens ajustadas)
- [ ] Rate limiting: bloqueia apos 5 tentativas em 15 minutos

---

### RF-022: Recuperacao de Senha (Interface)

**User Story:**
Como usuario que esqueceu a senha,
Quero solicitar recuperacao via email,
Para redefinir minha senha e acessar o sistema.

**Rotas:**
- `/recuperar-senha` - Solicitar link de recuperacao
- `/redefinir-senha?token=xxx` - Redefinir senha com token

**Fluxo Completo:**

```
[Tela Login]
     |
     v
[Clica "Esqueci minha senha"]
     |
     v
[Tela Recuperar Senha]
     |
     v
[Informa email e envia]
     |
     v
[Backend verifica email e envia link (se existir)]
     |
     v
[Tela exibe: "Se o email existir, enviaremos um link"]
     |
     v
[Usuario abre email e clica no link]
     |
     v
[Tela Redefinir Senha (com token na URL)]
     |
     v
[Informa nova senha e confirma]
     |
     v
[Senha alterada com sucesso]
     |
     v
[Redireciona para /login com toast de sucesso]
```

**Layout - Tela "Recuperar Senha":**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                          [Logo Renove CRM]                                  │
│                                                                             │
│                    ┌─────────────────────────────────┐                      │
│                    │                                 │                      │
│                    │       Recuperar Senha           │                      │
│                    │                                 │                      │
│                    │  Informe seu e-mail cadastrado  │                      │
│                    │  para receber o link de         │                      │
│                    │  recuperacao.                   │                      │
│                    │                                 │                      │
│                    │  E-mail *                       │                      │
│                    │  [_____________________________]│                      │
│                    │                                 │                      │
│                    │  [ Enviar link de recuperacao  ]│                      │
│                    │                                 │                      │
│                    │        ← Voltar para login      │                      │
│                    │                                 │                      │
│                    └─────────────────────────────────┘                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Especificacoes - Tela Recuperar:**

| Elemento | Especificacao |
|----------|---------------|
| Titulo | "Recuperar Senha", font-size 24px, font-weight 600 |
| Subtitulo | Texto explicativo, font-size 14px, color gray-600 |
| Botao | "Enviar link de recuperacao", bg-blue-600 |
| Link voltar | "← Voltar para login", color blue-600 |

**Layout - Tela "Redefinir Senha":**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                          [Logo Renove CRM]                                  │
│                                                                             │
│                    ┌─────────────────────────────────┐                      │
│                    │                                 │                      │
│                    │       Redefinir Senha           │                      │
│                    │                                 │                      │
│                    │  Nova Senha *                   │                      │
│                    │  [_____________________________]│ [👁]                 │
│                    │  Min 8 caracteres, 1 maiuscula, │                      │
│                    │  1 numero                       │                      │
│                    │                                 │                      │
│                    │  ── REQUISITOS ─────────────    │                      │
│                    │  [✓] Minimo 8 caracteres        │                      │
│                    │  [✗] Pelo menos 1 maiuscula     │                      │
│                    │  [✗] Pelo menos 1 numero        │                      │
│                    │                                 │                      │
│                    │  Confirmar Senha *              │                      │
│                    │  [_____________________________]│ [👁]                 │
│                    │  [✗] Senhas conferem            │                      │
│                    │                                 │                      │
│                    │  [       Redefinir Senha       ]│                      │
│                    │                                 │                      │
│                    └─────────────────────────────────┘                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Checklist de Requisitos da Senha (tempo real):**

| Requisito | Icone Atendido | Icone Nao Atendido | Cor Atendido | Cor Nao Atendido |
|-----------|----------------|--------------------|--------------| -----------------|
| Minimo 8 caracteres | ✓ CheckCircle | ✗ XCircle | Verde (#22C55E) | Cinza (#9CA3AF) |
| 1 letra maiuscula | ✓ CheckCircle | ✗ XCircle | Verde | Cinza |
| 1 numero | ✓ CheckCircle | ✗ XCircle | Verde | Cinza |
| Senhas conferem | ✓ CheckCircle | ✗ XCircle | Verde | Cinza |

**Regras de Seguranca:**

| Regra | Valor |
|-------|-------|
| Expiracao do token | 1 hora |
| Formato token | UUID v4 |
| Uso unico | Token invalidado apos uso bem-sucedido |
| Mensagem de envio | Generica: "Se o email existir, enviaremos um link" |
| Rate limiting | 3 solicitacoes por email/hora |

**Mensagens de Sucesso:**

| Tela | Mensagem |
|------|----------|
| Apos solicitar | "Se o email existir em nosso sistema, enviaremos um link de recuperacao." |
| Apos redefinir | Toast: "Senha alterada com sucesso! Faca login com sua nova senha." |

**Erros Possiveis:**

| Situacao | Mensagem |
|----------|----------|
| Token invalido | "Link invalido ou expirado. Solicite novo link." |
| Token expirado | "Link expirado. Solicite novo link." |
| Senhas nao conferem | "As senhas nao conferem." |
| Senha fraca | "A senha nao atende aos requisitos minimos." |

**Criterios de Aceitacao:**
- [ ] Link "Esqueci minha senha" na tela de login funciona
- [ ] Tela de recuperacao exibe campo email e instrucoes
- [ ] Botao "Enviar link" dispara POST /api/v1/auth/forgot-password
- [ ] Mensagem de sucesso generica (nao revela se email existe)
- [ ] Email enviado contem link com token unico
- [ ] Tela de redefinicao valida token antes de exibir formulario
- [ ] Checklist de requisitos de senha atualiza em tempo real
- [ ] Botao desabilitado ate todos requisitos atendidos
- [ ] Apos sucesso, redireciona para /login
- [ ] Toast de sucesso exibido na tela de login

---

### RF-023: Links de Politica e Termos

**User Story:**
Como usuario,
Quero acessar as politicas de privacidade e termos de servico,
Para entender como meus dados sao tratados.

**Posicao:** Rodape da tela de login, centralizado abaixo do card

**Layout:**

```
               Politica de Privacidade  •  Termos de Servico
```

**Especificacoes:**

| Elemento | Especificacao |
|----------|---------------|
| Font-size | 12px |
| Color | gray-500 (#6B7280) |
| Hover | underline, color gray-700 |
| Separador | Bullet (•) |
| Target | _blank (nova aba) |

**Configuracao via Variaveis de Ambiente:**

```typescript
// .env
VITE_PRIVACY_POLICY_URL=https://crm.renove.com.br/privacidade
VITE_TERMS_OF_SERVICE_URL=https://crm.renove.com.br/termos
```

**Comportamento se URLs nao configuradas:**

| Cenario | Comportamento |
|---------|---------------|
| URL vazia | Link oculto |
| Ambas vazias | Linha de rodape oculta |
| Paginas futuras | Exibir "Em breve" como placeholder |

**Criterios de Aceitacao:**
- [ ] Links visiveis no rodape da tela de login
- [ ] Abrem em nova aba (target="_blank")
- [ ] Rel="noopener noreferrer" para seguranca
- [ ] URLs configuraveis via variavel de ambiente
- [ ] Se URL vazia, link nao e renderizado
- [ ] Estilizacao consistente com o design system

---

### Alteracao no Endpoint de Login

O endpoint `POST /api/v1/auth/login` deve aceitar novo campo opcional:

**Request Atualizado:**

```typescript
interface LoginRequest {
  email: string;
  senha: string;
  lembrar?: boolean; // NOVO: se true, refresh_token expira em 30 dias
}
```

**Logica no Backend:**

```typescript
// Determinar expiracao do refresh token
const refreshTokenExpiry = request.lembrar
  ? 30 * 24 * 60 * 60 * 1000  // 30 dias em ms
  : 7 * 24 * 60 * 60 * 1000;  // 7 dias em ms (padrao)

const refreshToken = jwt.sign(
  { sub: user.id, type: 'refresh' },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: request.lembrar ? '30d' : '7d' }
);
```

---

### Checklist de Implementacao - Interface de Login

- [ ] Criar pagina /login com layout conforme wireframe
- [ ] Implementar formulario com React Hook Form + Zod
- [ ] Adicionar toggle de visibilidade da senha
- [ ] Implementar checkbox "Lembrar por 30 dias"
- [ ] Salvar preferencia em localStorage
- [ ] Implementar estados do botao (normal, hover, disabled, loading)
- [ ] Exibir mensagens de erro com estilo padrao
- [ ] Criar pagina /recuperar-senha
- [ ] Criar pagina /redefinir-senha com validacao de token
- [ ] Implementar checklist de requisitos de senha em tempo real
- [ ] Adicionar links de Politica e Termos no rodape
- [ ] Configurar variaveis de ambiente para URLs
- [ ] Atualizar endpoint POST /api/v1/auth/login para campo `lembrar`
- [ ] Testar fluxo completo de login
- [ ] Testar fluxo completo de recuperacao de senha
- [ ] Testar responsividade mobile
- [ ] Testar rate limiting (5 tentativas/15min)

---

## Requisitos Funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-001 | Login com email/senha | Must |
| RF-002 | JWT com refresh token | Must |
| RF-003 | Tres roles (Super Admin, Admin, Member) | Must |
| RF-004 | Perfis de permissao configuraveis | Must |
| RF-005 | Admin cria e gerencia members | Must |
| RF-006 | OAuth para Meta e Google | Must |
| RF-007 | Recuperacao de senha por email | Should |
| RF-008 | Logout em todos dispositivos | Should |
| RF-009 | Historico de logins | Could |
| RF-010 | Login com Google (SSO) | Could |
| RF-011 | Admin e Member podem visualizar seu proprio perfil | Must |
| RF-012 | Admin e Member podem editar nome, sobrenome e telefone | Must |
| RF-013 | Email e somente leitura (bloqueado para edicao) | Must |
| RF-014 | Admin e Member podem fazer upload de foto de perfil | Should |
| RF-015 | Admin e Member podem alterar sua propria senha | Must |
| RF-016 | Alteracao de senha exige senha atual valida | Must |
| RF-017 | Nova senha deve ter minimo 8 chars, 1 upper, 1 number | Must |
| RF-018 | Todas alteracoes de perfil sao registradas em audit_log | Must |
| RF-019 | Admin pode visualizar perfil de Members do seu tenant | Should |
| RF-020 | Admin pode editar nome/telefone de Members (nao senha/foto) | Should |
| RF-021 | Tela de login com titulo, email, senha, "Lembrar por 30 dias", botao Entrar | Must |
| RF-022 | Fluxo de recuperacao de senha: telas /recuperar-senha e /redefinir-senha | Must |
| RF-023 | Links de Politica de Privacidade e Termos de Servico no rodape do login | Should |

---

## Requisitos Nao-Funcionais

| Requisito | Target |
|-----------|--------|
| Tempo de login | < 2 segundos |
| Tempo de refresh | < 500ms |
| Expiracao access token | 15 minutos |
| Expiracao refresh token | 7 dias |
| Hash de senha | bcrypt 12 rounds |
| Criptografia tokens | AES-256-GCM |

---

## Metricas de Sucesso

### KPIs Primarios

| Metrica | Meta | Medicao |
|---------|------|---------|
| Taxa de sucesso de login | >= 99% | Logins bem-sucedidos / Total de tentativas |
| Tempo medio de autenticacao | < 2s | Tempo do submit ate resposta |
| Tempo de refresh token | < 500ms | Tempo da chamada /refresh |
| Uptime do servico de auth | >= 99.9% | Monitoramento continuo |

### KPIs Secundarios

| Metrica | Meta | Medicao |
|---------|------|---------|
| Taxa de bloqueio por rate limit | < 1% | Usuarios bloqueados / Total usuarios |
| Taxa de recuperacao de senha | >= 95% | Recuperacoes concluidas / Solicitadas |
| Adocao de OAuth (Meta/Google) | >= 30% | Tenants com integracao ativa |
| Taxa de uso de "Lembrar 30 dias" | Monitorar | Logins com flag ativo |

### Criterios de Lancamento

| Criterio | Requisito |
|----------|-----------|
| Testes de seguranca | Passar auditoria OWASP Top 10 |
| Rate limiting funcionando | 5 tentativas/15min por IP/email |
| Criptografia validada | AES-256-GCM para tokens OAuth |
| RLS aplicado | Todas tabelas com tenant_id isolado |
| Logs de auditoria | Todas acoes de auth registradas |

---

## Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| Vazamento de tokens JWT | Baixa | Critico | httpOnly cookies, refresh rotation, expiracao curta (15min) |
| Brute force de login | Media | Alto | Rate limiting (5 tentativas/15min), CAPTCHA apos 3 falhas |
| Roubo de sessao | Baixa | Critico | SameSite cookies, CSP headers, validacao de user-agent |
| Falha na criptografia de tokens OAuth | Baixa | Critico | AES-256-GCM, chave em HSM/env protegido, rotacao periodica |
| Member acessando dados de outros | Baixa | Critico | RLS obrigatorio, validacao dupla (middleware + banco) |
| OAuth token expirado sem refresh | Media | Medio | Refresh proativo 1h antes, notificacao ao usuario |
| Super Admin comprometido | Baixa | Critico | MFA obrigatorio (futuro), audit trail completo, IP whitelist |
| Recuperacao de senha abusada | Media | Medio | Rate limit 3/hora por email, mensagem generica |

---

## Time to Value

### MVP (3 dias)

| Dia | Entrega |
|-----|---------|
| 1 | Login/logout com JWT, middleware de autenticacao |
| 2 | 3 roles (Super Admin, Admin, Member), RLS basico |
| 3 | Refresh token, rate limiting, tela de login |

**Funcionalidades MVP:**
- Login com email/senha
- JWT com refresh token (7 dias)
- 3 roles com permissoes fixas
- RLS por tenant_id
- Tela de login funcional

### Versao 1.0 (+ 4 dias)

| Dia | Entrega |
|-----|---------|
| 4 | Perfis de permissao configuraveis |
| 5 | OAuth Meta (Lead Ads) |
| 6 | OAuth Google (Calendar) |
| 7 | Recuperacao de senha, "Lembrar 30 dias" |

**Funcionalidades V1.0:**
- Perfis de permissao por Admin
- Integracao OAuth Meta e Google
- Fluxo de recuperacao de senha
- Opcao "Lembrar por 30 dias"
- Audit trail de autenticacao

### Versao 1.1 (+ 3 dias)

| Dia | Entrega |
|-----|---------|
| 8-9 | Gerenciamento de perfil (nome, telefone, foto) |
| 10 | Alteracao de senha, historico de logins |

**Funcionalidades V1.1:**
- Edicao de perfil de usuario
- Upload de foto de perfil
- Alteracao de senha com validacao
- Historico de logins (opcional)

---

## Plano de Validacao

### Pre-Lancamento

| Item | Validacao | Responsavel |
|------|-----------|-------------|
| Testes unitarios | >= 90% cobertura em auth | Dev Team |
| Testes de integracao | Fluxos completos de login/logout | QA |
| Pentest basico | OWASP Top 10 checklist | Security |
| Revisao de codigo | Aprovacao de 2 devs | Tech Lead |
| Testes de carga | 100 logins simultaneos | DevOps |

### Durante Lancamento

| Item | Validacao | Responsavel |
|------|-----------|-------------|
| Monitoramento de erros | Alertas para falhas > 1% | DevOps |
| Logs de autenticacao | Verificar registro completo | Security |
| Tempo de resposta | < 2s em 95% das requisicoes | DevOps |
| Rate limiting | Validar bloqueio apos 5 tentativas | QA |

### Pos-Lancamento

| Item | Validacao | Frequencia |
|------|-----------|------------|
| Auditoria de acessos | Revisar logs de Super Admin | Semanal |
| Rotacao de secrets | JWT_SECRET, ENCRYPTION_KEY | Trimestral |
| Revisao de permissoes | Perfis e acessos por tenant | Mensal |
| Metricas de seguranca | Dashboard de tentativas suspeitas | Continuo |
| Feedback de usuarios | Taxa de sucesso de login | Semanal |

---

## Checklist de Implementacao

### Autenticacao Base
- [ ] Criar tabela usuarios
- [ ] Criar tabela papeis
- [ ] Criar tabela perfis_permissao
- [ ] Criar tabela refresh_tokens
- [ ] Criar tabela configuracoes_globais
- [ ] Criar tabela integracoes
- [ ] Implementar endpoint POST /auth/login
- [ ] Implementar endpoint POST /auth/refresh
- [ ] Implementar endpoint POST /auth/logout
- [ ] Implementar middleware de autenticacao JWT
- [ ] Implementar middleware de autorizacao por role
- [ ] Implementar middleware de autorizacao por permissao
- [ ] Implementar fluxo OAuth Meta
- [ ] Implementar fluxo OAuth Google
- [ ] Implementar rate limiting de auth
- [ ] Criar perfis padrao ao criar tenant
- [ ] Criar testes de autenticacao
- [ ] Criar testes de autorizacao

### Gerenciamento de Perfil de Usuario
- [ ] Adicionar colunas telefone, foto_url, foto_storage_path, senha_alterada_em em usuarios
- [ ] Criar bucket 'avatars' no Supabase Storage
- [ ] Criar politicas RLS para storage de avatares
- [ ] Endpoint GET /api/v1/perfil
- [ ] Endpoint PATCH /api/v1/perfil
- [ ] Endpoint POST /api/v1/perfil/foto
- [ ] Endpoint DELETE /api/v1/perfil/foto
- [ ] Endpoint POST /api/v1/perfil/senha
- [ ] Schemas Zod para validacao (atualizarPerfilSchema, alterarSenhaSchema, uploadFotoSchema)
- [ ] Middleware de validacao de senha atual
- [ ] Registro em audit_log para alteracoes de perfil
- [ ] Opcao "Meu Perfil" no dropdown do header
- [ ] Modal/Pagina de visualizacao de perfil
- [ ] Formulario de edicao com validacao
- [ ] Campo email desabilitado visualmente
- [ ] Modal de upload de foto com preview
- [ ] Modal de alteracao de senha com checklist de requisitos
- [ ] Feedback visual de sucesso/erro
- [ ] Atualizacao do avatar no header apos upload

---

## Historico de Versoes

| Versao | Data | Autor | Mudancas |
|--------|------|-------|----------|
| v1.0 | 2026-01-31 | Arquiteto de Produto | Versao inicial |
| v1.1 | 2026-01-31 | Arquiteto de Produto | Adicionadas restricoes absolutas do Member (Equipe & Permissoes bloqueado) |
| v1.2 | 2026-02-03 | Arquiteto de Produto | Adicionada secao Gerenciamento de Perfil de Usuario (RF-011 a RF-020): Admin e Member podem editar proprio perfil, email bloqueado, upload de foto, alteracao de senha |
| v1.3 | 2026-02-03 | Arquiteto de Produto | Adicionada secao Interface de Login (RF-021 a RF-023): Tela de login com titulo "Informe seus dados abaixo", campos E-mail e Senha, checkbox "Lembrar por 30 dias", link "Esqueci minha senha", fluxo de recuperacao de senha (2 telas), links de Politica de Privacidade e Termos de Servico, especificacoes visuais completas |
| v1.4 | 2026-02-03 | Arquiteto de Produto | Adicionadas secoes conforme prdpadrao.md: Hierarquia de Requisitos (Theme/Epic/5 Features), Metricas de Sucesso (KPIs e criterios lancamento), Riscos e Mitigacoes (8 riscos identificados), Time to Value (MVP 3 dias, V1.0 +4 dias, V1.1 +3 dias), Plano de Validacao (Pre/Durante/Pos-Lancamento) |
| v1.5 | 2026-02-03 | Arquiteto de Produto | Adicionada secao **Redirecionamento por Role (Pos-Login)**: Super Admin redireciona para /admin, Admin e Member redirecionam para /app; Exemplos de implementacao frontend (handleLoginSuccess, ProtectedRoute) e backend (middleware requireRole); Integra com PRD-14 Bootstrap |
