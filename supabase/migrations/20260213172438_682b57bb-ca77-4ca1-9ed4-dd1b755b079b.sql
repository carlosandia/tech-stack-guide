
-- Tabela para contatos bloqueados de pré-oportunidades
CREATE TABLE public.contatos_bloqueados_pre_op (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes_saas(id),
  phone_number VARCHAR NOT NULL,
  phone_name VARCHAR,
  motivo TEXT,
  bloqueado_por UUID REFERENCES public.usuarios(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_bloqueados_pre_op_org_phone 
  ON public.contatos_bloqueados_pre_op(organizacao_id, phone_number);

-- RLS
ALTER TABLE public.contatos_bloqueados_pre_op ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation - select"
  ON public.contatos_bloqueados_pre_op FOR SELECT
  USING (organizacao_id = public.get_user_tenant_id());

CREATE POLICY "Tenant isolation - insert"
  ON public.contatos_bloqueados_pre_op FOR INSERT
  WITH CHECK (organizacao_id = public.get_user_tenant_id());

CREATE POLICY "Tenant isolation - delete"
  ON public.contatos_bloqueados_pre_op FOR DELETE
  USING (organizacao_id = public.get_user_tenant_id());

-- Service role full access para webhook
CREATE POLICY "Service role full access"
  ON public.contatos_bloqueados_pre_op FOR SELECT
  USING (auth.role() = 'service_role');
