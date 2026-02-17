
-- Tabela de logs para debug/auditoria de webhooks de entrada
CREATE TABLE public.webhooks_entrada_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes_saas(id),
  webhook_id uuid NOT NULL REFERENCES public.webhooks_entrada(id),
  payload jsonb NOT NULL DEFAULT '{}',
  headers jsonb DEFAULT '{}',
  ip_origem text,
  status_code integer NOT NULL DEFAULT 200,
  processado boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- Índice composto para isolamento de tenant + consulta por webhook
CREATE INDEX idx_webhooks_entrada_logs_org_webhook 
  ON public.webhooks_entrada_logs(organizacao_id, webhook_id, criado_em DESC);

-- Índice para polling de debug (buscar não processados recentes)
CREATE INDEX idx_webhooks_entrada_logs_recentes 
  ON public.webhooks_entrada_logs(webhook_id, criado_em DESC) 
  WHERE processado = false;

-- RLS
ALTER TABLE public.webhooks_entrada_logs ENABLE ROW LEVEL SECURITY;

-- Política: usuários do tenant podem ler logs
CREATE POLICY "Tenant pode ler logs de webhook"
  ON public.webhooks_entrada_logs
  FOR SELECT
  USING (organizacao_id = public.get_user_tenant_id());

-- Política: service_role pode inserir (Edge Function)
CREATE POLICY "Service role pode inserir logs"
  ON public.webhooks_entrada_logs
  FOR INSERT
  WITH CHECK (true);
