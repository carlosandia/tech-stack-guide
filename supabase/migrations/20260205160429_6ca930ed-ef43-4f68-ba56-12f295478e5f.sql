-- Adicionar campo popular na tabela de planos
ALTER TABLE planos ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT false;