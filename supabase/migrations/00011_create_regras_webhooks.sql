-- AIDEV-NOTE: Migration PRD-05 - Regras de Qualificacao, Integracoes e Webhooks
-- Regras MQL, configuracoes de card, integracoes OAuth e webhooks bidirecionais

-- Tabela de regras de qualificacao (MQL)
CREATE TABLE IF NOT EXISTS regras_qualificacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id) ON DELETE CASCADE,

  nome varchar(100) NOT NULL,
  descricao text,

  -- Condicoes da regra (JSON)
  condicoes jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Formato: [{"campo": "origem", "operador": "igual", "valor": "site"}, ...]

  -- Operador logico entre condicoes
  operador_logico varchar(5) NOT NULL DEFAULT 'AND' CHECK (operador_logico IN ('AND', 'OR')),

  -- Pontuacao quando regra atendida
  pontuacao integer NOT NULL DEFAULT 0,

  -- Status
  ativo boolean DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,

  -- Auditoria
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  criado_por uuid REFERENCES usuarios(id)
);

-- Tabela de configuracoes do card (Kanban)
CREATE TABLE IF NOT EXISTS configuracoes_card (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id) ON DELETE CASCADE,

  -- Campos visiveis no card (array de nomes de campos)
  campos_visiveis jsonb NOT NULL DEFAULT '["nome", "valor", "responsavel"]'::jsonb,

  -- Configuracoes de exibicao
  mostrar_valor boolean DEFAULT true,
  mostrar_responsavel boolean DEFAULT true,
  mostrar_empresa boolean DEFAULT true,
  mostrar_telefone boolean DEFAULT false,
  mostrar_email boolean DEFAULT false,
  mostrar_tags boolean DEFAULT true,
  mostrar_tarefas_pendentes boolean DEFAULT true,
  mostrar_ultima_atividade boolean DEFAULT false,

  -- Campos customizados a exibir (array de IDs)
  campos_customizados jsonb DEFAULT '[]'::jsonb,

  -- Auditoria
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uk_config_card_org UNIQUE (organizacao_id)
);

-- Tabela de integracoes OAuth
CREATE TABLE IF NOT EXISTS integracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id) ON DELETE CASCADE,

  -- Plataforma
  plataforma varchar(50) NOT NULL CHECK (plataforma IN (
    'whatsapp_waha', 'meta', 'google', 'email_smtp'
  )),

  -- Status
  ativa boolean DEFAULT false,
  status varchar(20) DEFAULT 'desconectado'
    CHECK (status IN ('desconectado', 'conectando', 'conectado', 'erro')),

  -- Credenciais (criptografadas)
  access_token text,
  refresh_token text,
  token_expira_em timestamptz,

  -- Informacoes da conta conectada
  conta_id varchar(255),
  conta_nome varchar(255),
  conta_email varchar(255),

  -- Configuracoes especificas da plataforma
  configuracoes jsonb DEFAULT '{}'::jsonb,

  -- Erro mais recente
  erro_ultimo text,
  erro_em timestamptz,

  -- Sincronizacao
  ultima_sincronizacao timestamptz,

  -- Auditoria
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  conectado_por uuid REFERENCES usuarios(id),

  CONSTRAINT uk_integracoes_org_plataforma UNIQUE (organizacao_id, plataforma)
);

-- Tabela de webhooks de entrada (receber dados externos)
CREATE TABLE IF NOT EXISTS webhooks_entrada (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id) ON DELETE CASCADE,

  nome varchar(100) NOT NULL,
  descricao text,

  -- URL unica do webhook (token aleatorio)
  url_token varchar(64) NOT NULL UNIQUE,

  -- Autenticacao opcional
  api_key varchar(255),

  -- Status
  ativo boolean DEFAULT true,

  -- Estatisticas
  total_requests integer DEFAULT 0,
  ultima_request timestamptz,

  -- Auditoria
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  criado_por uuid REFERENCES usuarios(id)
);

-- Tabela de webhooks de saida (enviar dados para externos)
CREATE TABLE IF NOT EXISTS webhooks_saida (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id) ON DELETE CASCADE,

  nome varchar(100) NOT NULL,
  url varchar(500) NOT NULL,

  -- Eventos que disparam o webhook
  eventos jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Valores: contato_criado, contato_atualizado, oportunidade_criada,
  --          oportunidade_atualizada, oportunidade_ganha, oportunidade_perdida,
  --          tarefa_criada, tarefa_concluida

  -- Headers customizados
  headers jsonb DEFAULT '{}'::jsonb,

  -- Autenticacao
  auth_type varchar(20) DEFAULT 'none' CHECK (auth_type IN ('none', 'api_key', 'bearer', 'basic')),
  auth_value text, -- API key, token, ou user:pass codificado

  -- Status
  status varchar(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'erro')),

  -- Estatisticas
  sucessos integer DEFAULT 0,
  falhas integer DEFAULT 0,
  ultimo_envio timestamptz,

  -- Retry config
  max_retries integer DEFAULT 3,
  retry_delay_segundos integer DEFAULT 60,

  -- Auditoria
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  criado_por uuid REFERENCES usuarios(id)
);

-- Tabela de logs de webhooks de saida
CREATE TABLE IF NOT EXISTS webhooks_saida_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES webhooks_saida(id) ON DELETE CASCADE,

  evento varchar(50) NOT NULL,
  payload jsonb NOT NULL,

  -- Resposta
  http_status integer,
  resposta text,
  sucesso boolean DEFAULT false,

  -- Tempo de execucao
  tempo_ms integer,

  -- Retries
  tentativa integer DEFAULT 1,

  -- Erro
  erro text,

  criado_em timestamptz NOT NULL DEFAULT now()
);

-- Indices para performance
CREATE INDEX idx_regras_org ON regras_qualificacao(organizacao_id);
CREATE INDEX idx_regras_org_ativo ON regras_qualificacao(organizacao_id, ativo);
CREATE INDEX idx_integracoes_org ON integracoes(organizacao_id);
CREATE INDEX idx_integracoes_org_plataforma ON integracoes(organizacao_id, plataforma);
CREATE INDEX idx_webhooks_entrada_org ON webhooks_entrada(organizacao_id);
CREATE INDEX idx_webhooks_entrada_token ON webhooks_entrada(url_token);
CREATE INDEX idx_webhooks_saida_org ON webhooks_saida(organizacao_id);
CREATE INDEX idx_webhooks_logs_webhook ON webhooks_saida_logs(webhook_id);
CREATE INDEX idx_webhooks_logs_criado ON webhooks_saida_logs(criado_em DESC);

-- RLS Policies
ALTER TABLE regras_qualificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_card ENABLE ROW LEVEL SECURITY;
ALTER TABLE integracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks_entrada ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks_saida ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks_saida_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_regras" ON regras_qualificacao
  USING (organizacao_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY "tenant_isolation_config_card" ON configuracoes_card
  USING (organizacao_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY "tenant_isolation_integracoes" ON integracoes
  USING (organizacao_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY "tenant_isolation_webhooks_entrada" ON webhooks_entrada
  USING (organizacao_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY "tenant_isolation_webhooks_saida" ON webhooks_saida
  USING (organizacao_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY "tenant_isolation_webhooks_logs" ON webhooks_saida_logs
  USING (webhook_id IN (
    SELECT id FROM webhooks_saida
    WHERE organizacao_id = current_setting('app.current_tenant', true)::uuid
  ));

-- Triggers para atualizar timestamp
CREATE TRIGGER trg_regras_updated
  BEFORE UPDATE ON regras_qualificacao
  FOR EACH ROW EXECUTE FUNCTION update_campos_timestamp();

CREATE TRIGGER trg_config_card_updated
  BEFORE UPDATE ON configuracoes_card
  FOR EACH ROW EXECUTE FUNCTION update_campos_timestamp();

CREATE TRIGGER trg_integracoes_updated
  BEFORE UPDATE ON integracoes
  FOR EACH ROW EXECUTE FUNCTION update_campos_timestamp();

CREATE TRIGGER trg_webhooks_entrada_updated
  BEFORE UPDATE ON webhooks_entrada
  FOR EACH ROW EXECUTE FUNCTION update_campos_timestamp();

CREATE TRIGGER trg_webhooks_saida_updated
  BEFORE UPDATE ON webhooks_saida
  FOR EACH ROW EXECUTE FUNCTION update_campos_timestamp();

-- Comentarios
COMMENT ON TABLE regras_qualificacao IS 'Regras de qualificacao MQL - PRD-05';
COMMENT ON TABLE configuracoes_card IS 'Configuracoes do card Kanban - PRD-05';
COMMENT ON TABLE integracoes IS 'Integracoes OAuth com plataformas - PRD-05';
COMMENT ON TABLE webhooks_entrada IS 'Webhooks para receber dados externos - PRD-05';
COMMENT ON TABLE webhooks_saida IS 'Webhooks para enviar dados externos - PRD-05';
COMMENT ON TABLE webhooks_saida_logs IS 'Logs de envios de webhooks - PRD-05';
