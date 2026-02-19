
-- Corrigir RLS permissiva em conversas_labels e whatsapp_labels
-- Substituir USING(true) por filtro de tenant via get_user_tenant_id()

-- 1. conversas_labels
DROP POLICY IF EXISTS "conversas_labels_service_all" ON public.conversas_labels;

CREATE POLICY "conversas_labels_tenant_all" ON public.conversas_labels
  FOR ALL
  TO authenticated
  USING (organizacao_id = public.get_user_tenant_id())
  WITH CHECK (organizacao_id = public.get_user_tenant_id());

-- 2. whatsapp_labels
DROP POLICY IF EXISTS "whatsapp_labels_service_all" ON public.whatsapp_labels;

CREATE POLICY "whatsapp_labels_tenant_all" ON public.whatsapp_labels
  FOR ALL
  TO authenticated
  USING (organizacao_id = public.get_user_tenant_id())
  WITH CHECK (organizacao_id = public.get_user_tenant_id());
