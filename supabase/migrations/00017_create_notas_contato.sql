-- PRD-09: Tabela de notas privadas de contatos
-- AIDEV-NOTE: Notas internas vinculadas a contatos, NAO sao enviadas aos clientes

CREATE TABLE IF NOT EXISTS notas_contato (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id) ON DELETE CASCADE,
  contato_id uuid NOT NULL REFERENCES contatos(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

  -- Conteudo
  conteudo text NOT NULL,

  -- Origem (opcional - conversa onde a nota foi criada)
  conversa_id uuid REFERENCES conversas(id) ON DELETE SET NULL,

  -- Padrao
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_notas_contato ON notas_contato(contato_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_notas_tenant ON notas_contato(organizacao_id) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_notas_conversa ON notas_contato(conversa_id) WHERE deletado_em IS NULL;

-- RLS
ALTER TABLE notas_contato ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notas_contato_tenant_isolation" ON notas_contato;
CREATE POLICY "notas_contato_tenant_isolation" ON notas_contato
  USING (organizacao_id = current_setting('app.current_tenant', true)::uuid);

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION update_notas_contato_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_notas_contato_updated_at ON notas_contato;
CREATE TRIGGER trigger_update_notas_contato_updated_at
  BEFORE UPDATE ON notas_contato
  FOR EACH ROW
  EXECUTE FUNCTION update_notas_contato_updated_at();

-- Comentarios
COMMENT ON TABLE notas_contato IS 'Notas privadas vinculadas a contatos (PRD-09)';
COMMENT ON COLUMN notas_contato.conversa_id IS 'Conversa de origem onde a nota foi criada (opcional)';
