/**
 * AIDEV-NOTE: Área de mensagens com scroll infinito, separadores de data
 * e suporte a exibição de nomes de participantes em grupos
 */

import { useRef, useEffect, useMemo, forwardRef } from 'react'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2 } from 'lucide-react'
import { ChatMessageBubble, type ReactionBadge } from './ChatMessageBubble'
import type { Mensagem } from '../services/conversas.api'
import { useMentionResolver } from '../hooks/useMentionResolver'

interface ChatMessagesProps {
  mensagens: Mensagem[]
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => void
  isFetchingMore: boolean
  highlightIds?: Set<string>
  focusedId?: string | null
  conversaTipo?: string
  conversaId?: string
  fotoUrl?: string | null
  myAvatarUrl?: string | null
  onDeleteMessage?: (mensagemId: string, messageWahaId: string, paraTodos: boolean) => void
  onReplyMessage?: (mensagem: Mensagem) => void
  onReactMessage?: (mensagem: Mensagem, emoji: string) => void
  onForwardMessage?: (mensagem: Mensagem) => void
  onPinMessage?: (mensagem: Mensagem) => void
  onStartConversation?: (telefone: string) => void
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr)
  if (isToday(date)) return 'Hoje'
  if (isYesterday(date)) return 'Ontem'
  return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
}

const participantColors = [
  '#e17055', '#00b894', '#0984e3', '#6c5ce7',
  '#fdcb6e', '#e84393', '#00cec9', '#d63031',
  '#55efc4', '#a29bfe', '#fd79a8', '#ffeaa7',
]

function getParticipantColor(participant: string): string {
  const hash = participant.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return participantColors[hash % participantColors.length]
}

function getParticipantDisplayName(msg: Mensagem): string {
  const rawData = msg.raw_data as Record<string, unknown> | null
  if (rawData) {
    const _data = rawData._data as Record<string, unknown> | undefined
    const pushName = _data?.pushName as string
      || rawData.notifyName as string
      || rawData.pushName as string
      || _data?.notifyName as string
    if (pushName) return pushName
  }
  const participant = msg.participant || msg.from_number
  if (participant) {
    // AIDEV-NOTE: Limpar @lid, @c.us e @s.whatsapp.net para exibicao
    const cleaned = participant
      .replace('@c.us', '')
      .replace('@s.whatsapp.net', '')
      .replace('@lid', '')
    // Se ainda parecer um numero, formatar com +
    if (/^\d+$/.test(cleaned)) return `+${cleaned}`
    return cleaned
  }
  return 'Desconhecido'
}

// AIDEV-NOTE: Fallback - extrai contextInfo.quotedMessage do raw_data quando a mensagem citada
// não está na lista carregada (ex: respostas a Status/Stories ou mensagens muito antigas)
function extractQuotedFromRawData(msg: Mensagem): { syntheticMessage: Mensagem; isStatusReply: boolean } | null {
  const rawData = msg.raw_data as Record<string, unknown> | null
  if (!rawData) return null

  // Navegar na estrutura WAHA/GOWS para encontrar contextInfo
  const _data = rawData._data as Record<string, unknown> | undefined
  const message = (_data?.message || _data?.Message) as Record<string, unknown> | undefined
  if (!message) return null

  // contextInfo pode estar dentro de extendedTextMessage, imageMessage, videoMessage, etc.
  let contextInfo: Record<string, unknown> | undefined
  for (const key of Object.keys(message)) {
    const inner = message[key] as Record<string, unknown> | undefined
    if (inner?.contextInfo) {
      contextInfo = inner.contextInfo as Record<string, unknown>
      break
    }
  }
  if (!contextInfo?.quotedMessage) return null

  const quotedMessage = contextInfo.quotedMessage as Record<string, unknown>
  const remoteJID = (contextInfo.remoteJid || contextInfo.remoteJID) as string | undefined
  const isStatusReply = remoteJID === 'status@broadcast'
  const participant = (contextInfo.participant || contextInfo.Participant) as string | undefined

  // Resolver nome do remetente do status
  const participantPushName = (contextInfo.quotedMessageSenderName || contextInfo.PushName) as string | undefined

  // Detectar tipo da mensagem citada
  let tipo: Mensagem['tipo'] = 'text'
  let body: string | null = null
  let caption: string | null = null
  let thumbnailBase64: string | null = null
  let mediaMimetype: string | null = null

  if (quotedMessage.imageMessage) {
    tipo = 'image'
    const img = quotedMessage.imageMessage as Record<string, unknown>
    caption = (img.caption as string) || null
    mediaMimetype = (img.mimetype as string) || null
    const thumb = img.jpegThumbnail || img.JPEGThumbnail || img.jpegthumb
    if (thumb && typeof thumb === 'string') thumbnailBase64 = thumb
  } else if (quotedMessage.videoMessage) {
    tipo = 'video'
    const vid = quotedMessage.videoMessage as Record<string, unknown>
    caption = (vid.caption as string) || null
    mediaMimetype = (vid.mimetype as string) || null
    const thumb = vid.jpegThumbnail || vid.JPEGThumbnail
    if (thumb && typeof thumb === 'string') thumbnailBase64 = thumb
  } else if (quotedMessage.extendedTextMessage) {
    tipo = 'text'
    const ext = quotedMessage.extendedTextMessage as Record<string, unknown>
    body = (ext.text as string) || null
  } else if (quotedMessage.conversation) {
    tipo = 'text'
    body = quotedMessage.conversation as string
  } else if (quotedMessage.audioMessage) {
    tipo = 'audio'
    mediaMimetype = ((quotedMessage.audioMessage as Record<string, unknown>).mimetype as string) || null
  } else if (quotedMessage.documentMessage) {
    tipo = 'document'
    const doc = quotedMessage.documentMessage as Record<string, unknown>
    caption = (doc.fileName as string) || null
    mediaMimetype = (doc.mimetype as string) || null
  } else if (quotedMessage.stickerMessage) {
    tipo = 'sticker'
  }

  // Construir Mensagem sintética para o QuotedMessagePreview
  // AIDEV-NOTE: GOWS usa stanzaID (D maiúsculo), NOWEB usa stanzaId (d minúsculo)
  const stanzaId = (contextInfo.stanzaId || contextInfo.stanzaID) as string | undefined
  const syntheticMessage: Mensagem = {
    id: `synthetic_${stanzaId || Date.now()}`,
    organizacao_id: msg.organizacao_id,
    conversa_id: msg.conversa_id,
    message_id: stanzaId || '',
    from_me: false,
    from_number: participant?.replace('@s.whatsapp.net', '').replace('@c.us', '').replace('@lid', '') || null,
    participant: participant || null,
    tipo,
    body,
    caption,
    has_media: tipo !== 'text',
    media_url: thumbnailBase64 ? `data:image/jpeg;base64,${thumbnailBase64}` : null,
    media_mimetype: mediaMimetype,
    media_filename: caption && tipo === 'document' ? caption : null,
    media_size: null,
    media_duration: null,
    location_latitude: null,
    location_longitude: null,
    location_name: null,
    location_address: null,
    vcard: null,
    poll_question: null,
    poll_options: null,
    poll_allow_multiple: null,
    reaction_emoji: null,
    reaction_message_id: null,
    reply_to_message_id: null,
    fixada: false,
    ack: 0,
    criado_em: msg.criado_em,
    atualizado_em: msg.criado_em,
    raw_data: {
      _data: {
        pushName: participantPushName || undefined,
        PushName: participantPushName || undefined,
      },
      _synthetic_status_reply: isStatusReply,
    },
  }

  return { syntheticMessage, isStatusReply }
}

export const ChatMessages = forwardRef<HTMLDivElement, ChatMessagesProps>(function ChatMessages({
  mensagens, isLoading, hasMore, onLoadMore, isFetchingMore,
  highlightIds, focusedId, conversaTipo, conversaId, fotoUrl, myAvatarUrl,
  onDeleteMessage, onReplyMessage, onReactMessage, onForwardMessage, onPinMessage, onStartConversation,
}, _ref) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevLengthRef = useRef(0)
  const isGroup = conversaTipo === 'grupo' || conversaTipo === 'canal'

  const prevConversaRef = useRef<string | undefined>(undefined)
  const { contactMap } = useMentionResolver(mensagens)

  // AIDEV-NOTE: Efeito unificado para scroll - resolve race condition entre troca de conversa e cache
  useEffect(() => {
    const conversaMudou = prevConversaRef.current !== conversaId
    prevConversaRef.current = conversaId

    if (conversaMudou) {
      prevLengthRef.current = 0
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'instant' })
      }, 50)
    } else if (mensagens.length > prevLengthRef.current) {
      if (prevLengthRef.current === 0) {
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: 'instant' })
        }, 50)
      } else {
        const container = containerRef.current
        if (container) {
          const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150
          if (isNearBottom) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
          }
        }
      }
    }

    prevLengthRef.current = mensagens.length
  }, [conversaId, mensagens.length])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !hasMore) return

    const handleScroll = () => {
      if (container.scrollTop < 100 && !isFetchingMore) {
        onLoadMore()
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [hasMore, isFetchingMore, onLoadMore])

  useEffect(() => {
    if (focusedId) {
      const el = document.getElementById(`msg-${focusedId}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [focusedId])

  const sortedMessages = useMemo(() => {
    // Deduplicate: if there are messages WITH body and messages WITHOUT body for the same conversation,
    // filter out the empty ones (WAHA duplicates). But if ALL are empty, keep them to show activity.
    const withBody = mensagens.filter(m => !(m.tipo === 'text' && !m.body))
    const filtered = withBody.length > 0 ? withBody : mensagens
    // AIDEV-NOTE: Ordenar por timestamp_externo (WhatsApp) como criterio primario para ordem correta
    return [...filtered].sort((a, b) => {
      const tsA = a.timestamp_externo ? a.timestamp_externo * 1000 : new Date(a.criado_em).getTime()
      const tsB = b.timestamp_externo ? b.timestamp_externo * 1000 : new Date(b.criado_em).getTime()
      if (tsA !== tsB) return tsA - tsB
      return new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime()
    })
  }, [mensagens])

  // AIDEV-NOTE: Extrair stanza ID (último segmento após '_') para fallback de matching
  function extractStanzaId(messageId: string): string | undefined {
    if (!messageId || !messageId.includes('_')) return undefined
    const parts = messageId.split('_')
    return parts[parts.length - 1]
  }

  // AIDEV-NOTE: Agregar reações por message_id da mensagem original (estilo WhatsApp badges)
  // Indexa tanto pelo message_id completo quanto pelo stanza ID para resolver
  // divergência @lid vs @c.us (ex: false_xxx@lid_STANZA vs false_xxx@c.us_STANZA)
  const reactionsMap = useMemo(() => {
    const map = new Map<string, ReactionBadge[]>()
    for (const msg of sortedMessages) {
      if (msg.tipo === 'reaction' && msg.reaction_message_id && msg.reaction_emoji) {
        const key = msg.reaction_message_id
        const existing = map.get(key) || []
        const found = existing.find(r => r.emoji === msg.reaction_emoji)
        if (found) {
          found.count++
          if (msg.from_me) found.fromMe = true
        } else {
          existing.push({ emoji: msg.reaction_emoji, count: 1, fromMe: msg.from_me })
        }
        map.set(key, existing)

        // AIDEV-NOTE: Indexar também pelo stanza ID como fallback
        const stanzaId = extractStanzaId(key)
        if (stanzaId && stanzaId !== key) {
          if (!map.has(stanzaId)) {
            map.set(stanzaId, existing)
          }
        }
      }
    }
    return map
  }, [sortedMessages])

  // Filtrar mensagens tipo reaction da timeline (serão exibidas como badges)
  const visibleMessages = useMemo(() => {
    return sortedMessages.filter(m => m.tipo !== 'reaction')
  }, [sortedMessages])

  const messageByWahaId = useMemo(() => {
    const map = new Map<string, Mensagem>()
    for (const msg of sortedMessages) {
      if (msg.message_id) {
        // Index by full serialized ID
        map.set(msg.message_id, msg)

        if (msg.message_id.includes('_')) {
          const parts = msg.message_id.split('_')
          // Last segment (works for individual messages where last = stanzaID)
          const lastPart = parts[parts.length - 1]
          if (lastPart) map.set(lastPart, msg)

          // AIDEV-NOTE: For GOWS group messages (4+ segments): stanzaID is at index 2
          // Format: {bool}_{groupId}_{stanzaID}_{senderLid}
          if (parts.length >= 4) {
            const stanzaPart = parts[2]
            if (stanzaPart && !stanzaPart.includes('@')) {
              map.set(stanzaPart, msg)
            }
          }
        }
      }
    }
    return map
  }, [sortedMessages])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
      </div>
    )
  }

  if (!sortedMessages.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-center px-6">
        <p className="text-sm text-muted-foreground">
          Nenhuma mensagem nesta conversa ainda
        </p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-1"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      {isFetchingMore && (
        <div className="flex justify-center py-2">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      )}

      {visibleMessages.map((msg, idx) => {
        const showDateSep =
          idx === 0 ||
          !isSameDay(new Date(msg.criado_em), new Date(visibleMessages[idx - 1].criado_em))

        let participantName: string | null = null
        let participantColor: string | null = null

        if (isGroup && !msg.from_me) {
          const participant = msg.participant || msg.from_number || ''
          participantName = getParticipantDisplayName(msg)
          participantColor = getParticipantColor(participant)
        }

        // AIDEV-NOTE: Buscar reações pelo message_id completo, fallback pelo stanza ID
        const msgReactions = msg.message_id
          ? (reactionsMap.get(msg.message_id) || reactionsMap.get(extractStanzaId(msg.message_id) || ''))
          : undefined

        // AIDEV-NOTE: Resolver mensagem citada: primeiro tenta no mapa local,
        // fallback para raw_data.contextInfo.quotedMessage (cobre Status/Stories e msgs antigas)
        let resolvedQuoted: Mensagem | null = null
        let isStatusReply = false

        if (msg.reply_to_message_id) {
          resolvedQuoted = messageByWahaId.get(msg.reply_to_message_id) || null

          if (!resolvedQuoted) {
            const fallback = extractQuotedFromRawData(msg)
            if (fallback) {
              resolvedQuoted = fallback.syntheticMessage
              isStatusReply = fallback.isStatusReply
            }
          }
        }

        return (
          <div
            key={msg.id}
            id={`msg-${msg.id}`}
            className={
              focusedId === msg.id
                ? 'bg-warning-muted/40 rounded-md transition-colors duration-300'
                : highlightIds?.has(msg.id)
                  ? 'bg-warning-muted/20 rounded-md'
                  : ''
            }
          >
            {showDateSep && (
              <div className="flex items-center justify-center my-3">
                <span className="px-3 py-1 text-[11px] font-medium text-muted-foreground bg-muted/80 rounded-full shadow-sm">
                  {formatDateSeparator(msg.criado_em)}
                </span>
              </div>
            )}
            <ChatMessageBubble
              mensagem={msg}
              participantName={participantName}
              participantColor={participantColor}
              conversaId={conversaId}
              fotoUrl={fotoUrl}
              myAvatarUrl={myAvatarUrl}
              contactMap={contactMap}
              reactions={msgReactions}
              onDeleteMessage={onDeleteMessage}
              onReplyMessage={onReplyMessage}
              onReactMessage={onReactMessage}
              onForwardMessage={onForwardMessage}
              onPinMessage={onPinMessage}
              onStartConversation={onStartConversation}
              quotedMessage={resolvedQuoted}
              isStatusReply={isStatusReply}
            />
          </div>
        )
      })}

      <div ref={bottomRef} />
    </div>
  )
})
ChatMessages.displayName = 'ChatMessages'
