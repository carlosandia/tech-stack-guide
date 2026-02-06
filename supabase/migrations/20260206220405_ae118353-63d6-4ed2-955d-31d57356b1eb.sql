
-- =====================================================
-- Migrar RLS policies de contatos, segmentos e contatos_segmentos
-- De: current_setting('app.current_tenant') (backend Express)
-- Para: get_user_tenant_id() (Supabase direto via auth.uid())
-- =====================================================

-- 1. CONTATOS
-- Drop existing policies
DROP POLICY IF EXISTS "tenant_isolation" ON public.contatos;
DROP POLICY IF EXISTS "owner_visibility" ON public.contatos;

-- Create new policies using get_user_tenant_id()
CREATE POLICY "tenant_select" ON public.contatos
  FOR SELECT USING (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_insert" ON public.contatos
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_update" ON public.contatos
  FOR UPDATE USING (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_delete" ON public.contatos
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- 2. SEGMENTOS
DROP POLICY IF EXISTS "tenant_isolation" ON public.segmentos;

CREATE POLICY "tenant_select" ON public.segmentos
  FOR SELECT USING (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_insert" ON public.segmentos
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_update" ON public.segmentos
  FOR UPDATE USING (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_delete" ON public.segmentos
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- 3. CONTATOS_SEGMENTOS
DROP POLICY IF EXISTS "tenant_isolation" ON public.contatos_segmentos;

CREATE POLICY "tenant_select" ON public.contatos_segmentos
  FOR SELECT USING (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_insert" ON public.contatos_segmentos
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_update" ON public.contatos_segmentos
  FOR UPDATE USING (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_delete" ON public.contatos_segmentos
  FOR DELETE USING (organizacao_id = get_user_tenant_id());
