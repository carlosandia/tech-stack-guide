-- Migrar RLS de valores_campos_customizados de current_setting para get_user_tenant_id()

-- Remover policies antigas baseadas em current_setting
DROP POLICY IF EXISTS "tenant_isolation_valores" ON public.valores_campos_customizados;
DROP POLICY IF EXISTS "tenant_insert_valores" ON public.valores_campos_customizados;
DROP POLICY IF EXISTS "tenant_update_valores" ON public.valores_campos_customizados;
DROP POLICY IF EXISTS "tenant_delete_valores" ON public.valores_campos_customizados;

-- Criar novas policies usando get_user_tenant_id()
CREATE POLICY "tenant_select_valores"
  ON public.valores_campos_customizados
  FOR SELECT
  USING (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_insert_valores"
  ON public.valores_campos_customizados
  FOR INSERT
  WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_update_valores"
  ON public.valores_campos_customizados
  FOR UPDATE
  USING (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_delete_valores"
  ON public.valores_campos_customizados
  FOR DELETE
  USING (organizacao_id = get_user_tenant_id());
