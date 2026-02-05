
-- Inserir planos conforme PRD-14
INSERT INTO public.planos (id, nome, descricao, preco_mensal, preco_anual, moeda, limite_usuarios, limite_oportunidades, limite_storage_mb, limite_contatos, ativo, visivel, ordem, popular)
VALUES
  -- Trial: gratuito, padrao do sistema
  ('00000000-0000-0000-0000-000000000001', 'Trial', 'Período de teste gratuito com recursos básicos', 0, 0, 'BRL', 2, 50, 100, 100, true, false, 0, false),
  -- Starter: R$99/mês
  ('00000000-0000-0000-0000-000000000002', 'Starter', 'Ideal para pequenas equipes começando a organizar suas vendas', 99.00, 948.00, 'BRL', 5, 500, 1024, 1000, true, true, 1, false),
  -- Pro: R$249/mês (popular)
  ('00000000-0000-0000-0000-000000000003', 'Pro', 'Para equipes em crescimento que precisam de recursos avançados', 249.00, 2388.00, 'BRL', 15, 2000, 5120, 5000, true, true, 2, true),
  -- Enterprise: R$599/mês
  ('00000000-0000-0000-0000-000000000004', 'Enterprise', 'Solução completa para grandes operações comerciais', 599.00, 5748.00, 'BRL', 50, NULL, 20480, NULL, true, true, 3, false)
ON CONFLICT (id) DO NOTHING;

-- Vincular módulos aos planos conforme PRD-14
-- Trial: Negocios, Contatos, Atividades (básicos obrigatórios)
INSERT INTO public.planos_modulos (plano_id, modulo_id, configuracoes)
SELECT '00000000-0000-0000-0000-000000000001', id, '{}'::jsonb
FROM public.modulos WHERE slug IN ('negocios', 'contatos', 'atividades')
ON CONFLICT DO NOTHING;

-- Starter: Negocios, Contatos, Conversas, Conexoes, Atividades, Dashboard (basico)
INSERT INTO public.planos_modulos (plano_id, modulo_id, configuracoes)
SELECT '00000000-0000-0000-0000-000000000002', id, 
  CASE WHEN slug = 'dashboard' THEN '{"nivel": "basico"}'::jsonb ELSE '{}'::jsonb END
FROM public.modulos WHERE slug IN ('negocios', 'contatos', 'conversas', 'conexoes', 'atividades', 'dashboard')
ON CONFLICT DO NOTHING;

-- Pro: Todos os módulos
INSERT INTO public.planos_modulos (plano_id, modulo_id, configuracoes)
SELECT '00000000-0000-0000-0000-000000000003', id,
  CASE WHEN slug = 'dashboard' THEN '{"nivel": "completo"}'::jsonb ELSE '{}'::jsonb END
FROM public.modulos
ON CONFLICT DO NOTHING;

-- Enterprise: Todos os módulos + suporte prioritário
INSERT INTO public.planos_modulos (plano_id, modulo_id, configuracoes)
SELECT '00000000-0000-0000-0000-000000000004', id,
  CASE WHEN slug = 'dashboard' THEN '{"nivel": "completo"}'::jsonb ELSE '{}'::jsonb END
FROM public.modulos
ON CONFLICT DO NOTHING;
