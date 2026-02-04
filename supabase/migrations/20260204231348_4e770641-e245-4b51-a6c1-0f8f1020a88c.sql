-- =============================================
-- AIDEV-NOTE: Correção de segurança - Tabela user_roles separada
-- Problema: user_metadata pode ser modificado pelo usuário (inseguro)
-- Solução: Criar tabela user_roles com SECURITY DEFINER function
-- =============================================

-- 1. Criar enum para roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'member');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Criar tabela user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. Habilitar RLS na tabela user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Criar função SECURITY DEFINER para verificar roles (evita recursão)
CREATE OR REPLACE FUNCTION public.has_app_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Criar função SECURITY DEFINER para verificar se é super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin_v2()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
  )
$$;

-- 6. Políticas para user_roles (apenas super_admin pode gerenciar)
CREATE POLICY "super_admin_manage_roles" ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_super_admin_v2())
WITH CHECK (public.is_super_admin_v2());

-- 7. Usuário pode ver próprio role
CREATE POLICY "user_view_own_role" ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 8. Dropar políticas antigas de organizacoes_saas e recriar com função segura
DROP POLICY IF EXISTS "super_admin_full_access" ON organizacoes_saas;
DROP POLICY IF EXISTS "tenant_view_own_org" ON organizacoes_saas;

CREATE POLICY "super_admin_full_access" ON organizacoes_saas
FOR ALL
TO authenticated
USING (public.is_super_admin_v2())
WITH CHECK (public.is_super_admin_v2());

CREATE POLICY "tenant_view_own_org" ON organizacoes_saas
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT organizacao_id FROM public.usuarios WHERE auth_id = auth.uid()
  )
);

-- 9. Dropar políticas antigas de usuarios e recriar com função segura
DROP POLICY IF EXISTS "super_admin_usuarios_full_access" ON usuarios;
DROP POLICY IF EXISTS "tenant_view_own_usuarios" ON usuarios;
DROP POLICY IF EXISTS "user_manage_own_profile" ON usuarios;

CREATE POLICY "super_admin_usuarios_full_access" ON usuarios
FOR ALL
TO authenticated
USING (public.is_super_admin_v2())
WITH CHECK (public.is_super_admin_v2());

CREATE POLICY "tenant_view_own_usuarios" ON usuarios
FOR SELECT
TO authenticated
USING (
  organizacao_id IN (
    SELECT organizacao_id FROM public.usuarios WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "user_manage_own_profile" ON usuarios
FOR ALL
TO authenticated
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());

-- 10. Migrar super_admin existente para tabela user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::app_role
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'super_admin'
ON CONFLICT (user_id, role) DO NOTHING;