/**
 * AIDEV-NOTE: Estado vazio quando nenhuma conversa está selecionada
 */

import { MessageSquare } from 'lucide-react'

export function ConversaEmpty() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-muted/20">
      <div className="w-20 h-20 rounded-full bg-muted/60 flex items-center justify-center">
        <MessageSquare className="w-10 h-10 text-muted-foreground/50" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground/80">
          Suas conversas
        </h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
          Selecione uma conversa ao lado para visualizar as mensagens ou inicie uma nova conversa
        </p>
      </div>
    </div>
  )
}
