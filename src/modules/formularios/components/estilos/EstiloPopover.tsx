/**
 * AIDEV-NOTE: Painel lateral compacto para edição inline de estilos
 * Aparece ao lado do preview quando um elemento é selecionado
 * Auto-save: salva automaticamente com debounce quando o conteúdo muda
 */

import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  titulo: string
  children: ReactNode
  onSave?: () => void
  isSaving?: boolean
  onSaveConfig?: () => Promise<void> | void
  isSavingConfig?: boolean
}

export function EstiloPopover({ open, onClose, titulo, children }: Props) {
  if (!open) return null

  // AIDEV-NOTE: Auto-save com debounce removido do popover - delegado para o parent via onSave/onSaveConfig diretos

  return (
    <div className="w-72 shrink-0 border-l border-border bg-card flex flex-col animate-in slide-in-from-right-4 duration-200">
      <div className="flex items-center justify-between p-4 pb-2">
        <h4 className="text-sm font-semibold text-foreground">{titulo}</h4>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-muted text-muted-foreground"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {children}
      </div>
    </div>
  )
}
