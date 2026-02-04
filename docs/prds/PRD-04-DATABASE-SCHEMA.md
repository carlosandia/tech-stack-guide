# PRD-04: Database Schema - CRM Renove

| Campo | Valor |
|-------|-------|
| **Autor** | Arquiteto de Produto |
| **Data de criacao** | 2026-01-31 |
| **Ultima atualizacao** | 2026-02-03 |
| **Versao** | v1.8 |
| **Status** | Em desenvolvimento |
| **Dependencias** | PRD-02, PRD-03 |
| **Revisor tecnico** | Tech Lead |

---

## Resumo Executivo

Este documento define o schema completo do banco de dados do CRM Renove, seguindo os principios de multi-tenancy (PRD-02), nomenclatura PT-BR e as melhores praticas de modelagem para SaaS.

O banco utiliza PostgreSQL via Supabase, com Row Level Security (RLS) para isolamento de tenants.

---

## Convencoes

### Nomenclatura

| Elemento | Padrao | Exemplo |
|----------|--------|---------|
| Tabelas | snake_case PT-BR sem acento | `contatos_pessoas` |
| Colunas | snake_case PT-BR sem acento | `data_nascimento` |
| Chaves primarias | `id` (uuid) | `id uuid PRIMARY KEY` |
| Chaves estrangeiras | `entidade_id` | `organizacao_id` |
| Timestamps | `criado_em`, `atualizado_em`, `deletado_em` | timestamptz |
| Booleanos | prefixo positivo | `ativo`, `obrigatorio` |
| Enums | valores em minusculo | `'ativo'`, `'pendente'` |

### Colunas Padrao (Toda Tabela Principal)

```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
criado_em timestamptz NOT NULL DEFAULT now(),
atualizado_em timestamptz NOT NULL DEFAULT now(),
deletado_em timestamptz -- NULL = ativo, preenchido = soft delete
```

### Colunas Multi-Tenant (Tabelas CRM)

```sql
organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id)
```

---

## Diagrama de Entidades

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MUNDO SAAS (Plataforma)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  organizacoes_saas ──┬── usuarios                                           │
│         │            │       │                                              │
│         │            │       └── papeis                                     │
│         │            │                                                      │
│         └── configuracoes_globais                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         MUNDO CRM (Dados do Tenant)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  contatos ──────┬── contatos_pessoas                                        │
│       │         ├── contatos_empresas                                       │
│       │         └── contatos_segmentos ── segmentos                         │
│       │                                                                     │
│       └── oportunidades ──┬── funis                                         │
│               │           └── etapas_funil                                  │
│               │                                                             │
│               ├── oportunidades_produtos                                    │
│               └── tarefas                                                   │
│                                                                             │
│  campos_customizados ── valores_campos_customizados                         │
│                                                                             │
│  produtos ── categorias_produtos                                            │
│                                                                             │
│  motivos_resultado                                                          │
│                                                                             │
│  regras_qualificacao                                                        │
│                                                                             │
│  integracoes ── webhooks_entrada                                            │
│              └── webhooks_saida                                             │
│                                                                             │
│  sessoes_whatsapp (conexao por usuario)                                     │
│  conexoes_meta ── paginas_meta                                              │
│               └── formularios_lead_ads                                      │
│  config_conversions_api ── log_conversions_api                              │
│  custom_audiences_meta ── custom_audience_membros                           │
│  conexoes_google (conexao Google Calendar por usuario)                      │
│  conexoes_email (Gmail OAuth + SMTP Manual por usuario)                     │
│  conexoes_instagram (Instagram Direct por usuario)                          │
│  importacoes_contatos (historico de imports CSV/XLSX)                       │
│                                                                             │
│  tarefas_templates (templates globais)                                      │
│  etapas_templates (templates globais)                                       │
│  configuracoes_card (personalizacao kanban)                                 │
│  configuracoes_tenant (preferencias da org)                                 │
│                                                                             │
│  planos (catalogo de planos)                                                │
│  modulos (catalogo de modulos)                                              │
│  planos_modulos (vinculo plano-modulo)                                      │
│  organizacoes_modulos (modulos ativos por tenant)                           │
│  assinaturas (assinaturas Stripe)                                           │
│  organizacoes_expectativas (dados wizard)                                   │
│                                                                             │
│  audit_log                                                                  │
│                                                                             │
│  feedbacks (PRD-15)                                                         │
│  notificacoes (PRD-15)                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tabelas - Mundo SaaS

### organizacoes_saas

Tenants (empresas clientes do SaaS).

```sql
CREATE TABLE organizacoes_saas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome varchar(255) NOT NULL,
  slug varchar(100) NOT NULL UNIQUE,
  segmento varchar(100),
  website varchar(255),
  telefone varchar(20),
  email varchar(255) NOT NULL,

  -- Endereco
  endereco_cep varchar(10),
  endereco_logradouro varchar(255),
  endereco_numero varchar(20),
  endereco_complemento varchar(100),
  endereco_bairro varchar(100),
  endereco_cidade varchar(100),
  endereco_estado varchar(2),

  -- Plano e status
  plano varchar(20) NOT NULL DEFAULT 'trial',
  status varchar(20) NOT NULL DEFAULT 'ativo',
  trial_expira_em timestamptz,

  -- Limites
  limite_usuarios int DEFAULT 5,
  limite_oportunidades int DEFAULT 1000,
  limite_storage_mb int DEFAULT 1024,

  -- Timestamps
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  CONSTRAINT chk_plano CHECK (plano IN ('trial', 'starter', 'pro', 'enterprise')),
  CONSTRAINT chk_status CHECK (status IN ('ativo', 'suspenso', 'cancelado'))
);

CREATE INDEX idx_organizacoes_slug ON organizacoes_saas(slug);
CREATE INDEX idx_organizacoes_status ON organizacoes_saas(status) WHERE deletado_em IS NULL;
```

### usuarios

Usuarios de todos os tenants.

```sql
CREATE TABLE usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid REFERENCES organizacoes_saas(id),
  papel_id uuid NOT NULL REFERENCES papeis(id),
  perfil_permissao_id uuid REFERENCES perfis_permissao(id),

  nome varchar(100) NOT NULL,
  sobrenome varchar(100) NOT NULL,
  email varchar(255) NOT NULL UNIQUE,
  senha_hash varchar(255) NOT NULL,

  avatar_url varchar(500),
  telefone varchar(20),

  status varchar(20) NOT NULL DEFAULT 'ativo',
  email_verificado boolean DEFAULT false,
  ultimo_login timestamptz,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  CONSTRAINT chk_status CHECK (status IN ('ativo', 'inativo', 'pendente'))
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_organizacao ON usuarios(organizacao_id) WHERE deletado_em IS NULL;
```

### papeis

Roles do sistema.

```sql
CREATE TABLE papeis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome varchar(50) NOT NULL UNIQUE,
  descricao text,
  nivel int NOT NULL, -- 1=super_admin, 2=admin, 3=member

  criado_em timestamptz NOT NULL DEFAULT now()
);

-- Dados iniciais
INSERT INTO papeis (nome, descricao, nivel) VALUES
  ('super_admin', 'Administrador da plataforma', 1),
  ('admin', 'Administrador do tenant', 2),
  ('member', 'Membro do tenant', 3);
```

### perfis_permissao

Perfis de permissao configuraveis por tenant.

```sql
CREATE TABLE perfis_permissao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  nome varchar(100) NOT NULL,
  descricao text,
  permissoes jsonb NOT NULL DEFAULT '[]',
  padrao boolean DEFAULT false,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  UNIQUE(organizacao_id, nome)
);

CREATE INDEX idx_perfis_organizacao ON perfis_permissao(organizacao_id) WHERE deletado_em IS NULL;
```

### configuracoes_globais

Configuracoes de integracoes gerenciadas pelo Super Admin.

```sql
CREATE TABLE configuracoes_globais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plataforma varchar(50) NOT NULL,
  tipo varchar(50) NOT NULL,

  app_id varchar(255),
  app_secret_encrypted text,
  webhook_verify_token varchar(255),
  webhook_base_url varchar(500),

  configuracoes_extra jsonb DEFAULT '{}',
  ambiente varchar(20) DEFAULT 'production',
  ativo boolean DEFAULT true,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),

  UNIQUE(plataforma, tipo)
);
```

### refresh_tokens

Tokens de refresh para sessoes.

```sql
CREATE TABLE refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),
  token_hash varchar(255) NOT NULL,

  dispositivo varchar(255),
  ip inet,
  user_agent text,

  expira_em timestamptz NOT NULL,
  revogado_em timestamptz,

  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_usuario ON refresh_tokens(usuario_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
```

---

## Tabelas - Mundo CRM

### contatos

Tabela base para pessoas e empresas.

```sql
CREATE TABLE contatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  tipo varchar(20) NOT NULL, -- 'pessoa', 'empresa'

  -- Campos comuns
  nome varchar(255) NOT NULL,
  email varchar(255),
  telefone varchar(20),

  -- Qualificacao
  status_qualificacao varchar(20) DEFAULT 'novo',
  mql boolean DEFAULT false,
  sql boolean DEFAULT false,
  score int DEFAULT 0,

  -- Origem
  origem varchar(100),
  utm_source varchar(255),
  utm_medium varchar(255),
  utm_campaign varchar(255),

  -- Responsavel
  owner_id uuid REFERENCES usuarios(id),

  -- Tags
  tags text[] DEFAULT '{}',

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  CONSTRAINT chk_tipo CHECK (tipo IN ('pessoa', 'empresa')),
  CONSTRAINT chk_status_qualificacao CHECK (status_qualificacao IN ('novo', 'lead', 'mql', 'sql', 'cliente', 'perdido'))
);

-- Indices
CREATE INDEX idx_contatos_organizacao_tipo ON contatos(organizacao_id, tipo) WHERE deletado_em IS NULL;
CREATE INDEX idx_contatos_organizacao_email ON contatos(organizacao_id, email) WHERE deletado_em IS NULL;
CREATE INDEX idx_contatos_organizacao_telefone ON contatos(organizacao_id, telefone) WHERE deletado_em IS NULL;
CREATE INDEX idx_contatos_organizacao_owner ON contatos(organizacao_id, owner_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_contatos_tags ON contatos USING GIN(tags) WHERE deletado_em IS NULL;

-- RLS
ALTER TABLE contatos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON contatos
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### contatos_pessoas

Extensao para pessoas fisicas.

```sql
CREATE TABLE contatos_pessoas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contato_id uuid NOT NULL UNIQUE REFERENCES contatos(id) ON DELETE CASCADE,

  sobrenome varchar(255),
  cargo varchar(100),
  data_nascimento date,
  genero varchar(20),
  cpf varchar(14),

  -- Vinculo com empresa
  empresa_id uuid REFERENCES contatos(id),

  -- Redes sociais
  linkedin varchar(255),
  instagram varchar(100),

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pessoas_contato ON contatos_pessoas(contato_id);
CREATE INDEX idx_pessoas_empresa ON contatos_pessoas(empresa_id);
```

### contatos_empresas

Extensao para pessoas juridicas.

```sql
CREATE TABLE contatos_empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contato_id uuid NOT NULL UNIQUE REFERENCES contatos(id) ON DELETE CASCADE,

  razao_social varchar(255),
  cnpj varchar(18),
  inscricao_estadual varchar(20),

  segmento varchar(100),
  porte varchar(50),
  numero_funcionarios int,
  faturamento_anual decimal(15,2),

  website varchar(255),

  -- Endereco
  endereco_cep varchar(10),
  endereco_logradouro varchar(255),
  endereco_numero varchar(20),
  endereco_complemento varchar(100),
  endereco_bairro varchar(100),
  endereco_cidade varchar(100),
  endereco_estado varchar(2),

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_empresas_contato ON contatos_empresas(contato_id);
CREATE INDEX idx_empresas_cnpj ON contatos_empresas(cnpj);
```

### segmentos

Segmentos para organizacao de contatos (PRD-06).

```sql
CREATE TABLE segmentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  nome varchar(100) NOT NULL,
  cor varchar(7) NOT NULL, -- Hex color #RRGGBB
  descricao text,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  UNIQUE(organizacao_id, nome)
);

-- Indices
CREATE INDEX idx_segmentos_organizacao ON segmentos(organizacao_id) WHERE deletado_em IS NULL;

-- RLS
ALTER TABLE segmentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON segmentos
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### contatos_segmentos

Vinculo N:N entre contatos e segmentos (PRD-06).

```sql
CREATE TABLE contatos_segmentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contato_id uuid NOT NULL REFERENCES contatos(id) ON DELETE CASCADE,
  segmento_id uuid NOT NULL REFERENCES segmentos(id) ON DELETE CASCADE,

  criado_em timestamptz NOT NULL DEFAULT now(),

  UNIQUE(contato_id, segmento_id)
);

-- Indices
CREATE INDEX idx_contatos_segmentos_contato ON contatos_segmentos(contato_id);
CREATE INDEX idx_contatos_segmentos_segmento ON contatos_segmentos(segmento_id);
```

### importacoes_contatos

Historico de importacoes de contatos via CSV/XLSX (PRD-06).

```sql
CREATE TABLE importacoes_contatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),

  nome_arquivo varchar(255) NOT NULL,
  tipo_arquivo varchar(10) NOT NULL, -- 'csv', 'xlsx'
  tamanho_bytes int NOT NULL,

  total_registros int NOT NULL,
  registros_importados int NOT NULL DEFAULT 0,
  registros_duplicados int NOT NULL DEFAULT 0,
  registros_erro int NOT NULL DEFAULT 0,

  mapeamento_campos jsonb NOT NULL,
  segmento_id uuid REFERENCES segmentos(id),

  status varchar(20) NOT NULL DEFAULT 'pendente', -- 'pendente', 'processando', 'concluido', 'erro'
  erro_mensagem text,

  criado_em timestamptz NOT NULL DEFAULT now(),
  concluido_em timestamptz,

  CONSTRAINT chk_tipo_arquivo CHECK (tipo_arquivo IN ('csv', 'xlsx')),
  CONSTRAINT chk_status CHECK (status IN ('pendente', 'processando', 'concluido', 'erro'))
);

-- Indices
CREATE INDEX idx_importacoes_organizacao ON importacoes_contatos(organizacao_id);
CREATE INDEX idx_importacoes_usuario ON importacoes_contatos(usuario_id);

-- RLS
ALTER TABLE importacoes_contatos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON importacoes_contatos
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### funis

Pipelines de vendas.

```sql
CREATE TABLE funis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  nome varchar(100) NOT NULL,
  descricao text,
  cor varchar(7) DEFAULT '#3B82F6',
  icone varchar(50),

  padrao boolean DEFAULT false,
  ordem int DEFAULT 0,
  ativo boolean DEFAULT true,

  -- Configuracoes
  usar_tarefas_globais boolean DEFAULT true,
  usar_regras_qualificacao boolean DEFAULT true,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz
);

CREATE INDEX idx_funis_organizacao ON funis(organizacao_id) WHERE deletado_em IS NULL;

ALTER TABLE funis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON funis
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### etapas_funil

Etapas de cada funil.

```sql
CREATE TABLE etapas_funil (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  funil_id uuid NOT NULL REFERENCES funis(id) ON DELETE CASCADE,

  nome varchar(100) NOT NULL,
  descricao text,
  cor varchar(7) DEFAULT '#6B7280',

  ordem int NOT NULL,
  tipo varchar(20) NOT NULL DEFAULT 'normal',

  -- Configuracoes
  probabilidade int DEFAULT 0, -- % de chance de fechar
  dias_meta int, -- dias esperados nesta etapa

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  CONSTRAINT chk_tipo CHECK (tipo IN ('entrada', 'normal', 'ganho', 'perda')),
  CONSTRAINT chk_probabilidade CHECK (probabilidade >= 0 AND probabilidade <= 100)
);

CREATE INDEX idx_etapas_funil ON etapas_funil(funil_id, ordem) WHERE deletado_em IS NULL;

ALTER TABLE etapas_funil ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON etapas_funil
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### oportunidades

Negocios no funil.

```sql
CREATE TABLE oportunidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  funil_id uuid NOT NULL REFERENCES funis(id),
  etapa_id uuid NOT NULL REFERENCES etapas_funil(id),

  titulo varchar(255) NOT NULL,
  descricao text,

  -- Valores
  valor_estimado decimal(15,2),
  valor_fechado decimal(15,2),
  moeda varchar(3) DEFAULT 'BRL',

  -- Status
  status varchar(20) NOT NULL DEFAULT 'aberta',

  -- Contato principal
  contato_id uuid REFERENCES contatos(id),
  empresa_id uuid REFERENCES contatos(id),

  -- Responsavel
  owner_id uuid NOT NULL REFERENCES usuarios(id),

  -- Datas
  data_previsao_fechamento date,
  data_fechamento timestamptz,

  -- Resultado
  motivo_resultado_id uuid REFERENCES motivos_resultado(id),
  observacao_resultado text,

  -- Origem
  origem varchar(100),
  formulario_id uuid,

  -- Posicao no kanban
  posicao int DEFAULT 0,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  CONSTRAINT chk_status CHECK (status IN ('aberta', 'ganha', 'perdida'))
);

-- Indices
CREATE INDEX idx_oportunidades_tenant_funil ON oportunidades(organizacao_id, funil_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_oportunidades_tenant_etapa ON oportunidades(organizacao_id, etapa_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_oportunidades_tenant_status ON oportunidades(organizacao_id, status) WHERE deletado_em IS NULL;
CREATE INDEX idx_oportunidades_tenant_owner ON oportunidades(organizacao_id, owner_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_oportunidades_contato ON oportunidades(contato_id);

ALTER TABLE oportunidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON oportunidades
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### tarefas

Tarefas e follow-ups.

```sql
CREATE TABLE tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  -- Vinculos
  oportunidade_id uuid REFERENCES oportunidades(id),
  contato_id uuid REFERENCES contatos(id),

  titulo varchar(255) NOT NULL,
  descricao text,

  -- Tipo e canal
  tipo varchar(50) NOT NULL,
  canal varchar(50),

  -- Responsavel
  owner_id uuid NOT NULL REFERENCES usuarios(id),
  criado_por_id uuid NOT NULL REFERENCES usuarios(id),

  -- Datas
  data_vencimento timestamptz,
  data_conclusao timestamptz,

  -- Status
  status varchar(20) NOT NULL DEFAULT 'pendente',
  prioridade varchar(20) DEFAULT 'media',

  -- Lembrete
  lembrete_em timestamptz,
  lembrete_enviado boolean DEFAULT false,

  -- Origem (se veio de template)
  tarefa_template_id uuid,
  etapa_origem_id uuid,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  CONSTRAINT chk_status CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'cancelada')),
  CONSTRAINT chk_prioridade CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente'))
);

CREATE INDEX idx_tarefas_tenant_owner ON tarefas(organizacao_id, owner_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_tarefas_tenant_status ON tarefas(organizacao_id, status) WHERE deletado_em IS NULL;
CREATE INDEX idx_tarefas_oportunidade ON tarefas(oportunidade_id) WHERE deletado_em IS NULL;

ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON tarefas
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### campos_customizados

Definicao de campos dinamicos.

```sql
CREATE TABLE campos_customizados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  entidade varchar(50) NOT NULL,
  nome varchar(100) NOT NULL,
  nome_interno varchar(100) NOT NULL,

  tipo varchar(30) NOT NULL,

  -- Configuracoes
  obrigatorio boolean DEFAULT false,
  visivel boolean DEFAULT true,
  editavel boolean DEFAULT true,
  sistema boolean DEFAULT false,

  placeholder varchar(255),
  texto_ajuda text,
  valor_padrao text,

  -- Para campos tipo select
  opcoes jsonb,

  -- Validacao
  validacao_regex varchar(255),
  validacao_min numeric,
  validacao_max numeric,

  ordem int DEFAULT 0,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  UNIQUE(organizacao_id, entidade, nome_interno),
  CONSTRAINT chk_entidade CHECK (entidade IN ('contato', 'pessoa', 'empresa', 'oportunidade')),
  CONSTRAINT chk_tipo CHECK (tipo IN ('texto', 'texto_longo', 'numero', 'decimal', 'data', 'data_hora', 'booleano', 'select', 'multi_select', 'email', 'telefone', 'url', 'cpf', 'cnpj'))
);

CREATE INDEX idx_campos_tenant_entidade ON campos_customizados(organizacao_id, entidade) WHERE deletado_em IS NULL;

ALTER TABLE campos_customizados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON campos_customizados
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### valores_campos_customizados

Valores dos campos dinamicos.

```sql
CREATE TABLE valores_campos_customizados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campo_id uuid NOT NULL REFERENCES campos_customizados(id) ON DELETE CASCADE,
  entidade_id uuid NOT NULL,

  valor text,
  valor_json jsonb,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),

  UNIQUE(campo_id, entidade_id)
);

CREATE INDEX idx_valores_campo ON valores_campos_customizados(campo_id);
CREATE INDEX idx_valores_entidade ON valores_campos_customizados(entidade_id);
```

### categorias_produtos

Categorias para produtos.

```sql
CREATE TABLE categorias_produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  nome varchar(100) NOT NULL,
  descricao text,
  cor varchar(7) DEFAULT '#3B82F6',

  ordem int DEFAULT 0,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz
);

CREATE INDEX idx_categorias_tenant ON categorias_produtos(organizacao_id) WHERE deletado_em IS NULL;

ALTER TABLE categorias_produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON categorias_produtos
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### produtos

Catalogo de produtos.

```sql
CREATE TABLE produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  categoria_id uuid REFERENCES categorias_produtos(id),

  nome varchar(255) NOT NULL,
  descricao text,
  sku varchar(50),

  preco decimal(15,2),
  moeda varchar(3) DEFAULT 'BRL',

  -- Tipo de cobranca
  unidade varchar(20) DEFAULT 'un',
  recorrente boolean DEFAULT false,
  periodo_recorrencia varchar(20),

  ativo boolean DEFAULT true,
  ordem int DEFAULT 0,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  CONSTRAINT chk_unidade CHECK (unidade IN ('un', 'kg', 'hora', 'dia', 'mes', 'ano')),
  CONSTRAINT chk_periodo CHECK (periodo_recorrencia IN ('mensal', 'trimestral', 'semestral', 'anual'))
);

CREATE INDEX idx_produtos_tenant ON produtos(organizacao_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_produtos_categoria ON produtos(categoria_id) WHERE deletado_em IS NULL;
CREATE UNIQUE INDEX idx_produtos_sku ON produtos(organizacao_id, sku) WHERE sku IS NOT NULL AND deletado_em IS NULL;

ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON produtos
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### oportunidades_produtos

Produtos vinculados a oportunidades.

```sql
CREATE TABLE oportunidades_produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oportunidade_id uuid NOT NULL REFERENCES oportunidades(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES produtos(id),

  quantidade decimal(15,4) DEFAULT 1,
  preco_unitario decimal(15,2),
  desconto_percentual decimal(5,2) DEFAULT 0,

  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_opp_produtos_oportunidade ON oportunidades_produtos(oportunidade_id);
```

### motivos_resultado

Motivos de ganho/perda.

```sql
CREATE TABLE motivos_resultado (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  tipo varchar(10) NOT NULL,
  nome varchar(100) NOT NULL,
  descricao text,

  ativo boolean DEFAULT true,
  ordem int DEFAULT 0,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  CONSTRAINT chk_tipo CHECK (tipo IN ('ganho', 'perda'))
);

CREATE INDEX idx_motivos_tenant_tipo ON motivos_resultado(organizacao_id, tipo) WHERE deletado_em IS NULL;

ALTER TABLE motivos_resultado ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON motivos_resultado
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### regras_qualificacao

Regras para MQL automatico.

```sql
CREATE TABLE regras_qualificacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  nome varchar(100) NOT NULL,
  descricao text,

  campo_id uuid NOT NULL REFERENCES campos_customizados(id),
  operador varchar(30) NOT NULL,
  valor text NOT NULL,

  ativo boolean DEFAULT true,
  ordem int DEFAULT 0,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  CONSTRAINT chk_operador CHECK (operador IN (
    'igual', 'diferente', 'contem', 'nao_contem',
    'maior_que', 'menor_que', 'maior_igual', 'menor_igual',
    'vazio', 'nao_vazio'
  ))
);

CREATE INDEX idx_regras_tenant ON regras_qualificacao(organizacao_id) WHERE deletado_em IS NULL;

ALTER TABLE regras_qualificacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON regras_qualificacao
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### integracoes

Conexoes OAuth por tenant.

```sql
CREATE TABLE integracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),

  plataforma varchar(50) NOT NULL,
  tipo varchar(50) NOT NULL,

  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expira_em timestamptz,

  conta_externa_id varchar(255),
  conta_externa_nome varchar(255),
  conta_externa_email varchar(255),

  configuracoes jsonb DEFAULT '{}',

  status varchar(20) DEFAULT 'conectado',
  ultimo_sync timestamptz,
  ultimo_erro text,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  CONSTRAINT chk_status CHECK (status IN ('conectado', 'desconectado', 'erro', 'expirando'))
);

CREATE INDEX idx_integracoes_tenant ON integracoes(organizacao_id) WHERE deletado_em IS NULL;

ALTER TABLE integracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON integracoes
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### webhooks_entrada

Webhooks para receber dados externos.

```sql
CREATE TABLE webhooks_entrada (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  nome varchar(100) NOT NULL,
  descricao text,

  url_token varchar(64) NOT NULL UNIQUE,
  api_key_hash varchar(255),
  secret_key_hash varchar(255),

  ativo boolean DEFAULT true,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz
);

CREATE INDEX idx_webhooks_entrada_token ON webhooks_entrada(url_token);

ALTER TABLE webhooks_entrada ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON webhooks_entrada
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### webhooks_saida

Webhooks para enviar eventos.

```sql
CREATE TABLE webhooks_saida (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  nome varchar(100) NOT NULL,
  descricao text,
  url varchar(500) NOT NULL,

  -- Autenticacao
  tipo_autenticacao varchar(30),
  auth_header varchar(255),
  auth_valor_encrypted text,

  -- Eventos
  eventos text[] NOT NULL,

  -- Retry
  retry_ativo boolean DEFAULT true,
  max_tentativas int DEFAULT 3,

  ativo boolean DEFAULT true,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz
);

CREATE INDEX idx_webhooks_saida_tenant ON webhooks_saida(organizacao_id) WHERE deletado_em IS NULL;

ALTER TABLE webhooks_saida ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON webhooks_saida
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### audit_log

Log de auditoria para rastreabilidade completa de todas operacoes no sistema.

**Proposito:**
- Rastrear todas alteracoes em entidades de negocio
- Permitir auditoria de conformidade (LGPD, SOC2)
- Facilitar debugging e investigacao de incidentes
- Registrar acessos cross-tenant do Super Admin

**Eventos registrados:**
- `create` - Criacao de registro
- `update` - Atualizacao de registro
- `delete` - Soft delete de registro
- `restore` - Restauracao de registro deletado
- `login` - Login de usuario
- `logout` - Logout de usuario
- `login_failed` - Tentativa de login falha
- `permission_denied` - Acesso negado
- `cross_tenant_access` - Super Admin acessando dados de tenant
- `export` - Exportacao de dados
- `import` - Importacao de dados
- `oauth_connect` - Conexao OAuth estabelecida
- `oauth_disconnect` - Conexao OAuth revogada
- `webhook_received` - Webhook recebido de sistema externo
- `webhook_sent` - Webhook enviado para sistema externo

```sql
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid,           -- NULL para acoes de Super Admin sem contexto de tenant
  usuario_id uuid,               -- Usuario que executou a acao
  correlation_id uuid,           -- ID para agrupar acoes relacionadas no mesmo request

  -- Acao executada
  acao varchar(30) NOT NULL,     -- create, update, delete, login, etc.
  entidade varchar(50) NOT NULL, -- Nome da tabela/entidade afetada
  entidade_id uuid,              -- ID do registro afetado (se aplicavel)

  -- Dados da alteracao (para updates)
  dados_anteriores jsonb,        -- Snapshot do registro ANTES da alteracao
  dados_novos jsonb,             -- Snapshot do registro DEPOIS da alteracao

  -- Metadados do request
  ip inet,                       -- IP de origem
  user_agent text,               -- User agent do navegador/cliente
  request_method varchar(10),    -- GET, POST, PUT, DELETE
  request_path text,             -- Path da requisicao
  request_id uuid,               -- ID unico do request (para correlacao com logs)

  -- Contexto adicional
  detalhes jsonb,                -- Informacoes extras especificas da acao
  sucesso boolean DEFAULT true,  -- Se a operacao foi bem sucedida
  erro_mensagem text,            -- Mensagem de erro (se sucesso = false)

  criado_em timestamptz NOT NULL DEFAULT now()
);

-- Indices para consultas frequentes
CREATE INDEX idx_audit_tenant_entidade ON audit_log(organizacao_id, entidade, criado_em DESC);
CREATE INDEX idx_audit_usuario ON audit_log(usuario_id, criado_em DESC);
CREATE INDEX idx_audit_correlation ON audit_log(correlation_id);
CREATE INDEX idx_audit_acao ON audit_log(acao, criado_em DESC);
CREATE INDEX idx_audit_entidade_id ON audit_log(entidade_id);

-- Indice para busca por periodo
CREATE INDEX idx_audit_periodo ON audit_log(criado_em DESC);

-- Nota: Esta tabela NAO usa RLS para permitir que Super Admin
-- consulte logs de qualquer tenant. O controle de acesso e feito
-- na camada de aplicacao.

-- Particionar por mes para performance em producao (opcional)
-- CREATE TABLE audit_log_2026_01 PARTITION OF audit_log
--   FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

**Retencao de dados:**
- Logs sao mantidos por **2 anos** para conformidade
- Apos 2 anos, sao movidos para cold storage (S3/GCS)
- Admin pode solicitar exportacao de logs do seu tenant

**Exemplo de uso - Registrar alteracao:**

```typescript
await auditLog({
  organizacao_id: req.user.organizacao_id,
  usuario_id: req.user.id,
  correlation_id: req.correlationId,
  acao: 'update',
  entidade: 'oportunidades',
  entidade_id: oportunidade.id,
  dados_anteriores: oportunidadeAnterior,
  dados_novos: oportunidadeNova,
  ip: req.ip,
  user_agent: req.headers['user-agent'],
  request_method: req.method,
  request_path: req.path,
  request_id: req.id
});
```

---

## Tabelas - Feedback e Notificacoes (PRD-15)

### feedbacks

Feedbacks enviados por Admin/Member para o Super Admin.

```sql
CREATE TABLE feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),

  -- Conteudo
  tipo varchar(20) NOT NULL,
    -- 'bug': Bug/Problema reportado
    -- 'sugestao': Sugestao de melhoria
    -- 'duvida': Duvida/Ajuda
  descricao text NOT NULL,

  -- Status
  status varchar(20) NOT NULL DEFAULT 'aberto',
    -- 'aberto': Aguardando analise do Super Admin
    -- 'resolvido': Feedback tratado e resolvido
  resolvido_em timestamptz,
  resolvido_por uuid REFERENCES usuarios(id),

  -- Timestamps
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  CONSTRAINT chk_tipo_feedback CHECK (tipo IN ('bug', 'sugestao', 'duvida')),
  CONSTRAINT chk_status_feedback CHECK (status IN ('aberto', 'resolvido'))
);

-- Indices
CREATE INDEX idx_feedbacks_org ON feedbacks(organizacao_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_feedbacks_status ON feedbacks(status, criado_em DESC) WHERE deletado_em IS NULL;
CREATE INDEX idx_feedbacks_usuario ON feedbacks(usuario_id);
CREATE INDEX idx_feedbacks_tipo ON feedbacks(tipo) WHERE deletado_em IS NULL;

-- RLS
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- Usuario pode ver apenas seus proprios feedbacks
CREATE POLICY "usuario_proprio_feedback" ON feedbacks
  FOR SELECT
  USING (usuario_id = current_setting('app.current_user')::uuid);

-- Usuario pode criar feedback na sua organizacao
CREATE POLICY "usuario_criar_feedback" ON feedbacks
  FOR INSERT
  WITH CHECK (organizacao_id = current_setting('app.current_tenant')::uuid);

-- Nota: Super Admin acessa via service role (bypass RLS)
-- para visualizar feedbacks de todas organizacoes
```

### notificacoes

Sistema de notificacoes para usuarios do CRM.

```sql
CREATE TABLE notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),

  -- Conteudo
  tipo varchar(50) NOT NULL,
    -- 'feedback_resolvido': Feedback do usuario foi resolvido
    -- Tipos futuros: 'tarefa_atribuida', 'oportunidade_ganha', etc.
  titulo varchar(255) NOT NULL,
  mensagem text,
  link varchar(500), -- URL para redirecionamento ao clicar

  -- Referencia opcional (para navegacao)
  referencia_tipo varchar(50), -- 'feedback', 'tarefa', 'oportunidade', etc.
  referencia_id uuid,

  -- Status de leitura
  lida boolean NOT NULL DEFAULT false,
  lida_em timestamptz,

  -- Timestamps
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id, lida, criado_em DESC);
CREATE INDEX idx_notificacoes_nao_lidas ON notificacoes(usuario_id) WHERE lida = false;
CREATE INDEX idx_notificacoes_tipo ON notificacoes(usuario_id, tipo);

-- RLS
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Usuario ve apenas suas proprias notificacoes
CREATE POLICY "usuario_proprias_notificacoes" ON notificacoes
  FOR ALL
  USING (usuario_id = current_setting('app.current_user')::uuid);
```

**Eventos de Notificacao (PRD-15):**

| Tipo | Descricao | Criado Quando |
|------|-----------|---------------|
| `feedback_resolvido` | Feedback do usuario foi resolvido | Super Admin marca feedback como resolvido |

**Campos de Referencia:**

O campo `referencia_tipo` + `referencia_id` permite navegacao direta ao recurso relacionado:

| referencia_tipo | Destino |
|-----------------|---------|
| `feedback` | Modal de feedback enviado |
| `tarefa` | Detalhe da tarefa |
| `oportunidade` | Card da oportunidade |

---

## Funcoes e Triggers

### Funcao set_current_tenant

```sql
CREATE OR REPLACE FUNCTION set_current_tenant(tenant_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant', tenant_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Trigger atualizado_em

```sql
CREATE OR REPLACE FUNCTION trigger_set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar em todas tabelas com atualizado_em
CREATE TRIGGER set_atualizado_em
  BEFORE UPDATE ON contatos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_atualizado_em();

-- Repetir para outras tabelas...
```

---

## Checklist de Implementacao

- [ ] Criar todas as tabelas listadas
- [ ] Aplicar RLS em todas tabelas com organizacao_id
- [ ] Criar todos os indices
- [ ] Criar funcao set_current_tenant
- [ ] Criar triggers de atualizado_em
- [ ] Inserir dados iniciais (papeis)
- [ ] Testar isolamento multi-tenant
- [ ] Documentar migracao

---

## Tabelas - Planos e Modulos

### planos

Planos de assinatura da plataforma.

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
  visivel boolean DEFAULT true,
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

### modulos

Catalogo de modulos da plataforma.

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

### planos_modulos

Vinculo entre planos e modulos disponiveis.

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

CREATE INDEX idx_planos_modulos_plano ON planos_modulos(plano_id);
```

### organizacoes_modulos

Modulos ativos por organizacao.

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

CREATE INDEX idx_org_modulos_org ON organizacoes_modulos(organizacao_id);
```

### assinaturas

Assinaturas de planos por organizacao.

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

### organizacoes_expectativas

Dados de expectativas coletados na criacao do tenant.

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

## Tabelas - Configuracoes do Tenant

### tarefas_templates

Templates de tarefas configuraveis pelo Admin (globais).

```sql
CREATE TABLE tarefas_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  titulo varchar(255) NOT NULL,
  descricao text,
  tipo varchar(50) NOT NULL,
  canal varchar(50),

  prioridade varchar(20) DEFAULT 'media',
  dias_prazo int DEFAULT 1,

  ativo boolean DEFAULT true,
  ordem int DEFAULT 0,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  CONSTRAINT chk_tipo CHECK (tipo IN ('ligacao', 'email', 'reuniao', 'whatsapp', 'visita', 'outro')),
  CONSTRAINT chk_prioridade CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente'))
);

CREATE INDEX idx_tarefas_templates_tenant ON tarefas_templates(organizacao_id) WHERE deletado_em IS NULL;

ALTER TABLE tarefas_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON tarefas_templates
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### etapas_templates

Templates de etapas configuraveis pelo Admin (globais).

```sql
CREATE TABLE etapas_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  nome varchar(100) NOT NULL,
  descricao text,
  cor varchar(7) DEFAULT '#6B7280',

  tipo varchar(20) NOT NULL DEFAULT 'normal',
  probabilidade int DEFAULT 0,
  dias_meta int,

  ativo boolean DEFAULT true,
  ordem int DEFAULT 0,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  CONSTRAINT chk_tipo CHECK (tipo IN ('entrada', 'normal', 'ganho', 'perda')),
  CONSTRAINT chk_probabilidade CHECK (probabilidade >= 0 AND probabilidade <= 100)
);

CREATE INDEX idx_etapas_templates_tenant ON etapas_templates(organizacao_id) WHERE deletado_em IS NULL;

ALTER TABLE etapas_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON etapas_templates
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### configuracoes_card

Personalizacao dos campos visiveis no card do Kanban.

```sql
CREATE TABLE configuracoes_card (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  funil_id uuid REFERENCES funis(id),

  -- Campos visiveis no card
  mostrar_valor boolean DEFAULT true,
  mostrar_contato boolean DEFAULT true,
  mostrar_empresa boolean DEFAULT true,
  mostrar_telefone boolean DEFAULT false,
  mostrar_email boolean DEFAULT false,
  mostrar_owner boolean DEFAULT true,
  mostrar_data_criacao boolean DEFAULT false,
  mostrar_previsao_fechamento boolean DEFAULT true,
  mostrar_tarefas_pendentes boolean DEFAULT true,
  mostrar_tags boolean DEFAULT true,

  -- Campos customizados visiveis (array de campo_id)
  campos_customizados_visiveis uuid[] DEFAULT '{}',

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),

  UNIQUE(organizacao_id, funil_id)
);

CREATE INDEX idx_config_card_tenant ON configuracoes_card(organizacao_id);

ALTER TABLE configuracoes_card ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON configuracoes_card
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### configuracoes_tenant

Preferencias gerais da organizacao.

```sql
CREATE TABLE configuracoes_tenant (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL UNIQUE REFERENCES organizacoes_saas(id),

  -- Localizacao
  moeda_padrao varchar(3) DEFAULT 'BRL',
  timezone varchar(50) DEFAULT 'America/Sao_Paulo',
  formato_data varchar(20) DEFAULT 'DD/MM/YYYY',

  -- Notificacoes
  notificar_nova_oportunidade boolean DEFAULT true,
  notificar_tarefa_vencida boolean DEFAULT true,
  notificar_mudanca_etapa boolean DEFAULT false,

  -- Pipeline
  criar_tarefa_automatica boolean DEFAULT true,
  dias_alerta_inatividade int DEFAULT 7,

  -- WhatsApp/Comunicacao
  assinatura_mensagem text,
  horario_inicio_envio time DEFAULT '08:00',
  horario_fim_envio time DEFAULT '18:00',

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE configuracoes_tenant ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON configuracoes_tenant
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

---

## Tabelas - Configuracoes Globais (Plataforma)

### configuracoes_globais

Armazena credenciais de **aplicativos/OAuth** da plataforma (nao dados de tenants).
Super Admin configura aqui as credenciais para que Admin/Member possam fazer OAuth e conectar suas contas.

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

**Estrutura JSONB por Plataforma:**

| Plataforma | Campos | Descricao |
|------------|--------|-----------|
| meta | app_id, app_secret, webhook_verify_token, webhook_base_url, modo_sandbox | Credenciais do App Meta |
| google | client_id, client_secret, redirect_uri, servicos | Credenciais OAuth Google |
| recaptcha | site_key, secret_key, score_threshold, ativo_globalmente | Config reCAPTCHA v3 |
| stripe | public_key, secret_key, webhook_secret, ambiente | Conta Stripe da plataforma |
| waha | api_url, api_key, webhook_url | Instancia WAHA |
| email_sistema | smtp_host, smtp_port, smtp_user, smtp_pass, from_email, from_name | SMTP master |

**Nota:** Contas pessoais dos tenants (Pixel ID, Page Token, etc.) ficam na tabela `integracoes` por tenant.

---

## Tabelas - Conexoes (PRD-08)

As tabelas abaixo sao detalhadas no [PRD-08: Conexoes](./PRD-08-CONEXOES.md).

### sessoes_whatsapp

Sessoes WhatsApp por usuario (via WAHA Plus).

```sql
CREATE TABLE sessoes_whatsapp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),

  -- Identificacao da sessao no WAHA
  session_name varchar(100) NOT NULL, -- formato: wpp-{org_id}-{user_id}

  -- Dados do numero conectado
  phone_number varchar(20),
  phone_name varchar(255),

  -- Status da conexao
  status varchar(20) NOT NULL DEFAULT 'disconnected',
    -- disconnected, qr_pending, connecting, connected, failed

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

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  UNIQUE(organizacao_id, usuario_id)
);

CREATE INDEX idx_sessoes_wpp_org ON sessoes_whatsapp(organizacao_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_sessoes_wpp_status ON sessoes_whatsapp(organizacao_id, status) WHERE deletado_em IS NULL;
CREATE INDEX idx_sessoes_wpp_session ON sessoes_whatsapp(session_name);

ALTER TABLE sessoes_whatsapp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON sessoes_whatsapp
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### conexoes_meta

Conexao OAuth com Meta (por tenant).

```sql
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

CREATE INDEX idx_conexoes_meta_org ON conexoes_meta(organizacao_id) WHERE deletado_em IS NULL;

ALTER TABLE conexoes_meta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON conexoes_meta
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### paginas_meta

Paginas do Facebook conectadas.

```sql
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

  ativo boolean DEFAULT true,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),

  UNIQUE(organizacao_id, page_id)
);

CREATE INDEX idx_paginas_meta_org ON paginas_meta(organizacao_id);

ALTER TABLE paginas_meta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON paginas_meta
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### formularios_lead_ads

Mapeamento de formularios Lead Ads.

```sql
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

  -- Configuracoes adicionais
  criar_oportunidade boolean DEFAULT true,
  tags_automaticas text[] DEFAULT '{}',
  notificar_owner boolean DEFAULT true,

  -- Estatisticas
  total_leads_recebidos integer DEFAULT 0,
  ultimo_lead_recebido timestamptz,

  ativo boolean DEFAULT true,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  UNIQUE(organizacao_id, form_id)
);

CREATE INDEX idx_form_lead_ads_org ON formularios_lead_ads(organizacao_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_form_lead_ads_form ON formularios_lead_ads(form_id);

ALTER TABLE formularios_lead_ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON formularios_lead_ads
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### config_conversions_api

Configuracao Conversions API por tenant.

```sql
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

ALTER TABLE config_conversions_api ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON config_conversions_api
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### log_conversions_api

Log de eventos enviados para Conversions API.

```sql
CREATE TABLE log_conversions_api (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL,
  config_id uuid REFERENCES config_conversions_api(id),

  -- Dados do evento
  event_name varchar(50) NOT NULL,
  event_time timestamptz NOT NULL,

  -- Entidade origem
  entidade_tipo varchar(50),
  entidade_id uuid,

  -- Payload enviado (sem dados sensiveis)
  payload_resumo jsonb,

  -- Resposta do Meta
  status varchar(20) NOT NULL, -- sent, failed, pending
  response_code integer,
  response_body text,
  fbrq_event_id varchar(100),

  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_log_capi_org ON log_conversions_api(organizacao_id, criado_em DESC);
CREATE INDEX idx_log_capi_status ON log_conversions_api(organizacao_id, status);
CREATE INDEX idx_log_capi_event ON log_conversions_api(organizacao_id, event_name);

ALTER TABLE log_conversions_api ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON log_conversions_api
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### custom_audiences_meta

Publicos customizados sincronizados com Meta.

```sql
CREATE TABLE custom_audiences_meta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  conexao_meta_id uuid REFERENCES conexoes_meta(id),

  -- Dados do publico no Meta
  audience_id varchar(50) NOT NULL,
  audience_name varchar(255) NOT NULL,
  ad_account_id varchar(50) NOT NULL,

  -- Regra de sincronizacao
  tipo_sincronizacao varchar(20) NOT NULL DEFAULT 'evento',
    -- 'evento': adiciona quando evento ocorre
    -- 'manual': apenas sync manual

  -- Se tipo = 'evento', qual evento dispara
  evento_gatilho varchar(50),
    -- 'lead', 'mql', 'schedule', 'won', 'lost'

  -- Estatisticas
  total_usuarios integer DEFAULT 0,
  ultimo_sync timestamptz,
  ultimo_sync_sucesso boolean,

  ativo boolean DEFAULT true,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  UNIQUE(organizacao_id, audience_id)
);

CREATE INDEX idx_audiences_meta_org ON custom_audiences_meta(organizacao_id) WHERE deletado_em IS NULL;

ALTER TABLE custom_audiences_meta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON custom_audiences_meta
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### custom_audience_membros

Membros do publico (controle local de quem foi adicionado).

```sql
CREATE TABLE custom_audience_membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audience_id uuid NOT NULL REFERENCES custom_audiences_meta(id) ON DELETE CASCADE,
  contato_id uuid NOT NULL REFERENCES contatos(id),

  -- Hashes enviados (para referencia)
  email_hash varchar(64),
  phone_hash varchar(64),

  -- Status de sincronizacao
  sincronizado boolean DEFAULT false,
  sincronizado_em timestamptz,
  erro_sincronizacao text,

  criado_em timestamptz NOT NULL DEFAULT now(),

  UNIQUE(audience_id, contato_id)
);

CREATE INDEX idx_audience_membros_audience ON custom_audience_membros(audience_id);
CREATE INDEX idx_audience_membros_contato ON custom_audience_membros(contato_id);
CREATE INDEX idx_audience_membros_sync ON custom_audience_membros(audience_id, sincronizado);
```

### conexoes_google

Conexoes Google Calendar por usuario.

```sql
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

CREATE INDEX idx_conexoes_google_org ON conexoes_google(organizacao_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_conexoes_google_user ON conexoes_google(usuario_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_conexoes_google_status ON conexoes_google(organizacao_id, status);

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

---

### conexoes_email

Armazena conexoes de email pessoal dos usuarios (Gmail OAuth ou SMTP Manual).

```sql
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
  google_user_id varchar(50), -- ID unico do Google
  access_token_encrypted text, -- Token criptografado (AES-256)
  refresh_token_encrypted text, -- Refresh token criptografado
  token_expires_at timestamptz,
  scopes text[] DEFAULT ARRAY['gmail.send', 'userinfo.email'],

  -- SMTP Manual (se tipo = 'smtp_manual')
  smtp_host varchar(255), -- Ex: smtp.gmail.com
  smtp_port integer DEFAULT 587,
  smtp_user varchar(255), -- Geralmente igual ao email
  smtp_pass_encrypted text, -- Senha criptografada
  smtp_tls boolean DEFAULT true,
  smtp_auto_detected boolean DEFAULT false, -- Sistema detectou automaticamente?

  -- Status e metricas
  status varchar(20) NOT NULL DEFAULT 'active', -- 'active', 'error', 'disconnected'
  ultimo_envio timestamptz,
  total_enviados integer DEFAULT 0,
  ultimo_erro text,

  -- Timestamps
  conectado_em timestamptz DEFAULT now(),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  -- Constraint: um email por usuario no tenant
  UNIQUE(organizacao_id, usuario_id),

  -- Validacao: tipo deve ser valido
  CONSTRAINT chk_tipo_email CHECK (tipo IN ('gmail_oauth', 'smtp_manual'))
);

CREATE INDEX idx_conexoes_email_org ON conexoes_email(organizacao_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_conexoes_email_user ON conexoes_email(usuario_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_conexoes_email_status ON conexoes_email(organizacao_id, status);

ALTER TABLE conexoes_email ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON conexoes_email
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "user_own_connection" ON conexoes_email
  FOR SELECT USING (
    usuario_id = current_setting('app.current_user')::uuid
    OR current_setting('app.current_role') = 'admin'
  );
```

---

### conexoes_instagram

Armazena conexoes de Instagram Direct dos usuarios.

```sql
CREATE TABLE conexoes_instagram (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),

  -- Dados da conta Instagram
  instagram_user_id varchar(50) NOT NULL, -- ID unico do Instagram (IGSID)
  instagram_username varchar(255), -- @username
  instagram_name varchar(255), -- Nome de exibicao
  profile_picture_url text, -- URL da foto de perfil
  account_type varchar(20), -- 'BUSINESS' ou 'CREATOR'

  -- OAuth tokens (criptografados)
  access_token_encrypted text NOT NULL, -- Token criptografado (AES-256)
  token_type varchar(20) DEFAULT 'long_lived', -- 'short_lived' ou 'long_lived'
  token_expires_at timestamptz, -- Long-lived expira em 60 dias

  -- Permissoes concedidas pelo OAuth
  permissions text[] DEFAULT ARRAY[
    'instagram_business_basic',
    'instagram_business_manage_messages'
  ],

  -- Webhook
  webhook_subscribed boolean DEFAULT false,
  webhook_subscription_id varchar(100),

  -- Status e metricas
  status varchar(20) NOT NULL DEFAULT 'active', -- 'active', 'error', 'disconnected', 'token_expired'
  ultimo_sync timestamptz,
  ultimo_erro text,
  total_mensagens_enviadas integer DEFAULT 0,
  total_mensagens_recebidas integer DEFAULT 0,

  -- Timestamps
  conectado_em timestamptz DEFAULT now(),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  -- Constraint: uma conta Instagram por usuario no tenant
  UNIQUE(organizacao_id, usuario_id),

  -- Constraint: Instagram User ID unico por tenant
  UNIQUE(organizacao_id, instagram_user_id)
);

CREATE INDEX idx_conexoes_instagram_org ON conexoes_instagram(organizacao_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_conexoes_instagram_user ON conexoes_instagram(usuario_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_conexoes_instagram_ig_id ON conexoes_instagram(instagram_user_id);
CREATE INDEX idx_conexoes_instagram_status ON conexoes_instagram(organizacao_id, status);
CREATE INDEX idx_conexoes_instagram_token_exp ON conexoes_instagram(token_expires_at) WHERE status = 'active';

ALTER TABLE conexoes_instagram ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON conexoes_instagram
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "user_own_connection" ON conexoes_instagram
  FOR SELECT USING (
    usuario_id = current_setting('app.current_user')::uuid
    OR current_setting('app.current_role') = 'admin'
  );
```

---

## Historico de Versoes

| Versao | Data | Autor | Mudancas |
|--------|------|-------|----------|
| v1.0 | 2026-01-31 | Arquiteto de Produto | Versao inicial |
| v1.1 | 2026-01-31 | Arquiteto de Produto | Adicionadas tabelas de configuracoes: tarefas_templates, etapas_templates, configuracoes_card, configuracoes_tenant |
| v1.2 | 2026-01-31 | Arquiteto de Produto | Adicionadas tabelas de planos e modulos: planos, modulos, planos_modulos, organizacoes_modulos, assinaturas, organizacoes_expectativas |
| v1.3 | 2026-01-31 | Arquiteto de Produto | Adicionadas tabelas de conexoes (PRD-08): sessoes_whatsapp, conexoes_meta, paginas_meta, formularios_lead_ads, config_conversions_api, log_conversions_api, custom_audiences_meta, custom_audience_membros |
| v1.4 | 2026-01-31 | Arquiteto de Produto | Adicionada tabela conexoes_google (Google Calendar) |
| v1.5 | 2026-01-31 | Arquiteto de Produto | Adicionadas tabelas conexoes_email (Gmail OAuth + SMTP) e conexoes_instagram (Instagram Direct) |
| v1.6 | 2026-02-01 | Arquiteto de Produto | Detalhada tabela audit_log: eventos registrados, retencao, campos adicionais (request_method, request_path, request_id, detalhes, sucesso, erro_mensagem), indices otimizados |
| v1.7 | 2026-02-02 | Arquiteto de Produto | Adicao de perfis_permissao para permissoes granulares por tenant |
| v1.8 | 2026-02-03 | Arquiteto de Produto | Adicionadas tabelas feedbacks e notificacoes (PRD-15): sistema de feedback Admin/Member para Super Admin e notificacoes in-app |
