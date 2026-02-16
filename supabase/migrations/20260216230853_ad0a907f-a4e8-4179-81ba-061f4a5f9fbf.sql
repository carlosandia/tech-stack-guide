
-- 1. Backfill: preencher reply_to_message_id a partir do raw_data
UPDATE mensagens
SET reply_to_message_id = raw_data->'replyTo'->>'id'
WHERE reply_to_message_id IS NULL
  AND deletado_em IS NULL
  AND raw_data->'replyTo'->>'id' IS NOT NULL;

-- 2. Remover mensagens duplicadas (manter a mais antiga)
DELETE FROM mensagens
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY message_id ORDER BY criado_em ASC) as rn
    FROM mensagens
    WHERE deletado_em IS NULL
  ) sub
  WHERE rn > 1
);

-- 3. Adicionar constraint UNIQUE parcial para prevenir futuras duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS idx_mensagens_message_id_unique 
ON mensagens (message_id) 
WHERE deletado_em IS NULL;
