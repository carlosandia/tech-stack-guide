
-- Tabela para rastrear sessões de impersonação
-- AIDEV-NOTE: Conforme plano de impersonação PRD-14
CREATE TABLE public.sessoes_impersonacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_id uuid NOT NULL REFERENCES public.usuarios(id),
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes_saas(id),
  admin_alvo_id uuid NOT NULL REFERENCES public.usuarios(id),
  motivo text NOT NULL,
  token_hash text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  expira_em timestamptz NOT NULL,
  encerrado_em timestamptz,
  ip_origem text,
  user_agent text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- Índices compostos
CREATE INDEX idx_sessoes_impersonacao_org ON public.sessoes_impersonacao(organizacao_id, criado_em DESC);
CREATE INDEX idx_sessoes_impersonacao_admin ON public.sessoes_impersonacao(super_admin_id, criado_em DESC);
CREATE INDEX idx_sessoes_impersonacao_ativo ON public.sessoes_impersonacao(ativo, expira_em) WHERE ativo = true;

-- RLS: Acesso exclusivo via service_role (Edge Functions)
ALTER TABLE public.sessoes_impersonacao ENABLE ROW LEVEL SECURITY;

-- Nenhuma policy para anon/authenticated — só service_role acessa
