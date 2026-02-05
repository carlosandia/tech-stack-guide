-- Corrigir RLS para super_admin ver todos os usuários
-- Drop políticas existentes que podem estar conflitantes
DROP POLICY IF EXISTS "super_admin_usuarios_select" ON usuarios;
DROP POLICY IF EXISTS "Super admin full access usuarios" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select_policy" ON usuarios;

-- Criar política unificada de SELECT para usuarios
CREATE POLICY "usuarios_select_all" ON usuarios
FOR SELECT TO authenticated
USING (
  -- Super admin via user_roles pode ver todos
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
  -- Usuário pode ver a si mesmo
  OR auth_id = auth.uid()
  -- Usuário pode ver outros da mesma organização
  OR organizacao_id IN (
    SELECT organizacao_id FROM usuarios WHERE auth_id = auth.uid()
  )
);