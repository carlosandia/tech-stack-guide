-- Adicionar colunas de layout na tabela config_newsletter_formularios
ALTER TABLE public.config_newsletter_formularios
  ADD COLUMN IF NOT EXISTS newsletter_layout text NOT NULL DEFAULT 'simples',
  ADD COLUMN IF NOT EXISTS newsletter_imagem_url text,
  ADD COLUMN IF NOT EXISTS newsletter_imagem_link text;