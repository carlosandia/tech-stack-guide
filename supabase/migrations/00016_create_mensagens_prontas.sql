-- PRD-09: Tabela de mensagens prontas (quick replies)
-- AIDEV-NOTE: Templates de resposta rapida, podem ser pessoais ou globais

CREATE TABLE IF NOT EXISTS mensagens_prontas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id) ON DELETE CASCADE,
  usuario_id uuid REFERENCES usuarios(id) ON DELETE CASCADE,

  -- Identificacao
  atalho varchar(50) NOT NULL,
  titulo varchar(100) NOT NULL,
  conteudo text NOT NULL,

  -- Tipo
  tipo varchar(20) NOT NULL,

  -- Status
  ativo boolean DEFAULT true,

  -- Estatisticas
  vezes_usado integer DEFAULT 0,

  -- Padrao
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  -- Constraints
  CONSTRAINT chk_mensagens_prontas_tipo CHECK (tipo IN ('pessoal', 'global')),
  CONSTRAINT chk_mensagens_prontas_atalho CHECK (atalho ~ '^[a-z0-9_]+$')
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_mensagens_prontas_tenant ON mensagens_prontas(organizacao_id) WHERE deletado_em IS NULL AND ativo = true;
CREATE INDEX IF NOT EXISTS idx_mensagens_prontas_usuario ON mensagens_prontas(organizacao_id, usuario_id) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_mensagens_prontas_atalho ON mensagens_prontas(organizacao_id, atalho);

-- Unique constraint: atalho unico por org+usuario (NULL usuario = global)
CREATE UNIQUE INDEX IF NOT EXISTS idx_mensagens_prontas_unique_pessoal
  ON mensagens_prontas(organizacao_id, atalho, usuario_id)
  WHERE usuario_id IS NOT NULL AND deletado_em IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mensagens_prontas_unique_global
  ON mensagens_prontas(organizacao_id, atalho)
  WHERE usuario_id IS NULL AND deletado_em IS NULL;

-- RLS
ALTER TABLE mensagens_prontas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mensagens_prontas_tenant_isolation" ON mensagens_prontas;
CREATE POLICY "mensagens_prontas_tenant_isolation" ON mensagens_prontas
  USING (organizacao_id = current_setting('app.current_tenant', true)::uuid);

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION update_mensagens_prontas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_mensagens_prontas_updated_at ON mensagens_prontas;
CREATE TRIGGER trigger_update_mensagens_prontas_updated_at
  BEFORE UPDATE ON mensagens_prontas
  FOR EACH ROW
  EXECUTE FUNCTION update_mensagens_prontas_updated_at();

-- Comentarios
COMMENT ON TABLE mensagens_prontas IS 'Templates de resposta rapida (quick replies) para conversas (PRD-09)';
COMMENT ON COLUMN mensagens_prontas.atalho IS 'Comando de atalho sem barra (ex: ola, preco, horario)';
COMMENT ON COLUMN mensagens_prontas.tipo IS 'pessoal (apenas do usuario) ou global (visivel para todos)';
COMMENT ON COLUMN mensagens_prontas.usuario_id IS 'NULL = mensagem global criada por Admin';
