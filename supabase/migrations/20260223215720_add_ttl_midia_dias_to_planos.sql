-- RF-008: Adicionar campo de TTL de mídia por plano (lifecycle policy)
-- AIDEV-NOTE: Coluna já existe no banco — migration apenas para rastreabilidade no git
-- IF NOT EXISTS garante idempotência (não quebra se coluna já existir)
ALTER TABLE planos ADD COLUMN IF NOT EXISTS ttl_midia_dias integer NOT NULL DEFAULT 90;
COMMENT ON COLUMN planos.ttl_midia_dias IS 'Dias de retenção de mídia no bucket chat-media. Trial=30, Básico=60, Pro=90, Enterprise=365';
