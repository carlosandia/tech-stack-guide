/**
 * AIDEV-NOTE: Barra de filtros rápidos combináveis (RF-009)
 * Chips: Não lidos, Com anexos, Favoritos
 */

import { cn } from '@/lib/utils'
import { MailOpen, Paperclip, Star } from 'lucide-react'

export interface EmailFiltros {
  lido?: boolean
  tem_anexos?: boolean
  favorito?: boolean
}

interface EmailFiltersProps {
  filtros: EmailFiltros
  onChange: (filtros: EmailFiltros) => void
}

const chips = [
  { key: 'lido' as const, label: 'Não lidos', icon: MailOpen, activeValue: false as const },
  { key: 'tem_anexos' as const, label: 'Com anexos', icon: Paperclip, activeValue: true as const },
  { key: 'favorito' as const, label: 'Favoritos', icon: Star, activeValue: true as const },
]

export function EmailFilters({ filtros, onChange }: EmailFiltersProps) {
  const toggle = (key: keyof EmailFiltros, value: boolean) => {
    const isActive = filtros[key] === value
    const next = { ...filtros }
    if (isActive) {
      delete next[key]
    } else {
      ;(next as Record<string, boolean>)[key] = value
    }
    onChange(next)
  }

  const hasAnyFilter = Object.keys(filtros).length > 0

  return (
    <div className="flex items-center gap-1 px-2 py-1 border-b border-border/60 overflow-x-auto">
      {chips.map((chip) => {
        const isActive = filtros[chip.key] === chip.activeValue
        return (
          <button
            key={chip.key}
            onClick={() => toggle(chip.key, chip.activeValue)}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors',
              isActive
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'text-muted-foreground hover:bg-accent border border-transparent'
            )}
          >
            <chip.icon className="w-3 h-3" />
            {chip.label}
          </button>
        )
      })}
      {hasAnyFilter && (
        <button
          onClick={() => onChange({})}
          className="text-[11px] text-muted-foreground hover:text-foreground px-1"
        >
          Limpar
        </button>
      )}
    </div>
  )
}
