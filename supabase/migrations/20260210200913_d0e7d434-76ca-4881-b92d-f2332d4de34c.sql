-- Remover política UPDATE anon desnecessária (a RPC usa SECURITY DEFINER)
DROP POLICY IF EXISTS "anon_update_formularios_contadores" ON public.formularios;