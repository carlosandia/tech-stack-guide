
# Correcao: Drop Zone Unica + Drag and Drop Fluido

## Problema Raiz

Cada `DashboardSectionDraggable` renderiza duas drop zones: uma ACIMA e uma ABAIXO do bloco. Quando `dragOverIndex = N+1`:
- Bloco N mostra "drop below" (porque `N + 1 === dragOverIndex`)
- Bloco N+1 mostra "drop above" (porque `index === dragOverIndex`)

Resultado: **duas zonas visuais** para a mesma posicao, causando conflito visual e flickering ao arrastar.

---

## Solucao

### 1. DashboardSectionDraggable.tsx — Drop zone unica

- **Remover** a drop zone "abaixo" (`showDropBelow`) completamente
- Manter apenas a drop zone **acima** de cada bloco
- Adicionar `e.stopPropagation()` em todos os handlers de drag para evitar bubbling entre blocos adjacentes
- Isso elimina a duplicacao: cada posicao entre blocos tem exatamente UMA zona visual

### 2. DashboardPage.tsx — Drop zone final (apos ultimo bloco)

- Adicionar um `div` simples apos o `.map()` que funciona como zona de drop para a ultima posicao
- Ele so aparece quando `dragOverIndex === visibleSections.length` (ou seja, apos o ultimo bloco)
- Isso garante que o usuario consiga mover um bloco para o final da lista

### 3. Suavizar a experiencia

- Usar `requestAnimationFrame`-style throttle no `handleDragOver` para evitar re-renders excessivos: so atualizar `dragOverIndex` se o valor realmente mudou
- No `handleDragOver` do DashboardPage, comparar com o valor atual antes de setar estado

---

## Arquivos a editar

| Arquivo | Acao |
|---------|------|
| `src/modules/app/components/dashboard/DashboardSectionDraggable.tsx` | Remover drop zone "abaixo", adicionar stopPropagation |
| `src/modules/app/pages/DashboardPage.tsx` | Adicionar drop zone final apos o map, throttle no handleDragOver |

---

## Secao Tecnica

### DashboardSectionDraggable - Estrutura simplificada

```text
<div ref={containerRef} onDragOver onDragLeave onDrop>
  <!-- Drop zone ACIMA (unica) -->
  <div class="h-16 ou h-0 transition-all">Soltar aqui</div>

  <!-- Bloco arrastavel -->
  <div draggable>children</div>

  <!-- SEM drop zone abaixo -->
</div>
```

Logica de midpoint mantida: metade superior = `index`, metade inferior = `index + 1`. A diferenca e que agora `index + 1` ativa a drop zone do **proximo** bloco (acima dele), nao uma segunda zona no bloco atual.

### handleDragOver com throttle

```typescript
const handleDragOver = useCallback((_e: DragEvent, index: number) => {
  setDragOverIndex(prev => prev === index ? prev : index)
}, [])
```

Retornar o mesmo valor evita re-render desnecessario (React ignora setState com mesmo valor).

### Drop zone final no DashboardPage

```text
{draggingId && dragOverIndex === visibleSections.length && (
  <div class="h-16 bg-primary/5 border-dashed ...">
    Soltar aqui
  </div>
)}
```
