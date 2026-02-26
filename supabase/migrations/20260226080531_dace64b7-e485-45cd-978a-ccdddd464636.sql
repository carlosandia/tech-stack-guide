-- AIDEV-NOTE: Permite leitura da config do programa de parceiros por qualquer usuário autenticado
-- Necessário para resolver o nível do parceiro no hook useParceiroStatus
CREATE POLICY "autenticados_leem_config_programa" ON config_programa_parceiros
  FOR SELECT
  TO authenticated
  USING (true);

-- AIDEV-NOTE: Permite que usuários leiam indicações da própria organização
CREATE POLICY "usuarios_leem_indicacoes_propria_org" ON indicacoes_parceiro
  FOR SELECT
  TO authenticated
  USING (parceiro_id IN (
    SELECT id FROM parceiros WHERE organizacao_id = (
      SELECT organizacao_id FROM usuarios WHERE auth_id = auth.uid() LIMIT 1
    )
  ));