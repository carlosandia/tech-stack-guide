/**
 * AIDEV-NOTE: Modal de confirmação de exclusão de contato
 * Suporta modo normal (confirmar exclusão) e modo bloqueado (vínculos impedem exclusão)
 * Conforme PRD-06 RF-014 e Design System 10.5 - Modal/Dialog
 * - z-index: overlay 400, content 401
 * - Overlay: bg-black/80 backdrop-blur-sm
 * - Responsividade: w-[calc(100%-32px)] mobile, max-w-md desktop
 * - ARIA, ESC to close, focus trap
 */

import { useEffect, useRef, useId, forwardRef } from 'react'
import { X, AlertTriangle, Link2 } from 'lucide-react'

interface Vinculo {
  tipo: string
  nome: string
  id: string
}

interface ConfirmarExclusaoModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
  titulo?: string
  mensagem?: string
  erro?: string | null
  bloqueado?: boolean
  vinculos?: Vinculo[]
}

export const ConfirmarExclusaoModal = forwardRef<HTMLDivElement, ConfirmarExclusaoModalProps>(function ConfirmarExclusaoModal({
  open,
  onClose,
  onConfirm,
  loading,
  titulo = 'Excluir Contato',
  mensagem = 'Tem certeza que deseja excluir este contato? Esta ação não pode ser desfeita.',
  erro,
  bloqueado = false,
  vinculos = [],
}, _ref) {
  const modalRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  // ESC to close + focus trap
  useEffect(() => {
    if (!open) return

    const prev = document.activeElement as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
      prev?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      {/* Overlay - z-400 */}
      <div
        className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog container - z-401 */}
      <div className="fixed inset-0 z-[401] flex items-center justify-center pointer-events-none">
        <div
          ref={modalRef}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="
            pointer-events-auto
            bg-card border border-border rounded-lg shadow-lg
            flex flex-col
            w-[calc(100%-32px)] sm:max-w-md
            max-h-[calc(100dvh-32px)] sm:max-h-[85vh]
          "
        >
          {/* Header */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                bloqueado ? 'bg-accent' : 'bg-destructive/10'
              }`}>
                {bloqueado
                  ? <Link2 className="w-5 h-5 text-muted-foreground" />
                  : <AlertTriangle className="w-5 h-5 text-destructive" />}
              </div>
              <div>
                <h2 id={titleId} className="text-lg font-semibold text-foreground">
                  {bloqueado ? 'Exclusão bloqueada' : titulo}
                </h2>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-accent rounded-md transition-all duration-200" aria-label="Fechar">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 min-h-0 overscroll-contain space-y-4">
            <p className="text-sm text-muted-foreground">
              {bloqueado
                ? 'Este contato possui vínculos ativos que impedem a exclusão.'
                : mensagem}
            </p>

            {bloqueado && vinculos.length > 0 && (
              <div className="p-3 rounded-md bg-muted border border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Vínculos encontrados ({vinculos.length})
                </p>
                <div className="space-y-1 max-h-[150px] overflow-y-auto">
                  {vinculos.map((v) => (
                    <div key={v.id} className="flex items-center gap-2 py-1">
                      <span className="text-xs text-muted-foreground font-medium capitalize">{v.tipo}</span>
                      <span className="text-sm text-foreground">{v.nome}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Remova os vínculos antes de excluir este contato.
                </p>
              </div>
            )}

            {erro && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{erro}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-t border-border bg-card">
            <div className="flex justify-end gap-2 sm:gap-3">
              {bloqueado ? (
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200"
                >
                  Entendi
                </button>
              ) : (
                <>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium rounded-md border border-border text-foreground hover:bg-accent transition-all duration-200"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Excluindo...' : 'Excluir'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
})
ConfirmarExclusaoModal.displayName = 'ConfirmarExclusaoModal'
