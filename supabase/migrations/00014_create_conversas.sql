-- PRD-09: Tabela de conversas (threads de mensagens)
-- AIDEV-NOTE: Armazena conversas vinculadas a contatos via WhatsApp ou Instagram

CREATE TABLE IF NOT EXISTS conversas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id) ON DELETE CASCADE,
  contato_id uuid NOT NULL REFERENCES contatos(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  sessao_whatsapp_id uuid REFERENCES sessoes_whatsapp(id) ON DELETE SET NULL,
  conexao_instagram_id uuid REFERENCES conexoes_instagram(id) ON DELETE SET NULL,

  -- Identificacao do chat
  chat_id varchar(100) NOT NULL,
  canal varchar(20) NOT NULL,
  tipo varchar(20) NOT NULL DEFAULT 'individual',
  nome varchar(255),
  foto_url text,

  -- Status de atendimento
  status varchar(20) NOT NULL DEFAULT 'aberta',

  -- Contadores
  total_mensagens integer DEFAULT 0,
  mensagens_nao_lidas integer DEFAULT 0,

  -- Timestamps
  ultima_mensagem_em timestamptz,
  primeira_mensagem_em timestamptz,
  status_alterado_em timestamptz,

  -- Padrao
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  -- Constraints
  CONSTRAINT chk_conversas_canal CHECK (canal IN ('whatsapp', 'instagram')),
  CONSTRAINT chk_conversas_tipo CHECK (tipo IN ('individual', 'grupo', 'canal')),
  CONSTRAINT chk_conversas_status CHECK (status IN ('aberta', 'pendente', 'fechada'))
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_conversas_tenant_usuario ON conversas(organizacao_id, usuario_id) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_conversas_tenant_status ON conversas(organizacao_id, status) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_conversas_ultima ON conversas(organizacao_id, ultima_mensagem_em DESC) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_conversas_contato ON conversas(contato_id) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_conversas_chat ON conversas(chat_id);

-- Unique constraints para evitar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversas_unique_whatsapp
  ON conversas(organizacao_id, chat_id, sessao_whatsapp_id)
  WHERE sessao_whatsapp_id IS NOT NULL AND deletado_em IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversas_unique_instagram
  ON conversas(organizacao_id, chat_id, conexao_instagram_id)
  WHERE conexao_instagram_id IS NOT NULL AND deletado_em IS NULL;

-- RLS
ALTER TABLE conversas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversas_tenant_isolation" ON conversas;
CREATE POLICY "conversas_tenant_isolation" ON conversas
  USING (organizacao_id = current_setting('app.current_tenant', true)::uuid);

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION update_conversas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_conversas_updated_at ON conversas;
CREATE TRIGGER trigger_update_conversas_updated_at
  BEFORE UPDATE ON conversas
  FOR EACH ROW
  EXECUTE FUNCTION update_conversas_updated_at();

-- Comentarios
COMMENT ON TABLE conversas IS 'Threads de conversas com contatos via WhatsApp ou Instagram (PRD-09)';
COMMENT ON COLUMN conversas.chat_id IS 'ID externo do chat (ex: 5511999999999@c.us para WhatsApp)';
COMMENT ON COLUMN conversas.canal IS 'Canal de comunicacao: whatsapp ou instagram';
COMMENT ON COLUMN conversas.status IS 'Status de atendimento: aberta, pendente, fechada';
