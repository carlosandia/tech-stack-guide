
-- Add columns for pinning, muting, and archiving conversations
ALTER TABLE public.conversas ADD COLUMN IF NOT EXISTS fixada boolean NOT NULL DEFAULT false;
ALTER TABLE public.conversas ADD COLUMN IF NOT EXISTS silenciada boolean NOT NULL DEFAULT false;
ALTER TABLE public.conversas ADD COLUMN IF NOT EXISTS arquivada boolean NOT NULL DEFAULT false;

-- Index for sorting pinned conversations first
CREATE INDEX IF NOT EXISTS idx_conversas_fixada ON public.conversas (fixada DESC, ultima_mensagem_em DESC NULLS LAST) WHERE deletado_em IS NULL;
