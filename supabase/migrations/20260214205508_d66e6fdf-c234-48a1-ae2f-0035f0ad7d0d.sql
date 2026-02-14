-- AIDEV-NOTE: Função para resolver @lid → conversa_id via busca em raw_data das mensagens
CREATE OR REPLACE FUNCTION public.resolve_lid_conversa(p_org_id uuid, p_lid_number text)
RETURNS TABLE(conversa_id uuid) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT m.conversa_id
  FROM mensagens m
  WHERE m.organizacao_id = p_org_id
    AND m.raw_data::text LIKE '%' || p_lid_number || '%'
  LIMIT 1;
$$;