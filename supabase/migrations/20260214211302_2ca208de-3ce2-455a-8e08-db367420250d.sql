-- Limpar labels associadas a conversas soft-deleted (dados órfãos)
DELETE FROM conversas_labels
WHERE conversa_id IN (
  SELECT id FROM conversas WHERE deletado_em IS NOT NULL
);