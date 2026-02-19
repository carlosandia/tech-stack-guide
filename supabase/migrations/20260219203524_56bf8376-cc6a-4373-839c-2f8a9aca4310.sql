
-- =====================================================
-- CORRECAO: Substituir policies legadas com app.current_tenant
-- por get_user_tenant_id() em 15 tabelas
-- + Remover policy permissiva em webhooks_entrada_logs
-- =====================================================

-- 1. conexoes_email
DROP POLICY IF EXISTS "tenant_insert" ON conexoes_email;
CREATE POLICY "tenant_insert_v2" ON conexoes_email FOR INSERT
  WITH CHECK (organizacao_id = get_user_tenant_id());

-- 2. conexoes_google
DROP POLICY IF EXISTS "tenant_insert" ON conexoes_google;
CREATE POLICY "tenant_insert_v2" ON conexoes_google FOR INSERT
  WITH CHECK (organizacao_id = get_user_tenant_id());

DROP POLICY IF EXISTS "tenant_update" ON conexoes_google;
CREATE POLICY "tenant_update_v2" ON conexoes_google FOR UPDATE
  USING (organizacao_id = get_user_tenant_id());

-- 3. conexoes_instagram
DROP POLICY IF EXISTS "tenant_insert" ON conexoes_instagram;
CREATE POLICY "tenant_insert_v2" ON conexoes_instagram FOR INSERT
  WITH CHECK (organizacao_id = get_user_tenant_id());

-- 4. conexoes_meta
DROP POLICY IF EXISTS "tenant_insert" ON conexoes_meta;
CREATE POLICY "tenant_insert_v2" ON conexoes_meta FOR INSERT
  WITH CHECK (organizacao_id = get_user_tenant_id());

-- 5. config_conversions_api
DROP POLICY IF EXISTS "tenant_isolation" ON config_conversions_api;
DROP POLICY IF EXISTS "tenant_insert" ON config_conversions_api;
DROP POLICY IF EXISTS "tenant_update" ON config_conversions_api;
DROP POLICY IF EXISTS "tenant_delete" ON config_conversions_api;

CREATE POLICY "tenant_select_v2" ON config_conversions_api FOR SELECT
  USING (organizacao_id = get_user_tenant_id());
CREATE POLICY "tenant_insert_v2" ON config_conversions_api FOR INSERT
  WITH CHECK (organizacao_id = get_user_tenant_id());
CREATE POLICY "tenant_update_v2" ON config_conversions_api FOR UPDATE
  USING (organizacao_id = get_user_tenant_id());
CREATE POLICY "tenant_delete_v2" ON config_conversions_api FOR DELETE
  USING (organizacao_id = get_user_tenant_id());

-- 6. custom_audience_membros
DROP POLICY IF EXISTS "tenant_isolation" ON custom_audience_membros;
DROP POLICY IF EXISTS "tenant_insert" ON custom_audience_membros;
DROP POLICY IF EXISTS "tenant_update" ON custom_audience_membros;
DROP POLICY IF EXISTS "tenant_delete" ON custom_audience_membros;

CREATE POLICY "tenant_select_v2" ON custom_audience_membros FOR SELECT
  USING (organizacao_id = get_user_tenant_id());
CREATE POLICY "tenant_insert_v2" ON custom_audience_membros FOR INSERT
  WITH CHECK (organizacao_id = get_user_tenant_id());
CREATE POLICY "tenant_update_v2" ON custom_audience_membros FOR UPDATE
  USING (organizacao_id = get_user_tenant_id());
CREATE POLICY "tenant_delete_v2" ON custom_audience_membros FOR DELETE
  USING (organizacao_id = get_user_tenant_id());

-- 7. custom_audiences_meta
DROP POLICY IF EXISTS "tenant_isolation" ON custom_audiences_meta;
DROP POLICY IF EXISTS "tenant_insert" ON custom_audiences_meta;
DROP POLICY IF EXISTS "tenant_update" ON custom_audiences_meta;
DROP POLICY IF EXISTS "tenant_delete" ON custom_audiences_meta;

CREATE POLICY "tenant_select_v2" ON custom_audiences_meta FOR SELECT
  USING (organizacao_id = get_user_tenant_id());
CREATE POLICY "tenant_insert_v2" ON custom_audiences_meta FOR INSERT
  WITH CHECK (organizacao_id = get_user_tenant_id());
CREATE POLICY "tenant_update_v2" ON custom_audiences_meta FOR UPDATE
  USING (organizacao_id = get_user_tenant_id());
CREATE POLICY "tenant_delete_v2" ON custom_audiences_meta FOR DELETE
  USING (organizacao_id = get_user_tenant_id());

-- 8. duplicatas_contatos
DROP POLICY IF EXISTS "tenant_isolation" ON duplicatas_contatos;
CREATE POLICY "tenant_select_v2" ON duplicatas_contatos FOR SELECT
  USING (organizacao_id = get_user_tenant_id());

-- 9. eventos_pendentes
DROP POLICY IF EXISTS "tenant_isolation" ON eventos_pendentes;
DROP POLICY IF EXISTS "tenant_insert" ON eventos_pendentes;
DROP POLICY IF EXISTS "tenant_update" ON eventos_pendentes;

CREATE POLICY "tenant_select_v2" ON eventos_pendentes FOR SELECT
  USING (organizacao_id = get_user_tenant_id());
CREATE POLICY "tenant_insert_v2" ON eventos_pendentes FOR INSERT
  WITH CHECK (organizacao_id = get_user_tenant_id());
CREATE POLICY "tenant_update_v2" ON eventos_pendentes FOR UPDATE
  USING (organizacao_id = get_user_tenant_id());

-- 10. formularios_lead_ads
DROP POLICY IF EXISTS "tenant_isolation" ON formularios_lead_ads;
DROP POLICY IF EXISTS "tenant_insert" ON formularios_lead_ads;
DROP POLICY IF EXISTS "tenant_update" ON formularios_lead_ads;
DROP POLICY IF EXISTS "tenant_delete" ON formularios_lead_ads;

CREATE POLICY "tenant_select_v2" ON formularios_lead_ads FOR SELECT
  USING (organizacao_id = get_user_tenant_id());
CREATE POLICY "tenant_insert_v2" ON formularios_lead_ads FOR INSERT
  WITH CHECK (organizacao_id = get_user_tenant_id());
CREATE POLICY "tenant_update_v2" ON formularios_lead_ads FOR UPDATE
  USING (organizacao_id = get_user_tenant_id());
CREATE POLICY "tenant_delete_v2" ON formularios_lead_ads FOR DELETE
  USING (organizacao_id = get_user_tenant_id());

-- 11. historico_distribuicao
DROP POLICY IF EXISTS "tenant_isolation" ON historico_distribuicao;
DROP POLICY IF EXISTS "tenant_insert" ON historico_distribuicao;

CREATE POLICY "tenant_select_v2" ON historico_distribuicao FOR SELECT
  USING (organizacao_id = get_user_tenant_id());
CREATE POLICY "tenant_insert_v2" ON historico_distribuicao FOR INSERT
  WITH CHECK (organizacao_id = get_user_tenant_id());

-- 12. importacoes_contatos
DROP POLICY IF EXISTS "tenant_isolation" ON importacoes_contatos;
CREATE POLICY "tenant_select_v2" ON importacoes_contatos FOR SELECT
  USING (organizacao_id = get_user_tenant_id());

-- 13. integracoes
DROP POLICY IF EXISTS "tenant_isolation" ON integracoes;
DROP POLICY IF EXISTS "tenant_insert" ON integracoes;
DROP POLICY IF EXISTS "tenant_update" ON integracoes;
DROP POLICY IF EXISTS "tenant_delete" ON integracoes;

CREATE POLICY "tenant_select_v2" ON integracoes FOR SELECT
  USING (organizacao_id = get_user_tenant_id());
CREATE POLICY "tenant_insert_v2" ON integracoes FOR INSERT
  WITH CHECK (organizacao_id = get_user_tenant_id());
CREATE POLICY "tenant_update_v2" ON integracoes FOR UPDATE
  USING (organizacao_id = get_user_tenant_id());
CREATE POLICY "tenant_delete_v2" ON integracoes FOR DELETE
  USING (organizacao_id = get_user_tenant_id());

-- 14. log_conversions_api
DROP POLICY IF EXISTS "tenant_isolation" ON log_conversions_api;
DROP POLICY IF EXISTS "tenant_insert" ON log_conversions_api;

CREATE POLICY "tenant_select_v2" ON log_conversions_api FOR SELECT
  USING (organizacao_id = get_user_tenant_id());
CREATE POLICY "tenant_insert_v2" ON log_conversions_api FOR INSERT
  WITH CHECK (organizacao_id = get_user_tenant_id());

-- 15. paginas_meta
DROP POLICY IF EXISTS "tenant_isolation" ON paginas_meta;
DROP POLICY IF EXISTS "tenant_insert" ON paginas_meta;
DROP POLICY IF EXISTS "tenant_update" ON paginas_meta;
DROP POLICY IF EXISTS "tenant_delete" ON paginas_meta;

CREATE POLICY "tenant_select_v2" ON paginas_meta FOR SELECT
  USING (organizacao_id = get_user_tenant_id());
CREATE POLICY "tenant_insert_v2" ON paginas_meta FOR INSERT
  WITH CHECK (organizacao_id = get_user_tenant_id());
CREATE POLICY "tenant_update_v2" ON paginas_meta FOR UPDATE
  USING (organizacao_id = get_user_tenant_id());
CREATE POLICY "tenant_delete_v2" ON paginas_meta FOR DELETE
  USING (organizacao_id = get_user_tenant_id());

-- =====================================================
-- CORRECAO: Remover policy permissiva em webhooks_entrada_logs
-- =====================================================
DROP POLICY IF EXISTS "Service role pode inserir logs" ON webhooks_entrada_logs;
