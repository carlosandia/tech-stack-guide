/**
 * AIDEV-NOTE: Botão de toggle fullscreen + barra flutuante de controles (zoom, scroll, sair).
 * Usa Fullscreen API nativa do browser no container do dashboard.
 * Suporte a pinch-to-zoom via touch events.
 */

import { useState, useEffect, useCallback, useRef, type RefObject } from 'react'
import { Maximize2, Minimize2, ZoomIn, ZoomOut, ChevronUp, ChevronDown } from 'lucide-react'

interface FullscreenToggleProps {
  containerRef: RefObject<HTMLDivElement>
}

const ZOOM_STEP = 0.1
const ZOOM_MIN = 0.5
const ZOOM_MAX = 2.0
const SCROLL_AMOUNT = 300

export default function FullscreenToggle({ containerRef }: FullscreenToggleProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const pinchStartDist = useRef<number | null>(null)
  const pinchStartZoom = useRef<number>(1)

  const handleFullscreenChange = useCallback(() => {
    const fs = !!document.fullscreenElement
    setIsFullscreen(fs)
    if (!fs) {
      // Reset zoom ao sair do fullscreen
      setZoomLevel(1)
      applyZoom(1)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [handleFullscreenChange])

  // AIDEV-NOTE: Aplica zoom via CSS transform no elemento [data-dashboard-content]
  const applyZoom = useCallback((level: number) => {
    if (!containerRef.current) return
    const content = containerRef.current.querySelector('[data-dashboard-content]') as HTMLElement
    if (content) {
      content.style.transform = `scale(${level})`
      content.style.transformOrigin = 'top center'
    }
  }, [containerRef])

  const setAndApplyZoom = useCallback((newLevel: number) => {
    const clamped = Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, newLevel)) * 100) / 100
    setZoomLevel(clamped)
    applyZoom(clamped)
  }, [applyZoom])

  const zoomIn = useCallback(() => setAndApplyZoom(zoomLevel + ZOOM_STEP), [zoomLevel, setAndApplyZoom])
  const zoomOut = useCallback(() => setAndApplyZoom(zoomLevel - ZOOM_STEP), [zoomLevel, setAndApplyZoom])
  const resetZoom = useCallback(() => setAndApplyZoom(1), [setAndApplyZoom])

  const scrollUp = useCallback(() => {
    containerRef.current?.scrollBy({ top: -SCROLL_AMOUNT, behavior: 'smooth' })
  }, [containerRef])

  const scrollDown = useCallback(() => {
    containerRef.current?.scrollBy({ top: SCROLL_AMOUNT, behavior: 'smooth' })
  }, [containerRef])

  // AIDEV-NOTE: Pinch-to-zoom via touch events (somente em fullscreen)
  useEffect(() => {
    if (!isFullscreen || !containerRef.current) return

    const el = containerRef.current

    const getDistance = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchStartDist.current = getDistance(e.touches)
        pinchStartZoom.current = zoomLevel
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStartDist.current !== null) {
        e.preventDefault()
        const dist = getDistance(e.touches)
        const scale = dist / pinchStartDist.current
        const newZoom = pinchStartZoom.current * scale
        setAndApplyZoom(newZoom)
      }
    }

    const handleTouchEnd = () => {
      pinchStartDist.current = null
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isFullscreen, zoomLevel, containerRef, setAndApplyZoom])

  const toggleFullscreen = async () => {
    if (!containerRef.current) return
    try {
      if (!document.fullscreenElement) {
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

  const exitFullscreen = async () => {
    try {
      await document.exitFullscreen()
      containerRef.current?.classList.remove('bg-background', 'p-6')
    } catch (err) {
      console.warn('[Fullscreen] Erro ao sair:', err)
    }
  }

  const zoomPercent = `${Math.round(zoomLevel * 100)}%`

  const btnClass =
    'h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors active:scale-95 touch-manipulation'

  return (
    <>
      {/* Botão de entrada (fora do fullscreen) */}
      <button
        onClick={toggleFullscreen}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
      >
        {isFullscreen ? (
          <Minimize2 className="w-3.5 h-3.5" />
        ) : (
          <Maximize2 className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Barra flutuante — só aparece em fullscreen */}
      {isFullscreen && (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-center gap-1 bg-card/90 backdrop-blur-md border border-border rounded-xl shadow-lg p-1.5">
          {/* Scroll Up */}
          <button onClick={scrollUp} className={btnClass} title="Rolar acima">
            <ChevronUp className="w-4 h-4" />
          </button>

          {/* Zoom In */}
          <button
            onClick={zoomIn}
            className={btnClass}
            title="Aumentar zoom"
            disabled={zoomLevel >= ZOOM_MAX}
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Indicador de zoom (clique = reset) */}
          <button
            onClick={resetZoom}
            className="h-7 px-2 flex items-center justify-center rounded-md text-[11px] font-semibold text-foreground hover:bg-muted/80 transition-colors tabular-nums"
            title="Resetar zoom para 100%"
          >
            {zoomPercent}
          </button>

          {/* Zoom Out */}
          <button
            onClick={zoomOut}
            className={btnClass}
            title="Diminuir zoom"
            disabled={zoomLevel <= ZOOM_MIN}
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Scroll Down */}
          <button onClick={scrollDown} className={btnClass} title="Rolar abaixo">
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Separador */}
          <div className="w-6 h-px bg-border my-0.5" />

          {/* Sair */}
          <button onClick={exitFullscreen} className={btnClass} title="Sair da tela cheia">
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  )
}
