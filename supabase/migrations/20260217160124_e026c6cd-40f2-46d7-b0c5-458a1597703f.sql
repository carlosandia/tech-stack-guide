
-- Adicionar colunas de cadência em tarefas_templates
ALTER TABLE tarefas_templates
  ADD COLUMN IF NOT EXISTS modo VARCHAR(20) DEFAULT 'comum' CHECK (modo IN ('comum', 'cadencia')),
  ADD COLUMN IF NOT EXISTS assunto_email VARCHAR(500),
  ADD COLUMN IF NOT EXISTS corpo_mensagem TEXT;

-- Adicionar colunas de cadência em tarefas
ALTER TABLE tarefas
  ADD COLUMN IF NOT EXISTS modo VARCHAR(20) DEFAULT 'comum',
  ADD COLUMN IF NOT EXISTS assunto_email VARCHAR(500),
  ADD COLUMN IF NOT EXISTS corpo_mensagem TEXT;

-- Atualizar trigger para propagar novos campos
CREATE OR REPLACE FUNCTION public.aplicar_config_pipeline_oportunidade()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_config_dist RECORD;
  v_membros UUID[];
  v_membros_filtrados UUID[];
  v_posicao INT;
  v_responsavel_id UUID;
  v_dentro_horario BOOLEAN := TRUE;
  v_agora TIMESTAMPTZ;
  v_hora_atual TEXT;
  v_dia_semana INT;
  v_membro UUID;
  v_usuario_ativo BOOLEAN;
  v_vinculo RECORD;
  v_data_vencimento TIMESTAMPTZ;
BEGIN
  IF NEW.etapa_id IS NULL OR NEW.funil_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 1. DISTRIBUIÇÃO ROUND-ROBIN (só se não tem responsável)
  IF NEW.usuario_responsavel_id IS NULL THEN
    BEGIN
      SELECT * INTO v_config_dist
      FROM configuracoes_distribuicao
      WHERE funil_id = NEW.funil_id
      LIMIT 1;

      IF FOUND AND v_config_dist.modo = 'rodizio' THEN
        v_agora := NOW() AT TIME ZONE 'America/Sao_Paulo';
        v_dia_semana := EXTRACT(DOW FROM v_agora)::INT;
        v_hora_atual := TO_CHAR(v_agora, 'HH24:MI');

        IF v_config_dist.horario_especifico THEN
          IF v_config_dist.dias_semana IS NOT NULL AND NOT (v_dia_semana = ANY(v_config_dist.dias_semana)) THEN
            v_dentro_horario := FALSE;
          END IF;
          IF v_config_dist.horario_inicio IS NOT NULL AND v_config_dist.horario_fim IS NOT NULL THEN
            IF v_hora_atual < LEFT(v_config_dist.horario_inicio::TEXT, 5) OR v_hora_atual > LEFT(v_config_dist.horario_fim::TEXT, 5) THEN
              v_dentro_horario := FALSE;
            END IF;
          END IF;
        END IF;

        IF v_dentro_horario THEN
          SELECT ARRAY_AGG(fm.usuario_id)
          INTO v_membros
          FROM funis_membros fm
          WHERE fm.funil_id = NEW.funil_id AND fm.ativo = TRUE;

          IF v_membros IS NOT NULL AND array_length(v_membros, 1) > 0 THEN
            IF v_config_dist.pular_inativos THEN
              v_membros_filtrados := ARRAY[]::UUID[];
              FOREACH v_membro IN ARRAY v_membros LOOP
                SELECT (u.status = 'ativo') INTO v_usuario_ativo
                FROM usuarios u WHERE u.id = v_membro;
                IF v_usuario_ativo THEN
                  v_membros_filtrados := array_append(v_membros_filtrados, v_membro);
                END IF;
              END LOOP;
            ELSE
              v_membros_filtrados := v_membros;
            END IF;

            IF v_membros_filtrados IS NOT NULL AND array_length(v_membros_filtrados, 1) > 0 THEN
              v_posicao := COALESCE(v_config_dist.posicao_rodizio, 0) % array_length(v_membros_filtrados, 1);
              v_responsavel_id := v_membros_filtrados[v_posicao + 1];

              UPDATE oportunidades
              SET usuario_responsavel_id = v_responsavel_id
              WHERE id = NEW.id;

              UPDATE configuracoes_distribuicao
              SET posicao_rodizio = COALESCE(v_config_dist.posicao_rodizio, 0) + 1,
                  ultimo_usuario_id = v_responsavel_id,
                  atualizado_em = NOW()
              WHERE id = v_config_dist.id;
            END IF;
          END IF;
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[trigger-pipeline] Erro distribuição: %', SQLERRM;
    END;
  END IF;

  -- 2. TAREFAS AUTOMÁTICAS DA ETAPA (sempre executa)
  BEGIN
    FOR v_vinculo IN
      SELECT tt.id AS template_id, tt.titulo, tt.tipo, tt.descricao,
             tt.canal, tt.prioridade, tt.dias_prazo,
             tt.modo, tt.assunto_email, tt.corpo_mensagem
      FROM funis_etapas_tarefas fet
      JOIN tarefas_templates tt ON tt.id = fet.tarefa_template_id
      WHERE fet.etapa_funil_id = NEW.etapa_id
        AND fet.ativo = TRUE
    LOOP
      v_data_vencimento := NULL;
      IF v_vinculo.dias_prazo IS NOT NULL THEN
        v_data_vencimento := NOW() + (v_vinculo.dias_prazo || ' days')::INTERVAL;
      END IF;

      INSERT INTO tarefas (
        organizacao_id, oportunidade_id, contato_id,
        titulo, descricao, tipo, canal, prioridade,
        owner_id, status, data_vencimento,
        tarefa_template_id, etapa_origem_id,
        modo, assunto_email, corpo_mensagem
      ) VALUES (
        NEW.organizacao_id, NEW.id, NEW.contato_id,
        v_vinculo.titulo, v_vinculo.descricao, COALESCE(v_vinculo.tipo, 'tarefa'),
        v_vinculo.canal, COALESCE(v_vinculo.prioridade, 'media'),
        COALESCE(v_responsavel_id, NEW.usuario_responsavel_id), 'pendente', v_data_vencimento,
        v_vinculo.template_id, NEW.etapa_id,
        COALESCE(v_vinculo.modo, 'comum'), v_vinculo.assunto_email, v_vinculo.corpo_mensagem
      );
    END LOOP;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[trigger-pipeline] Erro tarefas: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$;
