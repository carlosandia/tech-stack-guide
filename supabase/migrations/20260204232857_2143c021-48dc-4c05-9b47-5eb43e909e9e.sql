-- =================================================
-- FASE 1: Remover políticas problemáticas - usuarios
-- =================================================
DROP POLICY IF EXISTS "admin_tenant_access" ON usuarios;
DROP POLICY IF EXISTS "admin_tenant_usuarios" ON usuarios;
DROP POLICY IF EXISTS "tenant_view_own_usuarios" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select_own_tenant" ON usuarios;
DROP POLICY IF EXISTS "member_own_usuario" ON usuarios;
DROP POLICY IF EXISTS "super_admin_all_usuarios" ON usuarios;

-- =================================================
-- FASE 1: Remover políticas problemáticas - organizacoes_saas
-- =================================================
DROP POLICY IF EXISTS "tenant_view_own_org" ON organizacoes_saas;
DROP POLICY IF EXISTS "tenant_isolation" ON organizacoes_saas;
DROP POLICY IF EXISTS "tenant_read_own_organizacao" ON organizacoes_saas;
DROP POLICY IF EXISTS "super_admin_all_organizacoes" ON organizacoes_saas;
DROP POLICY IF EXISTS "usuarios_select_own_organization" ON organizacoes_saas;

-- =================================================
-- FASE 2: Criar funções helper SECURITY DEFINER
-- =================================================

-- Função para obter organizacao_id do usuário atual (bypassa RLS)
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organizacao_id 
  FROM public.usuarios 
  WHERE auth_id = auth.uid()
  LIMIT 1
$$;

-- Função para verificar se usuário é admin do tenant (bypassa RLS)
CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.usuarios 
    WHERE auth_id = auth.uid() 
      AND role = 'admin'
  )
$$;

-- =================================================
-- FASE 3: Recriar políticas LIMPAS para usuarios
-- =================================================

-- Super Admin tem acesso total
DROP POLICY IF EXISTS "super_admin_usuarios_full_access" ON usuarios;
CREATE POLICY "super_admin_usuarios_full_access" ON usuarios
FOR ALL TO authenticated
USING (public.is_super_admin_v2());

-- Usuário pode ler próprio perfil
CREATE POLICY "user_read_own" ON usuarios
FOR SELECT TO authenticated
USING (auth_id = auth.uid());

-- Usuário pode atualizar próprio perfil
CREATE POLICY "user_update_own" ON usuarios  
FOR UPDATE TO authenticated
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());

-- =================================================
-- FASE 4: Recriar políticas LIMPAS para organizacoes_saas
-- =================================================

-- Super Admin tem acesso total
DROP POLICY IF EXISTS "super_admin_full_access" ON organizacoes_saas;
CREATE POLICY "super_admin_full_access" ON organizacoes_saas
FOR ALL TO authenticated
USING (public.is_super_admin_v2());

-- Tenant pode ler própria organização (usa função helper que bypassa RLS)
CREATE POLICY "tenant_read_own" ON organizacoes_saas
FOR SELECT TO authenticated
USING (id = public.get_user_tenant_id());