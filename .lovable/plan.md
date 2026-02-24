

# Correcao: Contagem de Contatos por Segmento + Exportacao Dinamica com Campos Globais

## Problema 1: Contagem incorreta de contatos nos segmentos

A funcao `segmentosApi.listar` (linha 1106 de `contatos.api.ts`) conta os vinculos na tabela `contatos_segmentos` sem verificar se o contato vinculado foi excluido (soft delete via `deletado_em`). Contatos removidos continuam sendo contados.

**Exemplo:** "Feira XPTO" mostra 5 contatos, mas pode ter apenas 2 ativos — os outros 3 foram soft-deleted.

**Correcao:** Ao contar vinculos, fazer um join com a tabela `contatos` para filtrar apenas contatos com `deletado_em IS NULL`. A abordagem sera buscar os IDs de contatos ativos vinculados a cada segmento.

### Arquivo: `src/modules/contatos/services/contatos.api.ts` (linhas ~1116-1132)

Logica atual:
```typescript
const { data: vinculosData } = await supabase
  .from('contatos_segmentos')
  .select('segmento_id')
  .in('segmento_id', segmentoIds)
```

Logica corrigida — buscar vinculos com join inner no contato para filtrar deletados:
```typescript
const { data: vinculosData } = await supabase
  .from('contatos_segmentos')
  .select('segmento_id, contatos!inner(id)')
  .in('segmento_id', segmentoIds)
  .is('contatos.deletado_em', null)
```

Se o Supabase nao suportar o join com filtro dessa forma (depende do FK), alternativa: buscar IDs de contatos ativos separadamente e cruzar com vinculos. Sera testada a abordagem com join primeiro.

---

## Problema 2: Modal de exportacao nao inclui campos customizados

O `ExportarContatosModal` tem colunas **hardcoded** (`COLUNAS_PESSOA` e `COLUNAS_EMPRESA`). Nao busca os campos globais do banco (padrao + customizados).

Na imagem da configuracao de campos, existem campos como "Qual e o seu nivel de decisao na empresa?", "Texto Longo" etc. que nao aparecem no modal de exportacao.

**Correcao:** Tornar o modal dinamico — buscar campos via `useCamposConfig` e construir a lista de colunas automaticamente.

### Arquivo: `src/modules/contatos/components/ExportarContatosModal.tsx`

**Mudancas:**

1. Importar `useCamposConfig` e remover as constantes hardcoded `COLUNAS_PESSOA` e `COLUNAS_EMPRESA`
2. Dentro do componente, chamar `useCamposConfig(tipo)` para obter todos os campos (sistema + customizados)
3. Montar a lista de colunas dinamicamente:
   - Campos sistema: `{ key: campo.slug_ou_field_key, label: campo.label, dbField: campo.field_key }`
   - Campos custom: `{ key: 'custom_' + campo.slug, label: campo.label, dbField: campo.slug, isCustom: true }`
4. Adicionar campos fixos que nao estao em `campos_customizados` (status, origem, criado_em)

### Arquivo: `src/modules/contatos/services/contatos.api.ts` (funcao `exportarComColunas`)

**Mudancas:**

1. Aceitar flag `isCustom` nas colunas
2. Para colunas custom, apos buscar os contatos, buscar tambem `valores_campos_customizados` para os IDs dos contatos exportados
3. Montar um mapa `contatoId -> { slug: valor }` dos campos customizados
4. Na geracao do CSV, para colunas custom, buscar o valor no mapa ao inves de direto do contato

Fluxo da exportacao:
```text
1. Buscar contatos (como ja faz)
2. Identificar colunas custom selecionadas
3. Se houver custom, buscar valores_campos_customizados para os IDs
4. Buscar definicoes de campos para mapear campo_id -> slug
5. Montar CSV mesclando dados da tabela contatos + valores customizados
```

---

## Resumo de arquivos

| Arquivo | Alteracao |
|---|---|
| `src/modules/contatos/services/contatos.api.ts` | Corrigir contagem de segmentos (filtrar deletados); Expandir exportacao para incluir campos custom |
| `src/modules/contatos/components/ExportarContatosModal.tsx` | Tornar colunas dinamicas via `useCamposConfig`; remover listas hardcoded |

