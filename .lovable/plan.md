

## Auditoria de Producao — Modulo /contatos

Analise para 500+ usuarios, alto volume de contatos e dados, conforme diretrizes do Arquiteto de Produto.

---

### 1. Problemas Criticos

#### 1.1 N+1 Queries no `listar` — GARGALO PRINCIPAL

O metodo `contatosApi.listar` faz **7 queries sequenciais** para montar a listagem:

1. Buscar contatos (principal)
2. Buscar segmentos vinculados (`contatos_segmentos`)
3. Buscar owners (`usuarios`)
4. Buscar empresas vinculadas (se tipo=pessoa)
5. Buscar pessoas vinculadas (se tipo=empresa)
6. Buscar definicoes de campos customizados (`campos_customizados`)
7. Buscar valores de campos customizados (`valores_campos_customizados`)
8. Buscar total de oportunidades (`oportunidades`)

Com 500 usuarios carregando a listagem, sao **3.500-4.000 queries/segundo** so para renderizar a tabela.

**Correcao**: As queries de enriquecimento (2-8) ja usam batch `.in()`, o que e bom. Porem, o campo `campos_customizados` faz 2 queries extras (definicoes + valores) que podem ser consolidadas. Alem disso, a query de `total_oportunidades` pode usar `.select('contato_id.count()')` com group by ao inves de trazer todos os registros e contar no frontend.

#### 1.2 Duplicatas carrega TODOS os contatos sem limit

O metodo `duplicatas()` (linha 542) faz `select` de **todos os contatos** do tenant sem paginacao nem limit. Com 50.000 contatos, isso transfere megabytes de dados e processa tudo no frontend.

**Correcao**: Mover a logica de agrupamento para o banco via SQL function que retorna apenas os grupos duplicados.

#### 1.3 Exportacao sem limit — risco de timeout

`exportar` e `exportarComColunas` (linhas 634, 769) buscam todos os contatos sem paginacao. Com bases grandes, isso causa timeout no Supabase (limite de 30s por default).

**Correcao**: Implementar exportacao em batches (1000 por vez) e concatenar os resultados.

#### 1.4 `segmentarLote` — N*M queries individuais

O metodo `segmentarLote` (linha 930) faz uma query **por contato, por segmento** para verificar existencia antes de inserir. Com 100 contatos e 3 segmentos, sao **300 SELECT + 300 INSERT** = 600 queries.

**Correcao**: Usar `upsert` com `onConflict` ao inves de verificar existencia manualmente, reduzindo para 1 query por batch.

#### 1.5 `criarOportunidadesLote` — updates individuais de owner

Linhas 917-924: atualiza owner_id de cada contato **individualmente** em um loop. Com 200 contatos, sao 200 queries.

**Correcao**: Agrupar por `responsavelId` e fazer um `.in('id', [...]).update()` por grupo.

#### 1.6 Cache auth duplicado

Mesma duplicacao de `_cachedOrgId/_cachedUserId` ja identificada no modulo /negocios. O `auth-context.ts` compartilhado ja foi criado mas `contatos.api.ts` ainda usa a copia local.

**Correcao**: Importar de `src/shared/services/auth-context.ts`.

---

### 2. Problemas de Performance Media

#### 2.1 Filtro de segmento pos-query

Linha 308: `if (params?.segmento_id)` filtra contatos **no frontend** apos ja ter carregado a pagina inteira. Isso distorce a paginacao (pode retornar menos itens que o `per_page` esperado).

**Correcao**: Fazer um pre-query em `contatos_segmentos` para obter os IDs filtrados e usar `.in('id', idsDoSegmento)` na query principal.

#### 2.2 Contagem de oportunidades carrega registros inteiros

Linha 374: busca `select('contato_id')` de todas as oportunidades dos contatos da pagina. Deveria usar `count` agrupado ao inves de trazer linhas.

**Correcao**: Substituir por uma query que conta no banco.

---

### 3. O que ja esta BEM FEITO

- Soft delete padronizado em todas as operacoes
- Batch operations no `excluirLote` e `atribuirLote` (eficientes com `.in()`)
- Sanitizacao de payload com `sanitizeContatoPayload`
- Paginacao na listagem principal
- Exclusao de `pre_lead` da listagem
- Campos customizados com tipagem correta
- Hooks React Query bem estruturados

---

### 4. Plano de Acao Priorizado

#### Fase 1 — Critico (antes de 500 usuarios)

| # | Acao | Impacto |
|---|------|---------|
| 1 | Importar auth-context compartilhado | Elimina duplicacao, DRY |
| 2 | Otimizar `segmentarLote` com upsert | Reduz N*M queries para 1 batch |
| 3 | Otimizar owner update em `criarOportunidadesLote` | Reduz N queries para K (K = membros unicos) |
| 4 | Filtro de segmento pre-query ao inves de pos-query | Corrige paginacao distorcida |

#### Fase 2 — Performance

| # | Acao | Impacto |
|---|------|---------|
| 5 | Exportacao em batches (1000 por vez) | Previne timeout em bases grandes |
| 6 | Contagem de oportunidades otimizada | Menos dados transferidos |
| 7 | Consolidar queries de campos customizados | Reduz 2 queries para 1 |

#### Fase 3 — Escala futura

| # | Acao | Impacto |
|---|------|---------|
| 8 | Mover deteccao de duplicatas para SQL function | Elimina transferencia massiva de dados |

---

### 5. Detalhes Tecnicos

**5.1 Auth-context (`contatos.api.ts`)**

Remover linhas 16-57 (cache local + `getOrganizacaoId` + `getUsuarioId` + `onAuthStateChange`). Importar de `@/shared/services/auth-context`.

**5.2 `segmentarLote` — upsert**

Substituir o loop de verificacao por:
```
const rows = payload.ids.flatMap(contatoId =>
  payload.adicionar.map(segId => ({
    contato_id: contatoId,
    segmento_id: segId,
    organizacao_id: organizacaoId,
  }))
)
await supabase.from('contatos_segmentos')
  .upsert(rows, { onConflict: 'contato_id,segmento_id' })
```

**5.3 Owner update agrupado em `criarOportunidadesLote`**

Substituir o loop individual por agrupamento:
```
const ownerGroups: Record<string, string[]> = {}
contatos.forEach((c, i) => {
  const rid = membrosDistribuicao[i % membrosDistribuicao.length]
  if (!ownerGroups[rid]) ownerGroups[rid] = []
  ownerGroups[rid].push(c.id)
})
await Promise.all(Object.entries(ownerGroups).map(([ownerId, ids]) =>
  supabase.from('contatos').update({ owner_id: ownerId }).in('id', ids)
))
```

**5.4 Filtro de segmento pre-query**

Antes da query principal, buscar IDs:
```
if (params?.segmento_id) {
  const { data: segVinculos } = await supabase
    .from('contatos_segmentos')
    .select('contato_id')
    .eq('segmento_id', params.segmento_id)
  const idsDoSegmento = (segVinculos || []).map(v => v.contato_id)
  if (idsDoSegmento.length === 0) return { contatos: [], total: 0, page, per_page: perPage, total_paginas: 0 }
  query = query.in('id', idsDoSegmento)
}
```
E remover o filtro pos-query da linha 308.

**5.5 Exportacao em batches**

Substituir query unica por loop com `.range(i, i+999)` ate esgotar os dados.

**5.6 Contagem de oportunidades**

Usar RPC ou contar direto no select com subquery ao inves de trazer todos os registros.

---

### 6. Arquivos impactados

| Arquivo | Tipo de mudanca |
|---------|----------------|
| `src/modules/contatos/services/contatos.api.ts` | Todas as correcoes acima |

Nenhum componente visual sera alterado. Nenhum hook muda de assinatura. Todas as correcoes sao internas ao service.

### 7. Garantias de seguranca

- Nenhum componente visual alterado
- Nenhuma prop removida ou renomeada
- Hooks mantem mesma assinatura e comportamento
- Paginacao continua funcionando identicamente
- Filtros, busca, ordenacao inalterados
- Soft delete preservado
- RLS continua como unica linha de defesa

