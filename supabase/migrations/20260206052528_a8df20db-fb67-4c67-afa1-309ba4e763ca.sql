-- Adicionar coluna acoes_rapidas na tabela configuracoes_card
-- Para armazenar quais ações rápidas aparecem no footer do card Kanban
ALTER TABLE public.configuracoes_card
ADD COLUMN acoes_rapidas jsonb DEFAULT '["telefone","whatsapp","email","agendar"]'::jsonb;

COMMENT ON COLUMN public.configuracoes_card.acoes_rapidas IS 'Ações rápidas exibidas no footer do card Kanban (telefone, whatsapp, email, agendar)';