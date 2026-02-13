
-- Adicionar campos de sistema de Oportunidade na função criar_campos_sistema
CREATE OR REPLACE FUNCTION public.criar_campos_sistema(p_organizacao_id uuid, p_criado_por uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO campos_customizados (organizacao_id, nome, slug, entidade, tipo, obrigatorio, sistema, ordem, criado_por)
  VALUES
    (p_organizacao_id, 'Nome', 'nome', 'pessoa', 'texto', true, true, 1, p_criado_por),
    (p_organizacao_id, 'Sobrenome', 'sobrenome', 'pessoa', 'texto', false, true, 2, p_criado_por),
    (p_organizacao_id, 'Email', 'email', 'pessoa', 'email', false, true, 3, p_criado_por),
    (p_organizacao_id, 'Telefone', 'telefone', 'pessoa', 'telefone', false, true, 4, p_criado_por),
    (p_organizacao_id, 'Cargo', 'cargo', 'pessoa', 'texto', false, true, 5, p_criado_por),
    (p_organizacao_id, 'LinkedIn', 'linkedin', 'pessoa', 'url', false, true, 6, p_criado_por);

  INSERT INTO campos_customizados (organizacao_id, nome, slug, entidade, tipo, obrigatorio, sistema, ordem, criado_por)
  VALUES
    (p_organizacao_id, 'Nome Fantasia', 'nome_fantasia', 'empresa', 'texto', true, true, 1, p_criado_por),
    (p_organizacao_id, 'Razão Social', 'razao_social', 'empresa', 'texto', false, true, 2, p_criado_por),
    (p_organizacao_id, 'CNPJ', 'cnpj', 'empresa', 'cnpj', false, true, 3, p_criado_por),
    (p_organizacao_id, 'Email', 'email', 'empresa', 'email', false, true, 4, p_criado_por),
    (p_organizacao_id, 'Telefone', 'telefone', 'empresa', 'telefone', false, true, 5, p_criado_por),
    (p_organizacao_id, 'Website', 'website', 'empresa', 'url', false, true, 6, p_criado_por),
    (p_organizacao_id, 'Segmento de Mercado', 'segmento', 'empresa', 'texto', false, true, 7, p_criado_por),
    (p_organizacao_id, 'Porte', 'porte', 'empresa', 'select', false, true, 8, p_criado_por);

  INSERT INTO campos_customizados (organizacao_id, nome, slug, entidade, tipo, obrigatorio, sistema, ordem, criado_por)
  VALUES
    (p_organizacao_id, 'Valor', 'valor', 'oportunidade', 'decimal', false, true, 1, p_criado_por),
    (p_organizacao_id, 'MRR', 'mrr', 'oportunidade', 'decimal', false, true, 2, p_criado_por),
    (p_organizacao_id, 'Responsável', 'responsavel', 'oportunidade', 'texto', false, true, 3, p_criado_por),
    (p_organizacao_id, 'Previsão de fechamento', 'previsao_fechamento', 'oportunidade', 'data', false, true, 4, p_criado_por);
END;
$function$;

-- Inserir campos de sistema de oportunidade para organizações existentes
INSERT INTO campos_customizados (organizacao_id, nome, slug, entidade, tipo, obrigatorio, sistema, ordem)
SELECT o.id, c.nome, c.slug, 'oportunidade', c.tipo, false, true, c.ordem
FROM organizacoes_saas o
CROSS JOIN (VALUES
  ('Valor', 'valor', 'decimal', 1),
  ('MRR', 'mrr', 'decimal', 2),
  ('Responsável', 'responsavel', 'texto', 3),
  ('Previsão de fechamento', 'previsao_fechamento', 'data', 4)
) AS c(nome, slug, tipo, ordem)
WHERE NOT EXISTS (
  SELECT 1 FROM campos_customizados cc
  WHERE cc.organizacao_id = o.id
    AND cc.entidade = 'oportunidade'
    AND cc.slug = c.slug
    AND cc.sistema = true
);
