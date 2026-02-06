
-- =====================================================
-- Migration: Atualizar RLS Policies para usar auth.uid()
-- Substitui current_setting('app.current_tenant') por get_user_tenant_id()
-- Usa funcoes SECURITY DEFINER existentes para evitar recursao
-- =====================================================

-- =====================================================
-- 1. CAMPOS_CUSTOMIZADOS
-- =====================================================
DROP POLICY IF EXISTS "tenant_isolation_campos" ON public.campos_customizados;
DROP POLICY IF EXISTS "tenant_insert_campos" ON public.campos_customizados;
DROP POLICY IF EXISTS "tenant_update_campos" ON public.campos_customizados;
DROP POLICY IF EXISTS "tenant_delete_campos" ON public.campos_customizados;

CREATE POLICY "tenant_select_campos" ON public.campos_customizados
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR EXISTS (SELECT 1 FROM usuarios u WHERE u.auth_id = auth.uid() AND u.role = 'super_admin')
  );

CREATE POLICY "tenant_insert_campos" ON public.campos_customizados
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_update_campos" ON public.campos_customizados
  FOR UPDATE USING (organizacao_id = get_user_tenant_id())
  WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_delete_campos" ON public.campos_customizados
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- =====================================================
-- 2. CATEGORIAS_PRODUTOS
-- =====================================================
DROP POLICY IF EXISTS "tenant_isolation_categorias" ON public.categorias_produtos;
DROP POLICY IF EXISTS "tenant_insert_categorias" ON public.categorias_produtos;
DROP POLICY IF EXISTS "tenant_update_categorias" ON public.categorias_produtos;
DROP POLICY IF EXISTS "tenant_delete_categorias" ON public.categorias_produtos;

CREATE POLICY "tenant_select_categorias" ON public.categorias_produtos
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR EXISTS (SELECT 1 FROM usuarios u WHERE u.auth_id = auth.uid() AND u.role = 'super_admin')
  );

CREATE POLICY "tenant_insert_categorias" ON public.categorias_produtos
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_update_categorias" ON public.categorias_produtos
  FOR UPDATE USING (organizacao_id = get_user_tenant_id())
  WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_delete_categorias" ON public.categorias_produtos
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- =====================================================
-- 3. CONFIGURACOES_CARD
-- =====================================================
DROP POLICY IF EXISTS "tenant_isolation_config_card" ON public.configuracoes_card;
DROP POLICY IF EXISTS "tenant_insert_config_card" ON public.configuracoes_card;
DROP POLICY IF EXISTS "tenant_update_config_card" ON public.configuracoes_card;

CREATE POLICY "tenant_select_config_card" ON public.configuracoes_card
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR EXISTS (SELECT 1 FROM usuarios u WHERE u.auth_id = auth.uid() AND u.role = 'super_admin')
  );

CREATE POLICY "tenant_insert_config_card" ON public.configuracoes_card
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_update_config_card" ON public.configuracoes_card
  FOR UPDATE USING (organizacao_id = get_user_tenant_id())
  WITH CHECK (organizacao_id = get_user_tenant_id());

-- =====================================================
-- 4. MOTIVOS_RESULTADO
-- =====================================================
DROP POLICY IF EXISTS "tenant_isolation_motivos" ON public.motivos_resultado;
DROP POLICY IF EXISTS "tenant_insert_motivos" ON public.motivos_resultado;
DROP POLICY IF EXISTS "tenant_update_motivos" ON public.motivos_resultado;
DROP POLICY IF EXISTS "tenant_delete_motivos" ON public.motivos_resultado;

CREATE POLICY "tenant_select_motivos" ON public.motivos_resultado
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR EXISTS (SELECT 1 FROM usuarios u WHERE u.auth_id = auth.uid() AND u.role = 'super_admin')
  );

CREATE POLICY "tenant_insert_motivos" ON public.motivos_resultado
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_update_motivos" ON public.motivos_resultado
  FOR UPDATE USING (organizacao_id = get_user_tenant_id())
  WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_delete_motivos" ON public.motivos_resultado
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- =====================================================
-- 5. PRODUTOS
-- =====================================================
DROP POLICY IF EXISTS "tenant_isolation_produtos" ON public.produtos;
DROP POLICY IF EXISTS "tenant_insert_produtos" ON public.produtos;
DROP POLICY IF EXISTS "tenant_update_produtos" ON public.produtos;
DROP POLICY IF EXISTS "tenant_delete_produtos" ON public.produtos;

CREATE POLICY "tenant_select_produtos" ON public.produtos
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR EXISTS (SELECT 1 FROM usuarios u WHERE u.auth_id = auth.uid() AND u.role = 'super_admin')
  );

CREATE POLICY "tenant_insert_produtos" ON public.produtos
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_update_produtos" ON public.produtos
  FOR UPDATE USING (organizacao_id = get_user_tenant_id())
  WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_delete_produtos" ON public.produtos
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- =====================================================
-- 6. TAREFAS_TEMPLATES
-- =====================================================
DROP POLICY IF EXISTS "tenant_isolation_tarefas_tpl" ON public.tarefas_templates;
DROP POLICY IF EXISTS "tenant_insert_tarefas_tpl" ON public.tarefas_templates;
DROP POLICY IF EXISTS "tenant_update_tarefas_tpl" ON public.tarefas_templates;
DROP POLICY IF EXISTS "tenant_delete_tarefas_tpl" ON public.tarefas_templates;

CREATE POLICY "tenant_select_tarefas_tpl" ON public.tarefas_templates
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR EXISTS (SELECT 1 FROM usuarios u WHERE u.auth_id = auth.uid() AND u.role = 'super_admin')
  );

CREATE POLICY "tenant_insert_tarefas_tpl" ON public.tarefas_templates
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_update_tarefas_tpl" ON public.tarefas_templates
  FOR UPDATE USING (organizacao_id = get_user_tenant_id())
  WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_delete_tarefas_tpl" ON public.tarefas_templates
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- =====================================================
-- 7. ETAPAS_TEMPLATES
-- =====================================================
DROP POLICY IF EXISTS "tenant_isolation_etapas_tpl" ON public.etapas_templates;
DROP POLICY IF EXISTS "tenant_insert_etapas_tpl" ON public.etapas_templates;
DROP POLICY IF EXISTS "tenant_update_etapas_tpl" ON public.etapas_templates;
DROP POLICY IF EXISTS "tenant_delete_etapas_tpl" ON public.etapas_templates;

CREATE POLICY "tenant_select_etapas_tpl" ON public.etapas_templates
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR EXISTS (SELECT 1 FROM usuarios u WHERE u.auth_id = auth.uid() AND u.role = 'super_admin')
  );

CREATE POLICY "tenant_insert_etapas_tpl" ON public.etapas_templates
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_update_etapas_tpl" ON public.etapas_templates
  FOR UPDATE USING (organizacao_id = get_user_tenant_id())
  WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_delete_etapas_tpl" ON public.etapas_templates
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- =====================================================
-- 8. ETAPAS_TAREFAS
-- =====================================================
DROP POLICY IF EXISTS "tenant_isolation_etapas_tarefas" ON public.etapas_tarefas;
DROP POLICY IF EXISTS "tenant_insert_etapas_tarefas" ON public.etapas_tarefas;
DROP POLICY IF EXISTS "tenant_delete_etapas_tarefas" ON public.etapas_tarefas;

CREATE POLICY "tenant_select_etapas_tarefas" ON public.etapas_tarefas
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR EXISTS (SELECT 1 FROM usuarios u WHERE u.auth_id = auth.uid() AND u.role = 'super_admin')
  );

CREATE POLICY "tenant_insert_etapas_tarefas" ON public.etapas_tarefas
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_update_etapas_tarefas" ON public.etapas_tarefas
  FOR UPDATE USING (organizacao_id = get_user_tenant_id())
  WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_delete_etapas_tarefas" ON public.etapas_tarefas
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- =====================================================
-- 9. REGRAS_QUALIFICACAO
-- =====================================================
DROP POLICY IF EXISTS "tenant_isolation_regras" ON public.regras_qualificacao;
DROP POLICY IF EXISTS "tenant_insert_regras" ON public.regras_qualificacao;
DROP POLICY IF EXISTS "tenant_update_regras" ON public.regras_qualificacao;
DROP POLICY IF EXISTS "tenant_delete_regras" ON public.regras_qualificacao;

CREATE POLICY "tenant_select_regras" ON public.regras_qualificacao
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR EXISTS (SELECT 1 FROM usuarios u WHERE u.auth_id = auth.uid() AND u.role = 'super_admin')
  );

CREATE POLICY "tenant_insert_regras" ON public.regras_qualificacao
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_update_regras" ON public.regras_qualificacao
  FOR UPDATE USING (organizacao_id = get_user_tenant_id())
  WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_delete_regras" ON public.regras_qualificacao
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- =====================================================
-- 10. WEBHOOKS_ENTRADA
-- =====================================================
DROP POLICY IF EXISTS "tenant_isolation_wh_entrada" ON public.webhooks_entrada;
DROP POLICY IF EXISTS "tenant_insert_wh_entrada" ON public.webhooks_entrada;
DROP POLICY IF EXISTS "tenant_update_wh_entrada" ON public.webhooks_entrada;
DROP POLICY IF EXISTS "tenant_delete_wh_entrada" ON public.webhooks_entrada;

CREATE POLICY "tenant_select_wh_entrada" ON public.webhooks_entrada
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR EXISTS (SELECT 1 FROM usuarios u WHERE u.auth_id = auth.uid() AND u.role = 'super_admin')
  );

CREATE POLICY "tenant_insert_wh_entrada" ON public.webhooks_entrada
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_update_wh_entrada" ON public.webhooks_entrada
  FOR UPDATE USING (organizacao_id = get_user_tenant_id())
  WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_delete_wh_entrada" ON public.webhooks_entrada
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- =====================================================
-- 11. WEBHOOKS_SAIDA
-- =====================================================
DROP POLICY IF EXISTS "tenant_isolation_wh_saida" ON public.webhooks_saida;
DROP POLICY IF EXISTS "tenant_insert_wh_saida" ON public.webhooks_saida;
DROP POLICY IF EXISTS "tenant_update_wh_saida" ON public.webhooks_saida;
DROP POLICY IF EXISTS "tenant_delete_wh_saida" ON public.webhooks_saida;

CREATE POLICY "tenant_select_wh_saida" ON public.webhooks_saida
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR EXISTS (SELECT 1 FROM usuarios u WHERE u.auth_id = auth.uid() AND u.role = 'super_admin')
  );

CREATE POLICY "tenant_insert_wh_saida" ON public.webhooks_saida
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_update_wh_saida" ON public.webhooks_saida
  FOR UPDATE USING (organizacao_id = get_user_tenant_id())
  WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_delete_wh_saida" ON public.webhooks_saida
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- =====================================================
-- 12. EQUIPES
-- =====================================================
DROP POLICY IF EXISTS "tenant_isolation_equipes" ON public.equipes;
DROP POLICY IF EXISTS "tenant_insert_equipes" ON public.equipes;
DROP POLICY IF EXISTS "tenant_update_equipes" ON public.equipes;
DROP POLICY IF EXISTS "tenant_delete_equipes" ON public.equipes;

CREATE POLICY "tenant_select_equipes" ON public.equipes
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR EXISTS (SELECT 1 FROM usuarios u WHERE u.auth_id = auth.uid() AND u.role = 'super_admin')
  );

CREATE POLICY "tenant_insert_equipes" ON public.equipes
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_update_equipes" ON public.equipes
  FOR UPDATE USING (organizacao_id = get_user_tenant_id())
  WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_delete_equipes" ON public.equipes
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- =====================================================
-- 13. EQUIPES_MEMBROS
-- =====================================================
DROP POLICY IF EXISTS "tenant_isolation_eq_membros" ON public.equipes_membros;
DROP POLICY IF EXISTS "tenant_insert_eq_membros" ON public.equipes_membros;
DROP POLICY IF EXISTS "tenant_delete_eq_membros" ON public.equipes_membros;

CREATE POLICY "tenant_select_eq_membros" ON public.equipes_membros
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR EXISTS (SELECT 1 FROM usuarios u WHERE u.auth_id = auth.uid() AND u.role = 'super_admin')
  );

CREATE POLICY "tenant_insert_eq_membros" ON public.equipes_membros
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_update_eq_membros" ON public.equipes_membros
  FOR UPDATE USING (organizacao_id = get_user_tenant_id())
  WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_delete_eq_membros" ON public.equipes_membros
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- =====================================================
-- 14. METAS
-- =====================================================
DROP POLICY IF EXISTS "tenant_isolation_metas" ON public.metas;
DROP POLICY IF EXISTS "tenant_insert_metas" ON public.metas;
DROP POLICY IF EXISTS "tenant_update_metas" ON public.metas;
DROP POLICY IF EXISTS "tenant_delete_metas" ON public.metas;

CREATE POLICY "tenant_select_metas" ON public.metas
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR EXISTS (SELECT 1 FROM usuarios u WHERE u.auth_id = auth.uid() AND u.role = 'super_admin')
  );

CREATE POLICY "tenant_insert_metas" ON public.metas
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_update_metas" ON public.metas
  FOR UPDATE USING (organizacao_id = get_user_tenant_id())
  WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_delete_metas" ON public.metas
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- =====================================================
-- 15. METAS_PROGRESSO
-- =====================================================
DROP POLICY IF EXISTS "tenant_isolation_progresso" ON public.metas_progresso;
DROP POLICY IF EXISTS "tenant_insert_progresso" ON public.metas_progresso;
DROP POLICY IF EXISTS "tenant_update_progresso" ON public.metas_progresso;

CREATE POLICY "tenant_select_progresso" ON public.metas_progresso
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR EXISTS (SELECT 1 FROM usuarios u WHERE u.auth_id = auth.uid() AND u.role = 'super_admin')
  );

CREATE POLICY "tenant_insert_progresso" ON public.metas_progresso
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "tenant_update_progresso" ON public.metas_progresso
  FOR UPDATE USING (organizacao_id = get_user_tenant_id())
  WITH CHECK (organizacao_id = get_user_tenant_id());

-- =====================================================
-- 16. WEBHOOKS_SAIDA_LOGS
-- =====================================================
DROP POLICY IF EXISTS "tenant_isolation_wh_logs" ON public.webhooks_saida_logs;

CREATE POLICY "tenant_select_wh_logs" ON public.webhooks_saida_logs
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR EXISTS (SELECT 1 FROM usuarios u WHERE u.auth_id = auth.uid() AND u.role = 'super_admin')
  );

CREATE POLICY "tenant_insert_wh_logs" ON public.webhooks_saida_logs
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());
