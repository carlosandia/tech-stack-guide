-- Corrigir RLS policy que usa usuarios.id ao invés de usuarios.auth_id
DROP POLICY IF EXISTS eventos_analytics_tenant_isolation ON eventos_analytics_formularios;

-- Recriar com a coluna correta (auth_id)
CREATE POLICY eventos_analytics_tenant_isolation ON eventos_analytics_formularios
FOR ALL USING (
  formulario_id IN (
    SELECT f.id FROM formularios f
    WHERE f.organizacao_id = (
      SELECT u.organizacao_id FROM usuarios u WHERE u.auth_id = auth.uid()
    )
  )
) WITH CHECK (
  formulario_id IN (
    SELECT f.id FROM formularios f
    WHERE f.organizacao_id = (
      SELECT u.organizacao_id FROM usuarios u WHERE u.auth_id = auth.uid()
    )
  )
);

-- Garantir que anon pode inserir eventos (formulário público)
DROP POLICY IF EXISTS eventos_analytics_anon_insert ON eventos_analytics_formularios;
CREATE POLICY eventos_analytics_anon_insert ON eventos_analytics_formularios
FOR INSERT TO anon
WITH CHECK (true);