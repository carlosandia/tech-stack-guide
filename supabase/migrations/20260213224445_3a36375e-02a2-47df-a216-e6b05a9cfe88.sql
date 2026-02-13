-- Corrigir RLS policies que usam usuarios.id = auth.uid() incorretamente
-- Deveria ser usuarios.auth_id = auth.uid()

-- 1. regras_condicionais_formularios
DROP POLICY IF EXISTS "regras_condicionais_tenant_isolation" ON regras_condicionais_formularios;
CREATE POLICY "regras_condicionais_tenant_isolation" ON regras_condicionais_formularios
  FOR ALL USING (
    formulario_id IN (
      SELECT f.id FROM formularios f
      WHERE f.organizacao_id = (
        SELECT u.organizacao_id FROM usuarios u WHERE u.auth_id = auth.uid()
      )
    )
  );

-- 2. testes_ab_formularios
DROP POLICY IF EXISTS "testes_ab_tenant_isolation" ON testes_ab_formularios;
CREATE POLICY "testes_ab_tenant_isolation" ON testes_ab_formularios
  FOR ALL USING (
    organizacao_id = (
      SELECT u.organizacao_id FROM usuarios u WHERE u.auth_id = auth.uid()
    )
  );

-- 3. variantes_ab_formularios
DROP POLICY IF EXISTS "variantes_ab_tenant_isolation" ON variantes_ab_formularios;
CREATE POLICY "variantes_ab_tenant_isolation" ON variantes_ab_formularios
  FOR ALL USING (
    teste_ab_id IN (
      SELECT t.id FROM testes_ab_formularios t
      WHERE t.organizacao_id = (
        SELECT u.organizacao_id FROM usuarios u WHERE u.auth_id = auth.uid()
      )
    )
  );
