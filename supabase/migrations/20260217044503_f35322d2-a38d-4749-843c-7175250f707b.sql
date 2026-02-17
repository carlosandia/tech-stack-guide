-- Remover política antiga baseada em current_setting (não funciona no frontend)
DROP POLICY IF EXISTS "mensagens_agendadas_tenant_isolation" ON public.mensagens_agendadas;

-- Criar políticas corretas usando get_user_tenant_id()
CREATE POLICY "Tenant users can view own scheduled messages"
  ON public.mensagens_agendadas FOR SELECT
  TO authenticated
  USING (organizacao_id = public.get_user_tenant_id());

CREATE POLICY "Tenant users can insert own scheduled messages"
  ON public.mensagens_agendadas FOR INSERT
  TO authenticated
  WITH CHECK (organizacao_id = public.get_user_tenant_id());

CREATE POLICY "Tenant users can update own scheduled messages"
  ON public.mensagens_agendadas FOR UPDATE
  TO authenticated
  USING (organizacao_id = public.get_user_tenant_id());

CREATE POLICY "Tenant users can delete own scheduled messages"
  ON public.mensagens_agendadas FOR DELETE
  TO authenticated
  USING (organizacao_id = public.get_user_tenant_id());