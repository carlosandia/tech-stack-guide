/**
 * AIDEV-NOTE: Componente minimalista para exibir uma etiqueta do WhatsApp
 * Pill com borda colorida e fundo sutil usando cor_hex com opacidade
 * Suporta modo compacto com truncate + tooltip e popover ao clicar
 */

import { forwardRef, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface LabelBadgeProps {
  nome: string
  corHex: string | null
  size?: 'sm' | 'md'
  compact?: boolean
  maxWidth?: string
  onClick?: () => void
}

export const LabelBadge = forwardRef<HTMLSpanElement, LabelBadgeProps>(function LabelBadge({ nome, corHex, size = 'sm', compact = false, maxWidth = '80px', onClick }, _ref) {
  const color = corHex || '#6b7280'
  const [popoverOpen, setPopoverOpen] = useState(false)

  const badgeContent = (
    <span
      onClick={(e) => {
        if (compact) {
          e.stopPropagation()
          setPopoverOpen(!popoverOpen)
        } else {
          onClick?.()
        }
      }}
      className={`
        inline-flex items-center rounded-full font-medium
        ${size === 'sm' ? 'px-1.5 py-0.5 text-[10px] gap-0.5' : 'px-2 py-0.5 text-[11px] gap-1'}
        ${(onClick || compact) ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
      `}
      style={{
        backgroundColor: `${color}18`,
        color: color,
        border: `1px solid ${color}40`,
        maxWidth: compact ? maxWidth : undefined,
      }}
      title={compact ? nome : undefined}
    >
      <span
        className={`rounded-full flex-shrink-0 ${size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'}`}
        style={{ backgroundColor: color }}
      />
      <span className={compact ? 'truncate' : 'whitespace-nowrap'}>{nome}</span>
    </span>
  )

  if (!compact) return badgeContent

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        {badgeContent}
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-auto max-w-[250px] p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className="inline-flex items-center gap-1 text-xs font-medium"
          style={{ color }}
        >
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          {nome}
        </span>
      </PopoverContent>
    </Popover>
  )
})
LabelBadge.displayName = 'LabelBadge'
