-- AIDEV-NOTE: Migration PRD-05 - Motivos de Resultado e Templates
-- Motivos de ganho/perda, templates de tarefas e etapas

-- Tabela de motivos de resultado (ganho/perda)
CREATE TABLE IF NOT EXISTS motivos_resultado (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id) ON DELETE CASCADE,

  nome varchar(100) NOT NULL,
  tipo varchar(10) NOT NULL CHECK (tipo IN ('ganho', 'perda')),

  ativo boolean DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,

  -- Auditoria
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  criado_por uuid REFERENCES usuarios(id),

  CONSTRAINT uk_motivos_org_tipo_nome UNIQUE (organizacao_id, tipo, nome)
);

-- Tabela de templates de tarefas
CREATE TABLE IF NOT EXISTS tarefas_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id) ON DELETE CASCADE,

  titulo varchar(200) NOT NULL,
  descricao text,

  -- Tipo da tarefa
  tipo varchar(20) NOT NULL DEFAULT 'outro'
    CHECK (tipo IN ('ligacao', 'email', 'reuniao', 'visita', 'outro')),

  -- Prioridade
  prioridade varchar(20) NOT NULL DEFAULT 'media'
    CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),

  -- Tempo
  duracao_minutos integer, -- Duracao estimada
  dias_para_vencimento integer, -- Dias ate o vencimento apos criacao

  ativo boolean DEFAULT true,

  -- Auditoria
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  criado_por uuid REFERENCES usuarios(id)
);

-- Tabela de templates de etapas do funil
CREATE TABLE IF NOT EXISTS etapas_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id) ON DELETE CASCADE,

  nome varchar(100) NOT NULL,
  descricao text,
  cor varchar(7) DEFAULT '#6B7280', -- Hex color

  -- Tipo da etapa
  tipo varchar(20) NOT NULL DEFAULT 'normal'
    CHECK (tipo IN ('entrada', 'normal', 'ganho', 'perda')),

  -- Probabilidade de fechamento (%)
  probabilidade integer DEFAULT 0 CHECK (probabilidade >= 0 AND probabilidade <= 100),

  -- Tempo limite em dias (SLA)
  tempo_limite_dias integer,

  -- Ordenacao
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean DEFAULT true,

  -- Auditoria
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  criado_por uuid REFERENCES usuarios(id),

  CONSTRAINT uk_etapas_org_nome UNIQUE (organizacao_id, nome)
);

-- Tabela de tarefas automaticas por etapa
CREATE TABLE IF NOT EXISTS etapas_tarefas_auto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etapa_template_id uuid NOT NULL REFERENCES etapas_templates(id) ON DELETE CASCADE,
  tarefa_template_id uuid NOT NULL REFERENCES tarefas_templates(id) ON DELETE CASCADE,

  -- Quando criar a tarefa
  criar_ao_entrar boolean DEFAULT true, -- Ao entrar na etapa
  dias_apos_entrada integer DEFAULT 0, -- Dias apos entrada na etapa

  ativo boolean DEFAULT true,

  CONSTRAINT uk_etapas_tarefas UNIQUE (etapa_template_id, tarefa_template_id)
);

-- Indices para performance
CREATE INDEX idx_motivos_org_tipo ON motivos_resultado(organizacao_id, tipo);
CREATE INDEX idx_motivos_org_ativo ON motivos_resultado(organizacao_id, ativo);
CREATE INDEX idx_tarefas_templates_org ON tarefas_templates(organizacao_id);
CREATE INDEX idx_tarefas_templates_org_tipo ON tarefas_templates(organizacao_id, tipo);
CREATE INDEX idx_etapas_templates_org ON etapas_templates(organizacao_id);
CREATE INDEX idx_etapas_templates_org_ordem ON etapas_templates(organizacao_id, ordem);
CREATE INDEX idx_etapas_tarefas_etapa ON etapas_tarefas_auto(etapa_template_id);

-- RLS Policies
ALTER TABLE motivos_resultado ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE etapas_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE etapas_tarefas_auto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_motivos" ON motivos_resultado
  USING (organizacao_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY "tenant_isolation_tarefas_templates" ON tarefas_templates
  USING (organizacao_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY "tenant_isolation_etapas_templates" ON etapas_templates
  USING (organizacao_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY "tenant_isolation_etapas_tarefas" ON etapas_tarefas_auto
  USING (etapa_template_id IN (
    SELECT id FROM etapas_templates
    WHERE organizacao_id = current_setting('app.current_tenant', true)::uuid
  ));

-- Triggers para atualizar timestamp
CREATE TRIGGER trg_motivos_updated
  BEFORE UPDATE ON motivos_resultado
  FOR EACH ROW EXECUTE FUNCTION update_campos_timestamp();

CREATE TRIGGER trg_tarefas_templates_updated
  BEFORE UPDATE ON tarefas_templates
  FOR EACH ROW EXECUTE FUNCTION update_campos_timestamp();

CREATE TRIGGER trg_etapas_templates_updated
  BEFORE UPDATE ON etapas_templates
  FOR EACH ROW EXECUTE FUNCTION update_campos_timestamp();

-- Seed de dados padrao (motivos comuns)
-- AIDEV-NOTE: Estes dados serao inseridos por tenant via service, nao aqui

-- Comentarios
COMMENT ON TABLE motivos_resultado IS 'Motivos de ganho/perda de negocios - PRD-05';
COMMENT ON TABLE tarefas_templates IS 'Templates de tarefas reutilizaveis - PRD-05';
COMMENT ON TABLE etapas_templates IS 'Templates de etapas do funil - PRD-05';
COMMENT ON TABLE etapas_tarefas_auto IS 'Tarefas automaticas por etapa - PRD-05';
