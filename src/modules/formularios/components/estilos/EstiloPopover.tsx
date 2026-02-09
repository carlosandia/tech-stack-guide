/**
 * AIDEV-NOTE: Painel lateral compacto para edição inline de estilos
 * Aparece ao lado do preview quando um elemento é selecionado
 */

import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  titulo: string
  children: ReactNode
}

export function EstiloPopover({ open, onClose, titulo, children }: Props) {
  if (!open) return null

  return (
    <div className="w-72 shrink-0 border-l border-border bg-card overflow-y-auto p-4 animate-in slide-in-from-right-4 duration-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-foreground">{titulo}</h4>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-muted text-muted-foreground"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {children}
    </div>
  )
}
