-- Drop da versão antiga (4 params) que causa ambiguidade com a nova (5 params)
DROP FUNCTION IF EXISTS public.fn_heatmap_atendimento(uuid, timestamptz, timestamptz, text);

-- Recriar apenas a versão com 5 params (p_tipo incluso)
CREATE OR REPLACE FUNCTION public.fn_heatmap_atendimento(
  p_organizacao_id uuid,
  p_periodo_inicio timestamptz,
  p_periodo_fim timestamptz,
  p_canal text DEFAULT NULL,
  p_tipo text DEFAULT NULL
)
RETURNS TABLE(dia_semana int, hora int, total bigint)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    EXTRACT(DOW FROM m.criado_em)::int AS dia_semana,
    EXTRACT(HOUR FROM m.criado_em)::int AS hora,
    COUNT(*)::bigint AS total
  FROM mensagens m
  JOIN conversas c ON c.id = m.conversa_id
  WHERE c.organizacao_id = p_organizacao_id
    AND m.criado_em BETWEEN p_periodo_inicio AND p_periodo_fim
    AND c.deletado_em IS NULL
    AND m.from_me = false
    AND c.tipo != 'canal'
    AND (p_canal IS NULL OR c.canal = p_canal)
    AND (p_tipo IS NULL OR c.tipo = p_tipo)
  GROUP BY 1, 2
  ORDER BY 1, 2;
$$;