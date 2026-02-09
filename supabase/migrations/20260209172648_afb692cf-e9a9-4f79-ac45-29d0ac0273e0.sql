
-- =====================================================
-- ETAPA 2: Tipos Especificos de Formularios
-- Tabelas: config_popup_formularios, config_newsletter_formularios, etapas_formularios
-- + Colunas adicionais em formularios (WhatsApp, tracking, limites)
-- =====================================================

-- 1. Adicionar colunas faltantes na tabela formularios
ALTER TABLE public.formularios
  ADD COLUMN IF NOT EXISTS tipo_botao_envio VARCHAR(20) DEFAULT 'padrao',
  ADD COLUMN IF NOT EXISTS whatsapp_numero VARCHAR(20),
  ADD COLUMN IF NOT EXISTS whatsapp_mensagem_template TEXT,
  ADD COLUMN IF NOT EXISTS max_submissoes INTEGER,
  ADD COLUMN IF NOT EXISTS data_inicio TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS data_fim TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mensagem_fechado TEXT DEFAULT 'Este formulario nao esta mais aceitando respostas.',
  ADD COLUMN IF NOT EXISTS tracking_conversao_ativo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_ads_conversion_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS google_ads_conversion_label VARCHAR(100),
  ADD COLUMN IF NOT EXISTS facebook_pixel_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS facebook_event_name VARCHAR(50) DEFAULT 'Lead',
  ADD COLUMN IF NOT EXISTS progressive_profiling_ativo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS lead_scoring_ativo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pontuacao_base_lead INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ab_testing_ativo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS versao INTEGER DEFAULT 1;

-- 2. Tabela config_popup_formularios
CREATE TABLE IF NOT EXISTS public.config_popup_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL UNIQUE REFERENCES public.formularios(id) ON DELETE CASCADE,

  tipo_gatilho VARCHAR(30) NOT NULL DEFAULT 'intencao_saida',
  atraso_segundos INTEGER DEFAULT 0,
  porcentagem_scroll INTEGER DEFAULT 50,
  seletor_elemento_clique VARCHAR(255),

  mostrar_uma_vez_sessao BOOLEAN DEFAULT true,
  dias_expiracao_cookie INTEGER DEFAULT 30,
  mostrar_mobile BOOLEAN DEFAULT true,

  cor_fundo_overlay VARCHAR(20) DEFAULT 'rgba(0, 0, 0, 0.5)',
  clique_overlay_fecha BOOLEAN DEFAULT true,

  tipo_animacao VARCHAR(20) DEFAULT 'fade',
  duracao_animacao_ms INTEGER DEFAULT 300,

  popup_imagem_url TEXT,
  popup_imagem_posicao VARCHAR(20) DEFAULT 'topo',

  posicao VARCHAR(20) DEFAULT 'centro',

  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now(),

  CHECK (tipo_gatilho IN ('intencao_saida', 'atraso_tempo', 'porcentagem_scroll', 'clique')),
  CHECK (tipo_animacao IN ('fade', 'slide_cima', 'slide_baixo', 'zoom', 'nenhum')),
  CHECK (posicao IN ('centro', 'topo_direita', 'baixo_direita', 'baixo_esquerda', 'topo_esquerda')),
  CHECK (popup_imagem_posicao IN ('topo', 'esquerda', 'direita', 'fundo'))
);

CREATE INDEX IF NOT EXISTS idx_config_popup_formularios ON public.config_popup_formularios(formulario_id);

-- 3. Tabela config_newsletter_formularios
CREATE TABLE IF NOT EXISTS public.config_newsletter_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL UNIQUE REFERENCES public.formularios(id) ON DELETE CASCADE,

  double_optin_ativo BOOLEAN DEFAULT true,
  assunto_email_confirmacao VARCHAR(255) DEFAULT 'Confirme sua inscricao',
  template_email_confirmacao TEXT,

  nome_lista VARCHAR(100),
  tags JSONB DEFAULT '[]',

  frequencia_envio VARCHAR(50),
  descricao_frequencia_envio TEXT,

  texto_consentimento TEXT DEFAULT 'Ao se inscrever, voce concorda em receber nossos emails e aceita nossa Politica de Privacidade.',
  url_politica_privacidade TEXT,
  mostrar_checkbox_consentimento BOOLEAN DEFAULT true,

  provedor_externo VARCHAR(50),
  id_lista_externa VARCHAR(100),
  ref_api_key_externa VARCHAR(100),

  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_config_newsletter_formularios ON public.config_newsletter_formularios(formulario_id);

-- 4. Tabela etapas_formularios
CREATE TABLE IF NOT EXISTS public.etapas_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL REFERENCES public.formularios(id) ON DELETE CASCADE,

  indice_etapa INTEGER NOT NULL,
  titulo_etapa VARCHAR(255) NOT NULL,
  descricao_etapa TEXT,
  icone_etapa VARCHAR(50),

  validar_ao_avancar BOOLEAN DEFAULT true,

  texto_botao_proximo VARCHAR(50) DEFAULT 'Proximo',
  texto_botao_anterior VARCHAR(50) DEFAULT 'Voltar',
  texto_botao_enviar VARCHAR(50) DEFAULT 'Enviar',

  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now(),

  UNIQUE(formulario_id, indice_etapa),
  CHECK (indice_etapa >= 0)
);

CREATE INDEX IF NOT EXISTS idx_etapas_formularios ON public.etapas_formularios(formulario_id, indice_etapa);
