
-- =====================================================
-- MIGRAÇÃO DE RLS: current_setting → get_user_tenant_id()
-- 15 tabelas do módulo de Negócios
-- Segue padrão da tabela contatos (que já funciona)
-- =====================================================

-- ===================== funis =====================
DROP POLICY IF EXISTS tenant_isolation ON public.funis;
DROP POLICY IF EXISTS tenant_insert ON public.funis;
DROP POLICY IF EXISTS tenant_update ON public.funis;
DROP POLICY IF EXISTS tenant_delete ON public.funis;

CREATE POLICY tenant_select ON public.funis
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR is_super_admin_v2()
  );
CREATE POLICY tenant_insert ON public.funis
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_update ON public.funis
  FOR UPDATE USING (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_delete ON public.funis
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- ===================== etapas_funil =====================
DROP POLICY IF EXISTS tenant_isolation ON public.etapas_funil;
DROP POLICY IF EXISTS tenant_insert ON public.etapas_funil;
DROP POLICY IF EXISTS tenant_update ON public.etapas_funil;
DROP POLICY IF EXISTS tenant_delete ON public.etapas_funil;

CREATE POLICY tenant_select ON public.etapas_funil
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR is_super_admin_v2()
  );
CREATE POLICY tenant_insert ON public.etapas_funil
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_update ON public.etapas_funil
  FOR UPDATE USING (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_delete ON public.etapas_funil
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- ===================== oportunidades =====================
DROP POLICY IF EXISTS tenant_isolation ON public.oportunidades;
DROP POLICY IF EXISTS tenant_insert ON public.oportunidades;
DROP POLICY IF EXISTS tenant_update ON public.oportunidades;
DROP POLICY IF EXISTS tenant_delete ON public.oportunidades;

CREATE POLICY tenant_select ON public.oportunidades
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR is_super_admin_v2()
  );
CREATE POLICY tenant_insert ON public.oportunidades
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_update ON public.oportunidades
  FOR UPDATE USING (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_delete ON public.oportunidades
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- ===================== oportunidades_produtos =====================
DROP POLICY IF EXISTS tenant_isolation ON public.oportunidades_produtos;
DROP POLICY IF EXISTS tenant_insert ON public.oportunidades_produtos;
DROP POLICY IF EXISTS tenant_update ON public.oportunidades_produtos;
DROP POLICY IF EXISTS tenant_delete ON public.oportunidades_produtos;

CREATE POLICY tenant_select ON public.oportunidades_produtos
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR is_super_admin_v2()
  );
CREATE POLICY tenant_insert ON public.oportunidades_produtos
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_update ON public.oportunidades_produtos
  FOR UPDATE USING (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_delete ON public.oportunidades_produtos
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- ===================== funis_membros =====================
DROP POLICY IF EXISTS tenant_isolation ON public.funis_membros;
DROP POLICY IF EXISTS tenant_insert ON public.funis_membros;
DROP POLICY IF EXISTS tenant_update ON public.funis_membros;
DROP POLICY IF EXISTS tenant_delete ON public.funis_membros;

CREATE POLICY tenant_select ON public.funis_membros
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR is_super_admin_v2()
  );
CREATE POLICY tenant_insert ON public.funis_membros
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_update ON public.funis_membros
  FOR UPDATE USING (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_delete ON public.funis_membros
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- ===================== funis_campos =====================
DROP POLICY IF EXISTS tenant_isolation ON public.funis_campos;
DROP POLICY IF EXISTS tenant_insert ON public.funis_campos;
DROP POLICY IF EXISTS tenant_update ON public.funis_campos;
DROP POLICY IF EXISTS tenant_delete ON public.funis_campos;

CREATE POLICY tenant_select ON public.funis_campos
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR is_super_admin_v2()
  );
CREATE POLICY tenant_insert ON public.funis_campos
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_update ON public.funis_campos
  FOR UPDATE USING (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_delete ON public.funis_campos
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- ===================== funis_regras_qualificacao =====================
DROP POLICY IF EXISTS tenant_isolation ON public.funis_regras_qualificacao;
DROP POLICY IF EXISTS tenant_insert ON public.funis_regras_qualificacao;
DROP POLICY IF EXISTS tenant_update ON public.funis_regras_qualificacao;
DROP POLICY IF EXISTS tenant_delete ON public.funis_regras_qualificacao;

CREATE POLICY tenant_select ON public.funis_regras_qualificacao
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR is_super_admin_v2()
  );
CREATE POLICY tenant_insert ON public.funis_regras_qualificacao
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_update ON public.funis_regras_qualificacao
  FOR UPDATE USING (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_delete ON public.funis_regras_qualificacao
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- ===================== funis_motivos =====================
DROP POLICY IF EXISTS tenant_isolation ON public.funis_motivos;
DROP POLICY IF EXISTS tenant_insert ON public.funis_motivos;
DROP POLICY IF EXISTS tenant_update ON public.funis_motivos;
DROP POLICY IF EXISTS tenant_delete ON public.funis_motivos;

CREATE POLICY tenant_select ON public.funis_motivos
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR is_super_admin_v2()
  );
CREATE POLICY tenant_insert ON public.funis_motivos
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_update ON public.funis_motivos
  FOR UPDATE USING (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_delete ON public.funis_motivos
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- ===================== configuracoes_distribuicao =====================
DROP POLICY IF EXISTS tenant_isolation ON public.configuracoes_distribuicao;
DROP POLICY IF EXISTS tenant_insert ON public.configuracoes_distribuicao;
DROP POLICY IF EXISTS tenant_update ON public.configuracoes_distribuicao;
DROP POLICY IF EXISTS tenant_delete ON public.configuracoes_distribuicao;

CREATE POLICY tenant_select ON public.configuracoes_distribuicao
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR is_super_admin_v2()
  );
CREATE POLICY tenant_insert ON public.configuracoes_distribuicao
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_update ON public.configuracoes_distribuicao
  FOR UPDATE USING (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_delete ON public.configuracoes_distribuicao
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- ===================== anotacoes_oportunidades =====================
DROP POLICY IF EXISTS tenant_isolation ON public.anotacoes_oportunidades;
DROP POLICY IF EXISTS tenant_insert ON public.anotacoes_oportunidades;
DROP POLICY IF EXISTS tenant_update ON public.anotacoes_oportunidades;
DROP POLICY IF EXISTS tenant_delete ON public.anotacoes_oportunidades;

CREATE POLICY tenant_select ON public.anotacoes_oportunidades
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR is_super_admin_v2()
  );
CREATE POLICY tenant_insert ON public.anotacoes_oportunidades
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_update ON public.anotacoes_oportunidades
  FOR UPDATE USING (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_delete ON public.anotacoes_oportunidades
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- ===================== documentos_oportunidades =====================
DROP POLICY IF EXISTS tenant_isolation ON public.documentos_oportunidades;
DROP POLICY IF EXISTS tenant_insert ON public.documentos_oportunidades;
DROP POLICY IF EXISTS tenant_update ON public.documentos_oportunidades;
DROP POLICY IF EXISTS tenant_delete ON public.documentos_oportunidades;

CREATE POLICY tenant_select ON public.documentos_oportunidades
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR is_super_admin_v2()
  );
CREATE POLICY tenant_insert ON public.documentos_oportunidades
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_update ON public.documentos_oportunidades
  FOR UPDATE USING (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_delete ON public.documentos_oportunidades
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- ===================== emails_oportunidades =====================
DROP POLICY IF EXISTS tenant_isolation ON public.emails_oportunidades;
DROP POLICY IF EXISTS tenant_insert ON public.emails_oportunidades;
DROP POLICY IF EXISTS tenant_update ON public.emails_oportunidades;
DROP POLICY IF EXISTS tenant_delete ON public.emails_oportunidades;

CREATE POLICY tenant_select ON public.emails_oportunidades
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR is_super_admin_v2()
  );
CREATE POLICY tenant_insert ON public.emails_oportunidades
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_update ON public.emails_oportunidades
  FOR UPDATE USING (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_delete ON public.emails_oportunidades
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- ===================== reunioes_oportunidades =====================
DROP POLICY IF EXISTS tenant_isolation ON public.reunioes_oportunidades;
DROP POLICY IF EXISTS tenant_insert ON public.reunioes_oportunidades;
DROP POLICY IF EXISTS tenant_update ON public.reunioes_oportunidades;
DROP POLICY IF EXISTS tenant_delete ON public.reunioes_oportunidades;

CREATE POLICY tenant_select ON public.reunioes_oportunidades
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR is_super_admin_v2()
  );
CREATE POLICY tenant_insert ON public.reunioes_oportunidades
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_update ON public.reunioes_oportunidades
  FOR UPDATE USING (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_delete ON public.reunioes_oportunidades
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- ===================== motivos_noshow =====================
DROP POLICY IF EXISTS tenant_isolation ON public.motivos_noshow;
DROP POLICY IF EXISTS tenant_insert ON public.motivos_noshow;
DROP POLICY IF EXISTS tenant_update ON public.motivos_noshow;
DROP POLICY IF EXISTS tenant_delete ON public.motivos_noshow;

CREATE POLICY tenant_select ON public.motivos_noshow
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR is_super_admin_v2()
  );
CREATE POLICY tenant_insert ON public.motivos_noshow
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_update ON public.motivos_noshow
  FOR UPDATE USING (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_delete ON public.motivos_noshow
  FOR DELETE USING (organizacao_id = get_user_tenant_id());

-- ===================== preferencias_metricas =====================
DROP POLICY IF EXISTS tenant_isolation ON public.preferencias_metricas;
DROP POLICY IF EXISTS tenant_insert ON public.preferencias_metricas;
DROP POLICY IF EXISTS tenant_update ON public.preferencias_metricas;
DROP POLICY IF EXISTS tenant_delete ON public.preferencias_metricas;

CREATE POLICY tenant_select ON public.preferencias_metricas
  FOR SELECT USING (
    organizacao_id = get_user_tenant_id()
    OR is_super_admin_v2()
  );
CREATE POLICY tenant_insert ON public.preferencias_metricas
  FOR INSERT WITH CHECK (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_update ON public.preferencias_metricas
  FOR UPDATE USING (organizacao_id = get_user_tenant_id());
CREATE POLICY tenant_delete ON public.preferencias_metricas
  FOR DELETE USING (organizacao_id = get_user_tenant_id());
