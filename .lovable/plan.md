

# Correcao: Tela "Nova versao disponivel" nao deve aparecer para o usuario

## Causa Raiz

Apos deploy, os chunks JS antigos sao removidos do servidor. O browser do usuario tenta carregar um chunk com hash antigo, recebe 404, e o `lazyWithRetry` faz `window.location.reload()`. Porem:

1. O `window.location.reload()` pode servir o `index.html` do cache do browser (que ainda aponta para os chunks antigos)
2. O reload falha novamente
3. O erro chega ao `ErrorBoundary`, que mostra a tela "Nova versao disponivel" exigindo clique manual

## Solucao

### Arquivo 1: `src/utils/lazyWithRetry.ts`

Substituir `window.location.reload()` por um reload com cache-busting:

```typescript
// Antes:
window.location.reload()

// Depois:
const url = new URL(window.location.href)
url.searchParams.set('_cb', Date.now().toString())
window.location.replace(url.toString())
```

Isso forca o browser a buscar um `index.html` novo do servidor, que contera as referencias aos chunks atualizados.

### Arquivo 2: `src/components/ErrorBoundary.tsx`

Para chunk errors que chegam ao ErrorBoundary (caso o lazyWithRetry nao tenha resolvido), fazer auto-reload em vez de mostrar a tela com botao:

- No `componentDidCatch`, verificar se e chunk error
- Se for, fazer reload automatico com cache-busting (usando uma flag diferente no sessionStorage para evitar loop)
- A tela "Nova versao disponivel" so aparece se TODAS as tentativas automaticas falharem (situacao extremamente rara)

Logica no `componentDidCatch`:

```typescript
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  console.error('[ErrorBoundary] Erro capturado:', error, errorInfo)

  if (this.isChunkErrorFromMsg(error.message)) {
    const key = 'eb-chunk-reload'
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1')
      const url = new URL(window.location.href)
      url.searchParams.set('_cb', Date.now().toString())
      window.location.replace(url.toString())
      return
    }
    sessionStorage.removeItem(key)
  }
}
```

## Resultado

- Na grande maioria dos casos, o usuario nunca vera a tela — o reload automatico com cache-busting resolve silenciosamente
- Apenas em situacoes extremas (servidor fora, CDN com problema) a tela aparece como fallback final
