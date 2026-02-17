/**
 * AIDEV-NOTE: Fila de mídia para envio em lote (PRD-09)
 * Após upload ao Storage, arquivos ficam nesta fila visual.
 * Usuário revisa e clica "Enviar tudo" para despachar em ordem.
 */

import { useState } from 'react'
import { X, Send, Image, FileText, Video, Music } from 'lucide-react'

export interface QueuedMedia {
  id: string
  filename: string
  tipo: string       // image | video | audio | document
  media_url: string
  mimetype: string
  thumbnail?: string // object URL para preview de imagem
}

interface MediaQueueProps {
  items: QueuedMedia[]
  onRemove: (id: string) => void
  onSendAll: () => void
  isSending: boolean
}

function getIcon(tipo: string) {
  switch (tipo) {
    case 'image': return <Image className="w-4 h-4" />
    case 'video': return <Video className="w-4 h-4" />
    case 'audio': return <Music className="w-4 h-4" />
    default: return <FileText className="w-4 h-4" />
  }
}

function getLabel(tipo: string) {
  switch (tipo) {
    case 'image': return 'Imagem'
    case 'video': return 'Vídeo'
    case 'audio': return 'Áudio'
    default: return 'Documento'
  }
}

export function MediaQueue({ items, onRemove, onSendAll, isSending }: MediaQueueProps) {
  if (items.length === 0) return null

  return (
    <div className="mx-3 mb-2 rounded-xl border border-border/60 bg-muted/40 overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
        <span className="text-xs font-medium text-muted-foreground">
          {items.length} {items.length === 1 ? 'arquivo na fila' : 'arquivos na fila'}
        </span>
        <button
          onClick={onSendAll}
          disabled={isSending}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Send className="w-3 h-3" />
          {isSending ? 'Enviando...' : 'Enviar tudo'}
        </button>
      </div>

      {/* Items */}
      <div className="flex gap-2 p-2 overflow-x-auto">
        {items.map((item) => (
          <QueueItem
            key={item.id}
            item={item}
            onRemove={() => onRemove(item.id)}
            disabled={isSending}
          />
        ))}
      </div>
    </div>
  )
}

function QueueItem({ item, onRemove, disabled }: { item: QueuedMedia; onRemove: () => void; disabled: boolean }) {
  const [imgError, setImgError] = useState(false)

  return (
    <div className="relative group flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-border/40 bg-background">
      {/* Preview */}
      {item.tipo === 'image' && item.thumbnail && !imgError ? (
        <img
          src={item.thumbnail}
          alt={item.filename}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground">
          {getIcon(item.tipo)}
          <span className="text-[9px] text-center leading-tight px-1 truncate w-full">
            {item.filename.length > 12 ? item.filename.slice(0, 10) + '…' : item.filename}
          </span>
        </div>
      )}

      {/* Type badge */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5">
        <span className="text-[9px] text-white font-medium">{getLabel(item.tipo)}</span>
      </div>

      {/* Remove button */}
      {!disabled && (
        <button
          onClick={onRemove}
          className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/60 text-white hover:bg-destructive transition-colors opacity-0 group-hover:opacity-100"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}
