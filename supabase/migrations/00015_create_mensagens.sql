-- PRD-09: Tabela de mensagens individuais
-- AIDEV-NOTE: Armazena todas as mensagens de todas as conversas com suporte a multiplos tipos

CREATE TABLE IF NOT EXISTS mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id) ON DELETE CASCADE,
  conversa_id uuid NOT NULL REFERENCES conversas(id) ON DELETE CASCADE,

  -- Identificacao da mensagem
  message_id varchar(200) NOT NULL,
  from_me boolean NOT NULL DEFAULT false,
  from_number varchar(50),
  to_number varchar(50),
  participant varchar(50),

  -- Tipo e conteudo
  tipo varchar(30) NOT NULL,
  body text,
  caption text,

  -- Midia
  has_media boolean DEFAULT false,
  media_url text,
  media_mimetype varchar(100),
  media_filename varchar(255),
  media_size integer,
  media_duration integer,

  -- Localizacao
  location_latitude decimal(10, 8),
  location_longitude decimal(11, 8),
  location_name varchar(255),
  location_address text,

  -- Contato compartilhado
  vcard text,

  -- Enquete
  poll_question text,
  poll_options jsonb,
  poll_allow_multiple boolean,

  -- Reacao
  reaction_emoji varchar(10),
  reaction_message_id varchar(200),

  -- Reply
  reply_to_message_id varchar(200),

  -- Status de entrega
  ack integer DEFAULT 0,
  ack_name varchar(20),

  -- Metadados
  timestamp_externo bigint,
  raw_data jsonb,

  -- Padrao
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  -- Constraints
  CONSTRAINT chk_mensagens_tipo CHECK (tipo IN (
    'text', 'image', 'video', 'audio', 'document',
    'sticker', 'location', 'contact', 'poll', 'reaction'
  )),
  CONSTRAINT chk_mensagens_ack CHECK (ack >= 0 AND ack <= 5)
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_mensagens_conversa ON mensagens(conversa_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_mensagens_message ON mensagens(message_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_tipo ON mensagens(conversa_id, tipo) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_mensagens_tenant ON mensagens(organizacao_id) WHERE deletado_em IS NULL;

-- Unique constraint para evitar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS idx_mensagens_unique
  ON mensagens(organizacao_id, message_id)
  WHERE deletado_em IS NULL;

-- RLS
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mensagens_tenant_isolation" ON mensagens;
CREATE POLICY "mensagens_tenant_isolation" ON mensagens
  USING (organizacao_id = current_setting('app.current_tenant', true)::uuid);

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION update_mensagens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_mensagens_updated_at ON mensagens;
CREATE TRIGGER trigger_update_mensagens_updated_at
  BEFORE UPDATE ON mensagens
  FOR EACH ROW
  EXECUTE FUNCTION update_mensagens_updated_at();

-- Comentarios
COMMENT ON TABLE mensagens IS 'Mensagens individuais das conversas (PRD-09)';
COMMENT ON COLUMN mensagens.message_id IS 'ID externo da mensagem (WhatsApp/Instagram)';
COMMENT ON COLUMN mensagens.from_me IS 'true se mensagem enviada pelo usuario, false se recebida';
COMMENT ON COLUMN mensagens.ack IS 'Status de entrega: 0=error, 1=pending, 2=sent, 3=delivered, 4=read, 5=played';
COMMENT ON COLUMN mensagens.tipo IS 'Tipo da mensagem: text, image, video, audio, document, sticker, location, contact, poll, reaction';
