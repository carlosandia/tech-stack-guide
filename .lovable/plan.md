
# Corrigir funcao validate_partner_code - segundo cast faltando

## Problema

A funcao `validate_partner_code` continua falhando com erro de tipo:

```
Returned type character varying(255) does not match expected type text in column 3
```

Na correcao anterior, foi adicionado `::text` na coluna `codigo_indicacao`, mas a coluna `o.nome` (da tabela `organizacoes_saas`) tambem e `varchar(255)` e precisa do mesmo cast.

## Solucao

Criar nova migration que recria a funcao com cast em ambas as colunas:

```sql
CREATE OR REPLACE FUNCTION public.validate_partner_code(p_codigo text)
RETURNS TABLE(id uuid, codigo_indicacao text, organizacao_nome text)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.codigo_indicacao::text, o.nome::text AS organizacao_nome
  FROM parceiros p
  JOIN organizacoes_saas o ON o.id = p.organizacao_id
  WHERE p.codigo_indicacao = UPPER(p_codigo)
    AND p.status = 'ativo'
  LIMIT 1;
END;
$$;
```

## Arquivo

| Arquivo | Acao |
|---------|------|
| Nova migration SQL | Recriar funcao com `o.nome::text` adicionado |

Nenhuma alteracao no frontend e necessaria. O `ParceiroPage.tsx` ja esta correto chamando a RPC.
