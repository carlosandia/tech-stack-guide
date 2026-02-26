
# Correção do Fullscreen - Zoom, Scroll e Estrutura

## Problemas Identificados

1. **Zoom não funciona**: O `applyZoom` busca `[data-dashboard-content]` como filho do `containerRef`, mas o `containerRef` (contentRef) JÁ É esse elemento. O querySelector nunca encontra nada.

2. **Scroll não funciona**: O `scrollBy` é chamado no `contentRef` (div interno), mas quem tem `overflow-y-auto` é o div pai. Em modo normal o scroll é do pai; em fullscreen, o `contentRef` vira fullscreen mas sem overflow, então nada rola.

3. **Fullscreen sem overflow**: Quando o `contentRef` entra em fullscreen, ele não tem `overflow-y-auto`, então conteúdo longo fica cortado.

## Solução

### Arquivo: `src/modules/app/pages/DashboardPage.tsx`

- Passar o `FullscreenToggle` o ref do container EXTERNO (o div com `overflow-y-auto`), não o `contentRef`
- Mover o `data-dashboard-content` para o div interno que deve receber o zoom (manter como está)
- O fullscreen será aplicado no container externo que já tem scroll

Mudanças:
- Criar um `scrollContainerRef` separado para o div externo (`h-full overflow-y-auto`)
- Passar `scrollContainerRef` ao `FullscreenToggle` como `containerRef`

### Arquivo: `src/modules/app/components/dashboard/FullscreenToggle.tsx`

- Corrigir `applyZoom`: buscar `[data-dashboard-content]` corretamente dentro do container externo (agora funcionará pois o container é o pai e o content é o filho)
- Scroll já funcionará pois o `containerRef` agora é o div com `overflow-y-auto`
- Adicionar `overflow-y-auto` ao container quando entrar em fullscreen (garantia)

## Secao Tecnica

### DashboardPage.tsx

```typescript
// Adicionar ref para o container scrollável
const scrollContainerRef = useRef<HTMLDivElement>(null)

// No JSX, o div externo recebe o ref:
<div ref={(node) => {
  scrollContainerRef.current = node
  // manter o forwarded ref também
  if (typeof ref === 'function') ref(node)
  else if (ref) ref.current = node
}} className="h-full overflow-y-auto">

// FullscreenToggle usa o scrollContainerRef
<FullscreenToggle containerRef={scrollContainerRef} />
```

### FullscreenToggle.tsx

- `applyZoom`: mantém `containerRef.current.querySelector('[data-dashboard-content]')` — agora funciona pois container é o pai
- `scrollUp/Down`: `containerRef.current.scrollBy(...)` — agora funciona pois container tem overflow
- `toggleFullscreen`: adicionar `overflow-y-auto` ao container em fullscreen
