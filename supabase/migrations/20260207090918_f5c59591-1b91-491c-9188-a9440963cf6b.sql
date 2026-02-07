-- Fix RLS policies on tarefas table to use get_user_tenant_id()
-- Old policy uses current_setting('app.current_tenant') which only works from backend

DROP POLICY IF EXISTS "tarefas_tenant_isolation" ON public.tarefas;

-- SELECT: tenant users + super admin
CREATE POLICY "tenant_select_tarefas"
  ON public.tarefas
  FOR SELECT
  USING (organizacao_id = get_user_tenant_id() OR is_super_admin_v2());

-- INSERT: tenant users only
CREATE POLICY "tenant_insert_tarefas"
  ON public.tarefas
  FOR INSERT
  WITH CHECK (organizacao_id = get_user_tenant_id());

-- UPDATE: tenant users only
CREATE POLICY "tenant_update_tarefas"
  ON public.tarefas
  FOR UPDATE
  USING (organizacao_id = get_user_tenant_id());

-- DELETE: tenant users only
CREATE POLICY "tenant_delete_tarefas"
  ON public.tarefas
  FOR DELETE
  USING (organizacao_id = get_user_tenant_id());