
-- =====================================================
-- Trigger para CONTATOS_SEGMENTOS (tags de contatos)
-- Registra no audit_log quando tag é adicionada/removida
-- vinculando a todas as oportunidades ativas do contato
-- =====================================================

CREATE OR REPLACE FUNCTION public.audit_contatos_segmentos_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usuario_id uuid;
  v_segmento_nome text;
  v_oportunidade record;
BEGIN
  v_usuario_id := get_current_usuario_id();

  -- Buscar nome do segmento
  SELECT nome INTO v_segmento_nome
  FROM segmentos
  WHERE id = COALESCE(NEW.segmento_id, OLD.segmento_id);

  IF TG_OP = 'INSERT' THEN
    -- Tag adicionada: registrar em todas as oportunidades ativas do contato
    FOR v_oportunidade IN
      SELECT id, organizacao_id FROM oportunidades
      WHERE contato_id = NEW.contato_id
        AND deletado_em IS NULL
        AND fechado_em IS NULL
    LOOP
      INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes)
      VALUES (
        v_oportunidade.organizacao_id,
        v_usuario_id,
        'tag_adicionada',
        'oportunidades',
        v_oportunidade.id,
        jsonb_build_object(
          'segmento_id', NEW.segmento_id,
          'segmento_nome', COALESCE(v_segmento_nome, 'Desconhecido'),
          'contato_id', NEW.contato_id
        )
      );
    END LOOP;
  END IF;

  IF TG_OP = 'DELETE' THEN
    -- Tag removida: registrar em todas as oportunidades ativas do contato
    FOR v_oportunidade IN
      SELECT id, organizacao_id FROM oportunidades
      WHERE contato_id = OLD.contato_id
        AND deletado_em IS NULL
        AND fechado_em IS NULL
    LOOP
      INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes)
      VALUES (
        v_oportunidade.organizacao_id,
        v_usuario_id,
        'tag_removida',
        'oportunidades',
        v_oportunidade.id,
        jsonb_build_object(
          'segmento_id', OLD.segmento_id,
          'segmento_nome', COALESCE(v_segmento_nome, 'Desconhecido'),
          'contato_id', OLD.contato_id
        )
      );
    END LOOP;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS audit_contatos_segmentos_trigger ON contatos_segmentos;
CREATE TRIGGER audit_contatos_segmentos_trigger
  AFTER INSERT OR DELETE ON contatos_segmentos
  FOR EACH ROW EXECUTE FUNCTION audit_contatos_segmentos_fn();
