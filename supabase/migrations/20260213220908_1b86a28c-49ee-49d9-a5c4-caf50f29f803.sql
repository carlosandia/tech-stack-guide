-- Corrigir RLS: policy ALL deve aplicar apenas a authenticated, não a anon
-- Isso permite que as policies INSERT para anon funcionem corretamente

DROP POLICY IF EXISTS "eventos_analytics_tenant_isolation" ON public.eventos_analytics_formularios;

CREATE POLICY "eventos_analytics_tenant_isolation" 
  ON public.eventos_analytics_formularios
  FOR ALL
  TO authenticated
  USING (
    formulario_id IN (
      SELECT f.id FROM formularios f 
      WHERE f.organizacao_id = (
        SELECT u.organizacao_id FROM usuarios u WHERE u.auth_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    formulario_id IN (
      SELECT f.id FROM formularios f 
      WHERE f.organizacao_id = (
        SELECT u.organizacao_id FROM usuarios u WHERE u.auth_id = auth.uid()
      )
    )
  );