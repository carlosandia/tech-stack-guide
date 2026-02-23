
# Corrigir funcao validate_partner_code - tipo incompativel

## Problema encontrado

A funcao `validate_partner_code` falha com o erro:

```
Returned type character varying(20) does not match expected type text in column 2
```

A coluna `parceiros.codigo_indicacao` e do tipo `varchar(20)`, mas a funcao declara o retorno como `text`. O PostgreSQL rejeita a incompatibilidade de tipos.

## Solucao

Criar uma nova migration que recria a funcao com um `CAST` explicito na coluna `codigo_indicacao`:

```sql
p.codigo_indicacao::text
```

## Arquivo

| Arquivo | Acao |
|---------|------|
| Nova migration SQL | Recriar funcao com cast para text |

## Detalhe tecnico

A migration vai executar `CREATE OR REPLACE FUNCTION public.validate_partner_code(p_codigo text)` com a unica diferenca de adicionar `::text` no SELECT da coluna `codigo_indicacao`, corrigindo a incompatibilidade de tipo que impede a funcao de retornar resultados.
