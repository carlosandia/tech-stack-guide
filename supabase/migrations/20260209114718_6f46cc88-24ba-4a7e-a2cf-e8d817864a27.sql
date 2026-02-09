-- Corrigir RLS de pre_oportunidades: migrar de current_setting para get_user_tenant_id()

-- Remover políticas antigas
DROP POLICY IF EXISTS tenant_isolation ON public.pre_oportunidades;
DROP POLICY IF EXISTS tenant_insert ON public.pre_oportunidades;
DROP POLICY IF EXISTS tenant_update ON public.pre_oportunidades;
DROP POLICY IF EXISTS tenant_delete ON public.pre_oportunidades;

-- Criar políticas usando get_user_tenant_id()
CREATE POLICY "tenant_select" ON public.pre_oportunidades
  FOR SELECT USING (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_insert" ON public.pre_oportunidades
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_update" ON public.pre_oportunidades
  FOR UPDATE USING (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_delete" ON public.pre_oportunidades
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- Também permitir service_role (edge functions) via policy para inserções do webhook
CREATE POLICY "service_role_all" ON public.pre_oportunidades
  FOR ALL USING (auth.role() = 'service_role');