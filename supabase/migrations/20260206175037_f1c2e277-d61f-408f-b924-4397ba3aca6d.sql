-- Adicionar 'webhook' como origem válida para contatos
ALTER TABLE public.contatos DROP CONSTRAINT contatos_origem_check;
ALTER TABLE public.contatos ADD CONSTRAINT contatos_origem_check CHECK (
  origem IN ('manual', 'importacao', 'formulario', 'whatsapp', 'instagram', 'meta_ads', 'indicacao', 'webhook', 'outro')
);