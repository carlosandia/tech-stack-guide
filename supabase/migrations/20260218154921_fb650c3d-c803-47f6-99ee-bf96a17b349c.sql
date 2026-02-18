-- AIDEV-NOTE: Função RPC para batch update de posições em uma única transação
-- Substitui N updates individuais por 1 roundtrip (Plano de Escala 1.2)

CREATE OR REPLACE FUNCTION public.reordenar_posicoes_etapa(items jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  item jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(items)
  LOOP
    UPDATE oportunidades
    SET posicao = (item->>'posicao')::int
    WHERE id = (item->>'id')::uuid;
  END LOOP;
END;
$$;