-- AIDEV-NOTE: Trigger para herdar origem do contato quando oportunidade é criada sem origem explícita
-- Isso cobre o caso de oportunidades criadas por automações/triggers que não setam origem

CREATE OR REPLACE FUNCTION public.herdar_origem_contato_oportunidade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Se a oportunidade foi criada sem origem ou com 'manual' (default), herdar do contato
  IF NEW.origem IS NULL OR NEW.origem = 'manual' THEN
    -- Só herdar se o contato tiver uma origem diferente de 'manual'
    SELECT CASE 
      WHEN c.origem IS NOT NULL AND c.origem != 'manual' THEN c.origem
      ELSE NEW.origem
    END INTO NEW.origem
    FROM contatos c
    WHERE c.id = NEW.contato_id;
  END IF;

  RETURN NEW;
END;
$function$;

-- Trigger BEFORE INSERT para herdar origem antes de salvar
-- Prioridade menor que o trigger de config pipeline (que roda AFTER)
DROP TRIGGER IF EXISTS trg_herdar_origem_contato ON oportunidades;
CREATE TRIGGER trg_herdar_origem_contato
  BEFORE INSERT ON oportunidades
  FOR EACH ROW
  EXECUTE FUNCTION herdar_origem_contato_oportunidade();