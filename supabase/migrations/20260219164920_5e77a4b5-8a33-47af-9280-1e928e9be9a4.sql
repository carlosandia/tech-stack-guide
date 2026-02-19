
-- Tabela para salvar preferências de filtros do Kanban
CREATE TABLE public.preferencias_filtros_kanban (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes_saas(id),
  nome TEXT NOT NULL,
  filtros JSONB NOT NULL DEFAULT '{}'::jsonb,
  padrao BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(usuario_id, organizacao_id, nome)
);

-- RLS
ALTER TABLE public.preferencias_filtros_kanban ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios veem seus proprios filtros"
  ON public.preferencias_filtros_kanban FOR SELECT
  USING (usuario_id = public.get_current_usuario_id());

CREATE POLICY "Usuarios criam seus proprios filtros"
  ON public.preferencias_filtros_kanban FOR INSERT
  WITH CHECK (usuario_id = public.get_current_usuario_id());

CREATE POLICY "Usuarios atualizam seus proprios filtros"
  ON public.preferencias_filtros_kanban FOR UPDATE
  USING (usuario_id = public.get_current_usuario_id());

CREATE POLICY "Usuarios deletam seus proprios filtros"
  ON public.preferencias_filtros_kanban FOR DELETE
  USING (usuario_id = public.get_current_usuario_id());

-- Trigger updated_at
CREATE TRIGGER set_atualizado_em_preferencias_filtros
  BEFORE UPDATE ON public.preferencias_filtros_kanban
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_atualizado_em();

-- Index
CREATE INDEX idx_preferencias_filtros_kanban_usuario ON public.preferencias_filtros_kanban(usuario_id, organizacao_id);
