-- AIDEV-NOTE: GAP 7 — Trigger SQL para emitir evento email_recebido
CREATE OR REPLACE FUNCTION public.emitir_evento_email_recebido()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO eventos_automacao (organizacao_id, tipo, entidade_tipo, entidade_id, dados)
    VALUES (NEW.organizacao_id, 'email_recebido', 'email', NEW.id,
      jsonb_build_object(
        'remetente', NEW.remetente,
        'assunto', NEW.assunto,
        'contato_id', NEW.contato_id,
        'oportunidade_id', NEW.oportunidade_id
      ));
  END IF;
  RETURN NEW;
END;
$function$;

-- Criar trigger na tabela emails_recebidos
DROP TRIGGER IF EXISTS trg_emitir_evento_email_recebido ON emails_recebidos;
CREATE TRIGGER trg_emitir_evento_email_recebido
  AFTER INSERT ON emails_recebidos
  FOR EACH ROW
  EXECUTE FUNCTION emitir_evento_email_recebido();