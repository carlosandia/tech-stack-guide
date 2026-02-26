
-- AIDEV-NOTE: Reescrever recalcular_progresso_meta para calcular progresso REAL
-- baseado em oportunidades ganhas e outras métricas do CRM.

CREATE OR REPLACE FUNCTION recalcular_progresso_meta(p_meta_id uuid)
RETURNS void AS $$
DECLARE
  v_meta RECORD;
  v_valor_atual decimal(15, 2) := 0;
  v_percentual decimal(5, 2) := 0;
  v_valor_alvo decimal(15, 2);
  v_org_id uuid;
  v_ganho_ids uuid[];
  v_has_children boolean := false;
  v_total decimal;
  v_ganhos decimal;
BEGIN
  SELECT id, tipo, metrica, organizacao_id, usuario_id, equipe_id,
         funil_id, data_inicio, data_fim,
         COALESCE(valor_meta, 0) AS valor_alvo
  INTO v_meta
  FROM metas
  WHERE id = p_meta_id AND ativo = true AND deletado_em IS NULL;

  IF NOT FOUND THEN RETURN; END IF;

  v_valor_alvo := v_meta.valor_alvo;
  v_org_id := v_meta.organizacao_id;

  -- Buscar IDs das etapas de ganho
  IF v_meta.funil_id IS NOT NULL THEN
    SELECT ARRAY_AGG(ef.id) INTO v_ganho_ids
    FROM etapas_funil ef
    WHERE ef.funil_id = v_meta.funil_id AND ef.tipo = 'ganho';
  ELSE
    SELECT ARRAY_AGG(ef.id) INTO v_ganho_ids
    FROM etapas_funil ef
    JOIN funis f ON f.id = ef.funil_id
    WHERE f.organizacao_id = v_org_id AND ef.tipo = 'ganho';
  END IF;

  v_ganho_ids := COALESCE(v_ganho_ids, ARRAY[]::uuid[]);

  -- Para empresa/equipe com filhas: somar filhas
  IF v_meta.tipo IN ('empresa', 'equipe') THEN
    SELECT EXISTS(SELECT 1 FROM metas WHERE meta_pai_id = p_meta_id AND ativo = true AND deletado_em IS NULL) INTO v_has_children;
    IF v_has_children THEN
      PERFORM recalcular_progresso_meta(m.id) FROM metas m WHERE m.meta_pai_id = p_meta_id AND m.ativo = true AND m.deletado_em IS NULL;
      SELECT COALESCE(SUM(mp.valor_atual), 0) INTO v_valor_atual
      FROM metas m JOIN metas_progresso mp ON mp.meta_id = m.id
      WHERE m.meta_pai_id = p_meta_id AND m.ativo = true AND m.deletado_em IS NULL;

      IF v_valor_alvo > 0 THEN v_percentual := ROUND((v_valor_atual / v_valor_alvo) * 100, 2); END IF;
      INSERT INTO metas_progresso (meta_id, organizacao_id, valor_atual, percentual_atingido, calculado_em)
      VALUES (p_meta_id, v_org_id, v_valor_atual, v_percentual, now())
      ON CONFLICT (meta_id) DO UPDATE SET valor_atual = v_valor_atual, percentual_atingido = v_percentual, calculado_em = now();
      RETURN;
    END IF;
  END IF;

  -- Cálculo direto baseado na métrica
  CASE v_meta.metrica
    WHEN 'valor_vendas' THEN
      SELECT COALESCE(SUM(o.valor), 0) INTO v_valor_atual
      FROM oportunidades o
      WHERE o.organizacao_id = v_org_id AND o.etapa_id = ANY(v_ganho_ids) AND o.deletado_em IS NULL
        AND o.fechado_em IS NOT NULL AND o.fechado_em::date >= v_meta.data_inicio AND o.fechado_em::date <= v_meta.data_fim
        AND (v_meta.usuario_id IS NULL OR o.usuario_responsavel_id = v_meta.usuario_id)
        AND (v_meta.funil_id IS NULL OR o.funil_id = v_meta.funil_id);

    WHEN 'quantidade_vendas' THEN
      SELECT COUNT(*)::decimal INTO v_valor_atual
      FROM oportunidades o
      WHERE o.organizacao_id = v_org_id AND o.etapa_id = ANY(v_ganho_ids) AND o.deletado_em IS NULL
        AND o.fechado_em IS NOT NULL AND o.fechado_em::date >= v_meta.data_inicio AND o.fechado_em::date <= v_meta.data_fim
        AND (v_meta.usuario_id IS NULL OR o.usuario_responsavel_id = v_meta.usuario_id)
        AND (v_meta.funil_id IS NULL OR o.funil_id = v_meta.funil_id);

    WHEN 'novos_negocios' THEN
      SELECT COUNT(*)::decimal INTO v_valor_atual
      FROM oportunidades o
      WHERE o.organizacao_id = v_org_id AND o.deletado_em IS NULL
        AND o.criado_em::date >= v_meta.data_inicio AND o.criado_em::date <= v_meta.data_fim
        AND (v_meta.usuario_id IS NULL OR o.usuario_responsavel_id = v_meta.usuario_id)
        AND (v_meta.funil_id IS NULL OR o.funil_id = v_meta.funil_id);

    WHEN 'ticket_medio' THEN
      SELECT COALESCE(AVG(o.valor), 0) INTO v_valor_atual
      FROM oportunidades o
      WHERE o.organizacao_id = v_org_id AND o.etapa_id = ANY(v_ganho_ids) AND o.deletado_em IS NULL
        AND o.fechado_em IS NOT NULL AND o.fechado_em::date >= v_meta.data_inicio AND o.fechado_em::date <= v_meta.data_fim
        AND (v_meta.usuario_id IS NULL OR o.usuario_responsavel_id = v_meta.usuario_id)
        AND (v_meta.funil_id IS NULL OR o.funil_id = v_meta.funil_id);

    WHEN 'taxa_conversao' THEN
      SELECT COUNT(*)::decimal INTO v_total
      FROM oportunidades o
      WHERE o.organizacao_id = v_org_id AND o.deletado_em IS NULL
        AND o.criado_em::date >= v_meta.data_inicio AND o.criado_em::date <= v_meta.data_fim
        AND (v_meta.usuario_id IS NULL OR o.usuario_responsavel_id = v_meta.usuario_id)
        AND (v_meta.funil_id IS NULL OR o.funil_id = v_meta.funil_id);

      SELECT COUNT(*)::decimal INTO v_ganhos
      FROM oportunidades o
      WHERE o.organizacao_id = v_org_id AND o.etapa_id = ANY(v_ganho_ids) AND o.deletado_em IS NULL
        AND o.fechado_em IS NOT NULL AND o.fechado_em::date >= v_meta.data_inicio AND o.fechado_em::date <= v_meta.data_fim
        AND (v_meta.usuario_id IS NULL OR o.usuario_responsavel_id = v_meta.usuario_id)
        AND (v_meta.funil_id IS NULL OR o.funil_id = v_meta.funil_id);

      IF v_total > 0 THEN v_valor_atual := (v_ganhos / v_total) * 100; END IF;

    WHEN 'novos_contatos' THEN
      SELECT COUNT(*)::decimal INTO v_valor_atual
      FROM contatos c
      WHERE c.organizacao_id = v_org_id AND c.deletado_em IS NULL
        AND c.criado_em::date >= v_meta.data_inicio AND c.criado_em::date <= v_meta.data_fim
        AND (v_meta.usuario_id IS NULL OR c.owner_id = v_meta.usuario_id);

    WHEN 'tempo_fechamento' THEN
      SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (o.fechado_em - o.criado_em)) / 86400), 0) INTO v_valor_atual
      FROM oportunidades o
      WHERE o.organizacao_id = v_org_id AND o.etapa_id = ANY(v_ganho_ids) AND o.deletado_em IS NULL
        AND o.fechado_em IS NOT NULL AND o.fechado_em::date >= v_meta.data_inicio AND o.fechado_em::date <= v_meta.data_fim
        AND (v_meta.usuario_id IS NULL OR o.usuario_responsavel_id = v_meta.usuario_id)
        AND (v_meta.funil_id IS NULL OR o.funil_id = v_meta.funil_id);

    ELSE
      -- Métricas não implementadas: manter valor atual
      SELECT COALESCE(mp.valor_atual, 0) INTO v_valor_atual FROM metas_progresso mp WHERE mp.meta_id = p_meta_id;
  END CASE;

  IF v_valor_alvo > 0 THEN v_percentual := ROUND((v_valor_atual / v_valor_alvo) * 100, 2); END IF;

  INSERT INTO metas_progresso (meta_id, organizacao_id, valor_atual, percentual_atingido, calculado_em)
  VALUES (p_meta_id, v_org_id, v_valor_atual, v_percentual, now())
  ON CONFLICT (meta_id) DO UPDATE SET valor_atual = v_valor_atual, percentual_atingido = v_percentual, calculado_em = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function para recalcular metas quando oportunidade muda
CREATE OR REPLACE FUNCTION trg_recalcular_metas_oportunidade()
RETURNS trigger AS $$
DECLARE
  v_meta RECORD;
  v_org_id uuid;
BEGIN
  v_org_id := COALESCE(NEW.organizacao_id, OLD.organizacao_id);

  FOR v_meta IN
    SELECT id FROM metas
    WHERE organizacao_id = v_org_id AND ativo = true AND deletado_em IS NULL
      AND metrica IN ('valor_vendas', 'quantidade_vendas', 'novos_negocios', 'ticket_medio', 'taxa_conversao', 'tempo_fechamento')
      AND data_inicio <= CURRENT_DATE AND data_fim >= CURRENT_DATE
  LOOP
    PERFORM recalcular_progresso_meta(v_meta.id);
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS trg_oportunidades_metas ON oportunidades;
CREATE TRIGGER trg_oportunidades_metas
  AFTER INSERT OR UPDATE OF etapa_id, valor, usuario_responsavel_id, funil_id, fechado_em, deletado_em
  ON oportunidades
  FOR EACH ROW
  EXECUTE FUNCTION trg_recalcular_metas_oportunidade();

-- Bootstrap: recalcular todas as metas ativas
DO $$
DECLARE v_meta RECORD;
BEGIN
  FOR v_meta IN SELECT id FROM metas WHERE ativo = true AND deletado_em IS NULL
  LOOP
    PERFORM recalcular_progresso_meta(v_meta.id);
  END LOOP;
END;
$$;
