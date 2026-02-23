

## Correção: Parceiro cadastrado não aparece na listagem

### Problema identificado

O parceiro foi cadastrado com sucesso no banco de dados (confirmado via query direta: `RENOVE-MBP7VY`, status `ativo`). Porém, ele não aparece na UI porque a query de listagem em `parceiros.api.ts` usa um **INNER JOIN** com a tabela `indicacoes_parceiro`:

```
indicacoes_parceiro!inner(status)
```

O modificador `!inner` faz com que apenas parceiros que possuem pelo menos uma indicação sejam retornados. Como o parceiro é novo e ainda não tem nenhuma indicação, ele é excluído do resultado.

### Solução

Alterar o join de `!inner` para um LEFT JOIN (padrão do Supabase, basta remover o `!inner`). Como os dados de indicações já são calculados separadamente nas queries subsequentes (linhas 64-84), esse join sequer é necessário.

### Alteração técnica

**Arquivo:** `src/modules/admin/services/parceiros.api.ts`

Na função `listarParceiros`, linha ~40, remover `indicacoes_parceiro!inner(status)` do select, ficando apenas:

```typescript
.select(
  `
  *,
  organizacao:organizacoes_saas(nome, email, plano, status),
  usuario:usuarios(nome, sobrenome, email)
  `,
  { count: 'estimated' },
)
```

Isso resolve o problema sem afetar nenhuma outra funcionalidade, pois os totais de indicados e comissões já são buscados em queries separadas logo abaixo.

