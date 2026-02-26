
-- Atualizar fn_dashboard_metricas_gerais para incluir motivos_ganho
CREATE OR REPLACE FUNCTION public.fn_dashboard_metricas_gerais(
  p_organizacao_id uuid,
  p_periodo_inicio timestamptz,
  p_periodo_fim timestamptz,
  p_funil_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_perda_ids uuid[];
  v_ganho_ids uuid[];
  v_perdas bigint;
  v_ganhos bigint;
  v_valor_perdas numeric;
  v_tarefas_abertas bigint;
  v_total_historico bigint;
  v_motivos_perda json;
  v_motivos_ganho json;
  v_produtos_ranking json;
BEGIN
  SELECT COALESCE(array_agg(id), '{}') INTO v_perda_ids
  FROM etapas_funil
  WHERE organizacao_id = p_organizacao_id AND tipo = 'perda';

  SELECT COALESCE(array_agg(id), '{}') INTO v_ganho_ids
  FROM etapas_funil
  WHERE organizacao_id = p_organizacao_id AND tipo = 'ganho';

  SELECT COUNT(*), COALESCE(SUM(valor), 0)
  INTO v_perdas, v_valor_perdas
  FROM oportunidades
  WHERE organizacao_id = p_organizacao_id
    AND etapa_id = ANY(v_perda_ids)
    AND fechado_em >= p_periodo_inicio
    AND fechado_em <= p_periodo_fim
    AND deletado_em IS NULL
    AND (p_funil_id IS NULL OR funil_id = p_funil_id);

  -- Contar ganhos para percentual
  SELECT COUNT(*) INTO v_ganhos
  FROM oportunidades
  WHERE organizacao_id = p_organizacao_id
    AND etapa_id = ANY(v_ganho_ids)
    AND fechado_em >= p_periodo_inicio
    AND fechado_em <= p_periodo_fim
    AND deletado_em IS NULL
    AND (p_funil_id IS NULL OR funil_id = p_funil_id);

  SELECT COUNT(*) INTO v_tarefas_abertas
  FROM tarefas
  WHERE organizacao_id = p_organizacao_id
    AND status IN ('pendente', 'em_andamento')
    AND deletado_em IS NULL;

  SELECT COUNT(*) INTO v_total_historico
  FROM oportunidades
  WHERE organizacao_id = p_organizacao_id
    AND deletado_em IS NULL
    AND (p_funil_id IS NULL OR funil_id = p_funil_id);

  -- Motivos de perda (top 10)
  SELECT COALESCE(json_agg(row_to_json(mp) ORDER BY (mp).quantidade DESC), '[]'::json)
  INTO v_motivos_perda
  FROM (
    SELECT
      COALESCE(mr.nome, 'Sem motivo') AS nome,
      COALESCE(mr.cor, '#9CA3AF') AS cor,
      COUNT(*) AS quantidade,
      CASE
        WHEN v_perdas > 0 THEN ROUND(COUNT(*)::numeric / v_perdas::numeric * 100, 1)
        ELSE 0
      END AS percentual
    FROM oportunidades o
    LEFT JOIN motivos_resultado mr ON mr.id = o.motivo_resultado_id
    WHERE o.organizacao_id = p_organizacao_id
      AND o.etapa_id = ANY(v_perda_ids)
      AND o.fechado_em >= p_periodo_inicio
      AND o.fechado_em <= p_periodo_fim
      AND o.deletado_em IS NULL
      AND (p_funil_id IS NULL OR o.funil_id = p_funil_id)
    GROUP BY mr.nome, mr.cor
    ORDER BY COUNT(*) DESC
    LIMIT 10
  ) mp;

  -- Motivos de ganho (top 10)
  SELECT COALESCE(json_agg(row_to_json(mg) ORDER BY (mg).quantidade DESC), '[]'::json)
  INTO v_motivos_ganho
  FROM (
    SELECT
      COALESCE(mr.nome, 'Sem motivo') AS nome,
      COALESCE(mr.cor, '#10B981') AS cor,
      COUNT(*) AS quantidade,
      CASE
        WHEN v_ganhos > 0 THEN ROUND(COUNT(*)::numeric / v_ganhos::numeric * 100, 1)
        ELSE 0
      END AS percentual
    FROM oportunidades o
    LEFT JOIN motivos_resultado mr ON mr.id = o.motivo_resultado_id
    WHERE o.organizacao_id = p_organizacao_id
      AND o.etapa_id = ANY(v_ganho_ids)
      AND o.fechado_em >= p_periodo_inicio
      AND o.fechado_em <= p_periodo_fim
      AND o.deletado_em IS NULL
      AND (p_funil_id IS NULL OR o.funil_id = p_funil_id)
    GROUP BY mr.nome, mr.cor
    ORDER BY COUNT(*) DESC
    LIMIT 10
  ) mg;

  -- AIDEV-NOTE: coluna correta é 'subtotal' (não 'valor_total')
  SELECT COALESCE(json_agg(row_to_json(pr) ORDER BY (pr).quantidade DESC), '[]'::json)
  INTO v_produtos_ranking
  FROM (
    SELECT
      p.nome AS nome,
      SUM(op.quantidade)::bigint AS quantidade,
      SUM(op.subtotal)::numeric AS receita
    FROM oportunidades_produtos op
    JOIN produtos p ON p.id = op.produto_id
    JOIN oportunidades o ON o.id = op.oportunidade_id
    JOIN etapas_funil ef ON ef.id = o.etapa_id AND ef.tipo = 'ganho'
    WHERE o.organizacao_id = p_organizacao_id
      AND o.fechado_em >= p_periodo_inicio
      AND o.fechado_em <= p_periodo_fim
      AND o.deletado_em IS NULL
      AND (p_funil_id IS NULL OR o.funil_id = p_funil_id)
    GROUP BY p.nome
    ORDER BY SUM(op.quantidade) DESC
    LIMIT 5
  ) pr;

  RETURN json_build_object(
    'perdas', v_perdas,
    'valor_perdas', v_valor_perdas,
    'tarefas_abertas', v_tarefas_abertas,
    'total_oportunidades_historico', v_total_historico,
    'motivos_perda', v_motivos_perda,
    'motivos_ganho', v_motivos_ganho,
    'produtos_ranking', v_produtos_ranking
  );
END;
$function$;
