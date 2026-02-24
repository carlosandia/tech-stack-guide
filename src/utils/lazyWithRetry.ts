import { lazy, type ComponentType } from 'react'

/**
 * AIDEV-NOTE: Wrapper para React.lazy que lida com falha de chunk apos deploy
 * 
 * Problema: Apos novo deploy, chunks JS antigos sao removidos do servidor.
 * O browser tenta carregar o chunk com hash antigo -> 404 -> tela branca.
 * 
 * Solucao: Detecta o erro de import dinamico e faz reload automatico UMA vez.
 * Usa sessionStorage para evitar loop infinito de reloads.
 */

type LazyImportFn<T extends ComponentType<any>> = () => Promise<{ default: T }>

function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const msg = error.message.toLowerCase()
  return (
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('loading chunk') ||
    msg.includes('loading css chunk')
  )
}

export function lazyWithRetry<T extends ComponentType<any>>(
  importFn: LazyImportFn<T>,
  chunkName?: string
) {
  return lazy(() =>
    importFn().catch((error: unknown) => {
      // Se nao e erro de chunk, propagar normalmente
      if (!isChunkLoadError(error)) {
        throw error
      }

      const key = `chunk-reload-${chunkName || 'app'}`
      const hasReloaded = sessionStorage.getItem(key)

      if (!hasReloaded) {
        // Marca que ja tentou reload para este chunk
        sessionStorage.setItem(key, '1')
        console.warn(`[lazyWithRetry] Chunk desatualizado detectado. Recarregando com cache-busting...`)
        const url = new URL(window.location.href)
        url.searchParams.set('_cb', Date.now().toString())
        window.location.replace(url.toString())
        // Retorna promise que nunca resolve (pagina vai recarregar)
        return new Promise<{ default: T }>(() => {})
      }

      // Ja tentou reload, limpa a flag e propaga o erro para o ErrorBoundary
      sessionStorage.removeItem(key)
      console.error(`[lazyWithRetry] Falha mesmo apos reload:`, error)
      throw error
    })
  )
}
