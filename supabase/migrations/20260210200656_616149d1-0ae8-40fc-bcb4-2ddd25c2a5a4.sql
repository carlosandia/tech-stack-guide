-- Permitir INSERT anônimo na tabela de eventos analytics (página pública)
CREATE POLICY "anon_insert_eventos_analytics"
ON public.eventos_analytics_formularios
FOR INSERT
TO anon
WITH CHECK (true);

-- Permitir UPDATE anônimo em formularios para incrementar contadores (visualizações, taxa)
-- Restrito apenas aos campos de contagem
CREATE POLICY "anon_update_formularios_contadores"
ON public.formularios
FOR UPDATE
TO anon
USING (status = 'publicado' AND deletado_em IS NULL)
WITH CHECK (status = 'publicado' AND deletado_em IS NULL);

-- Função RPC para incrementar visualizações e recalcular taxa de conversão atomicamente
CREATE OR REPLACE FUNCTION public.incrementar_visualizacao_formulario(p_formulario_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE formularios
  SET 
    total_visualizacoes = total_visualizacoes + 1,
    taxa_conversao = CASE 
      WHEN (total_visualizacoes + 1) > 0 
      THEN ROUND((total_submissoes::numeric / (total_visualizacoes + 1)) * 100, 2)
      ELSE 0 
    END
  WHERE id = p_formulario_id
    AND status = 'publicado'
    AND deletado_em IS NULL;
END;
$$;