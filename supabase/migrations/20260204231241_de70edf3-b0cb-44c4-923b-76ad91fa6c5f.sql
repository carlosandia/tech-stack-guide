-- =============================================
-- AIDEV-NOTE: Correção de RLS para usar JWT direto
-- Problema: Políticas conflitantes e função is_super_admin() 
-- consultava auth.users causando erro "permission denied"
-- Solução: Usar auth.jwt() -> 'user_metadata' ->> 'role' diretamente
-- =============================================

-- 1. Dropar políticas conflitantes em organizacoes_saas
DROP POLICY IF EXISTS "super_admin_all_organizacoes" ON organizacoes_saas;
DROP POLICY IF EXISTS "super_admin_full_access" ON organizacoes_saas;
DROP POLICY IF EXISTS "tenant_read_own_organizacao" ON organizacoes_saas;
DROP POLICY IF EXISTS "usuarios_select_own_organization" ON organizacoes_saas;
DROP POLICY IF EXISTS "tenant_view_own_org" ON organizacoes_saas;

-- 2. Dropar políticas em usuarios que podem ter o mesmo problema
DROP POLICY IF EXISTS "super_admin_all_usuarios" ON usuarios;
DROP POLICY IF EXISTS "super_admin_full_access" ON usuarios;
DROP POLICY IF EXISTS "tenant_select_own_usuarios" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select_own_tenant" ON usuarios;

-- 3. Recriar função is_super_admin usando JWT diretamente (sem consultar auth.users)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin',
    false
  )
$$;

-- 4. Recriar função has_role usando JWT diretamente
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role') = _role,
    false
  )
$$;

-- 5. Políticas para organizacoes_saas
-- Super admin pode fazer tudo em todas organizações
CREATE POLICY "super_admin_full_access" ON organizacoes_saas
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
);

-- Usuários podem ver sua própria organização
CREATE POLICY "tenant_view_own_org" ON organizacoes_saas
FOR SELECT
TO authenticated
USING (
  id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
);

-- 6. Políticas para usuarios
-- Super admin pode fazer tudo em todos usuarios
CREATE POLICY "super_admin_usuarios_full_access" ON usuarios
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
);

-- Usuários podem ver usuarios do mesmo tenant
CREATE POLICY "tenant_view_own_usuarios" ON usuarios
FOR SELECT
TO authenticated
USING (
  organizacao_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
);

-- Usuário pode ver e editar próprio perfil
CREATE POLICY "user_manage_own_profile" ON usuarios
FOR ALL
TO authenticated
USING (
  auth_id = auth.uid()
)
WITH CHECK (
  auth_id = auth.uid()
);