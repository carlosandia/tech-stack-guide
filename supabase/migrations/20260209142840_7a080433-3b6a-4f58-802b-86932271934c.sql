
-- =====================================================
-- Tabela: ramais_voip (credenciais SIP por usuario)
-- =====================================================

CREATE TABLE public.ramais_voip (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes_saas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  extension TEXT NOT NULL,
  password_encrypted TEXT NOT NULL,
  sip_server TEXT NOT NULL DEFAULT 'sip.api4com.com.br',
  nome_exibicao TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organizacao_id, usuario_id)
);

-- RLS: usuario so ve/edita o proprio ramal
ALTER TABLE public.ramais_voip ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve proprio ramal"
  ON public.ramais_voip FOR SELECT
  TO authenticated
  USING (organizacao_id = public.get_user_tenant_id() AND usuario_id = public.get_current_usuario_id());

CREATE POLICY "Usuario insere proprio ramal"
  ON public.ramais_voip FOR INSERT
  TO authenticated
  WITH CHECK (organizacao_id = public.get_user_tenant_id() AND usuario_id = public.get_current_usuario_id());

CREATE POLICY "Usuario atualiza proprio ramal"
  ON public.ramais_voip FOR UPDATE
  TO authenticated
  USING (organizacao_id = public.get_user_tenant_id() AND usuario_id = public.get_current_usuario_id());

CREATE POLICY "Usuario deleta proprio ramal"
  ON public.ramais_voip FOR DELETE
  TO authenticated
  USING (organizacao_id = public.get_user_tenant_id() AND usuario_id = public.get_current_usuario_id());

-- Admin pode ver todos os ramais do tenant
CREATE POLICY "Admin ve ramais do tenant"
  ON public.ramais_voip FOR SELECT
  TO authenticated
  USING (organizacao_id = public.get_user_tenant_id() AND public.is_tenant_admin());

-- Trigger atualizado_em
CREATE TRIGGER set_ramais_voip_atualizado_em
  BEFORE UPDATE ON public.ramais_voip
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_atualizado_em();

-- =====================================================
-- Tabela: ligacoes (historico de chamadas)
-- =====================================================

CREATE TABLE public.ligacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes_saas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id),
  oportunidade_id UUID REFERENCES public.oportunidades(id) ON DELETE SET NULL,
  contato_id UUID REFERENCES public.contatos(id) ON DELETE SET NULL,
  numero_destino TEXT NOT NULL,
  numero_origem TEXT,
  direcao TEXT NOT NULL DEFAULT 'saida' CHECK (direcao IN ('saida', 'entrada')),
  status TEXT NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('atendida', 'nao_atendida', 'ocupado', 'cancelada', 'em_andamento')),
  duracao_segundos INTEGER DEFAULT 0,
  inicio_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  fim_em TIMESTAMPTZ,
  gravacao_url TEXT,
  notas TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: filtro por tenant
ALTER TABLE public.ligacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios veem ligacoes do tenant"
  ON public.ligacoes FOR SELECT
  TO authenticated
  USING (organizacao_id = public.get_user_tenant_id());

CREATE POLICY "Usuarios inserem ligacoes do tenant"
  ON public.ligacoes FOR INSERT
  TO authenticated
  WITH CHECK (organizacao_id = public.get_user_tenant_id() AND usuario_id = public.get_current_usuario_id());

CREATE POLICY "Usuarios atualizam proprias ligacoes"
  ON public.ligacoes FOR UPDATE
  TO authenticated
  USING (organizacao_id = public.get_user_tenant_id() AND usuario_id = public.get_current_usuario_id());

-- Indices para performance
CREATE INDEX idx_ligacoes_organizacao ON public.ligacoes(organizacao_id);
CREATE INDEX idx_ligacoes_oportunidade ON public.ligacoes(oportunidade_id);
CREATE INDEX idx_ligacoes_contato ON public.ligacoes(contato_id);
CREATE INDEX idx_ligacoes_usuario ON public.ligacoes(usuario_id);
CREATE INDEX idx_ligacoes_inicio ON public.ligacoes(inicio_em DESC);

-- =====================================================
-- Trigger audit_log para ligacoes
-- =====================================================

CREATE OR REPLACE FUNCTION public.audit_ligacoes_fn()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_usuario_id uuid;
BEGIN
  v_usuario_id := get_current_usuario_id();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes)
    VALUES (NEW.organizacao_id, v_usuario_id, 'ligacao_iniciada', 'ligacoes',
      COALESCE(NEW.oportunidade_id, NEW.id),
      jsonb_build_object('numero_destino', NEW.numero_destino, 'direcao', NEW.direcao));
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Ligacao finalizada (status mudou de em_andamento para outro)
    IF OLD.status = 'em_andamento' AND NEW.status != 'em_andamento' THEN
      INSERT INTO audit_log (organizacao_id, usuario_id, acao, entidade, entidade_id, detalhes)
      VALUES (NEW.organizacao_id, v_usuario_id, 'ligacao_finalizada', 'ligacoes',
        COALESCE(NEW.oportunidade_id, NEW.id),
        jsonb_build_object(
          'numero_destino', NEW.numero_destino,
          'status', NEW.status,
          'duracao_segundos', NEW.duracao_segundos
        ));
    END IF;
    RETURN NEW;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE TRIGGER audit_ligacoes_trigger
  AFTER INSERT OR UPDATE ON public.ligacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_ligacoes_fn();
