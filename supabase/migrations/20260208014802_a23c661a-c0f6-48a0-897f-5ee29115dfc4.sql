-- Adicionar coluna modo_valor na tabela oportunidades
-- Controla se o valor é manual ou calculado pelos produtos vinculados
ALTER TABLE oportunidades 
ADD COLUMN IF NOT EXISTS modo_valor varchar DEFAULT 'manual' 
CHECK (modo_valor IN ('manual', 'produtos'));