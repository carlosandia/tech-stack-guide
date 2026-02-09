
-- Tabela conexoes_api4com para armazenar token da organizacao
CREATE TABLE public.conexoes_api4com (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes_saas(id) ON DELETE CASCADE,
  access_token_encrypted TEXT NOT NULL,
  api_url TEXT NOT NULL DEFAULT 'https://api.api4com.com.br',
  status TEXT NOT NULL DEFAULT 'desconectado' CHECK (status IN ('conectado', 'desconectado', 'erro')),
  conectado_em TIMESTAMPTZ,
  ultimo_erro TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  deletado_em TIMESTAMPTZ,
  UNIQUE (organizacao_id)
);

ALTER TABLE public.conexoes_api4com ENABLE ROW LEVEL SECURITY;

-- Apenas admin do tenant pode gerenciar
CREATE POLICY "Admin ve conexao api4com do tenant"
  ON public.conexoes_api4com FOR SELECT
  TO authenticated
  USING (organizacao_id = public.get_user_tenant_id());

CREATE POLICY "Admin insere conexao api4com"
  ON public.conexoes_api4com FOR INSERT
  TO authenticated
  WITH CHECK (organizacao_id = public.get_user_tenant_id() AND public.is_tenant_admin());

CREATE POLICY "Admin atualiza conexao api4com"
  ON public.conexoes_api4com FOR UPDATE
  TO authenticated
  USING (organizacao_id = public.get_user_tenant_id() AND public.is_tenant_admin());

CREATE POLICY "Admin deleta conexao api4com"
  ON public.conexoes_api4com FOR DELETE
  TO authenticated
  USING (organizacao_id = public.get_user_tenant_id() AND public.is_tenant_admin());

CREATE TRIGGER set_conexoes_api4com_atualizado_em
  BEFORE UPDATE ON public.conexoes_api4com
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_atualizado_em();
