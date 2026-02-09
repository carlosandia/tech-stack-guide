
-- Funcao para incrementar visualizacoes atomicamente
CREATE OR REPLACE FUNCTION public.incrementar_visualizacoes_formulario(p_formulario_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE formularios
  SET total_visualizacoes = total_visualizacoes + 1
  WHERE id = p_formulario_id
    AND deletado_em IS NULL;
END;
$$;

-- Funcao para incrementar submissoes e recalcular taxa atomicamente
CREATE OR REPLACE FUNCTION public.incrementar_submissoes_formulario(p_formulario_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE formularios
  SET 
    total_submissoes = total_submissoes + 1,
    taxa_conversao = CASE 
      WHEN total_visualizacoes > 0 
      THEN ROUND(((total_submissoes + 1)::numeric / total_visualizacoes::numeric) * 100, 2)
      ELSE 0
    END
  WHERE id = p_formulario_id
    AND deletado_em IS NULL;
END;
$$;
