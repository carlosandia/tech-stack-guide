
-- Tabela de origens dinâmicas (canais de aquisição)
CREATE TABLE public.origens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes_saas(id),
  nome text NOT NULL,
  slug text NOT NULL,
  cor text,
  padrao_sistema boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organizacao_id, slug)
);

-- Índice composto para queries filtradas por tenant
CREATE INDEX idx_origens_org_ativo ON public.origens(organizacao_id, ativo);

-- RLS
ALTER TABLE public.origens ENABLE ROW LEVEL SECURITY;

-- Policy: membros do tenant podem ler
CREATE POLICY "origens_select_tenant" ON public.origens
  FOR SELECT USING (organizacao_id = public.get_user_tenant_id());

-- Policy: admin do tenant pode inserir
CREATE POLICY "origens_insert_admin" ON public.origens
  FOR INSERT WITH CHECK (
    organizacao_id = public.get_user_tenant_id()
    AND public.is_tenant_admin()
  );

-- Policy: admin do tenant pode atualizar
CREATE POLICY "origens_update_admin" ON public.origens
  FOR UPDATE USING (
    organizacao_id = public.get_user_tenant_id()
    AND public.is_tenant_admin()
  );

-- Policy: admin pode deletar apenas não-sistema
CREATE POLICY "origens_delete_admin" ON public.origens
  FOR DELETE USING (
    organizacao_id = public.get_user_tenant_id()
    AND public.is_tenant_admin()
    AND padrao_sistema = false
  );

-- Função para criar origens padrão ao criar organização
CREATE OR REPLACE FUNCTION public.criar_origens_padrao(p_organizacao_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO origens (organizacao_id, nome, slug, padrao_sistema)
  VALUES
    (p_organizacao_id, 'Manual', 'manual', true),
    (p_organizacao_id, 'WhatsApp', 'whatsapp', true),
    (p_organizacao_id, 'Instagram', 'instagram', true),
    (p_organizacao_id, 'Indicação', 'indicacao', true),
    (p_organizacao_id, 'Site', 'site', true),
    (p_organizacao_id, 'Formulário', 'formulario', true),
    (p_organizacao_id, 'Importação', 'importacao', true),
    (p_organizacao_id, 'Evento', 'evento', true)
  ON CONFLICT (organizacao_id, slug) DO NOTHING;
END;
$$;

-- Seed: criar origens padrão para todas organizações existentes
DO $$
DECLARE
  org RECORD;
BEGIN
  FOR org IN SELECT id FROM organizacoes_saas LOOP
    PERFORM criar_origens_padrao(org.id);
  END LOOP;
END;
$$;
