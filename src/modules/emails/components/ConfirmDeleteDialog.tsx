/**
 * AIDEV-NOTE: Dialog de confirmação para exclusão de emails (RF-010)
 */

import { Trash2, Loader2 } from 'lucide-react'

interface ConfirmDeleteDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading?: boolean
  count?: number
}

export function ConfirmDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  count = 1,
}: ConfirmDeleteDialogProps) {
  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-[500] bg-foreground/20" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[501] w-[400px] max-w-[calc(100vw-2rem)] bg-background border border-border rounded-lg shadow-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Mover para lixeira</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {count > 1
                ? `${count} emails serão movidos para a lixeira.`
                : 'Este email será movido para a lixeira.'}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="h-8 px-3 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 h-8 px-4 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 transition-colors"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Excluir
          </button>
        </div>
      </div>
    </>
  )
}
