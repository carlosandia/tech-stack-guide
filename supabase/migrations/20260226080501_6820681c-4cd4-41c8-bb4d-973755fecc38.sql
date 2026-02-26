-- AIDEV-NOTE: Permite que admins/members leiam o parceiro da própria organização
-- Necessário para exibir o emblema de parceiro no dropdown do usuário
CREATE POLICY "usuarios_leem_parceiro_propria_org" ON parceiros
  FOR SELECT
  TO authenticated
  USING (organizacao_id = (
    SELECT organizacao_id FROM usuarios WHERE auth_id = auth.uid() LIMIT 1
  ));