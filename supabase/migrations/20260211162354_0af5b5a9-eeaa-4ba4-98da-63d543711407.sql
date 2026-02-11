
-- =====================================================
-- PRD-12: Módulo de Automações - Schema
-- =====================================================

-- =====================================================
-- 1. Tabela principal: automacoes
-- =====================================================
CREATE TABLE public.automacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  nome text NOT NULL,
  descricao text,
  ativo boolean NOT NULL DEFAULT false,

  -- Trigger
  trigger_tipo text NOT NULL,
  trigger_config jsonb NOT NULL DEFAULT '{}',

  -- Condições (array de condições AND)
  condicoes jsonb NOT NULL DEFAULT '[]',

  -- Ações (array ordenado de ações)
  acoes jsonb NOT NULL DEFAULT '[]',

  -- Controle anti-loop
  max_execucoes_hora integer NOT NULL DEFAULT 50,
  execucoes_ultima_hora integer NOT NULL DEFAULT 0,
  ultima_execucao_em timestamptz,
  total_execucoes integer NOT NULL DEFAULT 0,
  total_erros integer NOT NULL DEFAULT 0,

  criado_por uuid REFERENCES usuarios(id),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz
);

-- Trigger de atualizado_em
CREATE TRIGGER set_automacoes_atualizado_em
  BEFORE UPDATE ON public.automacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_atualizado_em();

-- =====================================================
-- 2. Tabela de logs de execução
-- =====================================================
CREATE TABLE public.log_automacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  automacao_id uuid NOT NULL REFERENCES automacoes(id) ON DELETE CASCADE,

  trigger_tipo text NOT NULL,
  entidade_tipo text,
  entidade_id uuid,

  status text NOT NULL DEFAULT 'executando',
  acoes_executadas jsonb DEFAULT '[]',
  erro_mensagem text,
  dados_trigger jsonb,
  duracao_ms integer,

  criado_em timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- 3. Tabela de execuções pendentes (delays)
-- =====================================================
CREATE TABLE public.execucoes_pendentes_automacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  automacao_id uuid NOT NULL REFERENCES automacoes(id) ON DELETE CASCADE,
  log_id uuid REFERENCES log_automacoes(id),

  acao_index integer NOT NULL,
  dados_contexto jsonb NOT NULL DEFAULT '{}',

  executar_em timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pendente',

  tentativas integer NOT NULL DEFAULT 0,
  max_tentativas integer NOT NULL DEFAULT 3,
  ultimo_erro text,

  criado_em timestamptz NOT NULL DEFAULT now(),
  executado_em timestamptz
);

-- =====================================================
-- 4. Tabela de eventos (fila de processamento)
-- =====================================================
CREATE TABLE public.eventos_automacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  tipo text NOT NULL,
  entidade_tipo text NOT NULL,
  entidade_id uuid NOT NULL,

  dados jsonb NOT NULL DEFAULT '{}',
  processado boolean NOT NULL DEFAULT false,
  processado_em timestamptz,

  criado_em timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- 5. Índices
-- =====================================================
CREATE INDEX idx_automacoes_org_ativo ON automacoes(organizacao_id, ativo) WHERE deletado_em IS NULL;
CREATE INDEX idx_automacoes_trigger ON automacoes(organizacao_id, trigger_tipo, ativo) WHERE deletado_em IS NULL;
CREATE INDEX idx_log_automacoes_org ON log_automacoes(organizacao_id, automacao_id, criado_em DESC);
CREATE INDEX idx_log_automacoes_status ON log_automacoes(organizacao_id, status, criado_em DESC);
CREATE INDEX idx_execucoes_pendentes_executar ON execucoes_pendentes_automacao(executar_em, status) WHERE status = 'pendente';
CREATE INDEX idx_eventos_automacao_processar ON eventos_automacao(organizacao_id, tipo, processado) WHERE processado = false;
CREATE INDEX idx_eventos_automacao_criado ON eventos_automacao(criado_em DESC);

-- =====================================================
-- 6. RLS
-- =====================================================
ALTER TABLE public.automacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_automacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execucoes_pendentes_automacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_automacao ENABLE ROW LEVEL SECURITY;

-- automacoes: Admin pode tudo, Member pode ler
CREATE POLICY "automacoes_select" ON public.automacoes
  FOR SELECT TO authenticated
  USING (organizacao_id = public.get_user_tenant_id());

CREATE POLICY "automacoes_insert" ON public.automacoes
  FOR INSERT TO authenticated
  WITH CHECK (
    organizacao_id = public.get_user_tenant_id()
    AND public.is_tenant_admin()
  );

CREATE POLICY "automacoes_update" ON public.automacoes
  FOR UPDATE TO authenticated
  USING (
    organizacao_id = public.get_user_tenant_id()
    AND public.is_tenant_admin()
  );

CREATE POLICY "automacoes_delete" ON public.automacoes
  FOR DELETE TO authenticated
  USING (
    organizacao_id = public.get_user_tenant_id()
    AND public.is_tenant_admin()
  );

-- log_automacoes: Somente leitura para o tenant
CREATE POLICY "log_automacoes_select" ON public.log_automacoes
  FOR SELECT TO authenticated
  USING (organizacao_id = public.get_user_tenant_id());

-- Edge Functions (service_role) precisam inserir logs
CREATE POLICY "log_automacoes_insert_service" ON public.log_automacoes
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "log_automacoes_update_service" ON public.log_automacoes
  FOR UPDATE TO service_role
  USING (true);

-- execucoes_pendentes: Somente leitura para o tenant
CREATE POLICY "execucoes_pendentes_select" ON public.execucoes_pendentes_automacao
  FOR SELECT TO authenticated
  USING (organizacao_id = public.get_user_tenant_id());

CREATE POLICY "execucoes_pendentes_insert_service" ON public.execucoes_pendentes_automacao
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "execucoes_pendentes_update_service" ON public.execucoes_pendentes_automacao
  FOR UPDATE TO service_role
  USING (true);

-- eventos_automacao: Service role pode tudo, tenant pode ler
CREATE POLICY "eventos_automacao_select" ON public.eventos_automacao
  FOR SELECT TO authenticated
  USING (organizacao_id = public.get_user_tenant_id());

CREATE POLICY "eventos_automacao_insert_service" ON public.eventos_automacao
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "eventos_automacao_update_service" ON public.eventos_automacao
  FOR UPDATE TO service_role
  USING (true);

-- =====================================================
-- 7. Triggers para emitir eventos de automação
-- =====================================================

-- Função genérica para emitir evento de automação
CREATE OR REPLACE FUNCTION public.emitir_evento_automacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tipo text;
  v_entidade_tipo text;
  v_entidade_id uuid;
  v_organizacao_id uuid;
  v_dados jsonb DEFAULT '{}';
BEGIN
  -- Determinar entidade
  v_entidade_tipo := TG_ARGV[0]; -- 'oportunidade', 'contato', 'tarefa'

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

      -- Oportunidade ganha
      IF OLD.fechado_em IS NULL AND NEW.fechado_em IS NOT NULL THEN
        -- Verificar se é ganho ou perda pela etapa tipo
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

    ELSIF v_entidade_tipo = 'tarefa' THEN
      -- Tarefa concluída
      IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'concluida' THEN
        INSERT INTO eventos_automacao (organizacao_id, tipo, entidade_tipo, entidade_id, dados)
        VALUES (v_organizacao_id, 'tarefa_concluida', 'tarefa', v_entidade_id,
          jsonb_build_object(
            'titulo', NEW.titulo,
            'oportunidade_id', NEW.oportunidade_id
          ));
      END IF;

      -- Tarefa vencida é tratada pelo cron, não aqui

    ELSIF v_entidade_tipo = 'contato' THEN
      -- Contato atualizado (campos relevantes)
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
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger em oportunidades
CREATE TRIGGER trg_automacao_oportunidades
  AFTER INSERT OR UPDATE ON public.oportunidades
  FOR EACH ROW
  EXECUTE FUNCTION public.emitir_evento_automacao('oportunidade');

-- Trigger em contatos
CREATE TRIGGER trg_automacao_contatos
  AFTER INSERT OR UPDATE ON public.contatos
  FOR EACH ROW
  EXECUTE FUNCTION public.emitir_evento_automacao('contato');

-- Trigger em tarefas
CREATE TRIGGER trg_automacao_tarefas
  AFTER INSERT OR UPDATE ON public.tarefas
  FOR EACH ROW
  EXECUTE FUNCTION public.emitir_evento_automacao('tarefa');

-- Trigger em contatos_segmentos (segmento adicionado)
CREATE OR REPLACE FUNCTION public.emitir_evento_segmento_adicionado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO eventos_automacao (organizacao_id, tipo, entidade_tipo, entidade_id, dados)
    VALUES (NEW.organizacao_id, 'contato_segmento_adicionado', 'contato', NEW.contato_id,
      jsonb_build_object('segmento_id', NEW.segmento_id));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_automacao_segmentos
  AFTER INSERT ON public.contatos_segmentos
  FOR EACH ROW
  EXECUTE FUNCTION public.emitir_evento_segmento_adicionado();

-- Trigger em submissoes_formularios (formulário preenchido)
CREATE OR REPLACE FUNCTION public.emitir_evento_formulario_submetido()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO eventos_automacao (organizacao_id, tipo, entidade_tipo, entidade_id, dados)
    VALUES (NEW.organizacao_id, 'formulario_submetido', 'formulario', NEW.formulario_id,
      jsonb_build_object(
        'formulario_id', NEW.formulario_id,
        'dados', NEW.dados,
        'contato_id', NEW.contato_id
      ));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_automacao_submissoes
  AFTER INSERT ON public.submissoes_formularios
  FOR EACH ROW
  EXECUTE FUNCTION public.emitir_evento_formulario_submetido();
