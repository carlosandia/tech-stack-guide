
-- =====================================================
-- ETAPA 4: A/B Testing + Webhooks + Analytics
-- =====================================================

-- Adicionar colunas AB testing ao formularios
ALTER TABLE public.formularios
  ADD COLUMN IF NOT EXISTS ab_testing_ativo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS teste_ab_atual_id UUID;

-- =====================================================
-- Tabela: testes_ab_formularios
-- =====================================================

CREATE TABLE IF NOT EXISTS public.testes_ab_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL REFERENCES public.formularios(id) ON DELETE CASCADE,
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes_saas(id) ON DELETE CASCADE,

  nome_teste VARCHAR(255) NOT NULL,
  descricao_teste TEXT,

  -- Status do teste
  status VARCHAR(20) NOT NULL DEFAULT 'rascunho',
  -- Valores: 'rascunho', 'em_andamento', 'pausado', 'concluido'

  -- Configuracao
  metrica_objetivo VARCHAR(30) DEFAULT 'taxa_conversao',
  -- Valores: 'taxa_conversao', 'taxa_submissao', 'tempo_preenchimento'
  confianca_minima DECIMAL(5,2) DEFAULT 95.00,
  duracao_minima_dias INTEGER DEFAULT 7,
  minimo_submissoes INTEGER DEFAULT 100,

  -- Datas
  iniciado_em TIMESTAMP WITH TIME ZONE,
  pausado_em TIMESTAMP WITH TIME ZONE,
  concluido_em TIMESTAMP WITH TIME ZONE,

  -- Resultado
  variante_vencedora_id UUID,

  -- Metadados
  criado_por UUID,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_testes_ab_formulario ON public.testes_ab_formularios(formulario_id);
CREATE INDEX IF NOT EXISTS idx_testes_ab_status ON public.testes_ab_formularios(status);

ALTER TABLE public.testes_ab_formularios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "testes_ab_tenant_isolation"
  ON public.testes_ab_formularios
  FOR ALL
  USING (organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()))
  WITH CHECK (organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()));

-- =====================================================
-- Tabela: variantes_ab_formularios
-- =====================================================

CREATE TABLE IF NOT EXISTS public.variantes_ab_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teste_ab_id UUID NOT NULL REFERENCES public.testes_ab_formularios(id) ON DELETE CASCADE,

  nome_variante VARCHAR(100) NOT NULL,
  letra_variante CHAR(1) NOT NULL,
  e_controle BOOLEAN DEFAULT false,

  -- Configuracao da variante (diferencas em JSONB)
  alteracoes JSONB NOT NULL DEFAULT '{}',

  -- Distribuicao de trafego
  porcentagem_trafego INTEGER DEFAULT 50,

  -- Estatisticas
  contagem_visualizacoes INTEGER DEFAULT 0,
  contagem_submissoes INTEGER DEFAULT 0,
  taxa_conversao DECIMAL(5,4) DEFAULT 0,

  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_variantes_ab_teste ON public.variantes_ab_formularios(teste_ab_id);

ALTER TABLE public.variantes_ab_formularios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "variantes_ab_tenant_isolation"
  ON public.variantes_ab_formularios
  FOR ALL
  USING (
    teste_ab_id IN (
      SELECT id FROM public.testes_ab_formularios WHERE organizacao_id = (
        SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()
      )
    )
  )
  WITH CHECK (
    teste_ab_id IN (
      SELECT id FROM public.testes_ab_formularios WHERE organizacao_id = (
        SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()
      )
    )
  );

-- Adicionar FK do teste_ab_atual_id
ALTER TABLE public.formularios
  ADD CONSTRAINT formularios_teste_ab_atual_id_fkey
  FOREIGN KEY (teste_ab_atual_id) REFERENCES public.testes_ab_formularios(id) ON DELETE SET NULL;

-- Adicionar FK variante_vencedora_id
ALTER TABLE public.testes_ab_formularios
  ADD CONSTRAINT testes_ab_variante_vencedora_fkey
  FOREIGN KEY (variante_vencedora_id) REFERENCES public.variantes_ab_formularios(id) ON DELETE SET NULL;

-- =====================================================
-- Tabela: webhooks_formularios
-- =====================================================

CREATE TABLE IF NOT EXISTS public.webhooks_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL REFERENCES public.formularios(id) ON DELETE CASCADE,
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes_saas(id) ON DELETE CASCADE,

  nome_webhook VARCHAR(100) NOT NULL,
  url_webhook TEXT NOT NULL,
  metodo_http VARCHAR(10) DEFAULT 'POST',

  -- Headers customizados
  headers_customizados JSONB DEFAULT '{}',

  -- Payload
  formato_payload VARCHAR(20) DEFAULT 'json',
  incluir_metadados BOOLEAN DEFAULT true,
  mapeamento_campos JSONB DEFAULT '{}',

  -- Trigger
  disparar_em VARCHAR(20) DEFAULT 'submissao',
  condicoes_disparo JSONB,

  -- Retry
  retry_ativo BOOLEAN DEFAULT true,
  max_tentativas INTEGER DEFAULT 3,
  atraso_retry_segundos INTEGER DEFAULT 60,

  -- Status
  ativo BOOLEAN DEFAULT true,
  ultimo_disparo_em TIMESTAMP WITH TIME ZONE,
  ultimo_status_code INTEGER,
  ultimo_erro TEXT,
  contagem_sucesso INTEGER DEFAULT 0,
  contagem_falha INTEGER DEFAULT 0,

  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_formulario ON public.webhooks_formularios(formulario_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_ativo ON public.webhooks_formularios(formulario_id, ativo);

ALTER TABLE public.webhooks_formularios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhooks_formularios_tenant_isolation"
  ON public.webhooks_formularios
  FOR ALL
  USING (organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()))
  WITH CHECK (organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()));

-- =====================================================
-- Tabela: logs_webhooks_formularios
-- =====================================================

CREATE TABLE IF NOT EXISTS public.logs_webhooks_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhooks_formularios(id) ON DELETE CASCADE,
  submissao_id UUID REFERENCES public.submissoes_formularios(id) ON DELETE SET NULL,

  -- Request
  request_url TEXT NOT NULL,
  request_metodo VARCHAR(10),
  request_headers JSONB,
  request_body TEXT,

  -- Response
  response_status_code INTEGER,
  response_headers JSONB,
  response_body TEXT,
  response_tempo_ms INTEGER,

  -- Status
  status VARCHAR(20) DEFAULT 'pendente',
  contagem_retry INTEGER DEFAULT 0,
  mensagem_erro TEXT,

  disparado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  concluido_em TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_logs_webhooks_webhook ON public.logs_webhooks_formularios(webhook_id);
CREATE INDEX IF NOT EXISTS idx_logs_webhooks_status ON public.logs_webhooks_formularios(status);

ALTER TABLE public.logs_webhooks_formularios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "logs_webhooks_tenant_isolation"
  ON public.logs_webhooks_formularios
  FOR ALL
  USING (
    webhook_id IN (
      SELECT id FROM public.webhooks_formularios WHERE organizacao_id = (
        SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()
      )
    )
  )
  WITH CHECK (
    webhook_id IN (
      SELECT id FROM public.webhooks_formularios WHERE organizacao_id = (
        SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()
      )
    )
  );

-- =====================================================
-- Tabela: eventos_analytics_formularios
-- =====================================================

CREATE TABLE IF NOT EXISTS public.eventos_analytics_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL REFERENCES public.formularios(id) ON DELETE CASCADE,

  visitor_id VARCHAR(64),
  session_id VARCHAR(64),

  tipo_evento VARCHAR(30) NOT NULL,
  -- Valores: 'visualizacao', 'inicio', 'foco_campo', 'saida_campo',
  --          'erro_campo', 'etapa_concluida', 'submissao', 'abandono'

  dados_evento JSONB DEFAULT '{}',

  tempo_no_formulario_segundos INTEGER,
  tempo_no_campo_segundos INTEGER,

  url_pagina TEXT,
  referrer TEXT,
  tipo_dispositivo VARCHAR(20),
  navegador VARCHAR(50),

  variante_ab_id UUID REFERENCES public.variantes_ab_formularios(id),

  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eventos_analytics_formulario ON public.eventos_analytics_formularios(formulario_id);
CREATE INDEX IF NOT EXISTS idx_eventos_analytics_tipo ON public.eventos_analytics_formularios(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_eventos_analytics_data ON public.eventos_analytics_formularios(criado_em);

ALTER TABLE public.eventos_analytics_formularios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eventos_analytics_tenant_isolation"
  ON public.eventos_analytics_formularios
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
