
-- Correcao: policies legadas restantes em integracoes (nomes com sufixo _integracoes)
DROP POLICY IF EXISTS "tenant_isolation_integracoes" ON integracoes;
DROP POLICY IF EXISTS "tenant_insert_integracoes" ON integracoes;
DROP POLICY IF EXISTS "tenant_update_integracoes" ON integracoes;
DROP POLICY IF EXISTS "tenant_delete_integracoes" ON integracoes;
