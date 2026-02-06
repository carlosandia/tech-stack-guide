
-- Atualizar funcao criar_campos_sistema para usar apenas pessoa e empresa (sem contato)
-- Conforme plano aprovado: 6 campos pessoa + 8 campos empresa = 14 campos do sistema

CREATE OR REPLACE FUNCTION public.criar_campos_sistema(p_organizacao_id uuid, p_criado_por uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- =====================================================
  -- Campos de Pessoa (6 campos)
  -- =====================================================
  INSERT INTO campos_customizados (organizacao_id, nome, slug, entidade, tipo, obrigatorio, sistema, ordem, criado_por)
  VALUES
    (p_organizacao_id, 'Nome', 'nome', 'pessoa', 'texto', true, true, 1, p_criado_por),
    (p_organizacao_id, 'Sobrenome', 'sobrenome', 'pessoa', 'texto', false, true, 2, p_criado_por),
    (p_organizacao_id, 'Email', 'email', 'pessoa', 'email', false, true, 3, p_criado_por),
    (p_organizacao_id, 'Telefone', 'telefone', 'pessoa', 'telefone', false, true, 4, p_criado_por),
    (p_organizacao_id, 'Cargo', 'cargo', 'pessoa', 'texto', false, true, 5, p_criado_por),
    (p_organizacao_id, 'LinkedIn', 'linkedin', 'pessoa', 'url', false, true, 6, p_criado_por);

  -- =====================================================
  -- Campos de Empresa (8 campos)
  -- =====================================================
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
END;
$function$;
