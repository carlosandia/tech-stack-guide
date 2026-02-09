/**
 * AIDEV-NOTE: Banner de mensagem fixada no topo do chat (PRD-09)
 * Mostra preview da mensagem fixada com botão de desafixar
 * Estilo inspirado no WhatsApp (ícone de pin + preview + X para desafixar)
 */

import { Pin, X } from 'lucide-react'
import type { Mensagem } from '../services/conversas.api'

interface PinnedMessageBannerProps {
  mensagem: Mensagem
  onUnpin: (mensagem: Mensagem) => void
  onScrollTo?: (mensagemId: string) => void
}

function getPreviewText(msg: Mensagem): string {
  switch (msg.tipo) {
    case 'text': return msg.body?.substring(0, 120) || ''
    case 'image': return `📷 ${msg.caption || 'Foto'}`
    case 'video': return `🎥 ${msg.caption || 'Vídeo'}`
    case 'audio': return `🎵 Mensagem de voz${msg.media_duration ? ` (${Math.floor(msg.media_duration / 60)}:${String(msg.media_duration % 60).padStart(2, '0')})` : ''}`
    case 'document': return `📄 ${msg.media_filename || 'Documento'}`
    case 'location': return `📍 ${msg.location_name || 'Localização'}`
    case 'contact': return '👤 Contato compartilhado'
    case 'poll': return `📊 ${msg.poll_question || 'Enquete'}`
    case 'sticker': return '🎨 Sticker'
    default: return 'Mensagem'
  }
}

export function PinnedMessageBanner({ mensagem, onUnpin, onScrollTo }: PinnedMessageBannerProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-muted/60 border-b border-border/50 cursor-pointer hover:bg-muted/80 transition-colors">
      <Pin className="w-4 h-4 text-primary flex-shrink-0 rotate-45" />
      
      <div
        className="flex-1 min-w-0"
        onClick={() => onScrollTo?.(mensagem.id)}
      >
        <p className="text-[11px] font-semibold text-primary">
          Mensagem fixada
        </p>
        <p className="text-xs text-foreground/70 truncate">
          {getPreviewText(mensagem)}
        </p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          onUnpin(mensagem)
        }}
        className="p-1 rounded-full hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
        title="Desafixar"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
