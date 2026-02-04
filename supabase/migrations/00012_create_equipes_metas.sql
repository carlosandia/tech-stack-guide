-- AIDEV-NOTE: Migration PRD-05 - Equipes e Metas Hierarquicas
-- Gestao de equipes de vendedores e sistema de metas

-- Tabela de equipes
CREATE TABLE IF NOT EXISTS equipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id) ON DELETE CASCADE,

  nome varchar(100) NOT NULL,
  descricao text,
  cor varchar(7) DEFAULT '#6B7280', -- Hex color

  -- Lider da equipe (opcional)
  lider_id uuid REFERENCES usuarios(id) ON DELETE SET NULL,

  ativo boolean DEFAULT true,

  -- Auditoria
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  criado_por uuid REFERENCES usuarios(id),

  CONSTRAINT uk_equipes_org_nome UNIQUE (organizacao_id, nome)
);

-- Tabela de membros das equipes (N:N)
CREATE TABLE IF NOT EXISTS equipes_membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id uuid NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

  -- Papel na equipe
  papel varchar(20) DEFAULT 'membro' CHECK (papel IN ('lider', 'membro')),

  adicionado_em timestamptz NOT NULL DEFAULT now(),
  adicionado_por uuid REFERENCES usuarios(id),

  CONSTRAINT uk_equipes_membros UNIQUE (equipe_id, usuario_id)
);

-- Tabela de metas hierarquicas
CREATE TABLE IF NOT EXISTS metas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id) ON DELETE CASCADE,

  -- Tipo de meta (hierarquia)
  tipo varchar(20) NOT NULL CHECK (tipo IN ('empresa', 'equipe', 'individual')),

  -- Referencia (depende do tipo)
  equipe_id uuid REFERENCES equipes(id) ON DELETE CASCADE,
  usuario_id uuid REFERENCES usuarios(id) ON DELETE CASCADE,

  -- Meta pai (para distribuicao hierarquica)
  meta_pai_id uuid REFERENCES metas(id) ON DELETE SET NULL,

  -- Metrica alvo (15 tipos conforme PRD)
  metrica varchar(50) NOT NULL CHECK (metrica IN (
    -- Receita
    'valor_vendas', 'mrr', 'ticket_medio',
    -- Quantidade
    'quantidade_vendas', 'novos_negocios', 'taxa_conversao',
    -- Atividades
    'reunioes', 'ligacoes', 'emails', 'tarefas',
    -- Leads
    'novos_contatos', 'mqls', 'sqls',
    -- Tempo
    'tempo_fechamento', 'velocidade_pipeline'
  )),

  -- Valores
  valor_alvo decimal(15, 2) NOT NULL,
  valor_minimo decimal(15, 2), -- Meta minima aceitavel

  -- Periodo
  periodo varchar(20) NOT NULL DEFAULT 'mensal'
    CHECK (periodo IN ('semanal', 'mensal', 'trimestral', 'semestral', 'anual')),
  data_inicio date NOT NULL,
  data_fim date NOT NULL,

  -- Status
  ativo boolean DEFAULT true,

  -- Auditoria
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  criado_por uuid REFERENCES usuarios(id),

  -- Constraints de integridade
  CONSTRAINT chk_metas_tipo_ref CHECK (
    (tipo = 'empresa' AND equipe_id IS NULL AND usuario_id IS NULL) OR
    (tipo = 'equipe' AND equipe_id IS NOT NULL AND usuario_id IS NULL) OR
    (tipo = 'individual' AND usuario_id IS NOT NULL)
  ),
  CONSTRAINT chk_metas_datas CHECK (data_fim > data_inicio)
);

-- Tabela de progresso das metas (cache para performance)
CREATE TABLE IF NOT EXISTS metas_progresso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_id uuid NOT NULL REFERENCES metas(id) ON DELETE CASCADE,

  -- Valores atuais
  valor_atual decimal(15, 2) NOT NULL DEFAULT 0,
  percentual_atingido decimal(5, 2) NOT NULL DEFAULT 0,

  -- Historico diario (JSON array)
  historico_diario jsonb DEFAULT '[]'::jsonb,
  -- Formato: [{"data": "2024-01-01", "valor": 1000}, ...]

  -- Ultima atualizacao
  calculado_em timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uk_metas_progresso UNIQUE (meta_id)
);

-- Indices para performance
CREATE INDEX idx_equipes_org ON equipes(organizacao_id);
CREATE INDEX idx_equipes_org_ativo ON equipes(organizacao_id, ativo);
CREATE INDEX idx_equipes_membros_equipe ON equipes_membros(equipe_id);
CREATE INDEX idx_equipes_membros_usuario ON equipes_membros(usuario_id);
CREATE INDEX idx_metas_org ON metas(organizacao_id);
CREATE INDEX idx_metas_org_tipo ON metas(organizacao_id, tipo);
CREATE INDEX idx_metas_org_periodo ON metas(organizacao_id, data_inicio, data_fim);
CREATE INDEX idx_metas_equipe ON metas(equipe_id) WHERE equipe_id IS NOT NULL;
CREATE INDEX idx_metas_usuario ON metas(usuario_id) WHERE usuario_id IS NOT NULL;
CREATE INDEX idx_metas_pai ON metas(meta_pai_id) WHERE meta_pai_id IS NOT NULL;
CREATE INDEX idx_metas_progresso_meta ON metas_progresso(meta_id);

-- RLS Policies
ALTER TABLE equipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipes_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas_progresso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_equipes" ON equipes
  USING (organizacao_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY "tenant_isolation_equipes_membros" ON equipes_membros
  USING (equipe_id IN (
    SELECT id FROM equipes
    WHERE organizacao_id = current_setting('app.current_tenant', true)::uuid
  ));

CREATE POLICY "tenant_isolation_metas" ON metas
  USING (organizacao_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY "tenant_isolation_metas_progresso" ON metas_progresso
  USING (meta_id IN (
    SELECT id FROM metas
    WHERE organizacao_id = current_setting('app.current_tenant', true)::uuid
  ));

-- Triggers para atualizar timestamp
CREATE TRIGGER trg_equipes_updated
  BEFORE UPDATE ON equipes
  FOR EACH ROW EXECUTE FUNCTION update_campos_timestamp();

CREATE TRIGGER trg_metas_updated
  BEFORE UPDATE ON metas
  FOR EACH ROW EXECUTE FUNCTION update_campos_timestamp();

-- Funcao para recalcular progresso da meta
CREATE OR REPLACE FUNCTION recalcular_progresso_meta(p_meta_id uuid)
RETURNS void AS $$
DECLARE
  v_meta metas%ROWTYPE;
  v_valor_atual decimal(15, 2) := 0;
  v_percentual decimal(5, 2) := 0;
BEGIN
  SELECT * INTO v_meta FROM metas WHERE id = p_meta_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- AIDEV-TODO: Implementar calculo real baseado na metrica
  -- Por enquanto, soma metas filhas para metas de empresa/equipe
  IF v_meta.tipo IN ('empresa', 'equipe') THEN
    SELECT COALESCE(SUM(mp.valor_atual), 0)
    INTO v_valor_atual
    FROM metas m
    JOIN metas_progresso mp ON mp.meta_id = m.id
    WHERE m.meta_pai_id = p_meta_id;
  END IF;

  -- Calcular percentual
  IF v_meta.valor_alvo > 0 THEN
    v_percentual := (v_valor_atual / v_meta.valor_alvo) * 100;
  END IF;

  -- Atualizar ou inserir progresso
  INSERT INTO metas_progresso (meta_id, valor_atual, percentual_atingido, calculado_em)
  VALUES (p_meta_id, v_valor_atual, v_percentual, now())
  ON CONFLICT (meta_id) DO UPDATE SET
    valor_atual = v_valor_atual,
    percentual_atingido = v_percentual,
    calculado_em = now();
END;
$$ LANGUAGE plpgsql;

-- Comentarios
COMMENT ON TABLE equipes IS 'Equipes de vendedores - PRD-05';
COMMENT ON TABLE equipes_membros IS 'Membros das equipes (N:N) - PRD-05';
COMMENT ON TABLE metas IS 'Metas hierarquicas (empresa/equipe/individual) - PRD-05';
COMMENT ON TABLE metas_progresso IS 'Cache de progresso das metas - PRD-05';
COMMENT ON FUNCTION recalcular_progresso_meta IS 'Recalcula progresso de uma meta - PRD-05';
