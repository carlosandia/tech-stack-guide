/**
 * AIDEV-NOTE: Modal de confirmação de exclusão de contato
 * Conforme Design System - Modal rounded-lg shadow-lg p-6
 */

import { X, AlertTriangle } from 'lucide-react'

interface ConfirmarExclusaoModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
  titulo?: string
  mensagem?: string
  erro?: string | null
}

export function ConfirmarExclusaoModal({
  open,
  onClose,
  onConfirm,
  loading,
  titulo = 'Excluir Contato',
  mensagem = 'Tem certeza que deseja excluir este contato? Esta ação não pode ser desfeita.',
  erro,
}: ConfirmarExclusaoModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md p-6 z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{titulo}</h3>
            <p className="text-sm text-muted-foreground mt-1">{mensagem}</p>
          </div>
        </div>

        {erro && (
          <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{erro}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-md border border-border text-foreground hover:bg-accent transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  )
}
