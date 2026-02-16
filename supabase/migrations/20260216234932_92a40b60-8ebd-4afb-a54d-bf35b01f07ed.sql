-- Remover o indice global que causa conflito entre organizacoes
DROP INDEX IF EXISTS idx_mensagens_message_id_unique;

-- Resetar contadores das conversas afetadas para refletir a realidade
UPDATE conversas
SET total_mensagens = 0, mensagens_nao_lidas = 0
WHERE id IN (
  'eaa5f71d-ba2f-465d-bb4d-540cb28bf792',
  '7576ec19-9ea7-47ed-95a2-e9df5dc6bbcc',
  '4f191c3e-9f29-47e5-817f-d647ef231c83'
);