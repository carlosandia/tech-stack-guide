/**
 * AIDEV-NOTE: Botão de toggle fullscreen para o dashboard.
 * Usa Fullscreen API nativa do browser no container do dashboard.
 */

import { useState, useEffect, useCallback, type RefObject } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'

interface FullscreenToggleProps {
  containerRef: RefObject<HTMLDivElement>
}

export default function FullscreenToggle({ containerRef }: FullscreenToggleProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleFullscreenChange = useCallback(() => {
    setIsFullscreen(!!document.fullscreenElement)
  }, [])

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [handleFullscreenChange])

  const toggle = async () => {
    if (!containerRef.current) return

    try {
      if (!document.fullscreenElement) {
        // Adicionar classes de fullscreen antes de entrar
        containerRef.current.classList.add('bg-background', 'p-6')
        await containerRef.current.requestFullscreen()
      } else {
        await document.exitFullscreen()
        containerRef.current.classList.remove('bg-background', 'p-6')
      }
    } catch (err) {
      console.warn('[Fullscreen] Não suportado:', err)
    }
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
      title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
    >
      {isFullscreen ? (
        <Minimize2 className="w-3.5 h-3.5" />
      ) : (
        <Maximize2 className="w-3.5 h-3.5" />
      )}
    </button>
  )
}
