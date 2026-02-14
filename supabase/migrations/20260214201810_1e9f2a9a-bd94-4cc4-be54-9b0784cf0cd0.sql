
-- =====================================================
-- Tabela: whatsapp_labels
-- Armazena etiquetas sincronizadas do WhatsApp por tenant
-- =====================================================
CREATE TABLE public.whatsapp_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes_saas(id) ON DELETE CASCADE,
  waha_label_id text NOT NULL,
  nome text NOT NULL,
  cor_hex text,
  cor_codigo integer,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT whatsapp_labels_org_waha_unique UNIQUE (organizacao_id, waha_label_id)
);

-- Índice composto para queries filtradas por tenant
CREATE INDEX idx_whatsapp_labels_org ON public.whatsapp_labels(organizacao_id);

-- Trigger para atualizar atualizado_em
CREATE TRIGGER update_whatsapp_labels_updated_at
  BEFORE UPDATE ON public.whatsapp_labels
  FOR EACH ROW EXECUTE FUNCTION public.update_atualizado_em();

-- RLS
ALTER TABLE public.whatsapp_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_labels_tenant_select" ON public.whatsapp_labels
  FOR SELECT USING (organizacao_id = public.get_user_tenant_id());

CREATE POLICY "whatsapp_labels_tenant_insert" ON public.whatsapp_labels
  FOR INSERT WITH CHECK (organizacao_id = public.get_user_tenant_id());

CREATE POLICY "whatsapp_labels_tenant_update" ON public.whatsapp_labels
  FOR UPDATE USING (organizacao_id = public.get_user_tenant_id());

CREATE POLICY "whatsapp_labels_tenant_delete" ON public.whatsapp_labels
  FOR DELETE USING (organizacao_id = public.get_user_tenant_id());

-- Service role (edge functions)
CREATE POLICY "whatsapp_labels_service_all" ON public.whatsapp_labels
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =====================================================
-- Tabela: conversas_labels
-- Vinculação N:N entre conversas e etiquetas
-- =====================================================
CREATE TABLE public.conversas_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes_saas(id) ON DELETE CASCADE,
  conversa_id uuid NOT NULL REFERENCES public.conversas(id) ON DELETE CASCADE,
  label_id uuid NOT NULL REFERENCES public.whatsapp_labels(id) ON DELETE CASCADE,
  criado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversas_labels_unique UNIQUE (conversa_id, label_id)
);

-- Índices compostos
CREATE INDEX idx_conversas_labels_org_conversa ON public.conversas_labels(organizacao_id, conversa_id);
CREATE INDEX idx_conversas_labels_org_label ON public.conversas_labels(organizacao_id, label_id);

-- RLS
ALTER TABLE public.conversas_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversas_labels_tenant_select" ON public.conversas_labels
  FOR SELECT USING (organizacao_id = public.get_user_tenant_id());

CREATE POLICY "conversas_labels_tenant_insert" ON public.conversas_labels
  FOR INSERT WITH CHECK (organizacao_id = public.get_user_tenant_id());

CREATE POLICY "conversas_labels_tenant_delete" ON public.conversas_labels
  FOR DELETE USING (organizacao_id = public.get_user_tenant_id());

-- Service role (edge functions)
CREATE POLICY "conversas_labels_service_all" ON public.conversas_labels
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Habilitar Realtime para ambas tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_labels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversas_labels;
