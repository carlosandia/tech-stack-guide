-- AIDEV-NOTE: Corrigir matching de canal de investimento para mapear nomes de canais
-- de investimento (meta_ads, google_ads, outros) para os valores reais de utm_source/origem.
-- meta_ads → facebook, fb, instagram, ig, meta, meta_ads
-- google_ads → google, google_ads, googleads, gads
-- outros → tudo que não é meta_ads nem google_ads

CREATE OR REPLACE FUNCTION public.fn_canal_match(
  p_utm_source text,
  p_origem text,
  p_canal text
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_canal IS NULL THEN true
    WHEN p_canal = 'meta_ads' THEN
      LOWER(COALESCE(NULLIF(TRIM(p_utm_source), ''), p_origem, 'direto')) IN (
        'facebook', 'fb', 'instagram', 'ig', 'meta', 'meta_ads', 'meta ads',
        'facebook_ads', 'facebook ads', 'instagram_ads', 'instagram ads'
      )
    WHEN p_canal = 'google_ads' THEN
      LOWER(COALESCE(NULLIF(TRIM(p_utm_source), ''), p_origem, 'direto')) IN (
        'google', 'google_ads', 'googleads', 'gads', 'google ads',
        'google_adwords', 'adwords', 'youtube', 'youtube_ads'
      )
    WHEN p_canal = 'outros' THEN
      LOWER(COALESCE(NULLIF(TRIM(p_utm_source), ''), p_origem, 'direto')) NOT IN (
        'facebook', 'fb', 'instagram', 'ig', 'meta', 'meta_ads', 'meta ads',
        'facebook_ads', 'facebook ads', 'instagram_ads', 'instagram ads',
        'google', 'google_ads', 'googleads', 'gads', 'google ads',
        'google_adwords', 'adwords', 'youtube', 'youtube_ads'
      )
    ELSE
      COALESCE(NULLIF(TRIM(p_utm_source), ''), p_origem, 'direto') = p_canal
  END;
$$;

-- Atualizar fn_metricas_funil para usar fn_canal_match
CREATE OR REPLACE FUNCTION public.fn_metricas_funil(
  p_organizacao_id uuid,
  p_periodo_inicio timestamptz,
  p_periodo_fim timestamptz,
  p_funil_id uuid DEFAULT NULL,
  p_canal text DEFAULT NULL
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
    'total_leads', (
      SELECT COUNT(DISTINCT o.id)
      FROM oportunidades o
      WHERE o.organizacao_id = p_organizacao_id
        AND o.criado_em >= p_periodo_inicio
        AND o.criado_em <= p_periodo_fim
        AND o.deletado_em IS NULL
        AND (p_funil_id IS NULL OR o.funil_id = p_funil_id)
        AND fn_canal_match(o.utm_source, o.origem, p_canal)
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
        AND fn_canal_match(o.utm_source, o.origem, p_canal)
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
        AND fn_canal_match(o.utm_source, o.origem, p_canal)
    ),

    'reunioes_agendadas', (
      SELECT COUNT(DISTINCT r.id)
      FROM reunioes_oportunidades r
      JOIN oportunidades o ON o.id = r.oportunidade_id AND o.deletado_em IS NULL
      WHERE r.organizacao_id = p_organizacao_id
        AND r.criado_em >= p_periodo_inicio
        AND r.criado_em <= p_periodo_fim
        AND r.deletado_em IS NULL
        AND r.cancelada_em IS NULL
        AND (p_funil_id IS NULL OR o.funil_id = p_funil_id)
        AND fn_canal_match(o.utm_source, o.origem, p_canal)
    ),

    'reunioes_realizadas', (
      SELECT COUNT(DISTINCT r.id)
      FROM reunioes_oportunidades r
      JOIN oportunidades o ON o.id = r.oportunidade_id AND o.deletado_em IS NULL
      WHERE r.organizacao_id = p_organizacao_id
        AND r.status = 'realizada'
        AND r.realizada_em >= p_periodo_inicio
        AND r.realizada_em <= p_periodo_fim
        AND r.deletado_em IS NULL
        AND (p_funil_id IS NULL OR o.funil_id = p_funil_id)
        AND fn_canal_match(o.utm_source, o.origem, p_canal)
    ),

    'reunioes', (
      SELECT COUNT(DISTINCT r.id)
      FROM reunioes_oportunidades r
      JOIN oportunidades o ON o.id = r.oportunidade_id AND o.deletado_em IS NULL
      WHERE r.organizacao_id = p_organizacao_id
        AND r.status = 'realizada'
        AND r.realizada_em >= p_periodo_inicio
        AND r.realizada_em <= p_periodo_fim
        AND r.deletado_em IS NULL
        AND (p_funil_id IS NULL OR o.funil_id = p_funil_id)
        AND fn_canal_match(o.utm_source, o.origem, p_canal)
    ),

    'reunioes_noshow', (
      SELECT COUNT(DISTINCT r.id)
      FROM reunioes_oportunidades r
      JOIN oportunidades o ON o.id = r.oportunidade_id AND o.deletado_em IS NULL
      WHERE r.organizacao_id = p_organizacao_id
        AND r.status = 'nao_compareceu'
        AND r.criado_em >= p_periodo_inicio
        AND r.criado_em <= p_periodo_fim
        AND r.deletado_em IS NULL
        AND (p_funil_id IS NULL OR o.funil_id = p_funil_id)
        AND fn_canal_match(o.utm_source, o.origem, p_canal)
    ),

    'reunioes_canceladas', (
      SELECT COUNT(DISTINCT r.id)
      FROM reunioes_oportunidades r
      JOIN oportunidades o ON o.id = r.oportunidade_id AND o.deletado_em IS NULL
      WHERE r.organizacao_id = p_organizacao_id
        AND r.cancelada_em IS NOT NULL
        AND r.cancelada_em >= p_periodo_inicio
        AND r.cancelada_em <= p_periodo_fim
        AND r.deletado_em IS NULL
        AND (p_funil_id IS NULL OR o.funil_id = p_funil_id)
        AND fn_canal_match(o.utm_source, o.origem, p_canal)
    ),

    'reunioes_reagendadas', (
      SELECT COUNT(DISTINCT r.id)
      FROM reunioes_oportunidades r
      JOIN oportunidades o ON o.id = r.oportunidade_id AND o.deletado_em IS NULL
      WHERE r.organizacao_id = p_organizacao_id
        AND r.status = 'reagendada'
        AND r.criado_em >= p_periodo_inicio
        AND r.criado_em <= p_periodo_fim
        AND r.deletado_em IS NULL
        AND (p_funil_id IS NULL OR o.funil_id = p_funil_id)
        AND fn_canal_match(o.utm_source, o.origem, p_canal)
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
        AND fn_canal_match(o.utm_source, o.origem, p_canal)
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
        AND fn_canal_match(o.utm_source, o.origem, p_canal)
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
        AND fn_canal_match(o.utm_source, o.origem, p_canal)
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
        AND fn_canal_match(o.utm_source, o.origem, p_canal)
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
        AND fn_canal_match(o.utm_source, o.origem, p_canal)
    )
  ) INTO v_resultado;

  RETURN v_resultado;
END;
$function$;