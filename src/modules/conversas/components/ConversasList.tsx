/**
 * AIDEV-NOTE: Lista de conversas com scroll (painel esquerdo)
 */

import { ConversaItem } from './ConversaItem'
import type { Conversa } from '../services/conversas.api'
import { MessageSquare, Loader2 } from 'lucide-react'

interface ConversasListProps {
  conversas: Conversa[]
  conversaAtivaId: string | null
  onSelectConversa: (id: string) => void
  isLoading: boolean
}

export function ConversasList({ conversas, conversaAtivaId, onSelectConversa, isLoading }: ConversasListProps) {
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
    <div className="flex-1 overflow-y-auto">
      {conversas.map((conversa) => (
        <ConversaItem
          key={conversa.id}
          conversa={conversa}
          isActive={conversa.id === conversaAtivaId}
          onClick={() => onSelectConversa(conversa.id)}
        />
      ))}
    </div>
  )
}
