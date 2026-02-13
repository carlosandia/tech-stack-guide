
-- Correção 1: Adicionar 'pre_lead' à constraint contatos_status_check
ALTER TABLE contatos DROP CONSTRAINT IF EXISTS contatos_status_check;
ALTER TABLE contatos ADD CONSTRAINT contatos_status_check 
  CHECK (status IN ('novo', 'lead', 'mql', 'sql', 'cliente', 'perdido', 'pre_lead'));
