-- Fix UPDATE policy to use auth.uid() instead of current_setting
DROP POLICY IF EXISTS tenant_update ON public.sessoes_whatsapp;
CREATE POLICY "tenant_update_v2" ON public.sessoes_whatsapp
  FOR UPDATE
  USING (organizacao_id = get_user_tenant_id());

-- Also fix the ALL and DELETE policies that have the same issue
DROP POLICY IF EXISTS tenant_isolation ON public.sessoes_whatsapp;
DROP POLICY IF EXISTS tenant_delete ON public.sessoes_whatsapp;
DROP POLICY IF EXISTS tenant_insert ON public.sessoes_whatsapp;

CREATE POLICY "tenant_insert_v2" ON public.sessoes_whatsapp
  FOR INSERT
  WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_delete_v2" ON public.sessoes_whatsapp
  FOR DELETE
  USING (organizacao_id = get_user_tenant_id());