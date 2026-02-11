

## Correcoes e Melhorias no Kanban e Modal de Detalhes

### 1. Tags nao aparecendo no modal de detalhes

**Problema**: O componente `TagsSection` esta renderizado (linha 700-702 do `DetalhesCampos.tsx`), mas provavelmente a query `contatos_segmentos` nao retorna dados por falta de filtro de `organizacao_id` ou RLS. Vou investigar e corrigir a query para garantir que os segmentos vinculados ao contato sejam carregados corretamente. Tambem verificarei se a tabela `contatos_segmentos` possui RLS que bloqueia a leitura.

**Acao**: Debugar a query da `TagsSection` (linhas 86-96) — adicionar `.eq('organizacao_id', ...)` se necessario e garantir que `segmentosApi.listar()` tambem retorna dados. Se o problema for apenas visual (z-index, overflow hidden do pai), corrigir o CSS.

---

### 2. Aumentar icone do Historico

**Acao**: No `DetalhesHistorico.tsx`, aumentar os icones dos eventos na timeline:
- Circulo do icone: de `w-5 h-5` para `w-6 h-6` (linha 273)
- Icone interno: de `w-3 h-3` para `w-3.5 h-3.5` (linha 30)

---

### 3. Menu de 3 pontos no header das etapas do Kanban

Adicionar um icone `MoreVertical` (3 pontos verticais) no header de cada `KanbanColumn` (exceto `SolicitacoesColumn`). Ao clicar, abre um `DropdownMenu` com 3 opcoes:

#### 3.1 Selecionar todos os cards
- Seleciona todas as oportunidades da etapa usando `onToggleSelect`
- Necessita de uma nova prop `onSelectAll(etapaId: string)` no `KanbanColumn`, propagada do `KanbanBoard`

#### 3.2 Ordenar cards da etapa
- Sub-opcoes: Padrao (Manual), Data de criacao, Valor, Alfabetico (Titulo)
- Reordena localmente os cards da etapa e persiste as novas posicoes via batch update de `posicao`
- Necessita de uma nova prop `onSortColumn(etapaId: string, criterio: string)` propagada do `KanbanBoard`

#### 3.3 Mover etapa para esquerda/direita
- Sub-opcoes: Esquerda e Direita
- Desabilitado para etapas padrao (tipo `entrada`, `ganho`, `perda`)
- Apenas etapas com tipo `normal` podem ser movidas
- Utiliza a API existente `pipelineConfigApi.reordenarEtapas()` para persistir a nova ordem
- Necessita de uma nova prop `onMoveColumn(etapaId: string, direcao: 'esquerda' | 'direita')` propagada do `KanbanBoard`

### Detalhes Tecnicos

**Arquivos alterados:**

| Arquivo | Alteracao |
|---|---|
| `DetalhesCampos.tsx` | Debugar/corrigir TagsSection (query ou CSS) |
| `DetalhesHistorico.tsx` | Aumentar icones da timeline |
| `KanbanColumn.tsx` | Adicionar DropdownMenu com 3 opcoes no header |
| `KanbanBoard.tsx` | Adicionar handlers para selectAll, sortColumn, moveColumn e propagar como props |

**Componentes utilizados:**
- `DropdownMenu` do Radix (ja disponivel em `src/components/ui/dropdown-menu.tsx`)
- Icones Lucide: `MoreVertical`, `CheckSquare`, `ArrowUpDown`, `ArrowLeft`, `ArrowRight`

**Logica de mover etapa:**
1. Encontrar indice atual da etapa no array `data.etapas`
2. Trocar `ordem` com a etapa adjacente (esquerda = indice-1, direita = indice+1)
3. Chamar `pipelineConfigApi.reordenarEtapas()` com as novas ordens
4. Invalidar query do kanban para refletir a mudanca

**Logica de ordenar cards:**
1. Clonar array de oportunidades da etapa
2. Ordenar pelo criterio selecionado (criado_em, valor, titulo)
3. Atualizar `posicao` de cada card sequencialmente via batch update
4. Invalidar cache do kanban

