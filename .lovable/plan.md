

## Correcoes: Zona de Drop Estilo Trello + Salvar Posicao ao Soltar

### Problema 1 — Posicao de drop nao e salva
Quando o card e solto, o `dropIndex` calculado pela `KanbanColumn` nao e repassado para o `KanbanBoard`. O `handleDrop` do board simplesmente adiciona o card no **final** da coluna destino (optimistic update usa `[...oportunidades, cardMovido]`). O indice de posicao e calculado visualmente mas descartado no momento do drop.

### Problema 2 — Zona de drop visual fraca
Atualmente a zona de drop e apenas uma linha fina (`h-0.5 bg-primary`). O usuario quer um placeholder estilo Trello: um bloco com fundo cinza escuro que "abre espaco" entre os cards, simulando o tamanho do card que sera inserido.

---

### Solucao

**Arquivo: `KanbanColumn.tsx`**
- Alterar a assinatura de `onDrop` para incluir o indice: `onDrop(e, etapaId, tipoEtapa, dropIndex)`
- Trocar o indicador visual de `h-0.5 bg-primary rounded-full` para um bloco placeholder estilo Trello: `h-[72px] bg-muted-foreground/10 rounded-lg border-2 border-dashed border-muted-foreground/20` — um retangulo cinza com borda tracejada que simula o espaco de um card

**Arquivo: `KanbanBoard.tsx`**
- Atualizar `handleDrop` para receber o 4o parametro `dropIndex?: number`
- Atualizar a tipagem de `onDrop` na interface de `KanbanColumn` para incluir `dropIndex`
- No optimistic update do `useMoverEtapa`, ao inserir o card na etapa destino, usar `splice(dropIndex, 0, card)` ao inves de append no final

**Arquivo: `useKanban.ts`**
- Nao precisa mudar — o optimistic update ja esta no `onMutate` do `useMoverEtapa`, basta o `KanbanBoard` fazer o `setQueriesData` com a posicao correta antes de chamar `mutate`
- Na verdade, como o `onMutate` generico nao sabe o indice, a abordagem sera: fazer o reposicionamento manual no cache **antes** de chamar `mutate`, e no `onMutate` apenas cancelar queries e salvar snapshot (sem mover novamente)

**Ajuste de abordagem (mais simples):**
- O `KanbanBoard.handleDrop` recebe o `dropIndex`
- Antes de chamar `moverEtapa.mutate`, faz o `queryClient.setQueriesData` diretamente inserindo o card na posicao correta
- O `useMoverEtapa.onMutate` ja faz o move generico (append), mas como o cache ja foi atualizado pelo board, o onMutate vai encontrar o card ja na posicao correta na etapa destino e nao duplicar (pois remove da origem e nao encontra mais)

**Abordagem final mais limpa:**
- Passar o `dropIndex` como parte dos parametros do `mutate` em `useMoverEtapa`
- No `onMutate`, usar o `dropIndex` para inserir na posicao correta ao inves de fazer append

---

### Detalhes tecnicos

#### Mudancas em `useKanban.ts`
- Adicionar `dropIndex?: number` ao tipo do `mutationFn` params
- No `onMutate`, trocar `[...etapa.oportunidades, oportunidadeMovida]` por logica com `splice` quando `dropIndex` for informado

#### Mudancas em `KanbanColumn.tsx`  
- Tipagem de `onDrop`: `(e, etapaId, tipoEtapa, dropIndex?: number) => void`
- No `handleDrop`, passar `dropIndex` atual: `onDrop(e, etapa.id, etapa.tipo, dropIndex ?? undefined)`
- Trocar o indicador visual para placeholder estilo Trello:
  - Bloco com altura fixa (~72px), fundo `bg-muted-foreground/10`, bordas `border-dashed`, cantos arredondados

#### Mudancas em `KanbanBoard.tsx`
- `handleDrop` recebe 4o param `dropIndex`
- Passa `dropIndex` no objeto do `mutate`: `{ oportunidadeId, etapaDestinoId, dropIndex }`

