/**
 * AIDEV-NOTE: Sidebar vertical estilo Gmail com pastas de email
 * Botão "Escrever" proeminente + lista de pastas com contadores
 * Ícones w-4 h-4 conforme Design System §9.2
 */

import { Inbox, Send, FileEdit, Archive, Trash2, Star, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PastaEmail } from '../types/email.types'

// Extended type to include virtual folders
type PastaEmailExtended = PastaEmail | 'starred'

interface EmailSidebarProps {
  pasta: PastaEmailExtended
  setPasta: (pasta: PastaEmailExtended) => void
  naoLidosInbox: number
  onCompose: () => void
}

const pastas: { id: PastaEmailExtended; label: string; icon: typeof Inbox }[] = [
  { id: 'inbox', label: 'Caixa de entrada', icon: Inbox },
  { id: 'starred', label: 'Com estrela', icon: Star },
  { id: 'sent', label: 'Enviados', icon: Send },
  { id: 'drafts', label: 'Rascunhos', icon: FileEdit },
  { id: 'archived', label: 'Arquivados', icon: Archive },
  { id: 'trash', label: 'Lixeira', icon: Trash2 },
]

export function EmailSidebar({ pasta, setPasta, naoLidosInbox, onCompose }: EmailSidebarProps) {
  return (
    <div className="flex flex-col h-full w-[200px] xl:w-[220px] flex-shrink-0 border-r border-border/40 bg-background">
      {/* Compose Button */}
      <div className="px-3 pt-3 pb-2">
        <button
          onClick={onCompose}
          className="
            flex items-center gap-2.5 w-full h-11 px-4 rounded-2xl
            bg-primary/10 hover:bg-primary/15
            text-primary font-medium text-sm
            shadow-sm hover:shadow-md
            transition-all duration-200
            border border-primary/10
          "
        >
          <Pencil className="w-4 h-4" />
          <span>Escrever</span>
        </button>
      </div>

      {/* Folders */}
      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {pastas.map((p) => {
          const isActive = p.id === 'starred' ? pasta === 'starred' : pasta === p.id
          const count = p.id === 'inbox' ? naoLidosInbox : undefined

          return (
            <button
              key={p.id}
              onClick={() => setPasta(p.id)}
              className={cn(
                'flex items-center gap-2.5 w-full px-3 py-1.5 rounded-r-full text-sm transition-colors mb-0.5',
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-foreground/70 hover:bg-accent/60'
              )}
            >
              <p.icon className={cn('w-4 h-4 flex-shrink-0', isActive && 'text-primary')} />
              <span className="flex-1 text-left truncate text-sm">{p.label}</span>
              {count !== undefined && count > 0 && (
                <span className={cn(
                  'text-xs font-bold flex-shrink-0',
                  isActive ? 'text-primary' : 'text-foreground/60'
                )}>
                  {count > 999 ? '999+' : count}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
