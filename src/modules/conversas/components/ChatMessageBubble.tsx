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
} from 'lucide-react'
import type { Mensagem } from '../services/conversas.api'
import { conversasApi } from '../services/conversas.api'
import { MediaViewer } from './MediaViewer'
import { toast } from 'sonner'
import { WhatsAppAudioPlayer } from './WhatsAppAudioPlayer'

// AIDEV-NOTE: Estrutura de reação agregada para exibição no estilo WhatsApp
export interface ReactionBadge {
  emoji: string
  count: number
  fromMe: boolean
}

interface ChatMessageBubbleProps {
  mensagem: Mensagem
  participantName?: string | null
  participantColor?: string | null
  conversaId?: string
  fotoUrl?: string | null
  myAvatarUrl?: string | null
  contactMap?: Map<string, string>
  reactions?: ReactionBadge[]
  onDeleteMessage?: (mensagemId: string, messageWahaId: string, paraTodos: boolean) => void
  onReplyMessage?: (mensagem: Mensagem) => void
  onReactMessage?: (mensagem: Mensagem, emoji: string) => void
  onForwardMessage?: (mensagem: Mensagem) => void
  onPinMessage?: (mensagem: Mensagem) => void
  quotedMessage?: Mensagem | null
  isStatusReply?: boolean
  onStartConversation?: (telefone: string) => void
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
  ALLOWED_TAGS: ['strong', 'em', 'del', 'code', 'span', 'a'],
  ALLOWED_ATTR: ['class', 'href', 'target', 'rel'],
}

// AIDEV-NOTE: Regex para detectar URLs no texto e converter em links clicáveis
const URL_REGEX = /(https?:\/\/[^\s<>"']+)/g

function sanitizeFormattedHtml(text: string): string {
  const formatted = text
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/~(.*?)~/g, '<del>$1</del>')
    .replace(/```(.*?)```/gs, '<code>$1</code>')
    // Converter URLs em links clicáveis
    .replace(URL_REGEX, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80 break-all">$1</a>')
  return DOMPurify.sanitize(formatted, DOMPURIFY_CONFIG)
}

function TextContent({ body, rawData, contactMap }: { body: string; rawData?: Record<string, unknown> | null; contactMap?: Map<string, string> }) {
  const resolvedBody = useMemo(() => {
    if (!contactMap || contactMap.size === 0 || !rawData) return body

    // Extrair mentionedJid do raw_data
    const _data = rawData._data as Record<string, unknown> | undefined
    const message = (_data?.message || _data?.Message) as Record<string, unknown> | undefined
    const extText = message?.extendedTextMessage as Record<string, unknown> | undefined
    const contextInfo = extText?.contextInfo as Record<string, unknown> | undefined
    const mentionedJid = (
      contextInfo?.mentionedJid || contextInfo?.mentionedJID ||
      _data?.MentionedJID ||
      rawData.mentionedIds
    ) as string[] | undefined

    if (!mentionedJid || mentionedJid.length === 0) return body

    let resolved = body
    for (const jid of mentionedJid) {
      const number = jid
        .replace('@s.whatsapp.net', '')
        .replace('@c.us', '')
        .replace('@lid', '')
      const name = contactMap.get(number)
      if (name) {
        // Substituir @numero por marcador que será renderizado como menção
        resolved = resolved.replace(`@${number}`, `@@mention:${name}@@`)
      } else if (/^\d{8,}$/.test(number)) {
        // Formatar numero como telefone legível
        const formatted = number.length > 10
          ? `+${number.slice(0, 2)} ${number.slice(2, 4)} ${number.slice(4)}`
          : `+${number}`
        resolved = resolved.replace(`@${number}`, `@@mention:${formatted}@@`)
      }
    }
    return resolved
  }, [body, rawData, contactMap])

  // Renderizar com menções estilizadas
  const sanitized = sanitizeFormattedHtml(resolvedBody)
  // Substituir marcadores @@mention:nome@@ por spans estilizados
  const withMentions = sanitized.replace(
    /@@mention:(.*?)@@/g,
    '<span class="mention-highlight">@$1</span>'
  )

  return (
    <p
      className="text-sm whitespace-pre-wrap break-words"
      dangerouslySetInnerHTML={{ __html: withMentions }}
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
  const [imgError, setImgError] = useState(false)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)

  // AIDEV-NOTE: Fallback para signed URL se a URL pública falhar (bucket privado)
  const handleImageError = useCallback(async () => {
    if (imgError || !mensagem.media_url) return
    setImgError(true)
    // Tentar extrair path do storage da URL pública
    const match = mensagem.media_url.match(/\/storage\/v1\/object\/public\/chat-media\/(.+)/)
    if (match) {
      try {
        const { supabase } = await import('@/integrations/supabase/client')
        const { data } = await supabase.storage.from('chat-media').createSignedUrl(match[1], 3600)
        if (data?.signedUrl) setSignedUrl(data.signedUrl)
      } catch { /* silent */ }
    }
  }, [mensagem.media_url, imgError])

  const finalUrl = signedUrl || mensagem.media_url

  return (
    <div className="space-y-1">
      {imgError && !signedUrl ? (
        <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border border-border/30 text-muted-foreground text-xs italic">
          <FileText className="w-4 h-4" />
          <span>Imagem não pôde ser carregada</span>
        </div>
      ) : (
        <img
          src={finalUrl}
          alt="Imagem"
          className="rounded-md max-w-[280px] max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
          loading="lazy"
          onClick={() => onViewMedia?.(finalUrl!, 'image')}
          onError={handleImageError}
        />
      )}
      {mensagem.caption && <TextContent body={mensagem.caption} rawData={mensagem.raw_data} />}
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
  const [vidError, setVidError] = useState(false)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)

  const handleVideoError = useCallback(async () => {
    if (vidError || !mensagem.media_url) return
    setVidError(true)
    const match = mensagem.media_url.match(/\/storage\/v1\/object\/public\/chat-media\/(.+)/)
    if (match) {
      try {
        const { supabase } = await import('@/integrations/supabase/client')
        const { data } = await supabase.storage.from('chat-media').createSignedUrl(match[1], 3600)
        if (data?.signedUrl) setSignedUrl(data.signedUrl)
      } catch { /* silent */ }
    }
  }, [mensagem.media_url, vidError])

  const finalUrl = signedUrl || mensagem.media_url

  return (
    <div className="space-y-1">
      {vidError && !signedUrl ? (
        <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border border-border/30 text-muted-foreground text-xs italic">
          <Play className="w-4 h-4" />
          <span>Vídeo não pôde ser carregado</span>
        </div>
      ) : (
        <div className="relative cursor-pointer group" onClick={() => onViewMedia?.(finalUrl!, 'video')}>
          <video src={finalUrl} className="rounded-md max-w-[280px] max-h-[300px]" preload="metadata" onError={handleVideoError} />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md group-hover:bg-black/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            </div>
          </div>
        </div>
      )}
      {mensagem.caption && <TextContent body={mensagem.caption} rawData={mensagem.raw_data} />}
    </div>
  )
}

function AudioContent({ mensagem, isMe, fotoUrl, myAvatarUrl, timestamp, ackIndicator }: { mensagem: Mensagem; isMe?: boolean; fotoUrl?: string | null; myAvatarUrl?: string | null; timestamp?: string; ackIndicator?: React.ReactNode }) {
  if (!mensagem.media_url) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border border-border/30 text-muted-foreground text-xs italic">
        <Play className="w-4 h-4" />
        <span>Áudio indisponível</span>
      </div>
    )
  }
  // AIDEV-NOTE: Para mensagens próprias, usar avatar do usuário logado
  const avatarUrl = isMe ? myAvatarUrl : fotoUrl
  return (
    <WhatsAppAudioPlayer
      src={mensagem.media_url}
      duration={mensagem.media_duration ?? undefined}
      isMe={!!isMe}
      fotoUrl={avatarUrl}
      timestamp={timestamp}
      ackIndicator={ackIndicator}
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

function ContactContent({ mensagem, onStartConversation }: { mensagem: Mensagem; onStartConversation?: (telefone: string) => void }) {
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
            if (cleanPhone) {
              if (onStartConversation) {
                onStartConversation(cleanPhone)
              } else {
                window.open(`https://wa.me/${cleanPhone}`, '_blank')
              }
            }
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
  onViewMedia?: (url: string, tipo: 'image' | 'video', extra?: { caption?: string; senderName?: string }) => void,
  conversaId?: string,
  isMe?: boolean,
  fotoUrl?: string | null,
  contactMap?: Map<string, string>,
  myAvatarUrl?: string | null,
  audioTimestamp?: string,
  audioAckIndicator?: React.ReactNode,
  onStartConversation?: (telefone: string) => void,
) {
  switch (mensagem.tipo) {
    case 'text': return <TextContent body={mensagem.body || ''} rawData={mensagem.raw_data} contactMap={contactMap} />
    case 'image': return <ImageContent mensagem={mensagem} onViewMedia={onViewMedia} />
    case 'video': return <VideoContent mensagem={mensagem} onViewMedia={onViewMedia} />
    case 'audio': return <AudioContent mensagem={mensagem} isMe={isMe} fotoUrl={fotoUrl} myAvatarUrl={myAvatarUrl} timestamp={audioTimestamp} ackIndicator={audioAckIndicator} />
    case 'document': return <DocumentContent mensagem={mensagem} />
    case 'location': return <LocationContent mensagem={mensagem} />
    case 'contact': return <ContactContent mensagem={mensagem} onStartConversation={onStartConversation} />
    case 'poll': return <PollContent mensagem={mensagem} conversaId={conversaId} fotoUrl={fotoUrl} />
    case 'sticker': return <StickerContent mensagem={mensagem} />
    case 'reaction': return <ReactionContent mensagem={mensagem} />
    default: return <p className="text-sm text-muted-foreground italic">Tipo não suportado</p>
  }
}

// =====================================================
// Quoted message preview (reply bubble)
// =====================================================

function QuotedMessagePreview({ quoted, isMe, isStatusReply, onViewMedia }: {
  quoted: Mensagem
  isMe: boolean
  isStatusReply?: boolean
  onViewMedia?: (url: string, tipo: 'image' | 'video', extra?: { caption?: string; senderName?: string }) => void
}) {
  const [loading, setLoading] = useState(false)

  const getPreviewText = () => {
    // Para imagem/video com caption, mostrar o caption
    if ((quoted.tipo === 'image' || quoted.tipo === 'video') && quoted.caption) {
      return `${quoted.tipo === 'image' ? '📷' : '🎥'} ${quoted.caption}`
    }
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

  // AIDEV-NOTE: Resolver nome do remetente da mensagem citada via pushName (grupos)
  const senderName = useMemo(() => {
    if (quoted.from_me) return 'Você'
    const rawData = quoted.raw_data as Record<string, unknown> | null
    if (rawData) {
      const _data = rawData._data as Record<string, unknown> | undefined
      const pushName = _data?.pushName as string
        || _data?.PushName as string
        || (_data?.Info as Record<string, unknown> | undefined)?.PushName as string
        || rawData.notifyName as string
        || rawData.pushName as string
      if (pushName) return pushName
    }
    // Fallback: formatar número do remetente
    if (quoted.from_number) {
      const cleaned = quoted.from_number.replace(/@.*/, '')
      if (/^\d+$/.test(cleaned)) return `+${cleaned}`
      return cleaned
    }
    return 'Contato'
  }, [quoted])

  // AIDEV-NOTE: Verificar se há thumbnail disponível (base64 ou media_url de imagem)
  const hasThumbnail = quoted.media_url && (quoted.tipo === 'image' || quoted.tipo === 'video')
  const isMediaType = quoted.tipo === 'image' || quoted.tipo === 'video'

  // AIDEV-NOTE: Dados extras para modo Status no MediaViewer
  const statusExtra = useMemo(() => {
    if (!isStatusReply) return undefined
    const captionText = quoted.caption || quoted.body || undefined
    return { caption: captionText, senderName }
  }, [isStatusReply, quoted.caption, quoted.body, senderName])

  const handleClick = useCallback(async () => {
    if (!isMediaType || !onViewMedia) return

    // Se já temos uma URL de mídia real (não base64), abrir direto
    if (quoted.media_url && !quoted.media_url.startsWith('data:')) {
      onViewMedia(quoted.media_url, quoted.tipo as 'image' | 'video', statusExtra)
      return
    }

    // Se não temos IDs válidos para buscar via API, abrir thumbnail direto
    if (!quoted.conversa_id || !quoted.message_id || quoted.id?.startsWith('synthetic_')) {
      if (quoted.media_url) {
        onViewMedia(quoted.media_url, quoted.tipo as 'image' | 'video', statusExtra)
      } else {
        toast('Mídia não disponível ou expirada')
      }
      return
    }

    // Tentar buscar mídia full-res via WAHA API
    setLoading(true)
    try {
      const { conversasApi } = await import('../services/conversas.api')
      const chatId = isStatusReply ? 'status@broadcast' : undefined
      const result = await conversasApi.downloadMessageMedia(
        quoted.conversa_id,
        quoted.message_id,
        chatId
      )

      if (result?.media_url) {
        onViewMedia(result.media_url, quoted.tipo as 'image' | 'video', statusExtra)
      } else if (quoted.media_url) {
        onViewMedia(quoted.media_url, quoted.tipo as 'image' | 'video', statusExtra)
      } else {
        toast('Mídia não disponível ou expirada')
      }
    } catch {
      if (quoted.media_url) {
        onViewMedia(quoted.media_url, quoted.tipo as 'image' | 'video', statusExtra)
      } else {
        toast('Erro ao carregar mídia')
      }
    } finally {
      setLoading(false)
    }
  }, [quoted, isMediaType, isStatusReply, onViewMedia, statusExtra])

  return (
    <div
      className={`
        rounded-lg mb-1.5 border-l-[3px] cursor-pointer overflow-hidden flex
        ${isMe
          ? 'bg-primary/10 border-l-primary/60'
          : 'bg-muted-foreground/15 border-l-muted-foreground/50'
        }
      `}
      onClick={handleClick}
    >
      <div className="flex-1 min-w-0 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] font-semibold text-primary truncate">
            {senderName}
          </p>
          {isStatusReply && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 text-[9px] font-semibold uppercase tracking-wide flex-shrink-0">
              ● Status
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground/80 truncate max-w-[220px]">
          {loading ? 'Carregando mídia...' : getPreviewText()}
        </p>
      </div>
      {hasThumbnail && (
        <div className="w-[52px] h-[52px] flex-shrink-0 relative">
          <img
            src={quoted.media_url!}
            alt="Thumbnail"
            className="w-full h-full object-cover rounded-r-lg"
          />
          {isMediaType && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-r-lg">
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
          )}
        </div>
      )}
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

function MessageActionMenu({ mensagem, onDelete, onReply, onCopy, onReact, onOpenChange }: {
  mensagem: Mensagem
  onDelete: (paraTodos: boolean) => void
  onReply?: () => void
  onCopy?: () => void
  onReact?: () => void
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
    // Fechar ao clicar fora ou ao scrollar o container de mensagens
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler)
    }, 10)
    const scrollContainer = buttonRef.current?.closest('.overflow-y-auto')
    scrollContainer?.addEventListener('scroll', handler)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handler)
      scrollContainer?.removeEventListener('scroll', handler)
    }
  }, [open])

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!open && buttonRef.current) {
      // AIDEV-NOTE: Recalcular posição no momento do clique para evitar deslocamento por scroll
      const rect = buttonRef.current.getBoundingClientRect()
      const menuWidth = 180
      const menuHeight = 200
      // Posicionar horizontalmente perto do botão
      let left = mensagem.from_me ? rect.right - menuWidth : rect.left
      if (left + menuWidth > window.innerWidth) left = window.innerWidth - menuWidth - 8
      if (left < 8) left = 8
      // Posicionar verticalmente: abrir para cima se não houver espaço abaixo
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

      {/* AIDEV-NOTE: Encaminhamento removido - WAHA GOWS não suporta forward de mensagens */}
      {/* AIDEV-NOTE: Fixar mensagem removido por solicitação do usuário */}

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
  mensagem, participantName, participantColor, conversaId, fotoUrl, myAvatarUrl, contactMap,
  reactions,
  onDeleteMessage, onReplyMessage, onReactMessage, onForwardMessage: _onForwardMessage, onPinMessage: _onPinMessage,
  quotedMessage, isStatusReply, onStartConversation
}: ChatMessageBubbleProps) {
  const [viewerMedia, setViewerMedia] = useState<{ url: string; tipo: 'image' | 'video'; caption?: string; senderName?: string } | null>(null)
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

  const handleViewMedia = (url: string, tipo: 'image' | 'video', extra?: { caption?: string; senderName?: string }) => {
    setViewerMedia({ url, tipo, caption: extra?.caption, senderName: extra?.senderName })
  }

  const handleDelete = (paraTodos: boolean) => {
    onDeleteMessage?.(mensagem.id, mensagem.message_id, paraTodos)
  }

  const handleReply = () => {
    onReplyMessage?.(mensagem)
  }

  // AIDEV-NOTE: Copia inteligente - imagens como blob PNG, outros tipos como texto/URL
  const handleCopy = useCallback(async () => {
    // Imagens: copiar o blob real da imagem via Clipboard API
    if (mensagem.tipo === 'image' && mensagem.media_url) {
      try {
        const resp = await fetch(mensagem.media_url)
        const blob = await resp.blob()
        // Clipboard API exige image/png — converter via canvas se necessário
        const pngBlob = await new Promise<Blob>((resolve, reject) => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            const ctx = canvas.getContext('2d')
            if (!ctx) return reject(new Error('Canvas context failed'))
            ctx.drawImage(img, 0, 0)
            canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png')
          }
          img.onerror = () => reject(new Error('Image load failed'))
          img.src = URL.createObjectURL(blob)
        })
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': pngBlob })
        ])
        toast.success('Imagem copiada')
      } catch {
        // Fallback: copiar URL
        await navigator.clipboard.writeText(mensagem.media_url)
        toast.success('Link da imagem copiado')
      }
      return
    }

    // Outros tipos de mídia: copiar URL com toast adequado
    if (['video', 'audio', 'document', 'sticker'].includes(mensagem.tipo) && mensagem.media_url) {
      await navigator.clipboard.writeText(mensagem.media_url)
      toast.success('Link do arquivo copiado')
      return
    }

    // Texto, contato, localização, enquete
    let content = ''
    switch (mensagem.tipo) {
      case 'text':
        content = mensagem.body || ''
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
      await navigator.clipboard.writeText(content)
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

  // AIDEV-NOTE: handleForward removido - GOWS não suporta forward
  // AIDEV-NOTE: handlePin removido por solicitação do usuário

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
             {renderContent(mensagem, handleViewMedia, conversaId, isMe, fotoUrl, contactMap, myAvatarUrl, undefined, undefined, onStartConversation)}
            <span className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1 justify-end">
              {format(new Date(mensagem.criado_em), 'HH:mm')}
              {isMe && <AckIndicator ack={mensagem.ack} />}
            </span>
          </div>
        </div>
        {viewerMedia && (
          <MediaViewer url={viewerMedia.url} tipo={viewerMedia.tipo} onClose={() => setViewerMedia(null)} caption={viewerMedia.caption} senderName={viewerMedia.senderName} />
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
              onOpenChange={(isOpen) => { setActionMenuOpen(isOpen); if (!isOpen) setHovered(false) }}
            />
          </div>
        )}

        <div
          ref={bubbleRef}
          className={`
            relative max-w-[85%] sm:max-w-[75%] lg:max-w-[60%] rounded-lg px-3 py-1.5
            ${reactions && reactions.length > 0 ? 'mb-3' : ''}
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
            <QuotedMessagePreview quoted={quotedMessage} isMe={isMe} isStatusReply={isStatusReply} onViewMedia={handleViewMedia} />
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
          ) : mensagem.tipo === 'audio' ? (
              <>
                {renderContent(mensagem, handleViewMedia, conversaId, isMe, fotoUrl, contactMap, myAvatarUrl, format(new Date(mensagem.criado_em), 'HH:mm'), isMe ? <AckIndicator ack={mensagem.ack} /> : undefined, onStartConversation)}
              </>
          ) : (
            <>
              {renderContent(mensagem, handleViewMedia, conversaId, isMe, fotoUrl, contactMap, myAvatarUrl, undefined, undefined, onStartConversation)}
              <div className="flex items-center gap-1 justify-end mt-1">
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(mensagem.criado_em), 'HH:mm')}
                </span>
                {isMe && <AckIndicator ack={mensagem.ack} />}
              </div>
            </>
          )}

          {/* AIDEV-NOTE: Reaction badges flutuante no canto inferior esquerdo (estilo WhatsApp) */}
          {reactions && reactions.length > 0 && (
            <div className="absolute -bottom-3 left-1 z-10">
              <div className="flex items-center gap-0.5 bg-background border border-border/50 rounded-full px-1.5 py-0.5 shadow-sm">
                {reactions.map((r, i) => (
                  <span key={i} className="text-sm leading-none" title={r.fromMe ? 'Você' : ''}>
                    {r.emoji}
                  </span>
                ))}
                {reactions.reduce((s, r) => s + r.count, 0) > 1 && (
                  <span className="text-[10px] text-muted-foreground ml-0.5">
                    {reactions.reduce((s, r) => s + r.count, 0)}
                  </span>
                )}
              </div>
            </div>
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
        <MediaViewer url={viewerMedia.url} tipo={viewerMedia.tipo} onClose={() => setViewerMedia(null)} caption={viewerMedia.caption} senderName={viewerMedia.senderName} />
      )}
    </>
  )
}
