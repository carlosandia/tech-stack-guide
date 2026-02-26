-- AIDEV-NOTE: Permitir members criarem origens on-the-fly via OrigemCombobox
-- A política anterior só permitia admins, mas members precisam criar origens ao cadastrar oportunidades

DROP POLICY IF EXISTS "origens_insert_admin" ON origens;

CREATE POLICY "origens_insert_tenant"
  ON origens FOR INSERT
  TO authenticated
  WITH CHECK (organizacao_id = get_user_tenant_id());
