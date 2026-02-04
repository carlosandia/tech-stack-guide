-- AIDEV-NOTE: Migration PRD-05 - Campos Customizados
-- Permite criar campos personalizados para entidades do CRM

-- Tabela de campos customizados
CREATE TABLE IF NOT EXISTS campos_customizados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id) ON DELETE CASCADE,

  -- Identificacao
  nome varchar(100) NOT NULL,
  label varchar(150) NOT NULL,
  descricao text,

  -- Entidade alvo (contato, pessoa, empresa, oportunidade)
  entidade varchar(50) NOT NULL CHECK (entidade IN ('contato', 'pessoa', 'empresa', 'oportunidade')),

  -- Tipo do campo (13 tipos conforme PRD)
  tipo varchar(50) NOT NULL CHECK (tipo IN (
    'texto', 'texto_longo', 'numero', 'decimal', 'data', 'data_hora',
    'booleano', 'select', 'multi_select', 'email', 'telefone', 'url', 'documento'
  )),

  -- Configuracoes do campo
  obrigatorio boolean DEFAULT false,
  valor_padrao text,
  placeholder text,

  -- Opcoes para campos select/multi_select (JSON array)
  opcoes jsonb DEFAULT '[]'::jsonb,

  -- Validacao
  validacao jsonb DEFAULT '{}'::jsonb, -- min, max, regex, etc.

  -- Ordenacao e exibicao
  ordem integer NOT NULL DEFAULT 0,
  visivel boolean DEFAULT true,

  -- Campo de sistema (nao pode ser editado/excluido)
  sistema boolean DEFAULT false,

  -- Auditoria
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  criado_por uuid REFERENCES usuarios(id),

  -- Constraint unica por organizacao + entidade + nome
  CONSTRAINT uk_campos_org_entidade_nome UNIQUE (organizacao_id, entidade, nome)
);

-- Tabela de valores dos campos customizados
CREATE TABLE IF NOT EXISTS valores_campos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id) ON DELETE CASCADE,
  campo_id uuid NOT NULL REFERENCES campos_customizados(id) ON DELETE CASCADE,

  -- Referencia a entidade (apenas um sera preenchido)
  contato_id uuid,
  oportunidade_id uuid,

  -- Valor do campo (armazenado como text, convertido conforme tipo)
  valor text,
  valor_json jsonb, -- Para multi_select ou dados complexos

  -- Auditoria
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),

  -- Constraint para garantir que apenas uma referencia seja preenchida
  CONSTRAINT chk_valores_campos_ref CHECK (
    (contato_id IS NOT NULL AND oportunidade_id IS NULL) OR
    (contato_id IS NULL AND oportunidade_id IS NOT NULL)
  )
);

-- Indices para performance
CREATE INDEX idx_campos_org_entidade ON campos_customizados(organizacao_id, entidade);
CREATE INDEX idx_campos_org_ordem ON campos_customizados(organizacao_id, entidade, ordem);
CREATE INDEX idx_valores_campo ON valores_campos(campo_id);
CREATE INDEX idx_valores_contato ON valores_campos(contato_id) WHERE contato_id IS NOT NULL;
CREATE INDEX idx_valores_oportunidade ON valores_campos(oportunidade_id) WHERE oportunidade_id IS NOT NULL;

-- RLS Policies
ALTER TABLE campos_customizados ENABLE ROW LEVEL SECURITY;
ALTER TABLE valores_campos ENABLE ROW LEVEL SECURITY;

-- Policy para campos_customizados
CREATE POLICY "tenant_isolation_campos" ON campos_customizados
  USING (organizacao_id = current_setting('app.current_tenant', true)::uuid);

-- Policy para valores_campos
CREATE POLICY "tenant_isolation_valores" ON valores_campos
  USING (organizacao_id = current_setting('app.current_tenant', true)::uuid);

-- Trigger para atualizar timestamp
CREATE OR REPLACE FUNCTION update_campos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_campos_updated
  BEFORE UPDATE ON campos_customizados
  FOR EACH ROW EXECUTE FUNCTION update_campos_timestamp();

CREATE TRIGGER trg_valores_updated
  BEFORE UPDATE ON valores_campos
  FOR EACH ROW EXECUTE FUNCTION update_campos_timestamp();

-- Comentarios
COMMENT ON TABLE campos_customizados IS 'Campos customizados por tenant/entidade - PRD-05';
COMMENT ON TABLE valores_campos IS 'Valores dos campos customizados - PRD-05';
