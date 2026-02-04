-- AIDEV-NOTE: Migration PRD-05 - Produtos e Categorias
-- Catalogo de produtos/servicos do tenant

-- Tabela de categorias de produtos
CREATE TABLE IF NOT EXISTS categorias_produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id) ON DELETE CASCADE,

  nome varchar(100) NOT NULL,
  descricao text,
  cor varchar(7), -- Hex color #RRGGBB

  ativo boolean DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,

  -- Auditoria
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  criado_por uuid REFERENCES usuarios(id),

  CONSTRAINT uk_categorias_org_nome UNIQUE (organizacao_id, nome)
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id) ON DELETE CASCADE,
  categoria_id uuid REFERENCES categorias_produtos(id) ON DELETE SET NULL,

  -- Identificacao
  nome varchar(200) NOT NULL,
  codigo varchar(50), -- SKU ou codigo interno
  descricao text,

  -- Precos
  preco decimal(15, 2) NOT NULL DEFAULT 0,
  custo decimal(15, 2), -- Custo interno (opcional)

  -- Recorrencia para SaaS/Servicos
  recorrencia varchar(20) NOT NULL DEFAULT 'nenhuma'
    CHECK (recorrencia IN ('nenhuma', 'mensal', 'trimestral', 'semestral', 'anual')),

  -- Status
  ativo boolean DEFAULT true,

  -- Metadados adicionais
  metadados jsonb DEFAULT '{}'::jsonb,

  -- Auditoria
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  criado_por uuid REFERENCES usuarios(id),

  CONSTRAINT uk_produtos_org_codigo UNIQUE (organizacao_id, codigo)
);

-- Indices para performance
CREATE INDEX idx_categorias_org ON categorias_produtos(organizacao_id);
CREATE INDEX idx_categorias_org_ativo ON categorias_produtos(organizacao_id, ativo);
CREATE INDEX idx_produtos_org ON produtos(organizacao_id);
CREATE INDEX idx_produtos_org_categoria ON produtos(organizacao_id, categoria_id);
CREATE INDEX idx_produtos_org_ativo ON produtos(organizacao_id, ativo);
CREATE INDEX idx_produtos_codigo ON produtos(organizacao_id, codigo) WHERE codigo IS NOT NULL;

-- RLS Policies
ALTER TABLE categorias_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_categorias" ON categorias_produtos
  USING (organizacao_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY "tenant_isolation_produtos" ON produtos
  USING (organizacao_id = current_setting('app.current_tenant', true)::uuid);

-- Triggers para atualizar timestamp
CREATE TRIGGER trg_categorias_updated
  BEFORE UPDATE ON categorias_produtos
  FOR EACH ROW EXECUTE FUNCTION update_campos_timestamp();

CREATE TRIGGER trg_produtos_updated
  BEFORE UPDATE ON produtos
  FOR EACH ROW EXECUTE FUNCTION update_campos_timestamp();

-- Comentarios
COMMENT ON TABLE categorias_produtos IS 'Categorias de produtos do tenant - PRD-05';
COMMENT ON TABLE produtos IS 'Catalogo de produtos/servicos do tenant - PRD-05';
