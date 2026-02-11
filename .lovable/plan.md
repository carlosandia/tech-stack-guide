
## Correções: Rodízio apenas em "Novos Negócios" + Drop entre cards

### Problema 1 — Rodízio/SLA aparecendo em todas as etapas
O timer de SLA (countdown) aparece em todos os cards de todas as etapas. Pelo contexto de negócio, o rodízio e o SLA só fazem sentido na etapa de **entrada** ("Novos Negócios"). A edge function `processar-sla` já filtra corretamente, mas o **frontend** exibe o countdown em todas as etapas.

**Solução:** Passar a informação do `tipo` da etapa para o `KanbanCard`. O SLA countdown só será exibido quando a etapa for do tipo `'entrada'`.

**Arquivos:**
- `KanbanColumn.tsx` — passar `etapaTipo` para o `KanbanCard`
- `KanbanCard.tsx` — receber `etapaTipo` e condicionar: `slaAtivo = slaConfig?.sla_ativo && etapaTipo === 'entrada'`

---

### Problema 2 — Drag-and-drop vertical sem zona de drop entre cards
Atualmente o drop só funciona no nível da coluna. Ao arrastar um card dentro da mesma coluna (reordenação) ou entre colunas, não existe indicador visual entre os cards mostrando onde o card será inserido.

**Solução:** Adicionar zonas de drop entre os cards na `KanbanColumn`, com indicador visual (linha azul/primária) que aparece quando o cursor está sobre a zona intermediária.

**Arquivos:**
- `KanbanColumn.tsx` — implementar lógica de drop zones entre cards:
  - Cada card será envolto por uma div que detecta `onDragOver` na metade superior/inferior
  - Um indicador visual (barra `h-0.5 bg-primary rounded`) aparece na posição de drop
  - Estado local `dropIndex` rastreia a posição de inserção
  - O `onDrop` passa a incluir o `dropIndex` para posicionamento

- `KanbanBoard.tsx` — atualizar `handleDrop` para receber e usar o índice de posição (opcional):
  - Mover entre colunas mantém o comportamento atual
  - Se houver índice, a oportunidade é inserida na posição correta no optimistic update

---

### Detalhes técnicos

#### Etapa tipo no card (Rodízio)
```text
KanbanBoard
  -> KanbanColumn (tem etapa.tipo)
    -> KanbanCard (recebe etapaTipo)
      -> slaAtivo = slaConfig?.sla_ativo && etapaTipo === 'entrada'
```

#### Drop zones entre cards
```text
KanbanColumn
  [DropZone index=0]  ← linha azul se dragOver
  [Card 1]
  [DropZone index=1]  ← linha azul se dragOver  
  [Card 2]
  [DropZone index=2]  ← linha azul se dragOver
  ...
```

Cada drop zone é uma div de altura mínima (~8px) que expande para ~4px de indicador visual ao receber hover de drag. O `onDragOver` detecta a posição do cursor (metade superior/inferior do card) para decidir qual drop zone ativar.

A reordenação dentro da mesma coluna será apenas visual (optimistic) sem persistir ordem no banco, já que o sistema atual não tem campo `ordem` nas oportunidades — o foco é apenas no feedback visual de onde o card será solto.
