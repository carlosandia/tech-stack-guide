-- ========================================
-- FASE 1: Criar função security definer para verificar role
-- Evita recursão infinita ao verificar permissões
-- ========================================

-- Criar enum para roles se não existir
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'member');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Função security definer para verificar role do usuario
-- Consulta auth.users.raw_user_meta_data ao invés da tabela usuarios
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = _user_id) = _role
  )
$$;

-- Função para verificar se usuario atual é super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'super_admin'
  )
$$;

-- ========================================
-- FASE 2: Corrigir policy da tabela usuarios
-- Remover recursão usando funções security definer
-- ========================================

-- Dropar policies problemáticas com recursão
DROP POLICY IF EXISTS "super_admin_full_access" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select_own_tenant" ON usuarios;
DROP POLICY IF EXISTS "admin_select_own_tenant" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update_self" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert_self" ON usuarios;

-- Nova policy para super_admin - usa função security definer (sem recursão)
CREATE POLICY "super_admin_full_access" ON usuarios
FOR ALL
USING (public.is_super_admin());

-- Policy para usuarios verem colegas do mesmo tenant
-- Usa join com auth.users para evitar recursão
CREATE POLICY "usuarios_select_own_tenant" ON usuarios
FOR SELECT
USING (
  organizacao_id = (
    SELECT raw_user_meta_data->>'tenant_id' 
    FROM auth.users 
    WHERE id = auth.uid()
  )::uuid
);

-- Policy para usuarios atualizarem próprio perfil
CREATE POLICY "usuarios_update_self" ON usuarios
FOR UPDATE
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());

-- Policy para inserir próprio perfil após signup
CREATE POLICY "usuarios_insert_self" ON usuarios
FOR INSERT
WITH CHECK (auth_id = auth.uid());

-- ========================================
-- FASE 3: Corrigir policy da tabela organizacoes_saas
-- ========================================

DROP POLICY IF EXISTS "super_admin_full_access" ON organizacoes_saas;
DROP POLICY IF EXISTS "usuarios_select_own_organization" ON organizacoes_saas;

-- Super admin pode ver todas organizações
CREATE POLICY "super_admin_full_access" ON organizacoes_saas
FOR ALL
USING (public.is_super_admin());

-- Usuarios podem ver própria organização
CREATE POLICY "usuarios_select_own_organization" ON organizacoes_saas
FOR SELECT
USING (
  id = (
    SELECT raw_user_meta_data->>'tenant_id' 
    FROM auth.users 
    WHERE id = auth.uid()
  )::uuid
);

-- ========================================
-- FASE 4: Corrigir policy da tabela planos
-- ========================================

DROP POLICY IF EXISTS "super_admin_full_access" ON planos;
DROP POLICY IF EXISTS "planos_visible_to_all" ON planos;

-- Super admin pode gerenciar planos
CREATE POLICY "super_admin_full_access" ON planos
FOR ALL
USING (public.is_super_admin());

-- Planos visíveis podem ser lidos por todos autenticados
CREATE POLICY "planos_visible_to_all" ON planos
FOR SELECT
USING (visivel = true);

-- ========================================
-- FASE 5: Corrigir policy da tabela modulos
-- ========================================

DROP POLICY IF EXISTS "super_admin_full_access" ON modulos;
DROP POLICY IF EXISTS "modulos_read_all" ON modulos;

-- Super admin pode gerenciar módulos
CREATE POLICY "super_admin_full_access" ON modulos
FOR ALL
USING (public.is_super_admin());

-- Todos autenticados podem ler módulos
CREATE POLICY "modulos_read_all" ON modulos
FOR SELECT
USING (auth.uid() IS NOT NULL);