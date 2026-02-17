
-- Fix UPDATE policies for conexoes_email, conexoes_instagram, conexoes_meta
-- Current policies use app.current_tenant which is not set by frontend

-- conexoes_email: drop old update policy and create one based on auth.uid()
DROP POLICY IF EXISTS "tenant_update" ON conexoes_email;
CREATE POLICY "tenant_update" ON conexoes_email
  FOR UPDATE
  USING (organizacao_id IN (
    SELECT organizacao_id FROM usuarios WHERE auth_id = auth.uid()
  ));

-- conexoes_instagram
DROP POLICY IF EXISTS "tenant_update" ON conexoes_instagram;
CREATE POLICY "tenant_update" ON conexoes_instagram
  FOR UPDATE
  USING (organizacao_id IN (
    SELECT organizacao_id FROM usuarios WHERE auth_id = auth.uid()
  ));

-- conexoes_meta
DROP POLICY IF EXISTS "tenant_update" ON conexoes_meta;
CREATE POLICY "tenant_update" ON conexoes_meta
  FOR UPDATE
  USING (organizacao_id IN (
    SELECT organizacao_id FROM usuarios WHERE auth_id = auth.uid()
  ));
