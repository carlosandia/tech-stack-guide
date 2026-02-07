-- Adicionar colunas de recorrência (MRR) na tabela oportunidades
ALTER TABLE oportunidades
  ADD COLUMN IF NOT EXISTS recorrente boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS periodo_recorrencia varchar(20) DEFAULT NULL;

-- Comentários descritivos
COMMENT ON COLUMN oportunidades.recorrente IS 'Indica se o valor da oportunidade é recorrente (MRR)';
COMMENT ON COLUMN oportunidades.periodo_recorrencia IS 'Período da recorrência: mensal, trimestral, semestral, anual';