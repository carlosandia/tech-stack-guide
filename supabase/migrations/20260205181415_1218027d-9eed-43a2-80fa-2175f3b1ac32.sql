-- Fix: remover recursão infinita em RLS de public.usuarios
-- A política anterior consultava a própria tabela usuarios dentro do USING, causando erro 500.

-- Remover políticas problemáticas
DROP POLICY IF EXISTS "usuarios_select_all" ON public.usuarios;
DROP POLICY IF EXISTS "super_admin_usuarios_select" ON public.usuarios;
DROP POLICY IF EXISTS "Super admin full access usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_select_policy" ON public.usuarios;

-- Criar policy segura (sem auto-referência)
-- Usa funções SECURITY DEFINER existentes para evitar recursão:
-- - is_super_admin_v2(): valida super_admin via user_roles
-- - get_user_tenant_id(): obtém organizacao_id do usuário logado
CREATE POLICY "usuarios_select_safe" ON public.usuarios
FOR SELECT TO authenticated
USING (
  public.is_super_admin_v2()
  OR auth_id = auth.uid()
  OR organizacao_id = public.get_user_tenant_id()
);
