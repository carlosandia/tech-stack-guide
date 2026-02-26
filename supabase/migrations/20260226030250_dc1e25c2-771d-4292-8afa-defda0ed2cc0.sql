CREATE OR REPLACE FUNCTION public.fn_metricas_funil(
  p_organizacao_id uuid,
  p_periodo_inicio timestamp with time zone,
  p_periodo_fim timestamp with time zone,
  p_funil_id uuid DEFAULT NULL::uuid,
  p_canal text DEFAULT NULL::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_ganho_ids uuid[];
  v_perda_ids uuid[];
  v_resultado json;
BEGIN
  SELECT COALESCE(array_agg(id), '{}') INTO v_ganho_ids
  FROM etapas_funil
  WHERE organizacao_id = p_organizacao_id AND tipo = 'ganho';

  SELECT COALESCE(array_agg(id), '{}') INTO v_perda_ids
  FROM etapas_funil
  WHERE organizacao_id = p_organizacao_id AND tipo = 'perda';

  SELECT json_build_object(
    -- AIDEV-NOTE: Leads = oportunidades criadas no período (não contatos)
    -- Segue padrão CRM: HubSpot, Pipedrive, RD Station
    'total_leads', (
      SELECT COUNT(DISTINCT o.id)
      FROM oportunidades o
      WHERE o.organizacao_id = p_organizacao_id
        AND o.criado_em >= p_periodo_inicio
        AND o.criado_em <= p_periodo_fim
        AND o.deletado_em IS NULL
        AND (p_funil_id IS NULL OR o.funil_id = p_funil_id)
        AND (p_canal IS NULL OR o.utm_source = p_canal)
    ),

    'mqls', (
      SELECT COUNT(DISTINCT o.id)
      FROM oportunidades o
      WHERE o.organizacao_id = p_organizacao_id
        AND o.qualificado_mql = true
        AND o.qualificado_mql_em >= p_periodo_inicio
        AND o.qualificado_mql_em <= p_periodo_fim
        AND o.deletado_em IS NULL
        AND (p_funil_id IS NULL OR o.funil_id = p_funil_id)
        AND (p_canal IS NULL OR o.utm_source = p_canal)
    ),

    'sqls', (
      SELECT COUNT(DISTINCT o.id)
      FROM oportunidades o
      WHERE o.organizacao_id = p_organizacao_id
        AND o.qualificado_sql = true
        AND o.qualificado_sql_em >= p_periodo_inicio
        AND o.qualificado_sql_em <= p_periodo_fim
        AND o.deletado_em IS NULL
        AND (p_funil_id IS NULL OR o.funil_id = p_funil_id)
        AND (p_canal IS NULL OR o.utm_source = p_canal)
    ),

    'reunioes', (
      SELECT COUNT(DISTINCT t.id)
      FROM tarefas t
      JOIN oportunidades o ON o.id = t.oportunidade_id AND o.deletado_em IS NULL
      WHERE t.organizacao_id = p_organizacao_id
        AND t.tipo = 'reuniao'
        AND t.status = 'concluida'
        AND t.data_conclusao >= p_periodo_inicio
        AND t.data_conclusao <= p_periodo_fim
        AND (p_funil_id IS NULL OR o.funil_id = p_funil_id)
        AND (p_canal IS NULL OR o.utm_source = p_canal)
    ),

    'fechados', (
      SELECT COUNT(DISTINCT o.id)
      FROM oportunidades o
      WHERE o.organizacao_id = p_organizacao_id
        AND o.etapa_id = ANY(v_ganho_ids)
        AND o.fechado_em >= p_periodo_inicio
        AND o.fechado_em <= p_periodo_fim
        AND o.deletado_em IS NULL
        AND (p_funil_id IS NULL OR o.funil_id = p_funil_id)
        AND (p_canal IS NULL OR o.utm_source = p_canal)
    ),

    'valor_gerado', (
      SELECT COALESCE(SUM(o.valor), 0)
      FROM oportunidades o
      WHERE o.organizacao_id = p_organizacao_id
        AND o.etapa_id = ANY(v_ganho_ids)
        AND o.fechado_em >= p_periodo_inicio
        AND o.fechado_em <= p_periodo_fim
        AND o.deletado_em IS NULL
        AND (p_funil_id IS NULL OR o.funil_id = p_funil_id)
        AND (p_canal IS NULL OR o.utm_source = p_canal)
    ),

    'ticket_medio', (
      SELECT COALESCE(AVG(o.valor), 0)
      FROM oportunidades o
      WHERE o.organizacao_id = p_organizacao_id
        AND o.etapa_id = ANY(v_ganho_ids)
        AND o.fechado_em >= p_periodo_inicio
        AND o.fechado_em <= p_periodo_fim
        AND o.deletado_em IS NULL
        AND (p_funil_id IS NULL OR o.funil_id = p_funil_id)
        AND (p_canal IS NULL OR o.utm_source = p_canal)
    ),

    'forecast', (
      SELECT COALESCE(SUM(o.valor * ef.probabilidade / 100.0), 0)
      FROM oportunidades o
      JOIN etapas_funil ef ON ef.id = o.etapa_id
      WHERE o.organizacao_id = p_organizacao_id
        AND o.etapa_id != ALL(v_ganho_ids)
        AND o.etapa_id != ALL(v_perda_ids)
        AND o.deletado_em IS NULL
        AND (p_funil_id IS NULL OR o.funil_id = p_funil_id)
        AND (p_canal IS NULL OR o.utm_source = p_canal)
    ),

    'ciclo_medio_dias', (
      SELECT ROUND(
        AVG(EXTRACT(EPOCH FROM (o.fechado_em - o.criado_em)) / 86400.0)::numeric,
        1
      )
      FROM oportunidades o
      WHERE o.organizacao_id = p_organizacao_id
        AND o.etapa_id = ANY(v_ganho_ids)
        AND o.fechado_em >= p_periodo_inicio
        AND o.fechado_em <= p_periodo_fim
        AND o.deletado_em IS NULL
        AND o.fechado_em > o.criado_em
        AND (p_funil_id IS NULL OR o.funil_id = p_funil_id)
        AND (p_canal IS NULL OR o.utm_source = p_canal)
    )
  ) INTO v_resultado;

  RETURN v_resultado;
END;
$function$;