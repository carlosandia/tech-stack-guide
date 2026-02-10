/**
 * AIDEV-NOTE: Painel lateral compacto para edição inline de estilos
 * Aparece ao lado do preview quando um elemento é selecionado
 */

import type { ReactNode } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

export function EstiloPopover({ open, onClose, titulo, children, onSave, isSaving, onSaveConfig, isSavingConfig }: Props) {
  if (!open) return null

  const anySaving = isSaving || isSavingConfig

  const handleSaveAll = async () => {
    if (onSaveConfig) await onSaveConfig()
    if (onSave) onSave()
  }

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
      <div className="flex-1 overflow-y-auto px-4 pb-2">
        {children}
      </div>
      {(onSave || onSaveConfig) && (
        <div className="shrink-0 p-3 border-t border-border bg-card">
          <Button size="sm" className="w-full" onClick={handleSaveAll} disabled={anySaving}>
            {anySaving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
            Salvar
          </Button>
        </div>
      )}
    </div>
  )
}
