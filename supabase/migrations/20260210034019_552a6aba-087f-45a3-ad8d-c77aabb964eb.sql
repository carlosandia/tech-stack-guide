
-- 1. Larguras fracionarias nos campos (ja existe coluna 'largura', apenas garantir que aceita novos valores)
-- Nenhuma alteracao necessaria - largura ja e text

-- 2. LGPD global para todos os formularios
ALTER TABLE public.formularios
  ADD COLUMN IF NOT EXISTS lgpd_ativo boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS lgpd_texto_consentimento text,
  ADD COLUMN IF NOT EXISTS lgpd_url_politica text,
  ADD COLUMN IF NOT EXISTS lgpd_checkbox_obrigatorio boolean DEFAULT true;

-- 3. Email de boas-vindas na newsletter
ALTER TABLE public.config_newsletter_formularios
  ADD COLUMN IF NOT EXISTS email_boas_vindas_ativo boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS assunto_boas_vindas text DEFAULT 'Bem-vindo!',
  ADD COLUMN IF NOT EXISTS template_boas_vindas text;

-- 4. Popup: acoes avancadas de marketing
ALTER TABLE public.config_popup_formularios
  ADD COLUMN IF NOT EXISTS frequencia_exibicao text DEFAULT 'uma_vez',
  ADD COLUMN IF NOT EXISTS max_exibicoes integer DEFAULT null,
  ADD COLUMN IF NOT EXISTS paginas_alvo text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS paginas_excluidas text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS utm_filtro jsonb DEFAULT null,
  ADD COLUMN IF NOT EXISTS mostrar_botao_fechar boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS delay_botao_fechar integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ativo_a_partir_de timestamptz DEFAULT null,
  ADD COLUMN IF NOT EXISTS ativo_ate timestamptz DEFAULT null;
