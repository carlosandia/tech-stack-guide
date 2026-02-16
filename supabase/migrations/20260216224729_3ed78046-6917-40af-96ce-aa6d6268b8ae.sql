-- Soft delete mensagens de conversas de canal (@newsletter)
UPDATE mensagens 
SET deletado_em = NOW() 
WHERE conversa_id IN (SELECT id FROM conversas WHERE tipo = 'canal')
AND deletado_em IS NULL;

-- Soft delete conversas de canal
UPDATE conversas 
SET deletado_em = NOW() 
WHERE tipo = 'canal' AND deletado_em IS NULL;