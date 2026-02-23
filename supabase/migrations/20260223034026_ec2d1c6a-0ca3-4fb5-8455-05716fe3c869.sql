-- Remover policies problemáticas e criar função SECURITY DEFINER
DROP POLICY IF EXISTS "anon_select_parceiro_ativo_por_codigo" ON public.parceiros;
DROP POLICY IF EXISTS "anon_select_org_nome_publico" ON public.organizacoes_saas;

-- Função segura que retorna nome da organização parceira pelo código de indicação
CREATE OR REPLACE FUNCTION public.get_partner_name_by_code(p_codigo text)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_nome text;
BEGIN
  SELECT o.nome INTO v_nome
  FROM parceiros p
  JOIN organizacoes_saas o ON o.id = p.organizacao_id
  WHERE p.codigo_indicacao = p_codigo
    AND p.status = 'ativo'
  LIMIT 1;
  
  RETURN v_nome;
END;
$$;