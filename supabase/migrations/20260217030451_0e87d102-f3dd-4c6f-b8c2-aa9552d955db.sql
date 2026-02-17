
-- AIDEV-NOTE: Corrige duplicatas existentes e previne novas via UNIQUE INDEX parcial
-- Passo 1: Soft-delete o contato mais recente de cada par duplicado (mantém o mais antigo)
WITH duplicatas_ranked AS (
  SELECT id, organizacao_id, telefone,
    ROW_NUMBER() OVER (PARTITION BY organizacao_id, telefone ORDER BY criado_em ASC) AS rn
  FROM contatos
  WHERE deletado_em IS NULL 
    AND telefone IS NOT NULL 
    AND telefone != ''
)
UPDATE contatos
SET deletado_em = now()
WHERE id IN (
  SELECT id FROM duplicatas_ranked WHERE rn > 1
);

-- Passo 2: Criar UNIQUE INDEX parcial para prevenir race conditions futuras
CREATE UNIQUE INDEX IF NOT EXISTS idx_contatos_org_telefone_unique
ON contatos (organizacao_id, telefone)
WHERE deletado_em IS NULL AND telefone IS NOT NULL AND telefone != '';
