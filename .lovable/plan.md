

# Correcao: Popovers/Dropdowns nao aparecem na toolbar de Negocios

## Causa Raiz

Tres componentes (PeriodoSelector, FiltrosPopover, MetaToolbarIndicator) usam `createPortal(content, document.body)` mas aplicam `sm:absolute sm:right-0 sm:mt-1.5` para desktop. O problema: `absolute` posiciona relativo ao ancestral posicionado mais proximo, que dentro de `document.body` e o proprio viewport. Sem um parent `relative`, o dropdown fica posicionado incorretamente (no topo/canto da pagina, atras da toolbar ou fora da tela).

Alem disso, o click-outside handler usa `containerRef` que aponta para o `div.relative` dentro da toolbar, mas o dropdown esta no `document.body` via portal — entao clicar no dropdown e detectado como "fora" e fecha imediatamente.

## Solucao

Calcular a posicao do dropdown a partir do `getBoundingClientRect()` do botao trigger e usar `fixed` em ambos os breakpoints (mesmo padrao ja usado com sucesso no `FiltrosConversas`).

### Arquivo 1: `src/modules/negocios/components/toolbar/PeriodoSelector.tsx`

- Usar `useRef` no botao trigger para obter `getBoundingClientRect()`
- Calcular `top` e `right` quando abrir
- Substituir `sm:absolute sm:right-0 sm:mt-1.5` por `fixed` com coordenadas calculadas
- Atualizar click-outside para incluir o dropdown ref no portal

### Arquivo 2: `src/modules/negocios/components/toolbar/FiltrosPopover.tsx`

- Mesma logica: calcular posicao a partir do botao trigger
- Usar `fixed` com coordenadas calculadas
- Atualizar click-outside para verificar ambos os refs (trigger + dropdown)

### Arquivo 3: `src/modules/negocios/components/toolbar/MetaToolbarIndicator.tsx`

- Mesma logica: calcular posicao a partir do botao trigger
- Usar `fixed` com coordenadas calculadas
- Atualizar click-outside para verificar ambos os refs

### Padrao comum para os 3 arquivos

```text
// Ao abrir:
const rect = btnRef.current.getBoundingClientRect()
const top = rect.bottom + 6
const right = window.innerWidth - rect.right

// No portal:
<div
  ref={dropdownRef}
  className="fixed z-[200] bg-card border border-border rounded-lg shadow-lg ..."
  style={{ top, right }}
>

// Click-outside:
if (
  dropdownRef.current && !dropdownRef.current.contains(target) &&
  btnRef.current && !btnRef.current.contains(target)
) setOpen(false)
```

## Resultado

- Todos os popovers/dropdowns da toolbar aparecem corretamente posicionados logo abaixo do botao trigger
- Funcionam em mobile (centralizados) e desktop (alinhados ao botao)
- Z-index z-[200] garante que fiquem acima da toolbar (z-50) e de qualquer outro elemento

