-- Permitir busca pública de parceiros ativos pelo codigo_indicacao (para experiência de indicação na página de planos)
CREATE POLICY "anon_select_parceiro_ativo_por_codigo"
ON public.parceiros
FOR SELECT
USING (status = 'ativo');