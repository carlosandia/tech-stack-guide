-- Add pinned flag to mensagens table
ALTER TABLE public.mensagens ADD COLUMN IF NOT EXISTS fixada boolean NOT NULL DEFAULT false;

-- Index for quick lookup of pinned messages per conversation
CREATE INDEX IF NOT EXISTS idx_mensagens_fixada ON public.mensagens (conversa_id) WHERE fixada = true;