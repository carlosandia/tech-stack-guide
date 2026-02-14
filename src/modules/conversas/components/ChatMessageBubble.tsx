/**
 * AIDEV-NOTE: Bolha de mensagem individual no chat (PRD-09)
 * Suporta todos os tipos: text, image, video, audio, document, location, contact, poll, sticker, reaction
 * Suporta exibição de nome do remetente em grupos
 * Integra MediaViewer para lightbox de imagens e vídeos
 * Menu de ações via Portal: Responder, Copiar, Reagir, Encaminhar, Fixar, Apagar
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import DOMPurify from 'dompurify'
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
  RefreshCw,
  ChevronDown,
  Trash2,
  Reply,
  Copy,
  Smile,
  Forward,
  Pin,
} from 'lucide-react'
import type { Mensagem } from '../services/conversas.api'
import { conversasApi } from '../services/conversas.api'
import { MediaViewer } from './MediaViewer'
import { toast } from 'sonner'
import { WhatsAppAudioPlayer } from './WhatsAppAudioPlayer'

interface ChatMessageBubbleProps {
  mensagem: Mensagem
  participantName?: string | null
  participantColor?: string | null
  conversaId?: string
  fotoUrl?: string | null
  onDeleteMessage?: (mensagemId: string, messageWahaId: string, paraTodos: boolean) => void
  onReplyMessage?: (mensagem: Mensagem) => void
  onReactMessage?: (mensagem: Mensagem, emoji: string) => void
  onForwardMessage?: (mensagem: Mensagem) => void
  onPinMessage?: (mensagem: Mensagem) => void
  quotedMessage?: Mensagem | null
}

// =====================================================
// Sub-components
// =====================================================

function AckIndicator({ ack }: { ack: number }) {
  if (ack <= 0) return null
  if (ack === 1) return <Check className="w-3.5 h-3.5 text-muted-foreground/50" />
  if (ack === 2) return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground/50" />
  if (ack === 3 || ack === 4) return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
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

const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: ['strong', 'em', 'del', 'code', 'span'],
  ALLOWED_ATTR: ['class'],
}

function sanitizeFormattedHtml(text: string): string {
  const formatted = text
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/~(.*?)~/g, '<del>$1</del>')
    .replace(/```(.*?)```/gs, '<code>$1</code>')
  return DOMPurify.sanitize(formatted, DOMPURIFY_CONFIG)
}

function TextContent({ body }: { body: string }) {
  const sanitized = sanitizeFormattedHtml(body)

  return (
    <p
      className="text-sm whitespace-pre-wrap break-words"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}

function ImageContent({ mensagem, onViewMedia }: { mensagem: Mensagem; onViewMedia?: (url: string, tipo: 'image' | 'video') => void }) {
  if (!mensagem.media_url) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border border-border/30 text-muted-foreground text-xs italic">
        <FileText className="w-4 h-4" />
        <span>Imagem indisponível</span>
      </div>
    )
  }
  return (
    <div className="space-y-1">
      <img
        src={mensagem.media_url}
        alt="Imagem"
        className="rounded-md max-w-[280px] max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
        loading="lazy"
        onClick={() => onViewMedia?.(mensagem.media_url!, 'image')}
      />
      {mensagem.caption && <TextContent body={mensagem.caption} />}
    </div>
  )
}

function VideoContent({ mensagem, onViewMedia }: { mensagem: Mensagem; onViewMedia?: (url: string, tipo: 'image' | 'video') => void }) {
  if (!mensagem.media_url) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border border-border/30 text-muted-foreground text-xs italic">
        <Play className="w-4 h-4" />
        <span>Vídeo indisponível</span>
      </div>
    )
  }
  return (
    <div className="space-y-1">
      <div className="relative cursor-pointer group" onClick={() => onViewMedia?.(mensagem.media_url!, 'video')}>
        <video src={mensagem.media_url} className="rounded-md max-w-[280px] max-h-[300px]" preload="metadata" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md group-hover:bg-black/30 transition-colors">
          <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>
      {mensagem.caption && <TextContent body={mensagem.caption} />}
    </div>
  )
}

function AudioContent({ mensagem, isMe, fotoUrl }: { mensagem: Mensagem; isMe?: boolean; fotoUrl?: string | null }) {
  if (!mensagem.media_url) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border border-border/30 text-muted-foreground text-xs italic">
        <Play className="w-4 h-4" />
        <span>Áudio indisponível</span>
      </div>
    )
  }
  return (
    <WhatsAppAudioPlayer
      src={mensagem.media_url}
      duration={mensagem.media_duration ?? undefined}
      isMe={!!isMe}
      fotoUrl={fotoUrl}
    />
  )
}

function getDocumentIcon(filename?: string | null) {
  const ext = (filename || '').split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'pdf':
      return (
        <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-red-500 uppercase">PDF</span>
        </div>
      )
    case 'doc':
    case 'docx':
      return (
        <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-blue-500" />
        </div>
      )
    case 'xls':
    case 'xlsx':
    case 'csv':
      return (
        <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-green-500" />
        </div>
      )
    case 'zip':
    case 'rar':
    case '7z':
      return (
        <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-amber-500" />
        </div>
      )
    default:
      return (
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-primary" />
        </div>
      )
  }
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
      window.open(url, '_blank')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="flex items-center gap-2 p-2 rounded-md bg-background/50 border border-border/50 hover:bg-accent/50 transition-colors w-full max-w-[280px] text-left overflow-hidden"
    >
      {getDocumentIcon(mensagem.media_filename)}
      <div className="flex-1 min-w-0 overflow-hidden">
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
    <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 p-2 rounded-md bg-background/50 border border-border/50 hover:bg-accent/50 transition-colors min-w-[200px]">
      <MapPin className="w-8 h-8 text-destructive flex-shrink-0" />
      <div className="flex-1 min-w-0">
        {mensagem.location_name && <p className="text-xs font-medium truncate">{mensagem.location_name}</p>}
        {mensagem.location_address && <p className="text-[11px] text-muted-foreground truncate">{mensagem.location_address}</p>}
        {!mensagem.location_name && !mensagem.location_address && <p className="text-xs text-muted-foreground">Localização compartilhada</p>}
      </div>
      <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </a>
  )
}

// AIDEV-NOTE: Cores de avatar para contatos compartilhados (consistência com ConversaItem)
const contactAvatarColors = [
  'bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-purple-500',
  'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500',
]

function getContactAvatarColor(name: string): string {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return contactAvatarColors[hash % contactAvatarColors.length]
}

function ContactContent({ mensagem }: { mensagem: Mensagem }) {
  // Parse vCard fields
  const vcard = mensagem.vcard || ''
  const displayName = vcard.match(/FN:(.*)/)?.[1]?.trim() || 'Contato'
  const phone = vcard.match(/TEL[^:]*:(.*)/)?.[1]?.trim() || ''
  const bizName = vcard.match(/X-WA-BIZ-NAME:(.*)/)?.[1]?.trim() || ''
  const bizDesc = vcard.match(/X-WA-BIZ-DESCRIPTION:([\s\S]*?)(?=\n[A-Z])/)?.[1]?.trim() || ''
  const photoData = vcard.match(/PHOTO;[^:]*:(.*)/)?.[1]?.trim() || ''
  const photoUri = vcard.match(/PHOTO;VALUE=URI:(.*)/)?.[1]?.trim() || ''
  const isBiz = !!bizName
  const contactName = bizName || displayName

  // Extract waid for profile picture URL attempt
  const waid = vcard.match(/waid=(\d+)/)?.[1] || ''

  // Determine avatar: photo from vCard > colored initials
  const hasPhoto = !!(photoData || photoUri)
  const photoSrc = photoUri || (photoData ? `data:image/jpeg;base64,${photoData}` : '')
  const initials = contactName.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('')
  const avatarColor = getContactAvatarColor(contactName)

  return (
    <div className="rounded-lg overflow-hidden min-w-[220px] max-w-[280px]">
      {/* Contact card body */}
      <div className="flex items-center gap-3 p-3 bg-muted/40">
        {hasPhoto ? (
          <img
            src={photoSrc}
            alt={contactName}
            className="w-11 h-11 rounded-full object-cover flex-shrink-0 border border-border/50"
          />
        ) : (
          <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm ${avatarColor}`}>
            {initials || <User className="w-5 h-5" />}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{contactName}</p>
          {isBiz && (
            <p className="text-[11px] text-muted-foreground">Conta comercial</p>
          )}
          {bizDesc && (
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{bizDesc.split('\n')[0]}</p>
          )}
          {!isBiz && phone && (
            <p className="text-[11px] text-muted-foreground">{phone}</p>
          )}
        </div>
      </div>
      {/* Action button */}
      <div className="border-t border-border/50 bg-muted/20">
        <button
          onClick={() => {
            const cleanPhone = (waid || phone).replace(/\D/g, '')
            if (cleanPhone) window.open(`https://wa.me/${cleanPhone}`, '_blank')
          }}
          className="w-full py-2 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
        >
          Conversar
        </button>
      </div>
    </div>
  )
}

function PollContent({ mensagem, conversaId, fotoUrl }: { mensagem: Mensagem; conversaId?: string; fotoUrl?: string | null }) {
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState(mensagem.poll_options)
  const [showVoters, setShowVoters] = useState(false)

  // AIDEV-NOTE: Sincronizar estado local com props quando Realtime/cache invalidation atualizar os dados
  useEffect(() => {
    setOptions(mensagem.poll_options)
  }, [mensagem.poll_options])

  const handleRefresh = async () => {
    if (!conversaId || !mensagem.message_id) return
    setLoading(true)
    try {
      const result = await conversasApi.consultarVotosEnquete(conversaId, mensagem.message_id)
      if (result?.poll_options) {
        setOptions(result.poll_options)
        const hasVotes = result.poll_options.some((o: { votes?: number }) => (o.votes || 0) > 0)
        toast.success(hasVotes ? 'Votos atualizados' : 'Nenhum voto registrado ainda. Novos votos serão sincronizados automaticamente.')
      } else {
        toast.info('Nenhum voto registrado ainda')
      }
    } catch {
      toast.error('Erro ao consultar votos')
    } finally {
      setLoading(false)
    }
  }

  const currentOptions = options || mensagem.poll_options || []
  const totalVotes = currentOptions.reduce((sum, o) => sum + (o.votes || 0), 0)
  const allowMultiple = mensagem.poll_allow_multiple

  return (
    <div className="min-w-[240px] max-w-[320px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm font-semibold text-foreground leading-snug">{mensagem.poll_question}</p>
        {conversaId && (
          <button onClick={handleRefresh} disabled={loading}
            className="p-1 rounded-full hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
            title="Atualizar votos">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Subtitle */}
      <div className="flex items-center gap-1 mb-3">
        <div className="w-4 h-4 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center flex-shrink-0">
          <Check className="w-2.5 h-2.5 text-primary-foreground" />
        </div>
        <span className="text-[11px] text-muted-foreground">
          {allowMultiple ? 'Selecione uma ou mais opções' : 'Selecione uma opção'}
        </span>
      </div>

      {/* Options */}
      <div className="space-y-0 border border-border/40 rounded-lg overflow-hidden bg-background/50">
        {currentOptions.map((opt, idx) => {
          const percent = totalVotes > 0 ? Math.round((opt.votes || 0) / totalVotes * 100) : 0
          return (
            <div key={idx} className={`relative ${idx > 0 ? 'border-t border-border/30' : ''}`}>
              {totalVotes > 0 && (
                <div
                  className="absolute inset-0 bg-primary/10 transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              )}
              <div className="relative flex items-center gap-2.5 px-3 py-2.5">
                <div className={`w-[18px] h-[18px] rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  (opt.votes || 0) > 0 ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                }`}>
                  {(opt.votes || 0) > 0 && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                </div>
                <span className="flex-1 text-[13px] text-foreground">{opt.text}</span>
                <span className="text-[12px] text-muted-foreground font-medium flex-shrink-0">
                  {opt.votes || 0}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <button
        onClick={() => setShowVoters(!showVoters)}
        className="w-full mt-2 pt-1 text-center text-[11px] text-primary hover:text-primary/80 font-medium transition-colors"
      >
        {showVoters ? 'Ocultar votos' : 'Mostrar votos'}
      </button>
      {totalVotes > 0 && (
        <p className="text-center text-[10px] text-muted-foreground mt-0.5">
          {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}
        </p>
      )}

      {/* AIDEV-NOTE: Painel de votos estilo WhatsApp com cards por opção e lista de votantes */}
      {showVoters && (
        <div className="mt-3 space-y-2">
          {/* Título da enquete */}
          <div className="bg-muted/50 rounded-lg px-3 py-2">
            <p className="text-xs font-semibold text-foreground">{mensagem.poll_question}</p>
          </div>

          {/* Cards por opção */}
          {currentOptions.map((opt, idx) => {
            // Obter votantes desta opção do raw_data.poll_voters
            const pollVoters = (mensagem.raw_data as Record<string, unknown>)?.poll_voters as Record<string, string[]> | undefined
            const votersForOption = pollVoters
              ? Object.entries(pollVoters)
                  .filter(([, selections]) => selections.includes(opt.text))
                  .map(([voterId]) => voterId)
              : []

            return (
              <div key={idx} className="bg-muted/30 rounded-lg overflow-hidden">
                {/* Header da opção */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-border/20">
                  <span className="text-[13px] font-semibold text-foreground">{opt.text}</span>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {opt.votes || 0} {(opt.votes || 0) === 1 ? 'voto' : 'votos'}
                  </span>
                </div>

                {/* Lista de votantes */}
                {votersForOption.length > 0 ? (
                  <div className="px-3 py-1.5 space-y-1">
                    {votersForOption.map((voter, vIdx) => {
                      // Formatar número do votante para exibição
                      const displayName = voter.replace('@c.us', '').replace('@s.whatsapp.net', '')
                      const formatted = displayName.length > 6
                        ? `+${displayName.slice(0, 2)} ${displayName.slice(2, 4)} ${displayName.slice(4)}`
                        : displayName

                      return (
                        <div key={vIdx} className="flex items-center gap-2 py-1">
                          {fotoUrl ? (
                            <img
                              src={fotoUrl}
                              alt=""
                              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-medium text-primary">
                                {displayName.slice(-2)}
                              </span>
                            </div>
                          )}
                          <span className="text-[12px] text-muted-foreground truncate">{formatted}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (opt.votes || 0) > 0 ? (
                  <div className="px-3 py-1.5">
                    <span className="text-[11px] text-muted-foreground italic">Votante(s) não identificado(s)</span>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StickerContent({ mensagem }: { mensagem: Mensagem }) {
  return <img src={mensagem.media_url || ''} alt="Sticker" className="w-[150px] h-[150px] object-contain" loading="lazy" />
}

function ReactionContent({ mensagem }: { mensagem: Mensagem }) {
  return <span className="text-2xl">{mensagem.reaction_emoji}</span>
}

function renderContent(
  mensagem: Mensagem,
  onViewMedia?: (url: string, tipo: 'image' | 'video') => void,
  conversaId?: string,
  isMe?: boolean,
  fotoUrl?: string | null,
) {
  switch (mensagem.tipo) {
    case 'text': return <TextContent body={mensagem.body || ''} />
    case 'image': return <ImageContent mensagem={mensagem} onViewMedia={onViewMedia} />
    case 'video': return <VideoContent mensagem={mensagem} onViewMedia={onViewMedia} />
    case 'audio': return <AudioContent mensagem={mensagem} isMe={isMe} fotoUrl={fotoUrl} />
    case 'document': return <DocumentContent mensagem={mensagem} />
    case 'location': return <LocationContent mensagem={mensagem} />
    case 'contact': return <ContactContent mensagem={mensagem} />
    case 'poll': return <PollContent mensagem={mensagem} conversaId={conversaId} fotoUrl={fotoUrl} />
    case 'sticker': return <StickerContent mensagem={mensagem} />
    case 'reaction': return <ReactionContent mensagem={mensagem} />
    default: return <p className="text-sm text-muted-foreground italic">Tipo não suportado</p>
  }
}

// =====================================================
// Quoted message preview (reply bubble)
// =====================================================

function QuotedMessagePreview({ quoted, isMe }: { quoted: Mensagem; isMe: boolean }) {
  const getPreviewText = () => {
    switch (quoted.tipo) {
      case 'text': return quoted.body || ''
      case 'image': return '📷 Foto'
      case 'video': return '🎥 Vídeo'
      case 'audio': return '🎵 Áudio'
      case 'document': return `📄 ${quoted.media_filename || 'Documento'}`
      case 'location': return '📍 Localização'
      case 'contact': return '👤 Contato'
      case 'poll': return `📊 ${quoted.poll_question || 'Enquete'}`
      case 'sticker': return '🎨 Sticker'
      default: return 'Mensagem'
    }
  }

  return (
    <div className={`
      rounded-md px-2.5 py-1.5 mb-1.5 border-l-[3px] cursor-pointer
      ${isMe
        ? 'bg-primary/5 border-l-primary/40'
        : 'bg-muted/60 border-l-muted-foreground/40'
      }
    `}>
      <p className="text-[11px] font-semibold text-primary truncate">
        {quoted.from_me ? 'Você' : 'Contato'}
      </p>
      <p className="text-[11px] text-muted-foreground truncate max-w-[250px]">
        {getPreviewText()}
      </p>
    </div>
  )
}

// =====================================================
// Quick Reaction Emojis
// =====================================================

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

function ReactionPicker({ onSelect, position }: {
  onSelect: (emoji: string) => void
  position: { top: number; left: number }
}) {
  return createPortal(
    <div
      className="fixed z-[10000] flex items-center gap-1 bg-popover border border-border rounded-full px-2 py-1.5 shadow-lg"
      style={{ top: position.top - 48, left: position.left }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-8 h-8 flex items-center justify-center text-lg hover:bg-accent rounded-full transition-colors hover:scale-125"
        >
          {emoji}
        </button>
      ))}
    </div>,
    document.body
  )
}

// =====================================================
// Action Menu (Portal-based)
// =====================================================

function MessageActionMenu({ mensagem, onDelete, onReply, onCopy, onReact, onForward, onPin, onOpenChange }: {
  mensagem: Mensagem
  onDelete: (paraTodos: boolean) => void
  onReply?: () => void
  onCopy?: () => void
  onReact?: () => void
  onForward?: () => void
  onPin?: () => void
  onOpenChange?: (isOpen: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)

  // Notify parent when menu open state changes
  useEffect(() => {
    onOpenChange?.(open)
  }, [open, onOpenChange])

  useEffect(() => {
    if (!open) return
    const handler = () => {
      setOpen(false)
    }
    // Use setTimeout so the click that opened doesn't immediately close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler)
    }, 10)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handler)
    }
  }, [open])

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const menuWidth = 180
      const menuHeight = 260 // estimated max menu height
      let left = mensagem.from_me ? rect.left : rect.right - menuWidth
      // Ensure it doesn't go off-screen horizontally
      if (left + menuWidth > window.innerWidth) left = window.innerWidth - menuWidth - 8
      if (left < 8) left = 8
      // Smart vertical positioning: open upward if not enough space below
      const spaceBelow = window.innerHeight - rect.bottom
      const top = spaceBelow < menuHeight
        ? Math.max(8, rect.top - menuHeight)
        : rect.bottom + 4
      setMenuPos({ top, left })
    }
    setOpen(!open)
  }, [open, mensagem.from_me])

  const menuContent = open && menuPos ? createPortal(
    <div
      className="fixed z-[9999] bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[180px]"
      style={{ top: menuPos.top, left: menuPos.left }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {onReply && (
        <button
          onClick={() => { onReply(); setOpen(false) }}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs hover:bg-accent/50 transition-colors text-foreground"
        >
          <Reply className="w-3.5 h-3.5 text-muted-foreground" />
          Responder
        </button>
      )}

      {onCopy && (
        <button
          onClick={() => { onCopy(); setOpen(false) }}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs hover:bg-accent/50 transition-colors text-foreground"
        >
          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          Copiar
        </button>
      )}

      {onReact && (
        <button
          onClick={() => { onReact(); setOpen(false) }}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs hover:bg-accent/50 transition-colors text-foreground"
        >
          <Smile className="w-3.5 h-3.5 text-muted-foreground" />
          Reagir
        </button>
      )}

      {onForward && (
        <button
          onClick={() => { onForward(); setOpen(false) }}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs hover:bg-accent/50 transition-colors text-foreground"
        >
          <Forward className="w-3.5 h-3.5 text-muted-foreground" />
          Encaminhar
        </button>
      )}

      {onPin && (
        <button
          onClick={() => { onPin(); setOpen(false) }}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs hover:bg-accent/50 transition-colors text-foreground"
        >
          <Pin className="w-3.5 h-3.5 text-muted-foreground" />
          Fixar
        </button>
      )}

      <div className="my-1 border-t border-border/50" />

      <button
        onClick={() => { onDelete(false); setOpen(false) }}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-xs hover:bg-accent/50 transition-colors text-foreground"
      >
        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
        Apagar para mim
      </button>

      {/* AIDEV-NOTE: WhatsApp permite "apagar para todos" somente dentro de ~60 horas após o envio */}
      {mensagem.from_me && (Date.now() - new Date(mensagem.criado_em).getTime()) < 60 * 60 * 60 * 1000 && (
        <button
          onClick={() => { onDelete(true); setOpen(false) }}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs hover:bg-accent/50 transition-colors text-destructive"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Apagar para todos
        </button>
      )}
    </div>,
    document.body
  ) : null

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="p-1 rounded-full bg-background/80 border border-border/50 shadow-sm hover:bg-accent/50 transition-colors"
      >
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
      {menuContent}
    </>
  )
}


// =====================================================
// Main component
// =====================================================

export function ChatMessageBubble({
  mensagem, participantName, participantColor, conversaId, fotoUrl,
  onDeleteMessage, onReplyMessage, onReactMessage, onForwardMessage, onPinMessage,
  quotedMessage
}: ChatMessageBubbleProps) {
  const [viewerMedia, setViewerMedia] = useState<{ url: string; tipo: 'image' | 'video' } | null>(null)
  const [, setHovered] = useState(false)
  const [actionMenuOpen, setActionMenuOpen] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [reactionPos, setReactionPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const bubbleRef = useRef<HTMLDivElement>(null)
  const isMe = mensagem.from_me
  const isSticker = mensagem.tipo === 'sticker'
  const isReaction = mensagem.tipo === 'reaction'
  const isTextType = mensagem.tipo === 'text'

  // Pre-format body for inline text rendering
  const formattedBody = useMemo(() => {
    if (!mensagem.body) return DOMPurify.sanitize('<span class="italic text-muted-foreground">Mensagem indisponível</span>', DOMPURIFY_CONFIG)
    return sanitizeFormattedHtml(mensagem.body)
  }, [mensagem.body])

  const handleViewMedia = (url: string, tipo: 'image' | 'video') => {
    setViewerMedia({ url, tipo })
  }

  const handleDelete = (paraTodos: boolean) => {
    onDeleteMessage?.(mensagem.id, mensagem.message_id, paraTodos)
  }

  const handleReply = () => {
    onReplyMessage?.(mensagem)
  }

  // Universal copy: text, media URL, vcard, etc.
  const handleCopy = useCallback(() => {
    let content = ''
    switch (mensagem.tipo) {
      case 'text':
        content = mensagem.body || ''
        break
      case 'image':
      case 'video':
      case 'audio':
      case 'document':
      case 'sticker':
        content = mensagem.media_url || mensagem.caption || mensagem.body || ''
        break
      case 'contact':
        content = mensagem.vcard || mensagem.body || ''
        break
      case 'location':
        content = `https://www.google.com/maps?q=${mensagem.location_latitude},${mensagem.location_longitude}`
        break
      case 'poll':
        content = `📊 ${mensagem.poll_question}\n${mensagem.poll_options?.map(o => `• ${o.text}`).join('\n') || ''}`
        break
      default:
        content = mensagem.body || ''
    }
    if (content) {
      navigator.clipboard.writeText(content)
      toast.success('Copiado')
    }
  }, [mensagem])

  const handleReact = useCallback(() => {
    if (bubbleRef.current) {
      const rect = bubbleRef.current.getBoundingClientRect()
      setReactionPos({
        top: rect.top,
        left: isMe ? rect.left : rect.left + 40,
      })
    }
    setShowReactionPicker(true)
  }, [isMe])

  const handleReactionSelect = useCallback((emoji: string) => {
    setShowReactionPicker(false)
    onReactMessage?.(mensagem, emoji)
  }, [mensagem, onReactMessage])

  const handleForward = useCallback(() => {
    onForwardMessage?.(mensagem)
  }, [mensagem, onForwardMessage])

  const handlePin = useCallback(() => {
    onPinMessage?.(mensagem)
  }, [mensagem, onPinMessage])

  // Close reaction picker on outside click
  useEffect(() => {
    if (!showReactionPicker) return
    const handler = () => setShowReactionPicker(false)
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 10)
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handler) }
  }, [showReactionPicker])

  // Sticker e reaction não tem bolha
  if (isSticker || isReaction) {
    return (
      <>
        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
          <div className="relative">
            {renderContent(mensagem, handleViewMedia, conversaId, isMe, fotoUrl)}
            <span className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1 justify-end">
              {format(new Date(mensagem.criado_em), 'HH:mm')}
              {isMe && <AckIndicator ack={mensagem.ack} />}
            </span>
          </div>
        </div>
        {viewerMedia && (
          <MediaViewer url={viewerMedia.url} tipo={viewerMedia.tipo} onClose={() => setViewerMedia(null)} />
        )}
      </>
    )
  }

  return (
    <>
      <div
        className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1 group/msg`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { if (!actionMenuOpen) setHovered(false) }}
      >
        {/* Action menu - LEFT side for SENT messages (isMe) */}
        {isMe && onDeleteMessage && (
          <div className={`flex items-start pt-1 mr-1 transition-opacity opacity-0 group-hover/msg:opacity-100 ${actionMenuOpen ? '!opacity-100' : ''}`}>
            <MessageActionMenu
              mensagem={mensagem}
              onDelete={handleDelete}
              onReply={onReplyMessage ? handleReply : undefined}
              onCopy={handleCopy}
              onReact={onReactMessage ? handleReact : undefined}
              onForward={onForwardMessage ? handleForward : undefined}
              onPin={onPinMessage ? handlePin : undefined}
              onOpenChange={(isOpen) => { setActionMenuOpen(isOpen); if (!isOpen) setHovered(false) }}
            />
          </div>
        )}

        <div
          ref={bubbleRef}
          className={`
            relative max-w-[85%] sm:max-w-[75%] lg:max-w-[60%] rounded-lg px-3 py-1.5
            ${isMe
              ? 'bg-primary/10 border border-primary/15'
              : 'bg-muted border border-border/30'
            }
          `}
        >
          {participantName && !isMe && (
            <p
              className="text-[11px] font-semibold mb-0.5 truncate"
              style={{ color: participantColor || 'hsl(var(--primary))' }}
            >
              {participantName}
            </p>
          )}

          {quotedMessage && (
            <QuotedMessagePreview quoted={quotedMessage} isMe={isMe} />
          )}

          {/* Inline text + timestamp (WhatsApp style) */}
          {isTextType ? (
            <div className="relative">
              <span className="text-sm whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: formattedBody }} />
              {/* Invisible spacer to reserve room for the floating timestamp */}
              <span className={`inline-block ${(mensagem.raw_data as any)?.is_template ? 'w-[130px]' : 'w-[70px]'}`} aria-hidden="true">&nbsp;</span>
              {/* Floating timestamp at bottom-right */}
              <span className="absolute bottom-0 right-0 flex items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap select-none">
                {(mensagem.raw_data as any)?.is_template && (
                  <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[9px] font-semibold leading-none">
                    Template
                  </span>
                )}
                {format(new Date(mensagem.criado_em), 'HH:mm')}
                {isMe && <AckIndicator ack={mensagem.ack} />}
              </span>
            </div>
          ) : (
            <>
              {renderContent(mensagem, handleViewMedia, conversaId, isMe, fotoUrl)}
              <div className="flex items-center gap-1 justify-end mt-1">
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(mensagem.criado_em), 'HH:mm')}
                </span>
                {isMe && <AckIndicator ack={mensagem.ack} />}
              </div>
            </>
          )}
        </div>

        {/* Action menu - RIGHT side for RECEIVED messages (!isMe) */}
        {!isMe && onDeleteMessage && (
          <div className={`flex items-start pt-1 ml-1 transition-opacity opacity-0 group-hover/msg:opacity-100 ${actionMenuOpen ? '!opacity-100' : ''}`}>
            <MessageActionMenu
              mensagem={mensagem}
              onDelete={handleDelete}
              onReply={onReplyMessage ? handleReply : undefined}
              onCopy={handleCopy}
              onReact={onReactMessage ? handleReact : undefined}
              onForward={onForwardMessage ? handleForward : undefined}
              onPin={onPinMessage ? handlePin : undefined}
              onOpenChange={(isOpen) => { setActionMenuOpen(isOpen); if (!isOpen) setHovered(false) }}
            />
          </div>
        )}
      </div>

      {showReactionPicker && (
        <ReactionPicker
          onSelect={handleReactionSelect}
          position={reactionPos}
        />
      )}

      {viewerMedia && (
        <MediaViewer url={viewerMedia.url} tipo={viewerMedia.tipo} onClose={() => setViewerMedia(null)} />
      )}
    </>
  )
}
