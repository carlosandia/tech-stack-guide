/**
 * AIDEV-NOTE: Bolha de mensagem individual no chat (PRD-09)
 * Suporta todos os tipos: text, image, video, audio, document, location, contact, poll, sticker, reaction
 * Suporta exibição de nome do remetente em grupos
 * Integra MediaViewer para lightbox de imagens e vídeos
 */

import { useState } from 'react'
import { format } from 'date-fns'
import {
  Check,
  CheckCheck,
  Play,
  Download,
  MapPin,
  User,
  FileText,
  ExternalLink,
} from 'lucide-react'
import type { Mensagem } from '../services/conversas.api'
import { MediaViewer } from './MediaViewer'

interface ChatMessageBubbleProps {
  mensagem: Mensagem
  /** Nome do participant (para grupos, mensagens recebidas) */
  participantName?: string | null
  /** Cor do participant (para grupos) */
  participantColor?: string | null
}

function AckIndicator({ ack }: { ack: number }) {
  if (ack <= 0) return null

  if (ack === 1) {
    return <Check className="w-3.5 h-3.5 text-muted-foreground/50" />
  }
  if (ack === 2 || ack === 3) {
    return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground/50" />
  }
  if (ack === 4) {
    return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
  }
  if (ack === 5) {
    return (
      <div className="flex items-center gap-0.5">
        <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
        <Play className="w-2.5 h-2.5 text-blue-500 fill-blue-500" />
      </div>
    )
  }
  return null
}

function TextContent({ body }: { body: string }) {
  const formatted = body
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/~(.*?)~/g, '<del>$1</del>')
    .replace(/```(.*?)```/gs, '<code>$1</code>')

  return (
    <p
      className="text-sm whitespace-pre-wrap break-words"
      dangerouslySetInnerHTML={{ __html: formatted }}
    />
  )
}

function ImageContent({ mensagem, onViewMedia }: { mensagem: Mensagem; onViewMedia?: (url: string, tipo: 'image' | 'video') => void }) {
  return (
    <div className="space-y-1">
      {mensagem.media_url && (
        <img
          src={mensagem.media_url}
          alt="Imagem"
          className="rounded-md max-w-[280px] max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
          loading="lazy"
          onClick={() => onViewMedia?.(mensagem.media_url!, 'image')}
        />
      )}
      {mensagem.caption && <TextContent body={mensagem.caption} />}
    </div>
  )
}

function VideoContent({ mensagem, onViewMedia }: { mensagem: Mensagem; onViewMedia?: (url: string, tipo: 'image' | 'video') => void }) {
  return (
    <div className="space-y-1">
      {mensagem.media_url && (
        <div
          className="relative cursor-pointer group"
          onClick={() => onViewMedia?.(mensagem.media_url!, 'video')}
        >
          <video
            src={mensagem.media_url}
            className="rounded-md max-w-[280px] max-h-[300px]"
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md group-hover:bg-black/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            </div>
          </div>
        </div>
      )}
      {mensagem.caption && <TextContent body={mensagem.caption} />}
    </div>
  )
}

function AudioContent({ mensagem }: { mensagem: Mensagem }) {
  return (
    <div className="min-w-[200px]">
      {mensagem.media_url && (
        <audio src={mensagem.media_url} controls className="w-full h-8" preload="metadata" />
      )}
      {mensagem.media_duration && (
        <span className="text-[11px] text-muted-foreground">
          {Math.floor(mensagem.media_duration / 60)}:{String(mensagem.media_duration % 60).padStart(2, '0')}
        </span>
      )}
    </div>
  )
}

function DocumentContent({ mensagem }: { mensagem: Mensagem }) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    const url = mensagem.media_url
    if (!url) return

    setDownloading(true)
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = mensagem.media_filename || 'documento'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch {
      // Fallback: open URL directly
      window.open(url, '_blank')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="flex items-center gap-2 p-2 rounded-md bg-background/50 border border-border/50 hover:bg-accent/50 transition-colors min-w-[200px] text-left"
    >
      <FileText className="w-8 h-8 text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{mensagem.media_filename || 'Documento'}</p>
        {mensagem.media_size && (
          <p className="text-[11px] text-muted-foreground">
            {(mensagem.media_size / 1024).toFixed(0)} KB
          </p>
        )}
      </div>
      <Download className={`w-4 h-4 text-muted-foreground flex-shrink-0 ${downloading ? 'animate-pulse' : ''}`} />
    </button>
  )
}

function LocationContent({ mensagem }: { mensagem: Mensagem }) {
  const mapsUrl = `https://www.google.com/maps?q=${mensagem.location_latitude},${mensagem.location_longitude}`

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 p-2 rounded-md bg-background/50 border border-border/50 hover:bg-accent/50 transition-colors min-w-[200px]"
    >
      <MapPin className="w-8 h-8 text-destructive flex-shrink-0" />
      <div className="flex-1 min-w-0">
        {mensagem.location_name && (
          <p className="text-xs font-medium truncate">{mensagem.location_name}</p>
        )}
        {mensagem.location_address && (
          <p className="text-[11px] text-muted-foreground truncate">{mensagem.location_address}</p>
        )}
        {!mensagem.location_name && !mensagem.location_address && (
          <p className="text-xs text-muted-foreground">Localização compartilhada</p>
        )}
      </div>
      <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </a>
  )
}

function ContactContent({ mensagem }: { mensagem: Mensagem }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-background/50 border border-border/50 min-w-[180px]">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
        <User className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium">Contato compartilhado</p>
        {mensagem.vcard && (
          <p className="text-[11px] text-muted-foreground truncate">
            {mensagem.vcard.match(/FN:(.*)/)?.[1] || 'vCard'}
          </p>
        )}
      </div>
    </div>
  )
}

function PollContent({ mensagem }: { mensagem: Mensagem }) {
  return (
    <div className="space-y-2 min-w-[220px]">
      <p className="text-sm font-medium">{mensagem.poll_question}</p>
      {mensagem.poll_options?.map((opt, idx) => (
        <div key={idx} className="flex items-center justify-between py-1 px-2 rounded bg-background/50 text-xs">
          <span>{opt.text}</span>
          <span className="text-muted-foreground">{opt.votes}</span>
        </div>
      ))}
    </div>
  )
}

function StickerContent({ mensagem }: { mensagem: Mensagem }) {
  return (
    <img
      src={mensagem.media_url || ''}
      alt="Sticker"
      className="w-[150px] h-[150px] object-contain"
      loading="lazy"
    />
  )
}

function ReactionContent({ mensagem }: { mensagem: Mensagem }) {
  return (
    <span className="text-2xl">{mensagem.reaction_emoji}</span>
  )
}

function renderContent(mensagem: Mensagem, onViewMedia?: (url: string, tipo: 'image' | 'video') => void) {
  switch (mensagem.tipo) {
    case 'text':
      return <TextContent body={mensagem.body || ''} />
    case 'image':
      return <ImageContent mensagem={mensagem} onViewMedia={onViewMedia} />
    case 'video':
      return <VideoContent mensagem={mensagem} onViewMedia={onViewMedia} />
    case 'audio':
      return <AudioContent mensagem={mensagem} />
    case 'document':
      return <DocumentContent mensagem={mensagem} />
    case 'location':
      return <LocationContent mensagem={mensagem} />
    case 'contact':
      return <ContactContent mensagem={mensagem} />
    case 'poll':
      return <PollContent mensagem={mensagem} />
    case 'sticker':
      return <StickerContent mensagem={mensagem} />
    case 'reaction':
      return <ReactionContent mensagem={mensagem} />
    default:
      return <p className="text-sm text-muted-foreground italic">Tipo não suportado</p>
  }
}

export function ChatMessageBubble({ mensagem, participantName, participantColor }: ChatMessageBubbleProps) {
  const [viewerMedia, setViewerMedia] = useState<{ url: string; tipo: 'image' | 'video' } | null>(null)
  const isMe = mensagem.from_me
  const isSticker = mensagem.tipo === 'sticker'
  const isReaction = mensagem.tipo === 'reaction'

  const handleViewMedia = (url: string, tipo: 'image' | 'video') => {
    setViewerMedia({ url, tipo })
  }

  // Sticker e reaction não tem bolha
  if (isSticker || isReaction) {
    return (
      <>
        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
          <div className="relative">
            {renderContent(mensagem, handleViewMedia)}
            <span className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1 justify-end">
              {format(new Date(mensagem.criado_em), 'HH:mm')}
              {isMe && <AckIndicator ack={mensagem.ack} />}
            </span>
          </div>
        </div>
        {viewerMedia && (
          <MediaViewer
            url={viewerMedia.url}
            tipo={viewerMedia.tipo}
            onClose={() => setViewerMedia(null)}
          />
        )}
      </>
    )
  }

  return (
    <>
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
        <div
          className={`
            relative max-w-[85%] sm:max-w-[75%] lg:max-w-[60%] rounded-lg px-3 py-2
            ${isMe
              ? 'bg-primary/10 border border-primary/15'
              : 'bg-muted border border-border/30'
            }
          `}
        >
          {/* Participant name for group messages (received only) */}
          {participantName && !isMe && (
            <p
              className="text-[11px] font-semibold mb-0.5 truncate"
              style={{ color: participantColor || 'hsl(var(--primary))' }}
            >
              {participantName}
            </p>
          )}

          {renderContent(mensagem, handleViewMedia)}

          {/* Timestamp + ACK */}
          <div className="flex items-center gap-1 justify-end mt-1">
            <span className="text-[10px] text-muted-foreground">
              {format(new Date(mensagem.criado_em), 'HH:mm')}
            </span>
            {isMe && <AckIndicator ack={mensagem.ack} />}
          </div>
        </div>
      </div>
      {viewerMedia && (
        <MediaViewer
          url={viewerMedia.url}
          tipo={viewerMedia.tipo}
          onClose={() => setViewerMedia(null)}
        />
      )}
    </>
  )
}
