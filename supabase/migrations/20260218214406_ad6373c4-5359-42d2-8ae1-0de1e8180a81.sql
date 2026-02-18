CREATE OR REPLACE FUNCTION public.emitir_evento_email_recebido()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO eventos_automacao (organizacao_id, tipo, entidade_tipo, entidade_id, dados)
    VALUES (NEW.organizacao_id, 'email_recebido', 'email', NEW.id,
      jsonb_build_object(
        'remetente', NEW.de_email,
        'assunto', NEW.assunto,
        'contato_id', NEW.contato_id,
        'oportunidade_id', NEW.oportunidade_id
      ));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';