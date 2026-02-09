
-- Adicionar config_botoes e config_pos_envio na tabela formularios
ALTER TABLE public.formularios 
ADD COLUMN IF NOT EXISTS config_botoes jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS config_pos_envio jsonb DEFAULT '{}';

-- Comentários para documentação
COMMENT ON COLUMN public.formularios.config_botoes IS 'Configuração dos botões de envio (tipo, WhatsApp, oportunidade, notificação email)';
COMMENT ON COLUMN public.formularios.config_pos_envio IS 'Configuração pós-envio (mensagens sucesso/erro, redirecionamento)';
