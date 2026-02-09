
-- Função para registrar abertura de email (chamada pela edge function email-tracking)
CREATE OR REPLACE FUNCTION public.registrar_abertura_email(p_tracking_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE emails_recebidos
  SET
    aberto_em = COALESCE(aberto_em, now()),
    total_aberturas = COALESCE(total_aberturas, 0) + 1
  WHERE tracking_id = p_tracking_id::uuid;
END;
$$;
