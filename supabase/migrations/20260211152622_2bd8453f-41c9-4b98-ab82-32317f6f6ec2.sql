
ALTER TABLE oportunidades
  ADD COLUMN IF NOT EXISTS posicao integer NOT NULL DEFAULT 0;

-- Indice para performance na ordenacao dentro de cada etapa
CREATE INDEX IF NOT EXISTS idx_oportunidades_etapa_posicao
  ON oportunidades (etapa_id, posicao ASC)
  WHERE deletado_em IS NULL;

-- Inicializar posicoes existentes baseado em criado_em (mais antigo = menor posicao)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY etapa_id ORDER BY criado_em ASC) as rn
  FROM oportunidades
  WHERE deletado_em IS NULL
)
UPDATE oportunidades SET posicao = ranked.rn
FROM ranked WHERE oportunidades.id = ranked.id;
