/**
 * AIDEV-NOTE: Componente de item individual na lista de emails
 * Mostra remetente, assunto, preview, data e indicadores (lido, favorito, anexo)
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
  return format(data, "d/MM/yy")
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

  return (
    <div
      onClick={() => onSelect(email.id)}
      className={cn(
        'flex items-start gap-3 px-3 py-2.5 cursor-pointer border-b border-border/50 transition-colors duration-150',
        isSelected && 'bg-primary/5 border-l-2 border-l-primary',
        !isSelected && 'hover:bg-accent/50',
        !email.lido && 'bg-primary/[0.02]'
      )}
    >
      {/* Checkbox */}
      <div className="flex-shrink-0 pt-0.5">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => {
            e.stopPropagation()
            onToggleCheck(email.id)
          }}
          className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
        />
      </div>

      {/* Star */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorito(email.id, !email.favorito)
        }}
        className="flex-shrink-0 pt-0.5"
      >
        <Star
          className={cn(
            'w-4 h-4 transition-colors',
            email.favorito
              ? 'fill-amber-400 text-amber-400'
              : 'text-muted-foreground/40 hover:text-amber-400'
          )}
        />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'text-sm truncate',
              !email.lido ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'
            )}
          >
            {nomeRemetente}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {email.tem_anexos && (
              <Paperclip className="w-3.5 h-3.5 text-muted-foreground/60" />
            )}
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatarDataEmail(email.data_email)}
            </span>
          </div>
        </div>

        <p
          className={cn(
            'text-sm truncate mt-0.5',
            !email.lido ? 'font-medium text-foreground' : 'text-muted-foreground'
          )}
        >
          {email.assunto || '(sem assunto)'}
        </p>

        {email.preview && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {email.preview}
          </p>
        )}
      </div>

      {/* Indicador não lido */}
      {!email.lido && (
        <div className="flex-shrink-0 pt-1.5">
          <div className="w-2 h-2 rounded-full bg-primary" />
        </div>
      )}
    </div>
  )
}
