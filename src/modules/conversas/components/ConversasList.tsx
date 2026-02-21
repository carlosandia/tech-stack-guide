/**
 * AIDEV-NOTE: Lista de conversas com scroll infinito (painel esquerdo)
 * Detecta scroll até o final para carregar próxima página
 * Passa callbacks de ações de contexto para ConversaItem
 */

import { useRef, useCallback } from 'react'
import { ConversaItem } from './ConversaItem'
import type { Conversa } from '../services/conversas.api'
import { MessageSquare, Loader2 } from 'lucide-react'

interface ConversasListProps {
  conversas: Conversa[]
  conversaAtivaId: string | null
  onSelectConversa: (id: string) => void
  isLoading: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
  onArquivar?: (id: string) => void
  onFixar?: (id: string, fixar: boolean) => void
  onMarcarNaoLida?: (id: string) => void
  onApagar?: (id: string) => void
}

// AIDEV-NOTE: Removido forwardRef - componente usa listRef interno para scroll infinito
export function ConversasList({
  conversas,
  conversaAtivaId,
  onSelectConversa,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onArquivar,
  onFixar,
  onMarcarNaoLida,
  onApagar,
}: ConversasListProps) {
  const listRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    const el = listRef.current
    if (!el || !hasNextPage || isFetchingNextPage) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      onLoadMore?.()
    }
  }, [hasNextPage, isFetchingNextPage, onLoadMore])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    )
  }

  if (!conversas.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
          <MessageSquare className="w-7 h-7 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Nenhuma conversa</p>
          <p className="text-xs text-muted-foreground mt-1">
            Inicie uma nova conversa para começar
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={listRef}
      className="flex-1 overflow-y-auto"
      onScroll={handleScroll}
    >
      {conversas.map((conversa) => (
        <ConversaItem
          key={conversa.id}
          conversa={conversa}
          isActive={conversa.id === conversaAtivaId}
          onClick={() => onSelectConversa(conversa.id)}
          onArquivar={onArquivar}
          onFixar={onFixar}
          onMarcarNaoLida={onMarcarNaoLida}
          onApagar={onApagar}
        />
      ))}

      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-3">
          <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
        </div>
      )}
    </div>
  )
}
