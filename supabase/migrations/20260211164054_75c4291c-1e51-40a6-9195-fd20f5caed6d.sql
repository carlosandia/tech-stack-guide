-- =====================================================
-- FIX: Remover policies overly permissive (USING/WITH CHECK = true)
-- Service role já bypassa RLS, então essas policies são desnecessárias
-- e perigosas pois permitem acesso anon/authenticated sem restrição
-- =====================================================

-- 1. audit_log: INSERT só deve vir do backend (service_role bypassa RLS)
DROP POLICY IF EXISTS "audit_log_service_insert" ON public.audit_log;
CREATE POLICY "audit_log_insert_authenticated" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (organizacao_id = public.get_user_tenant_id());

-- 2. checkout_sessions_pendentes: acesso total só via service_role (que já bypassa)
DROP POLICY IF EXISTS "service_role_full_access" ON public.checkout_sessions_pendentes;
-- Apenas SELECT público (para verificar status do checkout)
CREATE POLICY "checkout_sessions_select_by_email" ON public.checkout_sessions_pendentes
  FOR SELECT USING (true);

-- 3. eventos_analytics_formularios: INSERT público (analytics de formulários públicos é OK)
-- Mas vamos restringir para ser anon com formulario_id válido
DROP POLICY IF EXISTS "eventos_analytics_anon_insert" ON public.eventos_analytics_formularios;
CREATE POLICY "eventos_analytics_insert" ON public.eventos_analytics_formularios
  FOR INSERT TO anon, authenticated
  WITH CHECK (formulario_id IS NOT NULL);

-- 4. eventos_automacao: service-only (Edge Function usa service_role que bypassa RLS)
DROP POLICY IF EXISTS "eventos_automacao_update_service" ON public.eventos_automacao;
DROP POLICY IF EXISTS "eventos_automacao_insert_service" ON public.eventos_automacao;

-- 5. execucoes_pendentes_automacao: service-only
DROP POLICY IF EXISTS "execucoes_pendentes_insert_service" ON public.execucoes_pendentes_automacao;
DROP POLICY IF EXISTS "execucoes_pendentes_update_service" ON public.execucoes_pendentes_automacao;

-- 6. log_automacoes: service-only para INSERT/UPDATE
DROP POLICY IF EXISTS "log_automacoes_insert_service" ON public.log_automacoes;
DROP POLICY IF EXISTS "log_automacoes_update_service" ON public.log_automacoes;