
-- AIDEV-NOTE: Funcao dedicada para emitir evento reuniao_agendada no motor de automacao
-- Nao altera emitir_evento_automacao existente para evitar regressao
CREATE OR REPLACE FUNCTION public.emitir_evento_reuniao_agendada()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_contato_id uuid;
BEGIN
  -- Buscar contato_id da oportunidade vinculada
  SELECT contato_id INTO v_contato_id
  FROM oportunidades
  WHERE id = NEW.oportunidade_id
  LIMIT 1;

  INSERT INTO eventos_automacao (organizacao_id, tipo, entidade_tipo, entidade_id, dados)
  VALUES (
    NEW.organizacao_id,
    'reuniao_agendada',
    'reuniao',
    NEW.id,
    jsonb_build_object(
      'titulo', NEW.titulo,
      'oportunidade_id', NEW.oportunidade_id,
      'contato_id', v_contato_id,
      'tipo', NEW.tipo,
      'data_inicio', NEW.data_inicio
    )
  );

  RETURN NEW;
END;
$$;

-- Trigger AFTER INSERT na tabela reunioes_oportunidades
CREATE TRIGGER trigger_reuniao_agendada_automacao
  AFTER INSERT ON reunioes_oportunidades
  FOR EACH ROW
  EXECUTE FUNCTION emitir_evento_reuniao_agendada();
