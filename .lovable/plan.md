
# Plano: Drag and Drop Vertical entre Blocos do Dashboard

## Objetivo

Permitir reordenar os blocos/seções do dashboard via drag and drop vertical, com zona de drop visual (igual ao Kanban), atualização otimista na UI e persistência no backend via coluna `ordem_blocos` que já existe na tabela `preferencias_dashboard`.

---

## Abordagem

Usar **HTML5 Drag and Drop nativo** (mesmo padrão do Kanban e FormPreview), sem biblioteca externa. Cada bloco visível do dashboard será `draggable` e terá drop zones entre eles com indicador visual (barra azul tracejada).

---

## 1. Expandir o hook `useDashboardDisplay`

**Arquivo:** `src/modules/app/hooks/useDashboardDisplay.ts`

Adicionar:
- Estado `sectionOrder: SectionId[]` — array com a ordem dos blocos
- Ordem padrão: `['metas', 'funil', 'reunioes', 'kpis-principais', 'kpis-secundarios', 'canal', 'motivos', 'produtos', 'atendimento']`
- Novo tipo `SectionId` expandido com as seções que não tinham toggle (`kpis-secundarios`, `produtos`, `atendimento`)
- Função `reorderSection(dragId, targetIndex)` — move o bloco para a nova posição, salva imediatamente no state/localStorage e com debounce no Supabase (coluna `ordem_blocos`)
- Carregamento da ordem do banco na montagem (mesmo fluxo do `config_exibicao`)

---

## 2. Criar componente `DashboardSectionDraggable`

**Arquivo:** `src/modules/app/components/dashboard/DashboardSectionDraggable.tsx`

Wrapper que envolve cada bloco do dashboard, fornecendo:

- `draggable={true}` no container inteiro (clicar em qualquer lugar do bloco para arrastar)
- `onDragStart` — seta o `sectionId` no `dataTransfer`
- Visual durante drag: opacity reduzida no bloco sendo arrastado
- Drop zone acima de cada bloco:
  - Barra horizontal tracejada (`h-2 border-2 border-dashed border-primary/30 bg-primary/5 rounded`)
  - Visível apenas quando há item sendo arrastado sobre aquela posição
  - Calcula índice de drop baseado na posição Y do cursor (mesmo padrão do `KanbanColumn`)

**Props:**
```text
sectionId: string
index: number
isDragging: boolean
dragOverIndex: number | null
onDragStart(sectionId)
onDragOver(e, index)
onDragLeave()
onDrop(e, targetIndex)
children: ReactNode
```

---

## 3. Atualizar `DashboardPage`

**Arquivo:** `src/modules/app/pages/DashboardPage.tsx`

- Importar a nova `sectionOrder` e `reorderSection` do hook
- Estado local para controle de drag: `draggingId`, `dropIndex`
- Definir um mapa de seções com seus `SectionId`, condição de visibilidade e componente a renderizar
- Renderizar os blocos em loop baseado na `sectionOrder`, filtrando os visíveis
- Cada bloco envolto em `DashboardSectionDraggable`
- Handlers de drag no nível da page que delegam para `reorderSection`

---

## 4. Persistência

Mesma estratégia otimista do `config_exibicao`:
1. UI atualiza imediatamente (setState)
2. Salva no localStorage como fallback
3. Debounce de 500ms para persistir na coluna `ordem_blocos` (jsonb) da tabela `preferencias_dashboard`

Formato do `ordem_blocos`:
```json
["metas", "funil", "reunioes", "kpis-principais", "kpis-secundarios", "canal", "motivos", "produtos", "atendimento"]
```

---

## Resumo de arquivos

| Arquivo | Acao |
|---------|------|
| `src/modules/app/hooks/useDashboardDisplay.ts` | Adicionar `sectionOrder` + `reorderSection` + persistência |
| `src/modules/app/components/dashboard/DashboardSectionDraggable.tsx` | Criar wrapper draggable com drop zones |
| `src/modules/app/pages/DashboardPage.tsx` | Refatorar para renderizar blocos por ordem + drag handlers |

Nenhuma migration necessária — a coluna `ordem_blocos` já existe na tabela.

---

## Secao Tecnica

### Drop Zone Visual

Mesma estilização do Kanban:
```text
h-[6px] bg-primary/5 rounded border-2 border-dashed border-primary/30 transition-all duration-150
```

Exibida apenas quando `dragOverIndex === index` do bloco.

### Calculo de posicao de drop

Itera sobre os blocos visíveis, compara `mouseY` com o `midY` de cada bloco para determinar o índice de inserção — mesmo algoritmo do `KanbanColumn.handleCardAreaDragOver`.

### Cursor e feedback visual

- Bloco sendo arrastado: `opacity-40`
- Demais blocos: `cursor-grab` no hover, `cursor-grabbing` durante drag
- Drop zone animada com `transition-all duration-150`
