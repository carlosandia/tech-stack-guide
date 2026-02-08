
-- =====================================================
-- PRD-11: Caixa de Entrada de Email
-- Registro do modulo e vinculacao com planos
-- (As tabelas ja foram criadas na migration anterior)
-- =====================================================

-- Registro do modulo com requer como text[]
INSERT INTO public.modulos (slug, nome, descricao, icone, obrigatorio, ordem, requer)
VALUES (
  'caixa-entrada-email',
  'Caixa de Entrada',
  'Receber, ler e responder emails via IMAP/Gmail API',
  'Mail',
  false,
  9,
  ARRAY['conexoes']
);

-- Vincular aos planos Pro e Enterprise
INSERT INTO public.planos_modulos (plano_id, modulo_id)
SELECT 
  p.id,
  m.id
FROM public.planos p
CROSS JOIN public.modulos m
WHERE p.nome IN ('Pro', 'Enterprise')
  AND m.slug = 'caixa-entrada-email';
