

# Modo Fullscreen Inteligente - Controles de Navegacao e Zoom

## Contexto

O modo tela cheia atual apenas usa a Fullscreen API do browser, sem nenhum controle adicional. Para cenarios de TV, paineis touch ou apresentacoes, precisamos de controles flutuantes de scroll e zoom acessiveis por clique e toque.

## O que sera feito

### 1. Barra de controles flutuante no modo fullscreen

Quando em tela cheia, exibir uma barra flutuante fixa no canto inferior direito com:

- **Zoom In (+)** e **Zoom Out (-)** com icones clicaveis
- **Indicador de zoom atual** (ex: "100%")
- **Reset zoom** (clique no indicador volta para 100%)
- **Scroll Up / Scroll Down** com botoes de seta
- **Botao Sair** (minimizar) para sair da tela cheia

A barra so aparece em fullscreen. Em modo normal, nada muda.

### 2. Suporte a gestos touch

- **Pinch to zoom**: detectar gesture nativa de pinch (2 dedos) para zoom in/out no conteudo
- **Scroll natural**: o scroll por toque ja funciona nativamente, os botoes sao um complemento para paineis que nao tem scroll por toque fluido

### 3. Zoom via CSS transform

O zoom sera aplicado via `transform: scale(X)` + `transform-origin: top center` no container de conteudo. Isso:
- Nao quebra o layout dos componentes internos
- Permite valores entre 50% e 200%
- Funciona em qualquer browser

---

## Secao Tecnica

### Arquivo: `src/modules/app/components/dashboard/FullscreenToggle.tsx`

Refatorar para:
- Adicionar estados: `zoomLevel` (number, default 1), `isFullscreen`
- Funcoes: `zoomIn` (+0.1, max 2), `zoomOut` (-0.1, min 0.5), `resetZoom` (1), `scrollUp`, `scrollDown`
- Renderizar barra flutuante quando `isFullscreen === true`
- Aceitar `containerRef` para aplicar `transform: scale()` e controlar scroll

### Barra flutuante - Estrutura

```text
Posicao: fixed bottom-6 right-6
Layout: flex vertical gap-1
Estilo: bg-card/90 backdrop-blur border rounded-xl shadow-lg p-2

[ArrowUp]        -- scroll up
[ZoomIn +]       -- zoom in
[100%]           -- indicador (clique = reset)
[ZoomOut -]      -- zoom out
[ArrowDown]      -- scroll down
[Minimize]       -- sair fullscreen
```

### Zoom

```typescript
const applyZoom = (level: number) => {
  if (!containerRef.current) return
  const content = containerRef.current.querySelector('[data-dashboard-content]')
  if (content) {
    content.style.transform = `scale(${level})`
    content.style.transformOrigin = 'top center'
  }
}
```

### Gestos touch (pinch-to-zoom)

Usar `touchstart`/`touchmove` com 2 dedos para calcular distancia entre dedos e ajustar zoom proporcionalmente. Implementado via `useEffect` que registra listeners no container apenas quando em fullscreen.

### Arquivo: `src/modules/app/pages/DashboardPage.tsx`

- Adicionar `data-dashboard-content` no div de conteudo para o zoom poder encontra-lo
- Nenhuma outra mudanca necessaria

### Arquivos

| Arquivo | Acao |
|---------|------|
| `FullscreenToggle.tsx` | Refatorar com zoom, scroll e barra flutuante |
| `DashboardPage.tsx` | Adicionar `data-dashboard-content` no container |

