
-- Migrar RLS de funis_etapas_tarefas para usar get_user_tenant_id()
-- (mesmo padrão aplicado em outros 15 tabelas do módulo Negócios)

-- Remover policies antigas baseadas em current_setting
DROP POLICY IF EXISTS "tenant_isolation" ON public.funis_etapas_tarefas;
DROP POLICY IF EXISTS "tenant_insert" ON public.funis_etapas_tarefas;
DROP POLICY IF EXISTS "tenant_update" ON public.funis_etapas_tarefas;
DROP POLICY IF EXISTS "tenant_delete" ON public.funis_etapas_tarefas;

-- Criar policies novas usando get_user_tenant_id()
CREATE POLICY "tenant_select_funis_etapas_tarefas"
ON public.funis_etapas_tarefas
FOR SELECT
TO authenticated
USING (
  organizacao_id = get_user_tenant_id()
  OR is_super_admin_v2()
);

CREATE POLICY "tenant_insert_funis_etapas_tarefas"
ON public.funis_etapas_tarefas
FOR INSERT
TO authenticated
WITH CHECK (
  organizacao_id = get_user_tenant_id()
);

CREATE POLICY "tenant_update_funis_etapas_tarefas"
ON public.funis_etapas_tarefas
FOR UPDATE
TO authenticated
USING (
  organizacao_id = get_user_tenant_id()
);

CREATE POLICY "tenant_delete_funis_etapas_tarefas"
ON public.funis_etapas_tarefas
FOR DELETE
TO authenticated
USING (
  organizacao_id = get_user_tenant_id()
);
