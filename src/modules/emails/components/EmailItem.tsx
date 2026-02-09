/**
 * AIDEV-NOTE: Item de email estilo Gmail - layout single-line
 * Formato: checkbox | star | remetente | assunto - preview | data
 */

import { format, isToday, isYesterday, isThisYear } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Star, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EmailRecebido } from '../types/email.types'

interface EmailItemProps {
  email: EmailRecebido
  isSelected: boolean
  isChecked: boolean
  onSelect: (id: string) => void
  onToggleCheck: (id: string) => void
  onToggleFavorito: (id: string, favorito: boolean) => void
}

function formatarDataEmail(dataStr: string): string {
  const data = new Date(dataStr)
  if (isToday(data)) return format(data, 'HH:mm')
  if (isYesterday(data)) return 'Ontem'
  if (isThisYear(data)) return format(data, "d 'de' MMM", { locale: ptBR })
  return format(data, 'd/MM/yy')
}

export function EmailItem({
  email,
  isSelected,
  isChecked,
  onSelect,
  onToggleCheck,
  onToggleFavorito,
}: EmailItemProps) {
  const nomeRemetente = email.de_nome || email.de_email.split('@')[0]
  const isUnread = !email.lido

  return (
    <div
      onClick={() => onSelect(email.id)}
      className={cn(
        'flex items-center h-10 px-2 cursor-pointer border-b border-border/30 transition-colors duration-100 group',
        isSelected && 'bg-primary/8',
        !isSelected && 'hover:bg-accent/40 hover:shadow-[inset_0_-1px_0_0_hsl(var(--border)/0.5)]',
        isUnread && !isSelected && 'bg-background',
        !isUnread && !isSelected && 'bg-muted/20',
      )}
    >
      {/* Checkbox */}
      <div className="flex-shrink-0 w-8 flex items-center justify-center">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => {
            e.stopPropagation()
            onToggleCheck(email.id)
          }}
          className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
        />
      </div>

      {/* Star */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorito(email.id, !email.favorito)
        }}
        className="flex-shrink-0 w-7 flex items-center justify-center"
      >
        <Star
          className={cn(
            'w-4 h-4 transition-colors',
            email.favorito
              ? 'fill-amber-400 text-amber-400'
              : 'text-transparent group-hover:text-muted-foreground/30 hover:!text-amber-400'
          )}
        />
      </button>

      {/* Sender name - compact width */}
      <div className="flex-shrink-0 w-[100px] lg:w-[120px] pr-2">
        <span
          className={cn(
            'text-xs sm:text-sm truncate block',
            isUnread ? 'font-semibold text-foreground' : 'text-foreground/70'
          )}
        >
          {nomeRemetente}
        </span>
      </div>

      {/* Subject + Preview - takes remaining space */}
      <div className="flex-1 min-w-0 pr-2 overflow-hidden">
        <div className="flex items-center gap-1 min-w-0">
          <span
            className={cn(
              'text-xs sm:text-sm truncate flex-shrink min-w-0',
              isUnread ? 'font-semibold text-foreground' : 'text-foreground/70'
            )}
          >
            {email.assunto || '(sem assunto)'}
          </span>
          {email.preview && email.preview !== email.assunto && (
            <span className="text-xs text-muted-foreground/50 truncate flex-shrink-[2] min-w-0 hidden sm:inline">
              — {email.preview}
            </span>
          )}
        </div>
      </div>

      {/* Attachment + Date */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {email.tem_anexos && (
          <Paperclip className="w-3.5 h-3.5 text-muted-foreground/50" />
        )}
        <span
          className={cn(
            'text-xs whitespace-nowrap min-w-[60px] text-right',
            isUnread ? 'font-semibold text-foreground/70' : 'text-muted-foreground'
          )}
        >
          {formatarDataEmail(email.data_email)}
        </span>
      </div>
    </div>
  )
}
