-- Dropar o partial unique index que o PostgREST não consegue usar com onConflict
DROP INDEX IF EXISTS idx_mensagens_unique;

-- Criar unique index simples (sem WHERE) para que onConflict funcione
CREATE UNIQUE INDEX idx_mensagens_org_message_id ON mensagens (organizacao_id, message_id);