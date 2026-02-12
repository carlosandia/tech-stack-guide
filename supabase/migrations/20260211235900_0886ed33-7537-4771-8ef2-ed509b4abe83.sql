
-- =====================================================
-- AIDEV-NOTE: Novos triggers de eventos para automações (PRD Melhorias)
-- Adiciona triggers para: oportunidade_qualificada, conversa_finalizada
-- Os triggers para campo_contato_alterado e contato_atualizado já existem no emitir_evento_automacao
-- =====================================================

-- 1. Atualizar a função emitir_evento_automacao para emitir oportunidade_qualificada
CREATE OR REPLACE FUNCTION public.emitir_evento_automacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tipo text;
  v_entidade_tipo text;
  v_entidade_id uuid;
  v_organizacao_id uuid;
  v_dados jsonb DEFAULT '{}';
BEGIN
  v_entidade_tipo := TG_ARGV[0];

  IF TG_OP = 'INSERT' THEN
    v_entidade_id := NEW.id;
    v_organizacao_id := NEW.organizacao_id;

    IF v_entidade_tipo = 'oportunidade' THEN
      v_tipo := 'oportunidade_criada';
      v_dados := jsonb_build_object(
        'titulo', NEW.titulo,
        'valor', NEW.valor,
        'etapa_id', NEW.etapa_id,
        'funil_id', NEW.funil_id,
        'contato_id', NEW.contato_id,
        'usuario_responsavel_id', NEW.usuario_responsavel_id
      );
    ELSIF v_entidade_tipo = 'contato' THEN
      v_tipo := 'contato_criado';
      v_dados := jsonb_build_object(
        'nome', COALESCE(NEW.nome, NEW.nome_fantasia),
        'tipo', NEW.tipo,
        'email', NEW.email,
        'telefone', NEW.telefone,
        'origem', NEW.origem
      );
    ELSIF v_entidade_tipo = 'tarefa' THEN
      v_tipo := 'tarefa_criada';
      v_dados := jsonb_build_object(
        'titulo', NEW.titulo,
        'tipo', NEW.tipo,
        'oportunidade_id', NEW.oportunidade_id,
        'owner_id', NEW.owner_id
      );
    END IF;

    INSERT INTO eventos_automacao (organizacao_id, tipo, entidade_tipo, entidade_id, dados)
    VALUES (v_organizacao_id, v_tipo, v_entidade_tipo, v_entidade_id, v_dados);

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    v_entidade_id := NEW.id;
    v_organizacao_id := NEW.organizacao_id;

    IF v_entidade_tipo = 'oportunidade' THEN
      -- Movimentação de etapa
      IF OLD.etapa_id IS DISTINCT FROM NEW.etapa_id THEN
        INSERT INTO eventos_automacao (organizacao_id, tipo, entidade_tipo, entidade_id, dados)
        VALUES (v_organizacao_id, 'oportunidade_etapa_movida', 'oportunidade', v_entidade_id,
          jsonb_build_object(
            'etapa_anterior_id', OLD.etapa_id,
            'etapa_nova_id', NEW.etapa_id,
            'funil_id', NEW.funil_id,
            'titulo', NEW.titulo,
            'valor', NEW.valor,
            'contato_id', NEW.contato_id,
            'usuario_responsavel_id', NEW.usuario_responsavel_id
          ));
      END IF;

      -- Responsável alterado
      IF OLD.usuario_responsavel_id IS DISTINCT FROM NEW.usuario_responsavel_id THEN
        INSERT INTO eventos_automacao (organizacao_id, tipo, entidade_tipo, entidade_id, dados)
        VALUES (v_organizacao_id, 'oportunidade_responsavel_alterado', 'oportunidade', v_entidade_id,
          jsonb_build_object(
            'responsavel_anterior_id', OLD.usuario_responsavel_id,
            'responsavel_novo_id', NEW.usuario_responsavel_id,
            'titulo', NEW.titulo
          ));
      END IF;

      -- Valor alterado
      IF OLD.valor IS DISTINCT FROM NEW.valor THEN
        INSERT INTO eventos_automacao (organizacao_id, tipo, entidade_tipo, entidade_id, dados)
        VALUES (v_organizacao_id, 'oportunidade_valor_alterado', 'oportunidade', v_entidade_id,
          jsonb_build_object(
            'valor_anterior', OLD.valor,
            'valor_novo', NEW.valor,
            'titulo', NEW.titulo
          ));
      END IF;

      -- Oportunidade ganha/perdida
      IF OLD.fechado_em IS NULL AND NEW.fechado_em IS NOT NULL THEN
        INSERT INTO eventos_automacao (organizacao_id, tipo, entidade_tipo, entidade_id, dados)
        VALUES (v_organizacao_id,
          CASE WHEN NEW.motivo_resultado_id IS NULL THEN 'oportunidade_ganha' ELSE 'oportunidade_perdida' END,
          'oportunidade', v_entidade_id,
          jsonb_build_object(
            'titulo', NEW.titulo,
            'valor', NEW.valor,
            'contato_id', NEW.contato_id,
            'motivo_resultado_id', NEW.motivo_resultado_id
          ));
      END IF;

      -- NOVO: Qualificação MQL/SQL
      IF OLD.qualificado_mql IS DISTINCT FROM NEW.qualificado_mql AND NEW.qualificado_mql = true THEN
        INSERT INTO eventos_automacao (organizacao_id, tipo, entidade_tipo, entidade_id, dados)
        VALUES (v_organizacao_id, 'oportunidade_qualificada', 'oportunidade', v_entidade_id,
          jsonb_build_object(
            'tipo_qualificacao', 'MQL',
            'titulo', NEW.titulo,
            'valor', NEW.valor,
            'contato_id', NEW.contato_id
          ));
      END IF;

      IF OLD.qualificado_sql IS DISTINCT FROM NEW.qualificado_sql AND NEW.qualificado_sql = true THEN
        INSERT INTO eventos_automacao (organizacao_id, tipo, entidade_tipo, entidade_id, dados)
        VALUES (v_organizacao_id, 'oportunidade_qualificada', 'oportunidade', v_entidade_id,
          jsonb_build_object(
            'tipo_qualificacao', 'SQL',
            'titulo', NEW.titulo,
            'valor', NEW.valor,
            'contato_id', NEW.contato_id
          ));
      END IF;

    ELSIF v_entidade_tipo = 'tarefa' THEN
      IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'concluida' THEN
        INSERT INTO eventos_automacao (organizacao_id, tipo, entidade_tipo, entidade_id, dados)
        VALUES (v_organizacao_id, 'tarefa_concluida', 'tarefa', v_entidade_id,
          jsonb_build_object(
            'titulo', NEW.titulo,
            'oportunidade_id', NEW.oportunidade_id
          ));
      END IF;

    ELSIF v_entidade_tipo = 'contato' THEN
      -- Contato atualizado (campos relevantes) — inclui campo_contato_alterado
      IF OLD.nome IS DISTINCT FROM NEW.nome
         OR OLD.email IS DISTINCT FROM NEW.email
         OR OLD.telefone IS DISTINCT FROM NEW.telefone
         OR OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO eventos_automacao (organizacao_id, tipo, entidade_tipo, entidade_id, dados)
        VALUES (v_organizacao_id, 'contato_atualizado', 'contato', v_entidade_id,
          jsonb_build_object(
            'nome', COALESCE(NEW.nome, NEW.nome_fantasia),
            'email', NEW.email,
            'tipo', NEW.tipo
          ));

        -- NOVO: Evento específico para campo alterado (para trigger campo_contato_alterado)
        IF OLD.nome IS DISTINCT FROM NEW.nome THEN
          INSERT INTO eventos_automacao (organizacao_id, tipo, entidade_tipo, entidade_id, dados)
          VALUES (v_organizacao_id, 'campo_contato_alterado', 'contato', v_entidade_id,
            jsonb_build_object('campo', 'nome', 'valor_anterior', OLD.nome, 'valor_novo', NEW.nome));
        END IF;
        IF OLD.email IS DISTINCT FROM NEW.email THEN
          INSERT INTO eventos_automacao (organizacao_id, tipo, entidade_tipo, entidade_id, dados)
          VALUES (v_organizacao_id, 'campo_contato_alterado', 'contato', v_entidade_id,
            jsonb_build_object('campo', 'email', 'valor_anterior', OLD.email, 'valor_novo', NEW.email));
        END IF;
        IF OLD.telefone IS DISTINCT FROM NEW.telefone THEN
          INSERT INTO eventos_automacao (organizacao_id, tipo, entidade_tipo, entidade_id, dados)
          VALUES (v_organizacao_id, 'campo_contato_alterado', 'contato', v_entidade_id,
            jsonb_build_object('campo', 'telefone', 'valor_anterior', OLD.telefone, 'valor_novo', NEW.telefone));
        END IF;
        IF OLD.status IS DISTINCT FROM NEW.status THEN
          INSERT INTO eventos_automacao (organizacao_id, tipo, entidade_tipo, entidade_id, dados)
          VALUES (v_organizacao_id, 'campo_contato_alterado', 'contato', v_entidade_id,
            jsonb_build_object('campo', 'status', 'valor_anterior', OLD.status, 'valor_novo', NEW.status));
        END IF;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 2. Trigger para conversa_finalizada
CREATE OR REPLACE FUNCTION public.emitir_evento_conversa()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Conversa finalizada (status muda para resolvida ou fechada)
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('resolvida', 'fechada') THEN
      INSERT INTO eventos_automacao (organizacao_id, tipo, entidade_tipo, entidade_id, dados)
      VALUES (NEW.organizacao_id, 'conversa_finalizada', 'conversa', NEW.id,
        jsonb_build_object(
          'canal', NEW.canal,
          'contato_id', NEW.contato_id,
          'status_anterior', OLD.status,
          'status_novo', NEW.status,
          'total_mensagens', NEW.total_mensagens
        ));
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Criar trigger na tabela conversas (se não existir)
DROP TRIGGER IF EXISTS trg_conversa_evento_automacao ON conversas;
CREATE TRIGGER trg_conversa_evento_automacao
  AFTER UPDATE ON conversas
  FOR EACH ROW
  EXECUTE FUNCTION emitir_evento_conversa();
