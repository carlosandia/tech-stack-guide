-- AIDEV-NOTE: Adicionar coluna hash_arquivo para deduplicação por SHA-256
ALTER TABLE documentos_oportunidades
ADD COLUMN IF NOT EXISTS hash_arquivo TEXT;

-- Índice composto para busca rápida por hash dentro da organização
CREATE INDEX IF NOT EXISTS idx_docs_hash_org
ON documentos_oportunidades (organizacao_id, hash_arquivo)
WHERE deletado_em IS NULL AND hash_arquivo IS NOT NULL;