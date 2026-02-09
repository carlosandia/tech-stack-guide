
-- Adicionar campos do Widget WhatsApp à tabela configuracoes_tenant
ALTER TABLE public.configuracoes_tenant
  ADD COLUMN IF NOT EXISTS widget_whatsapp_ativo boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS widget_whatsapp_config jsonb DEFAULT '{}'::jsonb;
