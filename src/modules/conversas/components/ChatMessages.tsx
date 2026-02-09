/**
 * AIDEV-NOTE: Área de mensagens com scroll infinito, separadores de data
 * e suporte a exibição de nomes de participantes em grupos
 */

import { useRef, useEffect, useMemo } from 'react'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2 } from 'lucide-react'
import { ChatMessageBubble } from './ChatMessageBubble'
import type { Mensagem } from '../services/conversas.api'

interface ChatMessagesProps {
  mensagens: Mensagem[]
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => void
  isFetchingMore: boolean
  highlightIds?: Set<string>
  focusedId?: string | null
  /** Tipo da conversa: 'individual' | 'grupo' | 'canal' */
  conversaTipo?: string
  /** ID da conversa (para consultar votos de enquete) */
  conversaId?: string
  /** Callback para apagar mensagem */
  onDeleteMessage?: (mensagemId: string, messageWahaId: string, paraTodos: boolean) => void
  /** Callback para responder mensagem */
  onReplyMessage?: (mensagem: Mensagem) => void
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr)
  if (isToday(date)) return 'Hoje'
  if (isYesterday(date)) return 'Ontem'
  return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
}

// Cores distintas para participantes de grupo
const participantColors = [
  '#e17055', '#00b894', '#0984e3', '#6c5ce7',
  '#fdcb6e', '#e84393', '#00cec9', '#d63031',
  '#55efc4', '#a29bfe', '#fd79a8', '#ffeaa7',
]

function getParticipantColor(participant: string): string {
  const hash = participant.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return participantColors[hash % participantColors.length]
}

/**
 * Extrai o nome de exibição do participant de uma mensagem de grupo.
 * Usa pushName do raw_data ou o número de telefone.
 */
function getParticipantDisplayName(msg: Mensagem): string {
  // Try raw_data for pushName (sent by webhook)
  const rawData = msg.raw_data as Record<string, unknown> | null
  if (rawData) {
    const pushName = (rawData._data as Record<string, unknown>)?.pushName as string
      || rawData.notifyName as string
      || (rawData._data as Record<string, unknown>)?.notifyName as string
    if (pushName) return pushName
  }

  // Fallback: use from_number or participant field
  const participant = msg.participant || msg.from_number
  if (participant) {
    // Format phone number: 5511999999999 -> +55 11 99999-9999
    const cleaned = participant.replace('@c.us', '').replace('@s.whatsapp.net', '')
    return `+${cleaned}`
  }

  return 'Desconhecido'
}

export function ChatMessages({ mensagens, isLoading, hasMore, onLoadMore, isFetchingMore, highlightIds, focusedId, conversaTipo, conversaId, onDeleteMessage, onReplyMessage }: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevLengthRef = useRef(0)
  const isGroup = conversaTipo === 'grupo' || conversaTipo === 'canal'

  // Auto-scroll para baixo quando novas mensagens chegam
  useEffect(() => {
    if (mensagens.length > prevLengthRef.current) {
      if (prevLengthRef.current === 0) {
        bottomRef.current?.scrollIntoView({ behavior: 'instant' })
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
  }, [mensagens.length])

  // Scroll up detection para carregar mais
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

  // Scroll to focused search result
  useEffect(() => {
    if (focusedId) {
      const el = document.getElementById(`msg-${focusedId}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [focusedId])

  // Mensagens em ordem cronológica (API retorna desc, invertemos)
  const sortedMessages = useMemo(() => {
    return [...mensagens].sort(
      (a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime()
    )
  }, [mensagens])

  // Build a map of message_id -> Mensagem for quoted messages
  const messageByWahaId = useMemo(() => {
    const map = new Map<string, Mensagem>()
    for (const msg of sortedMessages) {
      if (msg.message_id) map.set(msg.message_id, msg)
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
      className="flex-1 overflow-y-auto px-4 py-3 space-y-1"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      {/* Loading more indicator */}
      {isFetchingMore && (
        <div className="flex justify-center py-2">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      )}

      {sortedMessages.map((msg, idx) => {
        // Separador de data
        const showDateSep =
          idx === 0 ||
          !isSameDay(new Date(msg.criado_em), new Date(sortedMessages[idx - 1].criado_em))

        // Group: determine participant name and color
        let participantName: string | null = null
        let participantColor: string | null = null

        if (isGroup && !msg.from_me) {
          const participant = msg.participant || msg.from_number || ''
          participantName = getParticipantDisplayName(msg)
          participantColor = getParticipantColor(participant)
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
              onDeleteMessage={onDeleteMessage}
              onReplyMessage={onReplyMessage}
              quotedMessage={msg.reply_to_message_id ? messageByWahaId.get(msg.reply_to_message_id) || null : null}
            />
          </div>
        )
      })}

      <div ref={bottomRef} />
    </div>
  )
}