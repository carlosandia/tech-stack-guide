
-- AIDEV-NOTE: Remover campo sistema LinkedIn de todas as organizações
-- A coluna linkedin_url na tabela contatos NÃO será removida (dados históricos)

-- 1. Deletar campo sistema linkedin de todos os tenants
DELETE FROM campos_customizados 
WHERE slug = 'linkedin' AND entidade = 'pessoa' AND sistema = true;

-- 2. Reajustar ordem dos campos de endereço (Cidade: 6, Estado: 7, CEP: 8)
UPDATE campos_customizados 
SET ordem = ordem - 1 
WHERE entidade = 'pessoa' 
  AND sistema = true 
  AND slug IN ('endereco_cidade', 'endereco_estado', 'endereco_cep')
  AND ordem > 6;

-- 3. Atualizar função criar_campos_sistema removendo LinkedIn e reordenando
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
    (p_organizacao_id, 'Cidade', 'endereco_cidade', 'pessoa', 'texto', false, true, 6, p_criado_por),
    (p_organizacao_id, 'Estado', 'endereco_estado', 'pessoa', 'texto', false, true, 7, p_criado_por),
    (p_organizacao_id, 'CEP', 'endereco_cep', 'pessoa', 'texto', false, true, 8, p_criado_por);

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
