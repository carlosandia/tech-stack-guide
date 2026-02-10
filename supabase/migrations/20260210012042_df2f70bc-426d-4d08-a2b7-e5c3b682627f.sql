
-- Tabela para registrar cada abertura individual de email
CREATE TABLE public.email_aberturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id uuid NOT NULL REFERENCES public.emails_recebidos(id) ON DELETE CASCADE,
  tracking_id uuid NOT NULL,
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes_saas(id),
  ip text,
  user_agent text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- Índices compostos para performance
CREATE INDEX idx_email_aberturas_email_id ON public.email_aberturas(email_id);
CREATE INDEX idx_email_aberturas_tracking ON public.email_aberturas(tracking_id);
CREATE INDEX idx_email_aberturas_org ON public.email_aberturas(organizacao_id, criado_em DESC);

-- RLS
ALTER TABLE public.email_aberturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_email_aberturas" ON public.email_aberturas
  FOR SELECT USING (organizacao_id = get_user_tenant_id());

-- Atualizar função para registrar abertura na nova tabela + atualizar contadores
CREATE OR REPLACE FUNCTION public.registrar_abertura_email(p_tracking_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_email RECORD;
BEGIN
  -- Buscar email pelo tracking_id
  SELECT id, organizacao_id INTO v_email
  FROM emails_recebidos
  WHERE tracking_id = p_tracking_id::uuid
  LIMIT 1;

  IF v_email IS NULL THEN
    RETURN;
  END IF;

  -- Registrar abertura individual
  INSERT INTO email_aberturas (email_id, tracking_id, organizacao_id)
  VALUES (v_email.id, p_tracking_id::uuid, v_email.organizacao_id);

  -- Atualizar contadores no email
  UPDATE emails_recebidos
  SET
    aberto_em = COALESCE(aberto_em, now()),
    total_aberturas = COALESCE(total_aberturas, 0) + 1
  WHERE id = v_email.id;
END;
$function$;
