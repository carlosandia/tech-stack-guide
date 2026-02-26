

# Correção: Barra de controles fullscreen some ao dar zoom

## Problema

A barra flutuante de controles (zoom, scroll, sair) usa `position: fixed`, que normalmente é relativo à viewport. Porém, quando o zoom é aplicado via `transform: scale(...)` no container pai (`[data-dashboard-content]`), o CSS faz com que `fixed` passe a ser relativo ao elemento transformado -- e não mais à viewport. Resultado: a barra "some" junto com o conteúdo ao dar zoom.

## Solução

Renderizar a barra flutuante usando `createPortal(content, document.body)` para que ela fique fora da árvore DOM do container transformado. Assim o `position: fixed` funciona corretamente em relação à viewport, independente do zoom.

## Mudança técnica

**Arquivo:** `src/modules/app/components/dashboard/FullscreenToggle.tsx`

- Importar `createPortal` de `react-dom`
- Envolver o bloco da barra flutuante (o `div` com `fixed bottom-6 right-6`) dentro de `createPortal(..., document.body)`
- Nenhuma outra mudança necessária -- posicionamento e estilos permanecem iguais

