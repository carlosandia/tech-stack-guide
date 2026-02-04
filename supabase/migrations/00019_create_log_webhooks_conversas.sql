-- PRD-09: Tabela de log de webhooks de conversas
-- AIDEV-NOTE: Log de todos os eventos recebidos de WAHA e Instagram para debug/audit

CREATE TABLE IF NOT EXISTS log_webhooks_conversas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid,

  -- Evento
  evento varchar(50) NOT NULL,
  canal varchar(20),
  sessao varchar(100),
  payload jsonb NOT NULL,

  -- Processamento
  processado boolean DEFAULT false,
  processado_em timestamptz,
  erro text,

  -- Padrao
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- Indices para performance (tabela pode crescer muito)
CREATE INDEX IF NOT EXISTS idx_log_webhooks_conv_org ON log_webhooks_conversas(organizacao_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_log_webhooks_conv_evento ON log_webhooks_conversas(evento, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_log_webhooks_conv_pendente ON log_webhooks_conversas(processado, criado_em) WHERE processado = false;
CREATE INDEX IF NOT EXISTS idx_log_webhooks_conv_canal ON log_webhooks_conversas(canal, criado_em DESC);

-- SEM RLS - Tabela de auditoria/debug acessivel apenas via service role
-- Dados senssiveis nao devem ser expostos ao frontend

-- Comentarios
COMMENT ON TABLE log_webhooks_conversas IS 'Log de eventos webhooks recebidos de WAHA/Instagram (PRD-09)';
COMMENT ON COLUMN log_webhooks_conversas.evento IS 'Tipo do evento: message, message.ack, message.reaction, session.status';
COMMENT ON COLUMN log_webhooks_conversas.canal IS 'Canal de origem: whatsapp ou instagram';
COMMENT ON COLUMN log_webhooks_conversas.processado IS 'Indica se o evento foi processado com sucesso';
