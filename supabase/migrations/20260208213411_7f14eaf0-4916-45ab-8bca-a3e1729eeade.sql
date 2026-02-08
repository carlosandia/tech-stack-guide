
-- =====================================================
-- PRD-11: Caixa de Entrada de Email - TABELAS
-- =====================================================

-- 1. TABELA: emails_recebidos
CREATE TABLE public.emails_recebidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes_saas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  conexao_email_id UUID REFERENCES public.conexoes_email(id) ON DELETE SET NULL,
  message_id TEXT NOT NULL,
  thread_id TEXT,
  provider_id TEXT,
  de_email TEXT NOT NULL,
  de_nome TEXT,
  para_email TEXT NOT NULL,
  cc_email TEXT,
  bcc_email TEXT,
  assunto TEXT,
  preview TEXT,
  corpo_texto TEXT,
  corpo_html TEXT,
  tem_anexos BOOLEAN NOT NULL DEFAULT false,
  anexos_info JSONB DEFAULT '[]'::jsonb,
  pasta TEXT NOT NULL DEFAULT 'inbox' CHECK (pasta IN ('inbox', 'sent', 'drafts', 'archived', 'trash')),
  lido BOOLEAN NOT NULL DEFAULT false,
  favorito BOOLEAN NOT NULL DEFAULT false,
  contato_id UUID REFERENCES public.contatos(id) ON DELETE SET NULL,
  oportunidade_id UUID REFERENCES public.oportunidades(id) ON DELETE SET NULL,
  data_email TIMESTAMPTZ NOT NULL DEFAULT now(),
  sincronizado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  deletado_em TIMESTAMPTZ,
  CONSTRAINT uq_emails_recebidos_message UNIQUE (organizacao_id, usuario_id, message_id)
);

-- 2. TABELA: emails_rascunhos
CREATE TABLE public.emails_rascunhos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes_saas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'novo' CHECK (tipo IN ('novo', 'resposta', 'encaminhar')),
  email_original_id UUID REFERENCES public.emails_recebidos(id) ON DELETE SET NULL,
  para_email TEXT,
  cc_email TEXT,
  bcc_email TEXT,
  assunto TEXT,
  corpo_html TEXT,
  anexos_temp JSONB DEFAULT '[]'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  deletado_em TIMESTAMPTZ
);

-- 3. TABELA: emails_tracking
CREATE TABLE public.emails_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes_saas(id) ON DELETE CASCADE,
  email_id UUID REFERENCES public.emails_recebidos(id) ON DELETE CASCADE,
  message_id TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('enviado', 'entregue', 'aberto', 'clicado')),
  contador INTEGER NOT NULL DEFAULT 0,
  ip INET,
  user_agent TEXT,
  primeira_vez TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultima_vez TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABELA: emails_assinaturas
CREATE TABLE public.emails_assinaturas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes_saas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  assinatura_html TEXT,
  incluir_em_respostas BOOLEAN NOT NULL DEFAULT true,
  incluir_em_novos BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_emails_assinatura_usuario UNIQUE (organizacao_id, usuario_id)
);

-- 5. TABELA: emails_sync_estado
CREATE TABLE public.emails_sync_estado (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes_saas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  conexao_email_id UUID REFERENCES public.conexoes_email(id) ON DELETE CASCADE,
  ultimo_sync TIMESTAMPTZ,
  ultimo_history_id TEXT,
  ultimo_uid_validity BIGINT,
  ultimo_uid BIGINT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'sincronizando', 'ok', 'erro')),
  erro_mensagem TEXT,
  tentativas_erro INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDICES
CREATE INDEX idx_emails_tenant_user_pasta ON public.emails_recebidos (organizacao_id, usuario_id, pasta, data_email DESC);
CREATE INDEX idx_emails_tenant_user_lido ON public.emails_recebidos (organizacao_id, usuario_id, lido);
CREATE INDEX idx_emails_contato ON public.emails_recebidos (contato_id);
CREATE INDEX idx_emails_message_id ON public.emails_recebidos (message_id);
CREATE INDEX idx_emails_busca ON public.emails_recebidos USING GIN (to_tsvector('portuguese', COALESCE(assunto, '') || ' ' || COALESCE(corpo_texto, '')));
CREATE INDEX idx_tracking_message ON public.emails_tracking (message_id);
CREATE INDEX idx_emails_rascunhos_user ON public.emails_rascunhos (organizacao_id, usuario_id);
CREATE INDEX idx_emails_sync_user ON public.emails_sync_estado (organizacao_id, usuario_id);

-- RLS: emails_recebidos
ALTER TABLE public.emails_recebidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve seus proprios emails"
  ON public.emails_recebidos FOR SELECT
  USING (organizacao_id = get_user_tenant_id() AND usuario_id = get_current_usuario_id());

CREATE POLICY "Usuario insere seus proprios emails"
  ON public.emails_recebidos FOR INSERT
  WITH CHECK (organizacao_id = get_user_tenant_id() AND usuario_id = get_current_usuario_id());

CREATE POLICY "Usuario atualiza seus proprios emails"
  ON public.emails_recebidos FOR UPDATE
  USING (organizacao_id = get_user_tenant_id() AND usuario_id = get_current_usuario_id());

CREATE POLICY "Usuario deleta seus proprios emails"
  ON public.emails_recebidos FOR DELETE
  USING (organizacao_id = get_user_tenant_id() AND usuario_id = get_current_usuario_id());

-- RLS: emails_rascunhos
ALTER TABLE public.emails_rascunhos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve seus proprios rascunhos"
  ON public.emails_rascunhos FOR SELECT
  USING (organizacao_id = get_user_tenant_id() AND usuario_id = get_current_usuario_id());

CREATE POLICY "Usuario insere seus proprios rascunhos"
  ON public.emails_rascunhos FOR INSERT
  WITH CHECK (organizacao_id = get_user_tenant_id() AND usuario_id = get_current_usuario_id());

CREATE POLICY "Usuario atualiza seus proprios rascunhos"
  ON public.emails_rascunhos FOR UPDATE
  USING (organizacao_id = get_user_tenant_id() AND usuario_id = get_current_usuario_id());

CREATE POLICY "Usuario deleta seus proprios rascunhos"
  ON public.emails_rascunhos FOR DELETE
  USING (organizacao_id = get_user_tenant_id() AND usuario_id = get_current_usuario_id());

-- RLS: emails_tracking
ALTER TABLE public.emails_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant ve tracking dos seus emails"
  ON public.emails_tracking FOR SELECT
  USING (organizacao_id = get_user_tenant_id());

CREATE POLICY "Tenant insere tracking"
  ON public.emails_tracking FOR INSERT
  WITH CHECK (organizacao_id = get_user_tenant_id());

CREATE POLICY "Tenant atualiza tracking"
  ON public.emails_tracking FOR UPDATE
  USING (organizacao_id = get_user_tenant_id());

-- RLS: emails_assinaturas
ALTER TABLE public.emails_assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve sua assinatura"
  ON public.emails_assinaturas FOR SELECT
  USING (organizacao_id = get_user_tenant_id() AND usuario_id = get_current_usuario_id());

CREATE POLICY "Usuario insere sua assinatura"
  ON public.emails_assinaturas FOR INSERT
  WITH CHECK (organizacao_id = get_user_tenant_id() AND usuario_id = get_current_usuario_id());

CREATE POLICY "Usuario atualiza sua assinatura"
  ON public.emails_assinaturas FOR UPDATE
  USING (organizacao_id = get_user_tenant_id() AND usuario_id = get_current_usuario_id());

-- RLS: emails_sync_estado
ALTER TABLE public.emails_sync_estado ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve seu sync estado"
  ON public.emails_sync_estado FOR SELECT
  USING (organizacao_id = get_user_tenant_id() AND usuario_id = get_current_usuario_id());

CREATE POLICY "Usuario insere seu sync estado"
  ON public.emails_sync_estado FOR INSERT
  WITH CHECK (organizacao_id = get_user_tenant_id() AND usuario_id = get_current_usuario_id());

CREATE POLICY "Usuario atualiza seu sync estado"
  ON public.emails_sync_estado FOR UPDATE
  USING (organizacao_id = get_user_tenant_id() AND usuario_id = get_current_usuario_id());

-- TRIGGERS (atualizado_em)
CREATE TRIGGER set_emails_recebidos_atualizado_em
  BEFORE UPDATE ON public.emails_recebidos
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_atualizado_em();

CREATE TRIGGER set_emails_rascunhos_atualizado_em
  BEFORE UPDATE ON public.emails_rascunhos
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_atualizado_em();

CREATE TRIGGER set_emails_assinaturas_atualizado_em
  BEFORE UPDATE ON public.emails_assinaturas
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_atualizado_em();

CREATE TRIGGER set_emails_sync_estado_atualizado_em
  BEFORE UPDATE ON public.emails_sync_estado
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_atualizado_em();
