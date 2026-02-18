

## Correção do Drop em Posição Errada (Off-by-one por gaps no `ordem`)

### Causa raiz

Os valores de `ordem` dos campos no banco têm gaps (0, 1, 3, 5, 7, 8, 9, 10). O `FormPreview` usa o **índice do array filtrado** (`topLevelCampos.map((campo, index)`) como parâmetro para drop zones e handlers, mas:

- `handleDropNewCampo` trata esse parâmetro como valor de `ordem` (usa para `ordem: index` e `c.ordem >= index`)
- `handleReorderCampo` trata como índice do array completo `campos`

Resultado: ao soltar entre Telefone (ordem=5) e Email (ordem=7), o drop zone passa `index+1 = 4`. O handler cria o campo com `ordem: 4`, que fica ANTES do Telefone (ordem 5), não depois.

---

### Solução

Usar `campo.ordem` ao invés de `index` do array filtrado, e ajustar o handler de reordenamento para funcionar com valores de `ordem`.

---

### Alterações

#### 1. `src/modules/formularios/components/editor/FormPreview.tsx`

Substituir todos os usos de `index` (do array filtrado) por `campo.ordem` nos callbacks de drag-and-drop:

- `renderDropZone(index + 1)` passa a ser `renderDropZone(campo.ordem + 1)`
- `onReorderCampo(draggedId, index)` no CampoItem passa a ser `onReorderCampo(draggedId, campo.ordem)`
- `onReorderCampo(draggedId, index)` no BlocoColunasEditor passa a ser `onReorderCampo(draggedId, campo.ordem)`
- `onMoveUp` / `onMoveDown` continuam usando `index` (posição visual), sem alteração

#### 2. `src/modules/formularios/pages/FormularioEditorPage.tsx`

**`handleReorderCampo`** — Reescrever para usar `targetOrdem` (valor de ordem) ao invés de índice de array:

```typescript
const handleReorderCampo = useCallback(
  (dragId: string, targetOrdem: number) => {
    const draggedCampo = campos.find(c => c.id === dragId)
    if (!draggedCampo) return
    // Se já está na posição correta, ignorar
    if (draggedCampo.ordem === targetOrdem || draggedCampo.ordem === targetOrdem - 1) return

    const without = campos.filter(c => c.id !== dragId)
    const insertAt = without.findIndex(c => c.ordem >= targetOrdem)
    const newCampos = [...without]
    if (insertAt === -1) {
      newCampos.push(draggedCampo)
    } else {
      newCampos.splice(insertAt, 0, draggedCampo)
    }
    reordenarCampos.mutate(newCampos.map((c, i) => ({ id: c.id, ordem: i })))
  },
  [campos, reordenarCampos]
)
```

---

### Arquivos impactados

| Arquivo | Ação |
|---------|------|
| `src/modules/formularios/components/editor/FormPreview.tsx` | Trocar `index` por `campo.ordem` nos drop zones e onDrop callbacks |
| `src/modules/formularios/pages/FormularioEditorPage.tsx` | Reescrever `handleReorderCampo` para usar `ordem` |

### Garantias

- Funciona corretamente com gaps no `ordem` (cenário real do banco)
- `handleDropNewCampo` já funciona com valores de `ordem` — apenas precisa receber o valor correto
- Nenhuma alteração na UI visual
- Campos fracionários e blocos de colunas continuam funcionando
