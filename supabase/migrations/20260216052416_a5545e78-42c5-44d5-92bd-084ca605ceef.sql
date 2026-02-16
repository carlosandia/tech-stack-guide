
-- =====================================================
-- LIMPEZA: Mesclar conversas duplicadas de Carlos Andia
-- Manter: 2dfd0edc-ffb5-424d-aeed-ef8bea3629b4 (89 msgs, chat_id correto @c.us)
-- Mover mensagens das duplicatas para a principal
-- =====================================================

-- 1. Mover mensagens da conversa @lid para a principal
UPDATE mensagens
SET conversa_id = '2dfd0edc-ffb5-424d-aeed-ef8bea3629b4'
WHERE conversa_id = 'ed08878f-4181-4cfc-a0c8-bebedfba3668'
AND id NOT IN (
  SELECT id FROM mensagens WHERE conversa_id = '2dfd0edc-ffb5-424d-aeed-ef8bea3629b4'
);

-- 2. Mover mensagens da conversa duplicada @c.us (5 msgs)
UPDATE mensagens
SET conversa_id = '2dfd0edc-ffb5-424d-aeed-ef8bea3629b4'
WHERE conversa_id = 'e8e9ed21-af91-4763-b6ce-e5526c4a363e'
AND id NOT IN (
  SELECT id FROM mensagens WHERE conversa_id = '2dfd0edc-ffb5-424d-aeed-ef8bea3629b4'
);

-- 3. Mover mensagens da conversa duplicada @c.us (1 msg)
UPDATE mensagens
SET conversa_id = '2dfd0edc-ffb5-424d-aeed-ef8bea3629b4'
WHERE conversa_id = 'bad00c8f-bc03-478d-beab-72755b981b5c'
AND id NOT IN (
  SELECT id FROM mensagens WHERE conversa_id = '2dfd0edc-ffb5-424d-aeed-ef8bea3629b4'
);

-- 4. Soft-delete as conversas duplicadas
UPDATE conversas
SET deletado_em = now()
WHERE id IN (
  'ed08878f-4181-4cfc-a0c8-bebedfba3668',
  'e8e9ed21-af91-4763-b6ce-e5526c4a363e',
  'bad00c8f-bc03-478d-beab-72755b981b5c'
);

-- 5. Soft-delete contatos duplicados (manter 3883977c que está vinculado à conversa principal)
UPDATE contatos
SET deletado_em = now()
WHERE id IN (
  '7ba69cff-f79a-4935-b3bd-1453bf0df77f',
  '536b462f-a2d4-40b1-a5d3-4cca0eefa94b',
  'eb96aa38-c2f4-428b-9385-65c20119734a'
);

-- 6. Atualizar contadores da conversa principal
UPDATE conversas
SET total_mensagens = (SELECT count(*) FROM mensagens WHERE conversa_id = '2dfd0edc-ffb5-424d-aeed-ef8bea3629b4'),
    ultima_mensagem_em = (SELECT max(criado_em) FROM mensagens WHERE conversa_id = '2dfd0edc-ffb5-424d-aeed-ef8bea3629b4')
WHERE id = '2dfd0edc-ffb5-424d-aeed-ef8bea3629b4';

-- 7. Buscar e verificar outras duplicatas potenciais no sistema (conversas individuais com mesmo telefone)
-- (informativo, não altera dados)
