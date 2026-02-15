
-- Limpar dados fantasma do status@broadcast
DELETE FROM mensagens WHERE conversa_id = 'bfb21f17-e8f8-42d5-8205-a7201b25de95';
DELETE FROM conversas WHERE id = 'bfb21f17-e8f8-42d5-8205-a7201b25de95';
DELETE FROM contatos WHERE telefone = 'status@broadcast' AND nome = 'status@broadcast';
