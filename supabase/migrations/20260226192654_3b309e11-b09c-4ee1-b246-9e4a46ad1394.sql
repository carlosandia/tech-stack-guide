-- AIDEV-NOTE: Unificação origem → utm_source em oportunidades
-- 1. Backfill: copiar origem para utm_source onde utm_source é NULL
UPDATE oportunidades 
SET utm_source = origem 
WHERE utm_source IS NULL AND origem IS NOT NULL AND origem != 'manual';

-- 2. Drop coluna origem
ALTER TABLE oportunidades DROP COLUMN IF EXISTS origem;

-- 3. Atualizar trigger herdar_origem_contato → escreve em utm_source
CREATE OR REPLACE FUNCTION public.herdar_origem_contato_oportunidade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Se a oportunidade foi criada sem utm_source, herdar do contato.origem
  IF NEW.utm_source IS NULL OR TRIM(NEW.utm_source) = '' THEN
    SELECT CASE 
      WHEN c.origem IS NOT NULL AND c.origem != 'manual' THEN c.origem
      ELSE NEW.utm_source
    END INTO NEW.utm_source
    FROM contatos c
    WHERE c.id = NEW.contato_id;
  END IF;

  RETURN NEW;
END;
$function$;

-- 4. Simplificar fn_canal_match (sem referência a origem)
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
      LOWER(COALESCE(NULLIF(TRIM(p_utm_source), ''), 'direto')) IN (
        'facebook', 'fb', 'instagram', 'ig', 'meta', 'meta_ads', 'meta ads',
        'facebook_ads', 'facebook ads', 'instagram_ads', 'instagram ads'
      )
    WHEN p_canal = 'google_ads' THEN
      LOWER(COALESCE(NULLIF(TRIM(p_utm_source), ''), 'direto')) IN (
        'google', 'google_ads', 'googleads', 'gads', 'google ads',
        'google_adwords', 'adwords', 'youtube', 'youtube_ads'
      )
    WHEN p_canal = 'outros' THEN
      LOWER(COALESCE(NULLIF(TRIM(p_utm_source), ''), 'direto')) NOT IN (
        'facebook', 'fb', 'instagram', 'ig', 'meta', 'meta_ads', 'meta ads',
        'facebook_ads', 'facebook ads', 'instagram_ads', 'instagram ads',
        'google', 'google_ads', 'googleads', 'gads', 'google ads',
        'google_adwords', 'adwords', 'youtube', 'youtube_ads'
      )
    ELSE
      COALESCE(NULLIF(TRIM(p_utm_source), ''), 'direto') = p_canal
  END;
$$;

-- 5. Atualizar fn_metricas_funil — remover referência a o.origem
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
        AND fn_canal_match(o.utm_source, NULL, p_canal)
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
        AND fn_canal_match(o.utm_source, NULL, p_canal)
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
        AND fn_canal_match(o.utm_source, NULL, p_canal)
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
        AND fn_canal_match(o.utm_source, NULL, p_canal)
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
        AND fn_canal_match(o.utm_source, NULL, p_canal)
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
        AND fn_canal_match(o.utm_source, NULL, p_canal)
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
        AND fn_canal_match(o.utm_source, NULL, p_canal)
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
        AND fn_canal_match(o.utm_source, NULL, p_canal)
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
        AND fn_canal_match(o.utm_source, NULL, p_canal)
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
        AND fn_canal_match(o.utm_source, NULL, p_canal)
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
        AND fn_canal_match(o.utm_source, NULL, p_canal)
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
        AND fn_canal_match(o.utm_source, NULL, p_canal)
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
        AND fn_canal_match(o.utm_source, NULL, p_canal)
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
        AND fn_canal_match(o.utm_source, NULL, p_canal)
    )
  ) INTO v_resultado;

  RETURN v_resultado;
END;
$function$;

-- 6. Atualizar fn_breakdown_canal_funil — usar só utm_source
CREATE OR REPLACE FUNCTION public.fn_breakdown_canal_funil(
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
  v_ganho_ids uuid[];
  v_total bigint;
BEGIN
  SELECT COALESCE(array_agg(id), '{}') INTO v_ganho_ids
  FROM etapas_funil
  WHERE organizacao_id = p_organizacao_id AND tipo = 'ganho';

  SELECT COUNT(*) INTO v_total
  FROM oportunidades
  WHERE organizacao_id = p_organizacao_id
    AND criado_em >= p_periodo_inicio
    AND criado_em <= p_periodo_fim
    AND deletado_em IS NULL
    AND (p_funil_id IS NULL OR funil_id = p_funil_id);

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(canal_data) ORDER BY (canal_data).oportunidades DESC), '[]'::json)
    FROM (
      SELECT
        COALESCE(NULLIF(TRIM(utm_source), ''), 'direto') AS canal,
        COUNT(*) AS oportunidades,
        COUNT(*) FILTER (
          WHERE etapa_id = ANY(v_ganho_ids)
            AND fechado_em >= p_periodo_inicio
            AND fechado_em <= p_periodo_fim
        ) AS fechados,
        COALESCE(SUM(valor) FILTER (
          WHERE etapa_id = ANY(v_ganho_ids)
            AND fechado_em >= p_periodo_inicio
            AND fechado_em <= p_periodo_fim
        ), 0) AS valor_gerado,
        CASE
          WHEN COUNT(*) FILTER (
            WHERE etapa_id = ANY(v_ganho_ids)
              AND fechado_em >= p_periodo_inicio
              AND fechado_em <= p_periodo_fim
          ) > 0 THEN
            ROUND(
              COALESCE(SUM(valor) FILTER (
                WHERE etapa_id = ANY(v_ganho_ids)
                  AND fechado_em >= p_periodo_inicio
                  AND fechado_em <= p_periodo_fim
              ), 0)::numeric /
              COUNT(*) FILTER (
                WHERE etapa_id = ANY(v_ganho_ids)
                  AND fechado_em >= p_periodo_inicio
                  AND fechado_em <= p_periodo_fim
              )::numeric,
              2
            )
          ELSE 0
        END AS ticket_medio,
        CASE
          WHEN COUNT(*) > 0 THEN
            ROUND(
              COUNT(*) FILTER (
                WHERE etapa_id = ANY(v_ganho_ids)
                  AND fechado_em >= p_periodo_inicio
                  AND fechado_em <= p_periodo_fim
              )::numeric / COUNT(*)::numeric * 100,
              1
            )
          ELSE 0
        END AS taxa_fechamento,
        CASE
          WHEN v_total > 0 THEN ROUND(COUNT(*)::numeric / v_total::numeric * 100, 1)
          ELSE 0
        END AS percentual_total
      FROM oportunidades
      WHERE organizacao_id = p_organizacao_id
        AND criado_em >= p_periodo_inicio
        AND criado_em <= p_periodo_fim
        AND deletado_em IS NULL
        AND (p_funil_id IS NULL OR funil_id = p_funil_id)
      GROUP BY COALESCE(NULLIF(TRIM(utm_source), ''), 'direto')
      ORDER BY COUNT(*) DESC
      LIMIT 10
    ) canal_data
  );
END;
$function$;