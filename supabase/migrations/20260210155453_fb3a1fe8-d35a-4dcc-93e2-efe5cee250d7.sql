
-- AIDEV-NOTE: Adicionar coluna multi_step_config para configurações globais de formulários multi-step
ALTER TABLE public.formularios
  ADD COLUMN IF NOT EXISTS multi_step_config jsonb DEFAULT '{}';

-- Comentário na coluna
COMMENT ON COLUMN public.formularios.multi_step_config IS 'Configurações globais do multi-step: tipo_progresso, permitir_voltar, permitir_pular, salvar_rascunho, validar_por_etapa, texto_botao_final';
