

# Correção: Persistência de Posição no Drag-and-Drop do Kanban

## Problema

Ao dropar um card em uma posição específica na coluna, o card aparece corretamente por um instante (optimistic update), mas após o refetch do servidor, ele vai para a última posição. Isso indica que a **posição não está sendo salva no banco de dados**.

## Causa Raiz

A chamada RPC `reordenar_posicoes_etapa` recebe um parâmetro do tipo `jsonb`, mas o código passa `JSON.stringify(items)` -- uma **string**. O Supabase client já serializa automaticamente os parâmetros para JSON, causando **double-encoding**:

```text
Esperado pelo PostgreSQL: [{"id":"abc","posicao":1}]  (jsonb array)
Enviado atualmente:       "[{\"id\":\"abc\",\"posicao\":1}]"  (jsonb string scalar)
```

A funcao `jsonb_array_elements()` falha silenciosamente ao receber uma string ao invés de um array, e o `catch` apenas loga o erro no console sem informar o usuário. Resultado: posicoes nunca sao salvas, e no refetch seguinte o card volta para a posicao default (NULL = final da lista).

## Correção

Remover o `JSON.stringify()` das duas chamadas RPC e passar o array diretamente. O Supabase client se encarrega da serialização.

### Arquivo 1: `src/modules/negocios/services/negocios.api.ts` (linha ~482)

**Antes:**
```typescript
const { error: rpcError } = await supabase.rpc('reordenar_posicoes_etapa', { items: JSON.stringify(items) } as any)
```

**Depois:**
```typescript
const { error: rpcError } = await supabase.rpc('reordenar_posicoes_etapa', { items } as any)
```

### Arquivo 2: `src/modules/negocios/components/kanban/KanbanBoard.tsx` (linha ~195)

**Antes:**
```typescript
const { error: rpcError } = await supabase.rpc('reordenar_posicoes_etapa', { items: JSON.stringify(items) } as any)
```

**Depois:**
```typescript
const { error: rpcError } = await supabase.rpc('reordenar_posicoes_etapa', { items } as any)
```

## Resumo

| Arquivo | Linha | Alteração |
|---------|-------|-----------|
| `negocios.api.ts` | ~482 | Remover `JSON.stringify()` na chamada RPC do `moverEtapa` |
| `KanbanBoard.tsx` | ~195 | Remover `JSON.stringify()` na chamada RPC do `handleSortColumn` |

## Impacto

- Cards mantêm a posição exata onde foram dropados, mesmo após refetch
- Ordenação via menu 3 pontos (por valor, data, alfabético) também persiste corretamente
- Nenhuma alteração no banco de dados ou na function RPC necessária
