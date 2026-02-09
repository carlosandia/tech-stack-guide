
-- AIDEV-NOTE: Policies anon para acesso publico a formularios publicados
-- Conforme PRD-17 - Etapa 1: Rota publica /f/:slug

-- SELECT em formularios publicados (anon)
CREATE POLICY "anon_select_formularios_publicados"
ON public.formularios
FOR SELECT
TO anon
USING (status = 'publicado' AND deletado_em IS NULL);

-- SELECT em campos de formularios publicados (anon)
CREATE POLICY "anon_select_campos_formularios_publicados"
ON public.campos_formularios
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.formularios f
    WHERE f.id = campos_formularios.formulario_id
      AND f.status = 'publicado'
      AND f.deletado_em IS NULL
  )
);

-- SELECT em estilos de formularios publicados (anon)
CREATE POLICY "anon_select_estilos_formularios_publicados"
ON public.estilos_formularios
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.formularios f
    WHERE f.id = estilos_formularios.formulario_id
      AND f.status = 'publicado'
      AND f.deletado_em IS NULL
  )
);

-- INSERT em submissoes_formularios (anon)
CREATE POLICY "anon_insert_submissoes_formularios"
ON public.submissoes_formularios
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.formularios f
    WHERE f.id = submissoes_formularios.formulario_id
      AND f.status = 'publicado'
      AND f.deletado_em IS NULL
  )
);
