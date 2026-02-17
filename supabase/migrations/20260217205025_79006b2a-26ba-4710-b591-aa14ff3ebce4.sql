
-- Tabela de pré-cadastros (leads pre-checkout)
-- AIDEV-NOTE: Conforme plano de captura de leads pre-checkout
CREATE TABLE public.pre_cadastros_saas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_contato varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  telefone varchar(50),
  nome_empresa varchar(255) NOT NULL,
  segmento varchar(100) NOT NULL,
  plano_id uuid REFERENCES public.planos(id),
  periodo varchar(10) DEFAULT 'mensal',
  is_trial boolean DEFAULT false,
  status varchar(20) DEFAULT 'pendente',
  stripe_session_id varchar(255),
  organizacao_id uuid REFERENCES public.organizacoes_saas(id),
  utms jsonb DEFAULT '{}',
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_pre_cadastro_status CHECK (status IN ('pendente', 'checkout_iniciado', 'convertido', 'expirado'))
);

-- Indices
CREATE INDEX idx_pre_cadastros_status ON public.pre_cadastros_saas(status);
CREATE INDEX idx_pre_cadastros_email ON public.pre_cadastros_saas(email);

-- RLS
ALTER TABLE public.pre_cadastros_saas ENABLE ROW LEVEL SECURITY;

-- Anon pode inserir (formulário público)
CREATE POLICY "anon_insert_pre_cadastro" ON public.pre_cadastros_saas
  FOR INSERT TO anon WITH CHECK (true);

-- Super admin pode ver e atualizar tudo
CREATE POLICY "super_admin_all_pre_cadastro" ON public.pre_cadastros_saas
  FOR ALL USING (public.is_super_admin_v2());

-- Service role (edge functions) pode tudo - implícito via service_role

-- Trigger para atualizar atualizado_em
CREATE TRIGGER set_pre_cadastros_atualizado_em
  BEFORE UPDATE ON public.pre_cadastros_saas
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_atualizado_em();
