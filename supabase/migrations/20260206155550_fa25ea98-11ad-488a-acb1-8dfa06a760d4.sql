-- =====================================================
-- Limpeza de políticas RLS redundantes na tabela usuarios
-- Mantém apenas as essenciais sem sobreposição
-- =====================================================

-- Dropar políticas redundantes (sobrepostas por user_manage_own_profile e usuarios_select_safe)
DROP POLICY IF EXISTS "member_own_profile" ON public.usuarios;
DROP POLICY IF EXISTS "member_update_own_profile" ON public.usuarios;
DROP POLICY IF EXISTS "user_read_own" ON public.usuarios;
DROP POLICY IF EXISTS "user_update_own" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update_self" ON public.usuarios;

-- Políticas mantidas (sem redundância):
-- 1. usuarios_select_safe (SELECT, authenticated) → is_super_admin_v2() OR auth_id = auth.uid() OR organizacao_id = get_user_tenant_id()
-- 2. super_admin_usuarios_full_access (ALL, authenticated) → is_super_admin_v2()
-- 3. user_manage_own_profile (ALL, authenticated) → auth_id = auth.uid()
-- 4. usuarios_insert_self (INSERT, public) → auth_id = auth.uid() [necessário para trigger handle_new_user]