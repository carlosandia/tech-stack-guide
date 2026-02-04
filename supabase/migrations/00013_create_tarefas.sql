-- PRD-10: Tabela de instancias de tarefas (conforme PRD-04)
-- AIDEV-NOTE: Esta tabela armazena as instancias de tarefas criadas quando oportunidades entram em etapas
-- Diferente de tarefas_templates que sao apenas templates de configuracao

CREATE TABLE IF NOT EXISTS tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id) ON DELETE CASCADE,

  -- Vinculos
  oportunidade_id uuid REFERENCES oportunidades(id) ON DELETE SET NULL,
  contato_id uuid REFERENCES contatos(id) ON DELETE SET NULL,

  -- Dados da tarefa
  titulo varchar(255) NOT NULL,
  descricao text,

  -- Tipo e canal
  tipo varchar(50) NOT NULL,
  canal varchar(50),

  -- Responsavel
  owner_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  criado_por_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

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
  tarefa_template_id uuid REFERENCES tarefas_templates(id) ON DELETE SET NULL,
  etapa_origem_id uuid REFERENCES etapas_funil(id) ON DELETE SET NULL,

  -- Timestamps
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  -- Constraints
  CONSTRAINT chk_tarefas_status CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'cancelada')),
  CONSTRAINT chk_tarefas_prioridade CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  CONSTRAINT chk_tarefas_tipo CHECK (tipo IN ('ligacao', 'email', 'reuniao', 'whatsapp', 'visita', 'outro'))
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_tarefas_tenant_owner ON tarefas(organizacao_id, owner_id) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_tarefas_tenant_status ON tarefas(organizacao_id, status) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_tarefas_oportunidade ON tarefas(oportunidade_id) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_tarefas_vencimento ON tarefas(organizacao_id, data_vencimento) WHERE deletado_em IS NULL AND status = 'pendente';
CREATE INDEX IF NOT EXISTS idx_tarefas_template ON tarefas(tarefa_template_id) WHERE deletado_em IS NULL;

-- RLS
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;

-- Policy para isolamento de tenant
DROP POLICY IF EXISTS "tarefas_tenant_isolation" ON tarefas;
CREATE POLICY "tarefas_tenant_isolation" ON tarefas
  USING (organizacao_id = current_setting('app.current_tenant', true)::uuid);

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION update_tarefas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tarefas_updated_at ON tarefas;
CREATE TRIGGER trigger_update_tarefas_updated_at
  BEFORE UPDATE ON tarefas
  FOR EACH ROW
  EXECUTE FUNCTION update_tarefas_updated_at();

-- Comentarios
COMMENT ON TABLE tarefas IS 'Instancias de tarefas criadas a partir de templates ou manualmente em oportunidades';
COMMENT ON COLUMN tarefas.tarefa_template_id IS 'Referencia ao template origem (se tarefa automatica)';
COMMENT ON COLUMN tarefas.etapa_origem_id IS 'Etapa que disparou a criacao da tarefa (se automatica)';
