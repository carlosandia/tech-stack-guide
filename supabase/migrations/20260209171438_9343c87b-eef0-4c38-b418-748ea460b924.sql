
-- =====================================================
-- PRD-17 ETAPA 1: Modulo de Formularios - Tabelas Core
-- =====================================================

-- 1. FORMULARIOS - Tabela principal
CREATE TABLE public.formularios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes_saas(id) ON DELETE CASCADE,
  
  -- Identificacao
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  slug VARCHAR(255) NOT NULL,
  
  -- Tipo e configuracao
  tipo VARCHAR(50) NOT NULL DEFAULT 'padrao',
  -- tipos: padrao, popup_saida, newsletter, multi_etapas
  
  -- Vinculo com pipeline
  funil_id UUID REFERENCES public.funis(id) ON DELETE SET NULL,
  etapa_id UUID REFERENCES public.etapas_funil(id) ON DELETE SET NULL,
  
  -- Status e publicacao
  status VARCHAR(50) NOT NULL DEFAULT 'rascunho',
  -- status: rascunho, publicado, arquivado
  publicado_em TIMESTAMPTZ,
  despublicado_em TIMESTAMPTZ,
  
  -- Configuracoes
  titulo_pagina VARCHAR(255),
  mensagem_sucesso TEXT DEFAULT 'Obrigado! Sua resposta foi enviada com sucesso.',
  url_redirecionamento TEXT,
  redirecionar_apos_envio BOOLEAN NOT NULL DEFAULT false,
  
  -- Anti-spam
  captcha_ativo BOOLEAN NOT NULL DEFAULT false,
  captcha_tipo VARCHAR(50) DEFAULT 'recaptcha_v2',
  -- tipos: recaptcha_v2, recaptcha_v3, hcaptcha
  captcha_site_key VARCHAR(255),
  honeypot_ativo BOOLEAN NOT NULL DEFAULT true,
  
  -- Rate limit
  rate_limit_ativo BOOLEAN NOT NULL DEFAULT true,
  rate_limit_max INTEGER NOT NULL DEFAULT 10,
  rate_limit_janela_minutos INTEGER NOT NULL DEFAULT 1,
  
  -- Notificacao
  notificar_email BOOLEAN NOT NULL DEFAULT false,
  emails_notificacao TEXT[], -- array de emails
  
  -- SEO / Compartilhamento
  meta_titulo VARCHAR(255),
  meta_descricao TEXT,
  og_image_url TEXT,
  
  -- Metricas (cache)
  total_visualizacoes INTEGER NOT NULL DEFAULT 0,
  total_submissoes INTEGER NOT NULL DEFAULT 0,
  taxa_conversao DECIMAL(5,2) NOT NULL DEFAULT 0,
  
  -- Audit
  criado_por UUID REFERENCES public.usuarios(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  deletado_em TIMESTAMPTZ,
  
  -- Slug unico por organizacao
  CONSTRAINT formularios_slug_org_unique UNIQUE (organizacao_id, slug)
);

-- Indices
CREATE INDEX idx_formularios_org ON public.formularios(organizacao_id);
CREATE INDEX idx_formularios_slug ON public.formularios(slug);
CREATE INDEX idx_formularios_status ON public.formularios(status);
CREATE INDEX idx_formularios_tipo ON public.formularios(tipo);
CREATE INDEX idx_formularios_funil ON public.formularios(funil_id);

-- RLS
ALTER TABLE public.formularios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation - select" ON public.formularios
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id() OR is_super_admin_v2()
  );

CREATE POLICY "Tenant isolation - insert" ON public.formularios
  FOR INSERT WITH CHECK (
    organizacao_id = get_user_tenant_id() OR is_super_admin_v2()
  );

CREATE POLICY "Tenant isolation - update" ON public.formularios
  FOR UPDATE USING (
    organizacao_id = get_user_tenant_id() OR is_super_admin_v2()
  );

CREATE POLICY "Tenant isolation - delete" ON public.formularios
  FOR DELETE USING (
    organizacao_id = get_user_tenant_id() OR is_super_admin_v2()
  );

-- Trigger atualizado_em
CREATE TRIGGER set_formularios_atualizado_em
  BEFORE UPDATE ON public.formularios
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_atualizado_em();


-- 2. CAMPOS_FORMULARIOS - Campos do formulario
CREATE TABLE public.campos_formularios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  formulario_id UUID NOT NULL REFERENCES public.formularios(id) ON DELETE CASCADE,
  
  -- Identificacao
  nome VARCHAR(255) NOT NULL,
  label VARCHAR(255) NOT NULL,
  placeholder VARCHAR(255),
  texto_ajuda TEXT,
  
  -- Tipo
  tipo VARCHAR(50) NOT NULL DEFAULT 'texto',
  -- tipos: texto, email, telefone, numero, textarea, select, multi_select,
  --        checkbox, radio, data, arquivo, oculto, cpf, cnpj, cep, url
  
  -- Validacao
  obrigatorio BOOLEAN NOT NULL DEFAULT false,
  validacoes JSONB DEFAULT '{}',
  -- ex: { "min_length": 2, "max_length": 255, "pattern": "regex", "min": 0, "max": 100 }
  
  -- Opcoes (para select, radio, checkbox, multi_select)
  opcoes JSONB DEFAULT '[]',
  -- ex: [{ "label": "Opcao 1", "valor": "opcao_1" }]
  
  -- Mapeamento para contato/oportunidade
  mapeamento_campo VARCHAR(100),
  -- ex: "contato.nome", "contato.email", "contato.telefone", "oportunidade.valor"
  
  -- Layout
  largura VARCHAR(20) NOT NULL DEFAULT 'full',
  -- largura: full, half, third
  
  -- Ordem
  ordem INTEGER NOT NULL DEFAULT 0,
  
  -- Condicional (campo visivel apenas se condicao for verdadeira)
  condicional_ativo BOOLEAN NOT NULL DEFAULT false,
  condicional_campo_id UUID REFERENCES public.campos_formularios(id) ON DELETE SET NULL,
  condicional_operador VARCHAR(20),
  -- operadores: igual, diferente, contem, nao_contem, maior, menor, vazio, nao_vazio
  condicional_valor TEXT,
  
  -- Etapa (para formularios multi-etapas)
  etapa_numero INTEGER DEFAULT 1,
  
  -- Audit
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX idx_campos_formularios_form ON public.campos_formularios(formulario_id);
CREATE INDEX idx_campos_formularios_ordem ON public.campos_formularios(formulario_id, ordem);

-- SEM RLS (tabela filha sem organizacao_id - isolamento via service layer)

-- Trigger atualizado_em
CREATE TRIGGER set_campos_formularios_atualizado_em
  BEFORE UPDATE ON public.campos_formularios
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_atualizado_em();


-- 3. ESTILOS_FORMULARIOS - Estilos visuais do formulario
CREATE TABLE public.estilos_formularios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  formulario_id UUID NOT NULL REFERENCES public.formularios(id) ON DELETE CASCADE,
  
  -- Estilos por secao (JSONB flexivel)
  container JSONB NOT NULL DEFAULT '{
    "background_color": "#FFFFFF",
    "border_radius": "8px",
    "padding": "24px",
    "max_width": "600px",
    "sombra": "md",
    "font_family": "Inter"
  }',
  
  cabecalho JSONB NOT NULL DEFAULT '{
    "logo_url": null,
    "logo_posicao": "centro",
    "titulo_cor": "#1F2937",
    "titulo_tamanho": "24px",
    "descricao_cor": "#6B7280",
    "descricao_tamanho": "14px"
  }',
  
  campos JSONB NOT NULL DEFAULT '{
    "label_cor": "#374151",
    "label_tamanho": "14px",
    "input_background": "#F9FAFB",
    "input_border_color": "#D1D5DB",
    "input_border_radius": "6px",
    "input_texto_cor": "#1F2937",
    "input_placeholder_cor": "#9CA3AF",
    "erro_cor": "#EF4444"
  }',
  
  botao JSONB NOT NULL DEFAULT '{
    "texto": "Enviar",
    "background_color": "#3B82F6",
    "texto_cor": "#FFFFFF",
    "border_radius": "6px",
    "largura": "full",
    "tamanho": "md",
    "hover_background": "#2563EB"
  }',
  
  pagina JSONB NOT NULL DEFAULT '{
    "background_color": "#F3F4F6",
    "background_image_url": null,
    "background_overlay": false,
    "background_overlay_cor": "rgba(0,0,0,0.5)"
  }',
  
  -- CSS customizado (avancado)
  css_customizado TEXT,
  
  -- Audit
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Um estilo por formulario
  CONSTRAINT estilos_formularios_form_unique UNIQUE (formulario_id)
);

-- Indices
CREATE INDEX idx_estilos_formularios_form ON public.estilos_formularios(formulario_id);

-- SEM RLS (tabela filha sem organizacao_id)

-- Trigger atualizado_em
CREATE TRIGGER set_estilos_formularios_atualizado_em
  BEFORE UPDATE ON public.estilos_formularios
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_atualizado_em();


-- 4. SUBMISSOES_FORMULARIOS - Submissoes recebidas
CREATE TABLE public.submissoes_formularios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  formulario_id UUID NOT NULL REFERENCES public.formularios(id) ON DELETE CASCADE,
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes_saas(id) ON DELETE CASCADE,
  
  -- Dados da submissao
  dados JSONB NOT NULL DEFAULT '{}',
  -- ex: { "nome": "Joao", "email": "joao@email.com", "telefone": "11999999999" }
  
  -- Rastreamento
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  pagina_origem TEXT,
  
  -- UTM
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_term VARCHAR(255),
  utm_content VARCHAR(255),
  
  -- Geolocalizacao (opcional)
  geo_pais VARCHAR(100),
  geo_estado VARCHAR(100),
  geo_cidade VARCHAR(100),
  
  -- Lead scoring
  lead_score INTEGER DEFAULT 0,
  
  -- Resultado da integracao
  contato_id UUID REFERENCES public.contatos(id) ON DELETE SET NULL,
  oportunidade_id UUID REFERENCES public.oportunidades(id) ON DELETE SET NULL,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'nova',
  -- status: nova, processada, erro, spam
  erro_mensagem TEXT,
  
  -- Anti-spam
  honeypot_preenchido BOOLEAN NOT NULL DEFAULT false,
  captcha_validado BOOLEAN,
  
  -- Audit
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX idx_submissoes_form ON public.submissoes_formularios(formulario_id);
CREATE INDEX idx_submissoes_org ON public.submissoes_formularios(organizacao_id);
CREATE INDEX idx_submissoes_status ON public.submissoes_formularios(status);
CREATE INDEX idx_submissoes_criado ON public.submissoes_formularios(criado_em DESC);
CREATE INDEX idx_submissoes_contato ON public.submissoes_formularios(contato_id);

-- RLS
ALTER TABLE public.submissoes_formularios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation - select" ON public.submissoes_formularios
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id() OR is_super_admin_v2()
  );

CREATE POLICY "Tenant isolation - insert" ON public.submissoes_formularios
  FOR INSERT WITH CHECK (true);
  -- Insert publico (submissao vem de formularios publicos)

CREATE POLICY "Tenant isolation - update" ON public.submissoes_formularios
  FOR UPDATE USING (
    organizacao_id = get_user_tenant_id() OR is_super_admin_v2()
  );

CREATE POLICY "Tenant isolation - delete" ON public.submissoes_formularios
  FOR DELETE USING (
    organizacao_id = get_user_tenant_id() OR is_super_admin_v2()
  );


-- 5. RATE_LIMITS_FORMULARIOS - Controle de rate limit por IP
CREATE TABLE public.rate_limits_formularios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  formulario_id UUID NOT NULL REFERENCES public.formularios(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  tentativas INTEGER NOT NULL DEFAULT 1,
  primeira_tentativa TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultima_tentativa TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unico por formulario + IP
  CONSTRAINT rate_limits_form_ip_unique UNIQUE (formulario_id, ip_address)
);

-- Indice
CREATE INDEX idx_rate_limits_form ON public.rate_limits_formularios(formulario_id);
CREATE INDEX idx_rate_limits_ultima ON public.rate_limits_formularios(ultima_tentativa);

-- SEM RLS (tabela interna de controle)


-- 6. LINKS_COMPARTILHAMENTO_FORMULARIOS - Links de compartilhamento
CREATE TABLE public.links_compartilhamento_formularios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  formulario_id UUID NOT NULL REFERENCES public.formularios(id) ON DELETE CASCADE,
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes_saas(id) ON DELETE CASCADE,
  
  -- Tipo do link
  tipo VARCHAR(50) NOT NULL DEFAULT 'link',
  -- tipos: link, embed, qrcode
  
  -- Configuracao
  url_completa TEXT NOT NULL,
  codigo_embed TEXT,
  qrcode_data TEXT, -- base64 ou URL da imagem do QR Code
  
  -- UTM padrao do link
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  
  -- Status
  ativo BOOLEAN NOT NULL DEFAULT true,
  
  -- Metricas
  total_cliques INTEGER NOT NULL DEFAULT 0,
  
  -- Audit
  criado_por UUID REFERENCES public.usuarios(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX idx_links_compartilhamento_form ON public.links_compartilhamento_formularios(formulario_id);
CREATE INDEX idx_links_compartilhamento_org ON public.links_compartilhamento_formularios(organizacao_id);

-- RLS
ALTER TABLE public.links_compartilhamento_formularios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation - select" ON public.links_compartilhamento_formularios
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id() OR is_super_admin_v2()
  );

CREATE POLICY "Tenant isolation - insert" ON public.links_compartilhamento_formularios
  FOR INSERT WITH CHECK (
    organizacao_id = get_user_tenant_id() OR is_super_admin_v2()
  );

CREATE POLICY "Tenant isolation - update" ON public.links_compartilhamento_formularios
  FOR UPDATE USING (
    organizacao_id = get_user_tenant_id() OR is_super_admin_v2()
  );

CREATE POLICY "Tenant isolation - delete" ON public.links_compartilhamento_formularios
  FOR DELETE USING (
    organizacao_id = get_user_tenant_id() OR is_super_admin_v2()
  );

-- Trigger atualizado_em
CREATE TRIGGER set_links_compartilhamento_atualizado_em
  BEFORE UPDATE ON public.links_compartilhamento_formularios
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_atualizado_em();


-- =====================================================
-- FUNCAO: Limpar rate limits expirados (cleanup)
-- =====================================================
CREATE OR REPLACE FUNCTION public.limpar_rate_limits_formularios()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.rate_limits_formularios
  WHERE ultima_tentativa < NOW() - INTERVAL '1 hour';
END;
$function$;
