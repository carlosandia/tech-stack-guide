
-- =====================================================
-- Limpeza: Merge conversas duplicadas Francisco Carlos (Renove Digital)
-- Conversa @lid: e05ee1eb-9ff6-41b6-bf90-f9185639e6b7 (contato: dc124f20)
-- Conversa @c.us: e3b8100e-23b9-4e34-8dd4-19e879921e06 (contato: 74eab1a0)
-- =====================================================

-- 1. Mover mensagens da conversa @lid para a conversa @c.us
UPDATE mensagens 
SET conversa_id = 'e3b8100e-23b9-4e34-8dd4-19e879921e06',
    atualizado_em = now()
WHERE conversa_id = 'e05ee1eb-9ff6-41b6-bf90-f9185639e6b7';

-- 2. Atualizar contato da conversa @c.us para o contato correto (Francisco Carlos)
UPDATE conversas 
SET contato_id = 'dc124f20-b0a3-493c-a7ee-8b7805501eaa',
    chat_id = '553599562143@c.us',
    nome = 'Francisco Carlos',
    atualizado_em = now()
WHERE id = 'e3b8100e-23b9-4e34-8dd4-19e879921e06';

-- 3. Atualizar total_mensagens da conversa final
UPDATE conversas 
SET total_mensagens = 5,
    atualizado_em = now()
WHERE id = 'e3b8100e-23b9-4e34-8dd4-19e879921e06';

-- 4. Soft-delete da conversa @lid duplicada
UPDATE conversas 
SET deletado_em = now(),
    atualizado_em = now()
WHERE id = 'e05ee1eb-9ff6-41b6-bf90-f9185639e6b7';

-- 5. Atualizar telefone do contato correto (Francisco Carlos) para o número real
UPDATE contatos 
SET telefone = '553599562143',
    atualizado_em = now()
WHERE id = 'dc124f20-b0a3-493c-a7ee-8b7805501eaa';

-- 6. Soft-delete do contato duplicado (criado com número @c.us sem nome)
UPDATE contatos 
SET deletado_em = now(),
    atualizado_em = now()
WHERE id = '74eab1a0-e432-4324-96b4-29819bb5999b';

-- 7. Mover labels associadas à conversa @lid para a @c.us (se existirem)
UPDATE conversas_labels
SET conversa_id = 'e3b8100e-23b9-4e34-8dd4-19e879921e06'
WHERE conversa_id = 'e05ee1eb-9ff6-41b6-bf90-f9185639e6b7'
  AND label_id NOT IN (
    SELECT label_id FROM conversas_labels WHERE conversa_id = 'e3b8100e-23b9-4e34-8dd4-19e879921e06'
  );

-- 8. Soft-delete labels órfãs da conversa deletada
DELETE FROM conversas_labels
WHERE conversa_id = 'e05ee1eb-9ff6-41b6-bf90-f9185639e6b7';
