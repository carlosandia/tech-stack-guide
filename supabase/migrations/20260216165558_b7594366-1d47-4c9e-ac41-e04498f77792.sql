
-- =====================================================
-- Limpeza de conversas e contatos duplicados @lid/@c.us
-- Carlos Andia: @lid (5405f5d1, 29 msgs) + @c.us (561ce627, 2 msgs)
-- Estratégia: soft-delete a @c.us PRIMEIRO, depois atualizar a @lid
-- =====================================================

-- 1. Mover mensagens da conversa @c.us para a conversa @lid
UPDATE mensagens 
SET conversa_id = '5405f5d1-5e54-4d9c-a4e6-7bba6181d0c5',
    atualizado_em = now()
WHERE conversa_id = '561ce627-e215-480e-a9ff-2f9ce6ed0117';

-- 2. Limpar labels da conversa @c.us duplicada
DELETE FROM conversas_labels 
WHERE conversa_id = '561ce627-e215-480e-a9ff-2f9ce6ed0117';

-- 3. Soft-delete a conversa @c.us duplicada PRIMEIRO (libera unique constraint)
UPDATE conversas 
SET deletado_em = now(), atualizado_em = now()
WHERE id = '561ce627-e215-480e-a9ff-2f9ce6ed0117';

-- 4. Atualizar chat_id da conversa @lid para @c.us (formato canônico)
UPDATE conversas 
SET chat_id = '5513988506995@c.us',
    total_mensagens = (SELECT count(*) FROM mensagens WHERE conversa_id = '5405f5d1-5e54-4d9c-a4e6-7bba6181d0c5'),
    atualizado_em = now()
WHERE id = '5405f5d1-5e54-4d9c-a4e6-7bba6181d0c5';

-- 5. Atualizar telefone do contato principal para o número real
UPDATE contatos 
SET telefone = '5513988506995',
    atualizado_em = now()
WHERE id = 'ac944ffe-94b2-4b4f-98ee-c3cd4a51c0dc';

-- 6. Soft-delete o contato duplicado @c.us
UPDATE contatos 
SET deletado_em = now(), atualizado_em = now()
WHERE id = '6c9711b7-97f8-4c73-840d-8f40ad81bf66';
