

## Correção do Drag-and-Drop no Preview do Formulário

### Problema identificado

No `FormPreview.tsx`, a função `renderDropZone` renderiza zonas de drop **entre** os campos. Porém:

1. **Altura zero quando inativa**: A drop zone usa `py-0` quando não está ativa (`dragOverIndex !== index`), resultando em uma div de ~0px de altura. O navegador não consegue detectar `dragEnter` de forma confiável em elementos sem altura.

2. **Drop zones dentro de flex items**: As drop zones (`renderDropZone(index + 1)`) estão dentro do `<div className={widthClass}>` de cada campo. Para campos com largura fracionária (50%, 33%), a zona de drop não ocupa a largura total, dificultando o targeting.

3. **Estrutura flex-wrap**: O container `<div className="flex flex-wrap">` empilha campos lado a lado, mas as drop zones ficam colapsadas entre eles.

---

### Solução

Reestruturar o layout para que:

- **Drop zones fiquem fora dos flex items**, ocupando sempre `w-full`
- **Drop zones inativas tenham altura mínima** suficiente para captura de eventos de drag (8px com área invisível expandida)

---

### Alterações no arquivo

**Arquivo:** `src/modules/formularios/components/editor/FormPreview.tsx`

**1. Atualizar `renderDropZone`** — Adicionar altura mínima invisível para hit detection:

```typescript
const renderDropZone = (index: number, isEmpty = false) => (
  <div
    onDragEnter={(e) => handleDragEnter(e, index)}
    onDragOver={handleDragOver}
    onDragLeave={(e) => handleDragLeave(e, index)}
    onDrop={(e) => handleDrop(e, index)}
    className="relative w-full"
    style={{ zIndex: dragOverIndex === index ? 10 : undefined }}
  >
    {/* Hit area — sempre presente para captura de drag */}
    <div
      className={cn(
        'relative transition-all',
        isEmpty
          ? 'py-8'
          : dragOverIndex === index
            ? 'py-3'
            : 'py-1',  // <-- mínimo de 8px (py-1 = 4px top + 4px bottom) em vez de py-0
      )}
    >
      {/* Linha indicadora ativa */}
      {dragOverIndex === index && !isEmpty && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center gap-2 px-2">
          <div className="flex-1 h-[2px] bg-primary rounded-full" />
          <span className="text-[10px] text-primary font-medium whitespace-nowrap px-1.5 py-0.5 bg-primary/10 rounded">
            Soltar aqui
          </span>
          <div className="flex-1 h-[2px] bg-primary rounded-full" />
        </div>
      )}
      {/* estados vazios mantidos iguais */}
    </div>
  </div>
)
```

**2. Reestruturar o loop de campos** — Separar drop zones dos flex items para que sempre ocupem `w-full`:

Atualmente:
```
<div className="flex flex-wrap">
  {campos.map(campo => (
    <div className={widthClass}>
      <CampoItem ... />
      {renderDropZone(index + 1)}  <!-- preso dentro do widthClass -->
    </div>
  ))}
</div>
```

Proposta:
```
<div>
  {campos.map(campo => (
    <React.Fragment key={campo.id}>
      <div className="flex flex-wrap">
        <div className={widthClass}>
          <CampoItem ... />
        </div>
      </div>
      {renderDropZone(index + 1)}  <!-- fora do flex, w-full -->
    </React.Fragment>
  ))}
</div>
```

Na verdade, para manter o layout flex-wrap funcional (campos lado a lado), a abordagem correta é agrupar os campos em linhas e colocar drop zones entre as linhas. Mas como o cenário mais comum é campos full-width, a solução mais simples e segura é:

- Manter a estrutura atual (`flex flex-wrap`)
- **Forçar `w-full` na div da drop zone** (`className="relative w-full"` já adicionado acima)
- **Garantir altura mínima** nas drop zones inativas (`py-1` em vez de `py-0`)

Isso basta porque:
- Para campos `w-full`: a drop zone já fica entre campos verticalmente e com `w-full` funciona perfeitamente
- Para campos fracionários: o `w-full` na drop zone força uma quebra de linha no flex-wrap, criando o espaço entre linhas

---

### Arquivo impactado

| Arquivo | Ação |
|---------|------|
| `src/modules/formularios/components/editor/FormPreview.tsx` | Editar renderDropZone: adicionar `w-full` e `py-1` mínimo |

### Garantias

- Nenhuma alteração na lógica de reordenamento ou criação de campos
- Campos fracionários continuam funcionando lado a lado
- Drop zones sempre visíveis como área de targeting durante drag
- Indicador de linha "Soltar aqui" mantido sem alterações visuais
- Sem impacto no modo "Visualização Final" (drop zones só existem no modo editor)
