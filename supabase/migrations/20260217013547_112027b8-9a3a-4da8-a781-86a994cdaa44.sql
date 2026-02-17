
-- Função para calcular storage usado por organização
-- Soma tamanhos de todos os arquivos em todos os buckets relevantes
-- onde o path começa com o organizacao_id
CREATE OR REPLACE FUNCTION public.calcular_storage_organizacao(p_organizacao_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'storage'
AS $$
  SELECT COALESCE(SUM((metadata->>'size')::bigint), 0)
  FROM storage.objects
  WHERE bucket_id IN (
    'documentos-oportunidades', 'anotacoes-audio', 'email-anexos', 
    'chat-media', 'formularios', 'assinaturas', 'avatars'
  )
  AND name LIKE p_organizacao_id::text || '/%'
$$;
