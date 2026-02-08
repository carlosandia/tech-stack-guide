
-- Atualizar check constraint para aceitar 'texto_audio'
ALTER TABLE anotacoes_oportunidades DROP CONSTRAINT IF EXISTS anotacoes_tipo_check;
ALTER TABLE anotacoes_oportunidades ADD CONSTRAINT anotacoes_tipo_check 
  CHECK (tipo IN ('texto', 'audio', 'texto_audio'));
