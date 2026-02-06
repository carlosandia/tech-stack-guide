-- Permitir que admins do tenant insiram novos usuários na sua organização
CREATE POLICY "tenant_admin_insert_usuarios"
ON public.usuarios
FOR INSERT
TO authenticated
WITH CHECK (
  is_tenant_admin()
  AND organizacao_id = get_user_tenant_id()
);

-- Permitir que admins do tenant atualizem usuários da sua organização
CREATE POLICY "tenant_admin_update_usuarios"
ON public.usuarios
FOR UPDATE
TO authenticated
USING (
  is_tenant_admin()
  AND organizacao_id = get_user_tenant_id()
)
WITH CHECK (
  is_tenant_admin()
  AND organizacao_id = get_user_tenant_id()
);