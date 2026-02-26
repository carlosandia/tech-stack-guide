
-- Tabela de visualizações salvas do dashboard
CREATE TABLE public.visualizacoes_dashboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes_saas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  filtros jsonb NOT NULL DEFAULT '{}'::jsonb,
  config_exibicao jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

-- Índice composto para queries por tenant + usuario
CREATE INDEX idx_visualizacoes_dashboard_org_user
  ON public.visualizacoes_dashboard(organizacao_id, usuario_id);

-- RLS
ALTER TABLE public.visualizacoes_dashboard ENABLE ROW LEVEL SECURITY;

-- Política: usuario só vê/edita suas próprias visualizações dentro do tenant
CREATE POLICY "visualizacoes_dashboard_select" ON public.visualizacoes_dashboard
  FOR SELECT USING (
    organizacao_id = public.get_user_tenant_id()
    AND usuario_id = public.get_current_usuario_id()
  );

CREATE POLICY "visualizacoes_dashboard_insert" ON public.visualizacoes_dashboard
  FOR INSERT WITH CHECK (
    organizacao_id = public.get_user_tenant_id()
    AND usuario_id = public.get_current_usuario_id()
  );

CREATE POLICY "visualizacoes_dashboard_update" ON public.visualizacoes_dashboard
  FOR UPDATE USING (
    organizacao_id = public.get_user_tenant_id()
    AND usuario_id = public.get_current_usuario_id()
  );

CREATE POLICY "visualizacoes_dashboard_delete" ON public.visualizacoes_dashboard
  FOR DELETE USING (
    organizacao_id = public.get_user_tenant_id()
    AND usuario_id = public.get_current_usuario_id()
  );
