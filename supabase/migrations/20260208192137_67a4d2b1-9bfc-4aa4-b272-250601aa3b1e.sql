-- =====================================================
-- PRD-09: Migrar RLS das tabelas de Conversas
-- De current_setting('app.current_tenant') para get_user_tenant_id()
-- Permite acesso direto do frontend via Supabase client
-- =====================================================

-- 1. CONVERSAS
DROP POLICY IF EXISTS "conversas_tenant_isolation" ON public.conversas;

CREATE POLICY "conversas_tenant_select" ON public.conversas
  FOR SELECT USING (organizacao_id = public.get_user_tenant_id());

CREATE POLICY "conversas_tenant_insert" ON public.conversas
  FOR INSERT WITH CHECK (organizacao_id = public.get_user_tenant_id());

CREATE POLICY "conversas_tenant_update" ON public.conversas
  FOR UPDATE USING (organizacao_id = public.get_user_tenant_id());

CREATE POLICY "conversas_tenant_delete" ON public.conversas
  FOR DELETE USING (organizacao_id = public.get_user_tenant_id());

-- 2. MENSAGENS
DROP POLICY IF EXISTS "mensagens_tenant_isolation" ON public.mensagens;

CREATE POLICY "mensagens_tenant_select" ON public.mensagens
  FOR SELECT USING (organizacao_id = public.get_user_tenant_id());

CREATE POLICY "mensagens_tenant_insert" ON public.mensagens
  FOR INSERT WITH CHECK (organizacao_id = public.get_user_tenant_id());

CREATE POLICY "mensagens_tenant_update" ON public.mensagens
  FOR UPDATE USING (organizacao_id = public.get_user_tenant_id());

CREATE POLICY "mensagens_tenant_delete" ON public.mensagens
  FOR DELETE USING (organizacao_id = public.get_user_tenant_id());

-- 3. MENSAGENS PRONTAS
DROP POLICY IF EXISTS "mensagens_prontas_tenant_isolation" ON public.mensagens_prontas;

CREATE POLICY "mensagens_prontas_tenant_select" ON public.mensagens_prontas
  FOR SELECT USING (organizacao_id = public.get_user_tenant_id());

CREATE POLICY "mensagens_prontas_tenant_insert" ON public.mensagens_prontas
  FOR INSERT WITH CHECK (organizacao_id = public.get_user_tenant_id());

CREATE POLICY "mensagens_prontas_tenant_update" ON public.mensagens_prontas
  FOR UPDATE USING (organizacao_id = public.get_user_tenant_id());

CREATE POLICY "mensagens_prontas_tenant_delete" ON public.mensagens_prontas
  FOR DELETE USING (organizacao_id = public.get_user_tenant_id());

-- 4. NOTAS CONTATO
DROP POLICY IF EXISTS "notas_contato_tenant_isolation" ON public.notas_contato;

CREATE POLICY "notas_contato_tenant_select" ON public.notas_contato
  FOR SELECT USING (organizacao_id = public.get_user_tenant_id());

CREATE POLICY "notas_contato_tenant_insert" ON public.notas_contato
  FOR INSERT WITH CHECK (organizacao_id = public.get_user_tenant_id());

CREATE POLICY "notas_contato_tenant_update" ON public.notas_contato
  FOR UPDATE USING (organizacao_id = public.get_user_tenant_id());

CREATE POLICY "notas_contato_tenant_delete" ON public.notas_contato
  FOR DELETE USING (organizacao_id = public.get_user_tenant_id());

-- 5. Super admin bypass (mesmo padrão dos outros módulos)
CREATE POLICY "conversas_super_admin" ON public.conversas
  FOR ALL USING (public.is_super_admin_v2());

CREATE POLICY "mensagens_super_admin" ON public.mensagens
  FOR ALL USING (public.is_super_admin_v2());

CREATE POLICY "mensagens_prontas_super_admin" ON public.mensagens_prontas
  FOR ALL USING (public.is_super_admin_v2());

CREATE POLICY "notas_contato_super_admin" ON public.notas_contato
  FOR ALL USING (public.is_super_admin_v2());