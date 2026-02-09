
-- =====================================================
-- ETAPA 3: Lógica Condicional + Progressive Profiling
-- =====================================================

-- Adicionar colunas de progressive profiling ao formularios
ALTER TABLE public.formularios
  ADD COLUMN IF NOT EXISTS progressive_profiling_ativo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS lead_scoring_ativo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pontuacao_base_lead INTEGER DEFAULT 0;

-- =====================================================
-- Tabela: regras_condicionais_formularios
-- =====================================================

CREATE TABLE IF NOT EXISTS public.regras_condicionais_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL REFERENCES public.formularios(id) ON DELETE CASCADE,

  -- Identificacao da regra
  nome_regra VARCHAR(100) NOT NULL,
  ordem_regra INTEGER NOT NULL DEFAULT 0,
  ativa BOOLEAN DEFAULT true,

  -- Tipo de acao
  tipo_acao VARCHAR(30) NOT NULL,
  -- Valores: 'mostrar_campo', 'ocultar_campo', 'mostrar_etapa',
  --          'ocultar_etapa', 'pular_para_etapa', 'redirecionar',
  --          'definir_valor', 'tornar_obrigatorio'

  -- Alvo da acao
  campo_alvo_id UUID REFERENCES public.campos_formularios(id) ON DELETE CASCADE,
  indice_etapa_alvo INTEGER,
  url_redirecionamento_alvo TEXT,
  valor_alvo TEXT,

  -- Condicoes (JSONB para flexibilidade)
  condicoes JSONB NOT NULL DEFAULT '[]',

  -- Operador logico entre condicoes
  logica_condicoes VARCHAR(3) DEFAULT 'e',

  -- Metadados
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_regras_condicionais_formulario ON public.regras_condicionais_formularios(formulario_id);
CREATE INDEX IF NOT EXISTS idx_regras_condicionais_ordem ON public.regras_condicionais_formularios(formulario_id, ordem_regra);

-- RLS
ALTER TABLE public.regras_condicionais_formularios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "regras_condicionais_tenant_isolation"
  ON public.regras_condicionais_formularios
  FOR ALL
  USING (
    formulario_id IN (
      SELECT id FROM public.formularios WHERE organizacao_id = (
        SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()
      )
    )
  )
  WITH CHECK (
    formulario_id IN (
      SELECT id FROM public.formularios WHERE organizacao_id = (
        SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()
      )
    )
  );

-- =====================================================
-- Tabela: config_progressive_profiling_formularios
-- =====================================================

CREATE TABLE IF NOT EXISTS public.config_progressive_profiling_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL UNIQUE REFERENCES public.formularios(id) ON DELETE CASCADE,

  -- Configuracao geral
  ativo BOOLEAN DEFAULT false,

  -- Identificacao de visitante
  metodo_identificacao VARCHAR(30) DEFAULT 'email',
  nome_cookie VARCHAR(100) DEFAULT 'crm_visitor_id',
  dias_expiracao_cookie INTEGER DEFAULT 365,

  -- Comportamento
  ocultar_campos_conhecidos BOOLEAN DEFAULT true,
  mostrar_campos_alternativos BOOLEAN DEFAULT true,
  min_campos_exibir INTEGER DEFAULT 2,

  -- Campos prioritarios
  ordem_prioridade_campos JSONB DEFAULT '[]',

  -- Mensagem para leads conhecidos
  saudacao_lead_conhecido TEXT DEFAULT 'Ola, {{primeiro_nome}}! Complete suas informacoes:',

  -- Metadados
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice
CREATE INDEX IF NOT EXISTS idx_config_progressive_profiling_formulario ON public.config_progressive_profiling_formularios(formulario_id);

-- RLS
ALTER TABLE public.config_progressive_profiling_formularios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "config_profiling_tenant_isolation"
  ON public.config_progressive_profiling_formularios
  FOR ALL
  USING (
    formulario_id IN (
      SELECT id FROM public.formularios WHERE organizacao_id = (
        SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()
      )
    )
  )
  WITH CHECK (
    formulario_id IN (
      SELECT id FROM public.formularios WHERE organizacao_id = (
        SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()
      )
    )
  );

-- Adicionar colunas de profiling aos campos_formularios
ALTER TABLE public.campos_formularios
  ADD COLUMN IF NOT EXISTS mostrar_para_leads_conhecidos BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS alternativa_para_campo_id UUID REFERENCES public.campos_formularios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS prioridade_profiling INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_pontuacao INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS regras_pontuacao JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS prefill_ativo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS prefill_fonte VARCHAR(30),
  ADD COLUMN IF NOT EXISTS prefill_chave VARCHAR(100),
  ADD COLUMN IF NOT EXISTS valor_padrao TEXT;
