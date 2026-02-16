-- Soft-delete conversas duplicadas (mantendo a mais recente por chat_id)
UPDATE conversas SET deletado_em = now()
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY chat_id ORDER BY criado_em DESC) as rn
    FROM conversas WHERE deletado_em IS NULL
  ) sub WHERE rn > 1
);