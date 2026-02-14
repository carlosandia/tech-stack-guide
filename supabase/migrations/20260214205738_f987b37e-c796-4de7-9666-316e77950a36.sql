CREATE OR REPLACE FUNCTION public.resolve_lid_conversa(p_org_id uuid, p_lid_number text)
RETURNS TABLE(conversa_id uuid) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.conversa_id
  FROM mensagens m
  JOIN conversas c ON c.id = m.conversa_id
  WHERE m.organizacao_id = p_org_id
    AND m.raw_data::text LIKE '%' || p_lid_number || '%'
    AND c.deletado_em IS NULL
  LIMIT 1;
$$;