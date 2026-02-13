-- Corrigir dados da enquete "Eai" que teve votos duplicados
-- Votante identificado nos logs: 5513988506995@c.us selecionou ["Sim","Não"]
UPDATE public.mensagens SET 
  poll_options = '[{"text":"Sim","votes":1},{"text":"Não","votes":1}]'::jsonb,
  raw_data = COALESCE(raw_data, '{}'::jsonb) || '{"poll_voters":{"5513988506995@c.us":["Sim","Não"]}}'::jsonb,
  atualizado_em = now()
WHERE id = '98aa7edc-87d0-454a-b3f3-59762c12a87a';