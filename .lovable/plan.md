

## Persistir Posicao do Drop no Kanban

### Problema raiz
A tabela `oportunidades` nao possui coluna para armazenar a ordem dos cards dentro de cada etapa. Atualmente a query ordena por `criado_em DESC` (linha 299 do `negocios.api.ts`), entao qualquer refetch do banco desfaz o posicionamento feito pelo usuario.

O optimistic update funciona visualmente, mas o `onSettled` do TanStack Query invalida o cache e refaz a busca ao banco, que retorna na ordem de criacao — descartando a posicao de drop.

### Solucao

Adicionar uma coluna `posicao` na tabela `oportunidades` e atualizar toda a cadeia para persistir e respeitar essa ordem.

---

### Passo 1 — Migration: adicionar coluna `posicao`

```sql
ALTER TABLE oportunidades
  ADD COLUMN IF NOT EXISTS posicao integer NOT NULL DEFAULT 0;

-- Indice para performance na ordenacao dentro de cada etapa
CREATE INDEX IF NOT EXISTS idx_oportunidades_etapa_posicao
  ON oportunidades (etapa_id, posicao ASC)
  WHERE deletado_em IS NULL;

-- Inicializar posicoes existentes baseado em criado_em (mais antigo = menor posicao)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY etapa_id ORDER BY criado_em ASC) as rn
  FROM oportunidades
  WHERE deletado_em IS NULL
)
UPDATE oportunidades SET posicao = ranked.rn
FROM ranked WHERE oportunidades.id = ranked.id;
```

---

### Passo 2 — `negocios.api.ts`: ordenar por `posicao` e atualizar `moverEtapa`

**Alterar `carregarKanban`** (linha 299):
- Trocar `.order('criado_em', { ascending: false })` por `.order('posicao', { ascending: true })`

**Alterar `moverEtapa`** (linhas 467-498):
- Receber `dropIndex` como parametro opcional
- Apos mover para a nova etapa, recalcular posicoes:
  1. Buscar oportunidades da etapa destino ordenadas por `posicao`
  2. Inserir o card movido na posicao `dropIndex`
  3. Atualizar as posicoes de todos os cards da etapa destino em batch

**Logica de reordenacao:**
```text
1. Buscar todas ops da etapa destino (exceto a movida) ORDER BY posicao
2. Inserir a movida na posicao dropIndex (ou no final se nao informado)
3. Para cada op na lista, UPDATE posicao = indice + 1
```

---

### Passo 3 — `useKanban.ts`: repassar dropIndex para a API

**Alterar `useMoverEtapa`** (linha 63-64):
- Incluir `dropIndex` no `mutationFn` para que seja repassado a `negociosApi.moverEtapa`

---

### Passo 4 — `criarOportunidade`: posicao inicial

Quando uma nova oportunidade e criada, ela deve receber `posicao = 0` (ou o proximo disponivel na etapa). A abordagem mais simples: inserir com `posicao = 0` e depois fazer um UPDATE para empurrar as demais +1 (ou inserir no final com `MAX(posicao) + 1`).

---

### Resumo dos arquivos alterados

| Arquivo | Alteracao |
|---|---|
| Migration SQL | Adicionar coluna `posicao`, indice, inicializar dados |
| `src/modules/negocios/services/negocios.api.ts` | Ordenar por `posicao`, `moverEtapa` recebe `dropIndex` e atualiza posicoes |
| `src/modules/negocios/hooks/useKanban.ts` | Passar `dropIndex` ao `mutationFn` |

Nenhum outro arquivo precisa mudar — `KanbanBoard` e `KanbanColumn` ja repassam o `dropIndex` corretamente.
