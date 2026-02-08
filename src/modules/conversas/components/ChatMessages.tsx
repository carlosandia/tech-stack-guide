/**
 * AIDEV-NOTE: Área de mensagens com scroll infinito e separadores de data
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
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr)
  if (isToday(date)) return 'Hoje'
  if (isYesterday(date)) return 'Ontem'
  return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
}

export function ChatMessages({ mensagens, isLoading, hasMore, onLoadMore, isFetchingMore }: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevLengthRef = useRef(0)

  // Auto-scroll para baixo quando novas mensagens chegam
  useEffect(() => {
    if (mensagens.length > prevLengthRef.current) {
      // Só auto-scroll se estava perto do bottom ou é carregamento inicial
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

  // Mensagens em ordem cronológica (API retorna desc, invertemos)
  const sortedMessages = useMemo(() => {
    return [...mensagens].sort(
      (a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime()
    )
  }, [mensagens])

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

        return (
          <div key={msg.id}>
            {showDateSep && (
              <div className="flex items-center justify-center my-3">
                <span className="px-3 py-1 text-[11px] font-medium text-muted-foreground bg-muted/80 rounded-full shadow-sm">
                  {formatDateSeparator(msg.criado_em)}
                </span>
              </div>
            )}
            <ChatMessageBubble mensagem={msg} />
          </div>
        )
      })}

      <div ref={bottomRef} />
    </div>
  )
}
