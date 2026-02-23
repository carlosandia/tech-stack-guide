CREATE OR REPLACE FUNCTION public.validate_partner_code(p_codigo text)
RETURNS TABLE(id uuid, codigo_indicacao text, organizacao_nome text)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.codigo_indicacao::text, o.nome::text AS organizacao_nome
  FROM parceiros p
  JOIN organizacoes_saas o ON o.id = p.organizacao_id
  WHERE p.codigo_indicacao = UPPER(p_codigo)
    AND p.status = 'ativo'
  LIMIT 1;
END;
$$;