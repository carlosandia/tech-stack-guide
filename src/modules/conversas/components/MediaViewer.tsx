/**
 * AIDEV-NOTE: Lightbox/Viewer para mídia (imagens e vídeos)
 * Fullscreen com zoom, download e controles
 * Suporta modo Status (WhatsApp-style) com caption e senderName
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { X, Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { createPortal } from 'react-dom'

interface MediaViewerProps {
  url: string
  tipo: 'image' | 'video'
  onClose: () => void
  caption?: string
  senderName?: string
  timestamp?: string
}

export function MediaViewer({ url, tipo, onClose, caption, senderName, timestamp }: MediaViewerProps) {
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const posStart = useRef({ x: 0, y: 0 })

  const isStatusMode = !!(caption || senderName)

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (tipo !== 'image') return
    e.preventDefault()
    setZoom(prev => {
      const next = prev + (e.deltaY < 0 ? 0.25 : -0.25)
      return Math.max(0.5, Math.min(5, next))
    })
  }, [tipo])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (tipo !== 'image' || zoom <= 1) return
    setIsDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY }
    posStart.current = { ...position }
  }, [tipo, zoom, position])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: posStart.current.x + (e.clientX - dragStart.current.x),
      y: posStart.current.y + (e.clientY - dragStart.current.y),
    })
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const resetZoom = useCallback(() => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  const handleDownload = useCallback(() => {
    const a = document.createElement('a')
    a.href = url
    a.download = url.split('/').pop() || 'download'
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [url])

  // AIDEV-NOTE: Modo Status - layout estilo WhatsApp Web com senderName no topo e caption embaixo
  if (isStatusMode) {
    const content = (
      <div
        className="fixed inset-0 z-[600] flex flex-col bg-black"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Top bar - sender name + close/download */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent absolute top-0 left-0 right-0 z-10">
          <div className="flex items-center gap-3">
            {/* Avatar placeholder */}
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-semibold">
                {(senderName || '?')[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-tight">{senderName}</p>
              {timestamp && (
                <p className="text-white/60 text-xs">{timestamp}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media content - centered */}
        <div
          className="flex-1 flex items-center justify-center overflow-hidden"
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
          onWheel={handleWheel}
        >
          {tipo === 'image' ? (
            <img
              src={url}
              alt="Status"
              className="object-contain select-none"
              style={{
                maxWidth: '80vw',
                maxHeight: '70vh',
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                transition: isDragging ? 'none' : 'transform 0.2s ease',
                imageRendering: 'auto',
              }}
              onMouseDown={handleMouseDown}
              draggable={false}
            />
          ) : (
            <video
              src={url}
              controls
              autoPlay
              className="max-w-[80vw] max-h-[70vh]"
            />
          )}
        </div>

        {/* Caption bar at bottom */}
        {caption && (
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-6 pb-6 pt-12">
            <p className="text-white text-sm text-center leading-relaxed">{caption}</p>
          </div>
        )}
      </div>
    )

    return createPortal(content, document.body)
  }

  // AIDEV-NOTE: Modo padrão (genérico) para mídia normal
  const content = (
    <div
      className="fixed inset-0 z-[600] flex flex-col bg-black/90 backdrop-blur-sm"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50">
        <div className="flex items-center gap-2">
          {tipo === 'image' && (
            <>
              <button
                onClick={() => setZoom(prev => Math.min(5, prev + 0.5))}
                className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.5))}
                className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={resetZoom}
                className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                title="Reset zoom"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <span className="text-xs text-white/60 ml-1">{Math.round(zoom * 100)}%</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Media content */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        onWheel={handleWheel}
      >
        {tipo === 'image' ? (
          <img
            src={url}
            alt="Visualização"
            className="object-contain select-none"
            style={{
              maxWidth: '90vw',
              maxHeight: 'calc(100vh - 80px)',
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              transition: isDragging ? 'none' : 'transform 0.2s ease',
            }}
            onMouseDown={handleMouseDown}
            draggable={false}
          />
        ) : (
          <video
            src={url}
            controls
            autoPlay
            className="max-w-full max-h-full"
            style={{ maxHeight: 'calc(100vh - 80px)' }}
          />
        )}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
