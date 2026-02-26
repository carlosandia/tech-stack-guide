-- AIDEV-NOTE: Adicionar coluna origem em oportunidades + backfill + atualizar RPC fn_breakdown_canal_funil

-- 1. Adicionar coluna origem
ALTER TABLE oportunidades ADD COLUMN IF NOT EXISTS origem VARCHAR(50) DEFAULT 'manual';

-- 2. Backfill: herdar origem do contato vinculado
UPDATE oportunidades o
SET origem = COALESCE(c.origem, 'manual')
FROM contatos c
WHERE o.contato_id = c.id
  AND (o.origem IS NULL OR o.origem = 'manual');

-- 3. Atualizar RPC fn_breakdown_canal_funil para usar COALESCE(utm_source, origem, 'direto')
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
        COALESCE(NULLIF(TRIM(utm_source), ''), origem, 'direto') AS canal,
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
      GROUP BY COALESCE(NULLIF(TRIM(utm_source), ''), origem, 'direto')
      ORDER BY COUNT(*) DESC
      LIMIT 10
    ) canal_data
  );
END;
$function$;