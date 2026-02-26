CREATE OR REPLACE FUNCTION public.fn_relatorio_metas_dashboard(
  p_organizacao_id uuid,
  p_periodo_inicio timestamptz,
  p_periodo_fim timestamptz
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result json;
  v_resumo json;
  v_metas_empresa json;
  v_vendedores json;
  v_ranking_vendedores json;
  v_ranking_equipes json;
  v_total_metas int := 0;
  v_metas_atingidas int := 0;
  v_media_atingimento numeric := 0;
  v_em_risco int := 0;
  v_metas_nomes json := '[]'::json;
  v_ganho_ids uuid[];
BEGIN
  SELECT COALESCE(array_agg(id), '{}') INTO v_ganho_ids
  FROM etapas_funil
  WHERE organizacao_id = p_organizacao_id AND tipo = 'ganho';

  -- ═══════════════════════════════════════════════════════════
  -- RESUMO UNIFICADO: empresa + equipe + individual
  -- AIDEV-NOTE: Corrigido para incluir TODOS os tipos de meta
  -- ═══════════════════════════════════════════════════════════
  SELECT
    COUNT(*)::int,
    COUNT(*) FILTER (WHERE sub.percentual >= 100)::int,
    ROUND(COALESCE(AVG(sub.percentual), 0), 1),
    COUNT(*) FILTER (WHERE sub.percentual < 40 AND sub.percentual > 0)::int,
    COALESCE(json_agg(json_build_object(
      'nome', sub.nome,
      'metrica', sub.metrica,
      'percentual', sub.percentual
    ) ORDER BY sub.percentual DESC), '[]'::json)
  INTO v_total_metas, v_metas_atingidas, v_media_atingimento, v_em_risco, v_metas_nomes
  FROM (
    SELECT m.nome, m.metrica,
      CASE WHEN m.valor_meta > 0
        THEN ROUND((COALESCE(mp.valor_atual, 0) / m.valor_meta) * 100, 1)
        ELSE 0
      END AS percentual
    FROM metas m
    LEFT JOIN LATERAL (
      SELECT valor_atual FROM metas_progresso WHERE meta_id = m.id ORDER BY calculado_em DESC LIMIT 1
    ) mp ON true
    WHERE m.organizacao_id = p_organizacao_id
      AND m.ativo = true AND m.deletado_em IS NULL
      AND m.data_inicio <= p_periodo_fim::date
      AND m.data_fim >= p_periodo_inicio::date
  ) sub;

  v_resumo := json_build_object(
    'total_metas', v_total_metas,
    'metas_atingidas', v_metas_atingidas,
    'media_atingimento', ROUND(v_media_atingimento, 1),
    'em_risco', v_em_risco,
    'metas_nomes', v_metas_nomes
  );

  -- METAS DA EMPRESA (para exibição detalhada)
  SELECT COALESCE(json_agg(row_to_json(me) ORDER BY me.percentual DESC), '[]'::json)
  INTO v_metas_empresa
  FROM (
    SELECT
      m.nome, m.metrica,
      m.valor_meta::numeric AS valor_meta,
      COALESCE(mp.valor_atual, 0)::numeric AS valor_atual,
      CASE WHEN m.valor_meta > 0
        THEN ROUND((COALESCE(mp.valor_atual, 0) / m.valor_meta) * 100, 1)
        ELSE 0
      END AS percentual,
      m.periodo
    FROM metas m
    LEFT JOIN LATERAL (
      SELECT valor_atual FROM metas_progresso WHERE meta_id = m.id ORDER BY calculado_em DESC LIMIT 1
    ) mp ON true
    WHERE m.organizacao_id = p_organizacao_id
      AND m.tipo = 'empresa'
      AND m.ativo = true AND m.deletado_em IS NULL
      AND m.data_inicio <= p_periodo_fim::date
      AND m.data_fim >= p_periodo_inicio::date
  ) me;

  -- VENDEDORES COM PERFORMANCE
  SELECT COALESCE(json_agg(row_to_json(vp) ORDER BY vp.percentual_medio DESC), '[]'::json)
  INTO v_vendedores
  FROM (
    SELECT
      u.id AS usuario_id,
      COALESCE(u.nome, '') || COALESCE(' ' || u.sobrenome, '') AS nome,
      u.avatar_url,
      eq.equipe_nome,
      COALESCE(metas_agg.percentual_medio, 0) AS percentual_medio,
      COALESCE(vendas.total_vendas, 0) AS total_vendas,
      COALESCE(vendas.receita_gerada, 0) AS receita_gerada,
      COALESCE(metas_agg.metas_json, '[]'::json) AS metas
    FROM usuarios u
    LEFT JOIN LATERAL (
      SELECT e.nome AS equipe_nome
      FROM equipes_membros em JOIN equipes e ON e.id = em.equipe_id AND e.deletado_em IS NULL
      WHERE em.usuario_id = u.id AND em.ativo = true LIMIT 1
    ) eq ON true
    LEFT JOIN LATERAL (
      SELECT
        ROUND(AVG(CASE WHEN m2.valor_meta > 0 THEN (COALESCE(mp2.valor_atual, 0) / m2.valor_meta) * 100 ELSE 0 END), 1) AS percentual_medio,
        json_agg(json_build_object(
          'metrica', m2.metrica, 'valor_meta', m2.valor_meta,
          'valor_atual', COALESCE(mp2.valor_atual, 0),
          'percentual', CASE WHEN m2.valor_meta > 0 THEN ROUND((COALESCE(mp2.valor_atual, 0) / m2.valor_meta) * 100, 1) ELSE 0 END
        )) AS metas_json
      FROM metas m2
      LEFT JOIN LATERAL (SELECT valor_atual FROM metas_progresso WHERE meta_id = m2.id ORDER BY calculado_em DESC LIMIT 1) mp2 ON true
      WHERE m2.usuario_id = u.id AND m2.organizacao_id = p_organizacao_id
        AND m2.tipo = 'individual' AND m2.ativo = true AND m2.deletado_em IS NULL
        AND m2.data_inicio <= p_periodo_fim::date AND m2.data_fim >= p_periodo_inicio::date
    ) metas_agg ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS total_vendas, COALESCE(SUM(o.valor), 0) AS receita_gerada
      FROM oportunidades o
      WHERE o.usuario_responsavel_id = u.id AND o.organizacao_id = p_organizacao_id
        AND o.etapa_id = ANY(v_ganho_ids)
        AND o.fechado_em >= p_periodo_inicio AND o.fechado_em <= p_periodo_fim AND o.deletado_em IS NULL
    ) vendas ON true
    WHERE u.organizacao_id = p_organizacao_id AND u.role IN ('admin', 'member')
      AND u.status = 'ativo' AND u.deletado_em IS NULL
      AND (metas_agg.percentual_medio IS NOT NULL OR COALESCE(vendas.total_vendas, 0) > 0)
  ) vp;

  -- RANKING VENDEDORES (top 5)
  SELECT COALESCE(json_agg(row_to_json(rv)), '[]'::json)
  INTO v_ranking_vendedores
  FROM (
    SELECT ROW_NUMBER() OVER (ORDER BY perf.percentual_medio DESC, perf.receita DESC)::int AS posicao,
      perf.nome, perf.avatar_url, perf.percentual_medio, perf.receita
    FROM (
      SELECT COALESCE(u.nome, '') || COALESCE(' ' || u.sobrenome, '') AS nome, u.avatar_url,
        ROUND(AVG(CASE WHEN m.valor_meta > 0 THEN (COALESCE(mp.valor_atual, 0) / m.valor_meta) * 100 ELSE 0 END), 1) AS percentual_medio,
        COALESCE((SELECT SUM(o.valor) FROM oportunidades o WHERE o.usuario_responsavel_id = u.id
          AND o.organizacao_id = p_organizacao_id AND o.etapa_id = ANY(v_ganho_ids)
          AND o.fechado_em >= p_periodo_inicio AND o.fechado_em <= p_periodo_fim AND o.deletado_em IS NULL), 0) AS receita
      FROM usuarios u
      JOIN metas m ON m.usuario_id = u.id AND m.organizacao_id = p_organizacao_id
        AND m.tipo = 'individual' AND m.ativo = true AND m.deletado_em IS NULL
        AND m.data_inicio <= p_periodo_fim::date AND m.data_fim >= p_periodo_inicio::date
      LEFT JOIN LATERAL (SELECT valor_atual FROM metas_progresso WHERE meta_id = m.id ORDER BY calculado_em DESC LIMIT 1) mp ON true
      WHERE u.organizacao_id = p_organizacao_id AND u.status = 'ativo' AND u.deletado_em IS NULL
      GROUP BY u.id, u.nome, u.sobrenome, u.avatar_url
    ) perf ORDER BY perf.percentual_medio DESC, perf.receita DESC LIMIT 5
  ) rv;

  -- RANKING EQUIPES (top 3)
  SELECT COALESCE(json_agg(row_to_json(re)), '[]'::json)
  INTO v_ranking_equipes
  FROM (
    SELECT ROW_NUMBER() OVER (ORDER BY eq_perf.percentual_medio DESC, eq_perf.receita DESC)::int AS posicao,
      eq_perf.nome, eq_perf.cor, eq_perf.total_membros::int, eq_perf.percentual_medio, eq_perf.receita
    FROM (
      SELECT e.nome, e.cor, COUNT(DISTINCT em.usuario_id) AS total_membros,
        ROUND(AVG(COALESCE(user_perf.percentual_medio, 0)), 1) AS percentual_medio,
        COALESCE(SUM(user_perf.receita), 0) AS receita
      FROM equipes e
      JOIN equipes_membros em ON em.equipe_id = e.id AND em.ativo = true
      LEFT JOIN LATERAL (
        SELECT
          ROUND(AVG(CASE WHEN m.valor_meta > 0 THEN (COALESCE(mp.valor_atual, 0) / m.valor_meta) * 100 ELSE 0 END), 1) AS percentual_medio,
          COALESCE((SELECT SUM(o.valor) FROM oportunidades o WHERE o.usuario_responsavel_id = em.usuario_id
            AND o.organizacao_id = p_organizacao_id AND o.etapa_id = ANY(v_ganho_ids)
            AND o.fechado_em >= p_periodo_inicio AND o.fechado_em <= p_periodo_fim AND o.deletado_em IS NULL), 0) AS receita
        FROM metas m
        LEFT JOIN LATERAL (SELECT valor_atual FROM metas_progresso WHERE meta_id = m.id ORDER BY calculado_em DESC LIMIT 1) mp ON true
        WHERE m.usuario_id = em.usuario_id AND m.organizacao_id = p_organizacao_id
          AND m.tipo = 'individual' AND m.ativo = true AND m.deletado_em IS NULL
          AND m.data_inicio <= p_periodo_fim::date AND m.data_fim >= p_periodo_inicio::date
      ) user_perf ON true
      WHERE e.organizacao_id = p_organizacao_id AND e.ativo = true AND e.deletado_em IS NULL
      GROUP BY e.id, e.nome, e.cor HAVING COUNT(DISTINCT em.usuario_id) > 0
    ) eq_perf ORDER BY eq_perf.percentual_medio DESC, eq_perf.receita DESC LIMIT 3
  ) re;

  v_result := json_build_object(
    'resumo', v_resumo,
    'metas_empresa', v_metas_empresa,
    'vendedores', v_vendedores,
    'ranking_vendedores', v_ranking_vendedores,
    'ranking_equipes', v_ranking_equipes
  );

  RETURN v_result;
END;
$function$;