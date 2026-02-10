-- Corrigir RLS: anon_insert_eventos_analytics - validar que formulário existe e está publicado
DROP POLICY IF EXISTS "anon_insert_eventos_analytics" ON public.eventos_analytics_formularios;
CREATE POLICY "anon_insert_eventos_analytics"
ON public.eventos_analytics_formularios
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM formularios f
    WHERE f.id = eventos_analytics_formularios.formulario_id
      AND f.status = 'publicado'
      AND f.deletado_em IS NULL
  )
);

-- Corrigir RLS: Tenant isolation - insert em submissoes_formularios para authenticated
DROP POLICY IF EXISTS "Tenant isolation - insert" ON public.submissoes_formularios;
CREATE POLICY "Tenant isolation - insert"
ON public.submissoes_formularios
FOR INSERT
TO authenticated
WITH CHECK (
  organizacao_id = get_user_tenant_id() OR is_super_admin_v2()
);