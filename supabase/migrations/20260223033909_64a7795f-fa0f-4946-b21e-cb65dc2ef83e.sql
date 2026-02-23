-- Permitir leitura pública do nome da organização (para badge de indicação na página de planos)
-- Exposição mínima: apenas o nome é retornado via join com parceiros ativos
CREATE POLICY "anon_select_org_nome_publico"
ON public.organizacoes_saas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.parceiros p
    WHERE p.organizacao_id = id
    AND p.status = 'ativo'
  )
);