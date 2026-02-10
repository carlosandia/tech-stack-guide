
-- AIDEV-NOTE: Corrigir warnings de segurança - habilitar RLS em tabelas filhas de formulários
-- Essas tabelas não possuem organizacao_id próprio, isolamento via formulario_id → formularios.organizacao_id

-- 1. Função SECURITY DEFINER para verificar ownership do formulário
CREATE OR REPLACE FUNCTION public.formulario_pertence_ao_tenant(_formulario_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.formularios f
    WHERE f.id = _formulario_id
      AND f.organizacao_id = public.get_user_tenant_id()
      AND f.deletado_em IS NULL
  )
$$;

-- 2. Habilitar RLS em todas as tabelas filhas

-- campos_formularios
ALTER TABLE public.campos_formularios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON public.campos_formularios
  FOR SELECT USING (public.formulario_pertence_ao_tenant(formulario_id));

CREATE POLICY "tenant_isolation_insert" ON public.campos_formularios
  FOR INSERT WITH CHECK (public.formulario_pertence_ao_tenant(formulario_id));

CREATE POLICY "tenant_isolation_update" ON public.campos_formularios
  FOR UPDATE USING (public.formulario_pertence_ao_tenant(formulario_id));

CREATE POLICY "tenant_isolation_delete" ON public.campos_formularios
  FOR DELETE USING (public.formulario_pertence_ao_tenant(formulario_id));

-- config_newsletter_formularios
ALTER TABLE public.config_newsletter_formularios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON public.config_newsletter_formularios
  FOR SELECT USING (public.formulario_pertence_ao_tenant(formulario_id));

CREATE POLICY "tenant_isolation_insert" ON public.config_newsletter_formularios
  FOR INSERT WITH CHECK (public.formulario_pertence_ao_tenant(formulario_id));

CREATE POLICY "tenant_isolation_update" ON public.config_newsletter_formularios
  FOR UPDATE USING (public.formulario_pertence_ao_tenant(formulario_id));

CREATE POLICY "tenant_isolation_delete" ON public.config_newsletter_formularios
  FOR DELETE USING (public.formulario_pertence_ao_tenant(formulario_id));

-- config_popup_formularios
ALTER TABLE public.config_popup_formularios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON public.config_popup_formularios
  FOR SELECT USING (public.formulario_pertence_ao_tenant(formulario_id));

CREATE POLICY "tenant_isolation_insert" ON public.config_popup_formularios
  FOR INSERT WITH CHECK (public.formulario_pertence_ao_tenant(formulario_id));

CREATE POLICY "tenant_isolation_update" ON public.config_popup_formularios
  FOR UPDATE USING (public.formulario_pertence_ao_tenant(formulario_id));

CREATE POLICY "tenant_isolation_delete" ON public.config_popup_formularios
  FOR DELETE USING (public.formulario_pertence_ao_tenant(formulario_id));

-- estilos_formularios
ALTER TABLE public.estilos_formularios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON public.estilos_formularios
  FOR SELECT USING (public.formulario_pertence_ao_tenant(formulario_id));

CREATE POLICY "tenant_isolation_insert" ON public.estilos_formularios
  FOR INSERT WITH CHECK (public.formulario_pertence_ao_tenant(formulario_id));

CREATE POLICY "tenant_isolation_update" ON public.estilos_formularios
  FOR UPDATE USING (public.formulario_pertence_ao_tenant(formulario_id));

CREATE POLICY "tenant_isolation_delete" ON public.estilos_formularios
  FOR DELETE USING (public.formulario_pertence_ao_tenant(formulario_id));

-- etapas_formularios
ALTER TABLE public.etapas_formularios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON public.etapas_formularios
  FOR SELECT USING (public.formulario_pertence_ao_tenant(formulario_id));

CREATE POLICY "tenant_isolation_insert" ON public.etapas_formularios
  FOR INSERT WITH CHECK (public.formulario_pertence_ao_tenant(formulario_id));

CREATE POLICY "tenant_isolation_update" ON public.etapas_formularios
  FOR UPDATE USING (public.formulario_pertence_ao_tenant(formulario_id));

CREATE POLICY "tenant_isolation_delete" ON public.etapas_formularios
  FOR DELETE USING (public.formulario_pertence_ao_tenant(formulario_id));

-- rate_limits_formularios
ALTER TABLE public.rate_limits_formularios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON public.rate_limits_formularios
  FOR SELECT USING (public.formulario_pertence_ao_tenant(formulario_id));

CREATE POLICY "tenant_isolation_insert" ON public.rate_limits_formularios
  FOR INSERT WITH CHECK (public.formulario_pertence_ao_tenant(formulario_id));

CREATE POLICY "tenant_isolation_update" ON public.rate_limits_formularios
  FOR UPDATE USING (public.formulario_pertence_ao_tenant(formulario_id));

CREATE POLICY "tenant_isolation_delete" ON public.rate_limits_formularios
  FOR DELETE USING (public.formulario_pertence_ao_tenant(formulario_id));

-- 3. Manter políticas anon existentes para formulários publicados (campos e estilos)
-- As políticas anon_select_campos_formularios_publicados e anon_select_estilos_formularios_publicados
-- já existem e continuam funcionando para acesso público de formulários publicados.

-- 4. Sobre os WARNINGs de policies com "true":
-- audit_log INSERT com true: intencional - audit log precisa aceitar inserts de qualquer contexto
-- submissoes_formularios INSERT com true: intencional - submissões são feitas por visitantes anônimos
