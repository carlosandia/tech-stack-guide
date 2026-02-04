-- PRD-09: Tabela de mensagens agendadas
-- AIDEV-NOTE: Mensagens programadas para envio futuro

CREATE TABLE IF NOT EXISTS mensagens_agendadas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id) ON DELETE CASCADE,
  conversa_id uuid NOT NULL REFERENCES conversas(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

  -- Conteudo
  tipo varchar(30) NOT NULL DEFAULT 'text',
  conteudo text NOT NULL,
  media_url text,

  -- Agendamento
  agendado_para timestamptz NOT NULL,
  timezone varchar(50) NOT NULL DEFAULT 'America/Sao_Paulo',

  -- Status
  status varchar(20) NOT NULL DEFAULT 'agendada',
  enviada_em timestamptz,
  erro text,

  -- Padrao
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT chk_mensagens_agendadas_status CHECK (status IN ('agendada', 'enviada', 'cancelada', 'falha')),
  CONSTRAINT chk_mensagens_agendadas_tipo CHECK (tipo IN (
    'text', 'image', 'video', 'audio', 'document'
  ))
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_msg_agendadas_envio ON mensagens_agendadas(agendado_para) WHERE status = 'agendada';
CREATE INDEX IF NOT EXISTS idx_msg_agendadas_usuario ON mensagens_agendadas(organizacao_id, usuario_id);
CREATE INDEX IF NOT EXISTS idx_msg_agendadas_conversa ON mensagens_agendadas(conversa_id);
CREATE INDEX IF NOT EXISTS idx_msg_agendadas_status ON mensagens_agendadas(organizacao_id, status);

-- RLS
ALTER TABLE mensagens_agendadas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mensagens_agendadas_tenant_isolation" ON mensagens_agendadas;
CREATE POLICY "mensagens_agendadas_tenant_isolation" ON mensagens_agendadas
  USING (organizacao_id = current_setting('app.current_tenant', true)::uuid);

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION update_mensagens_agendadas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_mensagens_agendadas_updated_at ON mensagens_agendadas;
CREATE TRIGGER trigger_update_mensagens_agendadas_updated_at
  BEFORE UPDATE ON mensagens_agendadas
  FOR EACH ROW
  EXECUTE FUNCTION update_mensagens_agendadas_updated_at();

-- Comentarios
COMMENT ON TABLE mensagens_agendadas IS 'Mensagens programadas para envio futuro (PRD-09)';
COMMENT ON COLUMN mensagens_agendadas.agendado_para IS 'Data/hora do envio programado';
COMMENT ON COLUMN mensagens_agendadas.timezone IS 'Fuso horario do agendamento';
