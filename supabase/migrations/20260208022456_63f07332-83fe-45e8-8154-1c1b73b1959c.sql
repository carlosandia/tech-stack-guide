
-- =====================================================
-- Audit Log Triggers para Histórico de Oportunidades
-- Registra automaticamente eventos em oportunidades,
-- anotações, tarefas, documentos, emails, reuniões e contatos
-- =====================================================

-- Helper: buscar usuario_id a partir de auth.uid()
CREATE OR REPLACE FUNCTION public.get_current_usuario_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.usuarios WHERE auth_id = auth.uid() LIMIT 1
$$;

-- =====================================================
-- 1. Trigger para OPORTUNIDADES
-- =====================================================
CREATE OR REPLACE FUNCTION public.audit_oportunidades_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usuario_id uuid;
  v_acao text;
  v_detalhes jsonb DEFAULT '{}'::jsonb;
  v_should_log boolean DEFAULT false;
BEGIN
  v_usuario_id := get_current_usuario_id();

  IF TG_OP = 'INSERT' THEN
    v_acao := 'criacao';
    v_detalhes := jsonb_build_object('titulo', NEW.titulo);
    v_should_log := true;

    INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes, dados_novos)
    VALUES (NEW.organizacao_id, v_usuario_id, v_acao, 'oportunidades', NEW.id, v_detalhes, to_jsonb(NEW));
    RETURN NEW;
  END IF;

  -- UPDATE: detectar mudanças específicas
  IF TG_OP = 'UPDATE' THEN
    -- Movimentação de etapa
    IF OLD.etapa_id IS DISTINCT FROM NEW.etapa_id THEN
      INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes, dados_anteriores, dados_novos)
      VALUES (NEW.organizacao_id, v_usuario_id, 'movimentacao', 'oportunidades', NEW.id,
        jsonb_build_object('etapa_anterior_id', OLD.etapa_id, 'etapa_nova_id', NEW.etapa_id),
        jsonb_build_object('etapa_id', OLD.etapa_id),
        jsonb_build_object('etapa_id', NEW.etapa_id));
      v_should_log := true;
    END IF;

    -- Alteração de valor
    IF OLD.valor IS DISTINCT FROM NEW.valor THEN
      INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes)
      VALUES (NEW.organizacao_id, v_usuario_id, 'alteracao_campo', 'oportunidades', NEW.id,
        jsonb_build_object('campo', 'valor', 'de', OLD.valor, 'para', NEW.valor));
      v_should_log := true;
    END IF;

    -- Alteração de responsável
    IF OLD.usuario_responsavel_id IS DISTINCT FROM NEW.usuario_responsavel_id THEN
      INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes)
      VALUES (NEW.organizacao_id, v_usuario_id, 'alteracao_campo', 'oportunidades', NEW.id,
        jsonb_build_object('campo', 'responsavel', 'de', OLD.usuario_responsavel_id, 'para', NEW.usuario_responsavel_id));
      v_should_log := true;
    END IF;

    -- Alteração de previsão de fechamento
    IF OLD.previsao_fechamento IS DISTINCT FROM NEW.previsao_fechamento THEN
      INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes)
      VALUES (NEW.organizacao_id, v_usuario_id, 'alteracao_campo', 'oportunidades', NEW.id,
        jsonb_build_object('campo', 'previsao_fechamento', 'de', OLD.previsao_fechamento, 'para', NEW.previsao_fechamento));
      v_should_log := true;
    END IF;

    -- Fechamento
    IF OLD.fechado_em IS NULL AND NEW.fechado_em IS NOT NULL THEN
      INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes)
      VALUES (NEW.organizacao_id, v_usuario_id, 'fechamento', 'oportunidades', NEW.id,
        jsonb_build_object('motivo_resultado_id', NEW.motivo_resultado_id));
      v_should_log := true;
    END IF;

    -- Exclusão (soft delete)
    IF OLD.deletado_em IS NULL AND NEW.deletado_em IS NOT NULL THEN
      INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes)
      VALUES (NEW.organizacao_id, v_usuario_id, 'exclusao', 'oportunidades', NEW.id, '{}'::jsonb);
      v_should_log := true;
    END IF;

    -- Alteração de título
    IF OLD.titulo IS DISTINCT FROM NEW.titulo THEN
      INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes)
      VALUES (NEW.organizacao_id, v_usuario_id, 'alteracao_campo', 'oportunidades', NEW.id,
        jsonb_build_object('campo', 'titulo', 'de', OLD.titulo, 'para', NEW.titulo));
      v_should_log := true;
    END IF;

    -- Qualificação MQL
    IF OLD.qualificado_mql IS DISTINCT FROM NEW.qualificado_mql AND NEW.qualificado_mql = true THEN
      INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes)
      VALUES (NEW.organizacao_id, v_usuario_id, 'qualificacao', 'oportunidades', NEW.id,
        jsonb_build_object('tipo', 'MQL'));
    END IF;

    -- Qualificação SQL
    IF OLD.qualificado_sql IS DISTINCT FROM NEW.qualificado_sql AND NEW.qualificado_sql = true THEN
      INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes)
      VALUES (NEW.organizacao_id, v_usuario_id, 'qualificacao', 'oportunidades', NEW.id,
        jsonb_build_object('tipo', 'SQL'));
    END IF;

    RETURN NEW;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_oportunidades_trigger
  AFTER INSERT OR UPDATE ON oportunidades
  FOR EACH ROW EXECUTE FUNCTION audit_oportunidades_fn();

-- =====================================================
-- 2. Trigger para ANOTAÇÕES
-- =====================================================
CREATE OR REPLACE FUNCTION public.audit_anotacoes_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usuario_id uuid;
  v_acao text;
  v_detalhes jsonb;
BEGIN
  v_usuario_id := get_current_usuario_id();

  IF TG_OP = 'INSERT' THEN
    v_acao := 'anotacao_criada';
    v_detalhes := jsonb_build_object('tipo', NEW.tipo);
    
    INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes)
    VALUES (NEW.organizacao_id, v_usuario_id, v_acao, 'anotacoes_oportunidades', NEW.oportunidade_id, v_detalhes);
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Soft delete
    IF OLD.deletado_em IS NULL AND NEW.deletado_em IS NOT NULL THEN
      INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes)
      VALUES (NEW.organizacao_id, v_usuario_id, 'anotacao_excluida', 'anotacoes_oportunidades', NEW.oportunidade_id,
        jsonb_build_object('tipo', NEW.tipo));
    -- Edição de conteúdo
    ELSIF OLD.conteudo IS DISTINCT FROM NEW.conteudo THEN
      INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes)
      VALUES (NEW.organizacao_id, v_usuario_id, 'anotacao_editada', 'anotacoes_oportunidades', NEW.oportunidade_id,
        jsonb_build_object('tipo', NEW.tipo));
    END IF;
    RETURN NEW;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_anotacoes_trigger
  AFTER INSERT OR UPDATE ON anotacoes_oportunidades
  FOR EACH ROW EXECUTE FUNCTION audit_anotacoes_fn();

-- =====================================================
-- 3. Trigger para TAREFAS
-- =====================================================
CREATE OR REPLACE FUNCTION public.audit_tarefas_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usuario_id uuid;
BEGIN
  -- Só registrar se tem oportunidade_id
  IF NEW.oportunidade_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_usuario_id := get_current_usuario_id();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes)
    VALUES (NEW.organizacao_id, v_usuario_id, 'tarefa_criada', 'tarefas', NEW.oportunidade_id,
      jsonb_build_object('titulo', NEW.titulo, 'tipo', NEW.tipo, 'prioridade', NEW.prioridade));
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Tarefa concluída
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'concluida' THEN
      INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes)
      VALUES (NEW.organizacao_id, v_usuario_id, 'tarefa_concluida', 'tarefas', NEW.oportunidade_id,
        jsonb_build_object('titulo', NEW.titulo));
      RETURN NEW;
    END IF;

    -- Tarefa excluída (soft delete)
    IF OLD.deletado_em IS NULL AND NEW.deletado_em IS NOT NULL THEN
      INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes)
      VALUES (NEW.organizacao_id, v_usuario_id, 'tarefa_excluida', 'tarefas', NEW.oportunidade_id,
        jsonb_build_object('titulo', NEW.titulo));
      RETURN NEW;
    END IF;

    -- Alteração de status genérica
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes)
      VALUES (NEW.organizacao_id, v_usuario_id, 'tarefa_atualizada', 'tarefas', NEW.oportunidade_id,
        jsonb_build_object('titulo', NEW.titulo, 'status_anterior', OLD.status, 'status_novo', NEW.status));
      RETURN NEW;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_tarefas_trigger
  AFTER INSERT OR UPDATE ON tarefas
  FOR EACH ROW EXECUTE FUNCTION audit_tarefas_fn();

-- =====================================================
-- 4. Trigger para DOCUMENTOS
-- =====================================================
CREATE OR REPLACE FUNCTION public.audit_documentos_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usuario_id uuid;
BEGIN
  v_usuario_id := get_current_usuario_id();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes)
    VALUES (NEW.organizacao_id, v_usuario_id, 'documento_anexado', 'documentos_oportunidades', NEW.oportunidade_id,
      jsonb_build_object('nome_arquivo', NEW.nome_arquivo, 'tipo_arquivo', NEW.tipo_arquivo));
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.deletado_em IS NULL AND NEW.deletado_em IS NOT NULL THEN
      INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes)
      VALUES (NEW.organizacao_id, v_usuario_id, 'documento_removido', 'documentos_oportunidades', NEW.oportunidade_id,
        jsonb_build_object('nome_arquivo', NEW.nome_arquivo));
    END IF;
    RETURN NEW;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_documentos_trigger
  AFTER INSERT OR UPDATE ON documentos_oportunidades
  FOR EACH ROW EXECUTE FUNCTION audit_documentos_fn();

-- =====================================================
-- 5. Trigger para EMAILS
-- =====================================================
CREATE OR REPLACE FUNCTION public.audit_emails_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usuario_id uuid;
BEGIN
  v_usuario_id := get_current_usuario_id();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes)
    VALUES (NEW.organizacao_id, v_usuario_id, 'email_criado', 'emails_oportunidades', NEW.oportunidade_id,
      jsonb_build_object('assunto', NEW.assunto, 'destinatario', NEW.destinatario));
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'enviado' THEN
      INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes)
      VALUES (NEW.organizacao_id, v_usuario_id, 'email_enviado', 'emails_oportunidades', NEW.oportunidade_id,
        jsonb_build_object('assunto', NEW.assunto, 'destinatario', NEW.destinatario));
    END IF;
    RETURN NEW;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_emails_trigger
  AFTER INSERT OR UPDATE ON emails_oportunidades
  FOR EACH ROW EXECUTE FUNCTION audit_emails_fn();

-- =====================================================
-- 6. Trigger para REUNIÕES
-- =====================================================
CREATE OR REPLACE FUNCTION public.audit_reunioes_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usuario_id uuid;
  v_acao text;
BEGIN
  v_usuario_id := get_current_usuario_id();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes)
    VALUES (NEW.organizacao_id, v_usuario_id, 'reuniao_agendada', 'reunioes_oportunidades', NEW.oportunidade_id,
      jsonb_build_object('titulo', NEW.titulo, 'tipo', NEW.tipo, 'data_inicio', NEW.data_inicio, 'status', NEW.status));
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Status mudou
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      CASE NEW.status
        WHEN 'realizada' THEN v_acao := 'reuniao_realizada';
        WHEN 'cancelada' THEN v_acao := 'reuniao_cancelada';
        WHEN 'noshow' THEN v_acao := 'reuniao_noshow';
        ELSE v_acao := 'reuniao_atualizada';
      END CASE;

      INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes)
      VALUES (NEW.organizacao_id, v_usuario_id, v_acao, 'reunioes_oportunidades', NEW.oportunidade_id,
        jsonb_build_object('titulo', NEW.titulo, 'status', NEW.status, 'status_anterior', OLD.status));
      RETURN NEW;
    END IF;

    -- Reagendamento (data mudou)
    IF OLD.data_inicio IS DISTINCT FROM NEW.data_inicio THEN
      INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes)
      VALUES (NEW.organizacao_id, v_usuario_id, 'reuniao_reagendada', 'reunioes_oportunidades', NEW.oportunidade_id,
        jsonb_build_object('titulo', NEW.titulo, 'data_anterior', OLD.data_inicio, 'data_nova', NEW.data_inicio));
      RETURN NEW;
    END IF;

    -- Soft delete
    IF OLD.deletado_em IS NULL AND NEW.deletado_em IS NOT NULL THEN
      INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes)
      VALUES (NEW.organizacao_id, v_usuario_id, 'reuniao_excluida', 'reunioes_oportunidades', NEW.oportunidade_id,
        jsonb_build_object('titulo', NEW.titulo));
      RETURN NEW;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_reunioes_trigger
  AFTER INSERT OR UPDATE ON reunioes_oportunidades
  FOR EACH ROW EXECUTE FUNCTION audit_reunioes_fn();

-- =====================================================
-- 7. Trigger para CONTATOS (especial - busca oportunidades)
-- =====================================================
CREATE OR REPLACE FUNCTION public.audit_contatos_oportunidades_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usuario_id uuid;
  v_detalhes jsonb DEFAULT '{}'::jsonb;
  v_campos_alterados text[] DEFAULT '{}';
  v_op record;
BEGIN
  v_usuario_id := get_current_usuario_id();

  -- Detectar campos alterados
  IF OLD.nome IS DISTINCT FROM NEW.nome THEN v_campos_alterados := array_append(v_campos_alterados, 'nome'); END IF;
  IF OLD.sobrenome IS DISTINCT FROM NEW.sobrenome THEN v_campos_alterados := array_append(v_campos_alterados, 'sobrenome'); END IF;
  IF OLD.email IS DISTINCT FROM NEW.email THEN v_campos_alterados := array_append(v_campos_alterados, 'email'); END IF;
  IF OLD.telefone IS DISTINCT FROM NEW.telefone THEN v_campos_alterados := array_append(v_campos_alterados, 'telefone'); END IF;
  IF OLD.empresa_id IS DISTINCT FROM NEW.empresa_id THEN v_campos_alterados := array_append(v_campos_alterados, 'empresa'); END IF;
  IF OLD.nome_fantasia IS DISTINCT FROM NEW.nome_fantasia THEN v_campos_alterados := array_append(v_campos_alterados, 'nome_fantasia'); END IF;
  IF OLD.razao_social IS DISTINCT FROM NEW.razao_social THEN v_campos_alterados := array_append(v_campos_alterados, 'razao_social'); END IF;
  IF OLD.cargo IS DISTINCT FROM NEW.cargo THEN v_campos_alterados := array_append(v_campos_alterados, 'cargo'); END IF;

  -- Se nenhum campo relevante mudou, sair
  IF array_length(v_campos_alterados, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  v_detalhes := jsonb_build_object(
    'campos_alterados', to_jsonb(v_campos_alterados),
    'contato_id', NEW.id,
    'contato_nome', COALESCE(NEW.nome, NEW.nome_fantasia, 'Contato')
  );

  -- Buscar todas as oportunidades ativas vinculadas a este contato
  FOR v_op IN
    SELECT id, organizacao_id FROM oportunidades
    WHERE contato_id = NEW.id AND deletado_em IS NULL
  LOOP
    INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes)
    VALUES (v_op.organizacao_id, v_usuario_id, 'contato_atualizado', 'contatos', v_op.id, v_detalhes);
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_contatos_oportunidades_trigger
  AFTER UPDATE ON contatos
  FOR EACH ROW EXECUTE FUNCTION audit_contatos_oportunidades_fn();
