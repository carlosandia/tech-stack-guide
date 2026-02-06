/**
 * AIDEV-NOTE: Componente base reutilizável para modais
 * Conforme Design System 10.5 - Modal/Dialog
 * 
 * Features:
 * - Z-index correto (overlay z-[400], content z-[401])
 * - Overlay padronizado bg-black/80 backdrop-blur-sm
 * - Estrutura flex-col com header/content/footer fixos
 * - Header com badge icon por variant (create/edit)
 * - Responsividade mobile completa
 * - Animações de entrada (scale-in + fade-in)
 * - Focus trap
 * - ARIA attributes (role, aria-modal, aria-labelledby)
 * - Fechar com Escape
 */

import { useEffect, useRef, useId, type ReactNode } from 'react'
import { X, Plus, Pencil } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const sizeClasses: Record<string, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
}

interface ModalBaseProps {
  onClose: () => void
  title: string
  description?: string
  icon?: LucideIcon
  variant?: 'create' | 'edit'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: ReactNode
  footer: ReactNode
}

export function ModalBase({
  onClose,
  title,
  description,
  icon: CustomIcon,
  variant = 'create',
  size = 'md',
  children,
  footer,
}: ModalBaseProps) {
  const titleId = useId()
  const descId = useId()
  const modalRef = useRef<HTMLDivElement>(null)

  // ESC to close + focus trap
  useEffect(() => {
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

    // Auto-focus first input
    requestAnimationFrame(() => {
      const firstInput = modalRef.current?.querySelector<HTMLElement>(
        'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])'
      )
      firstInput?.focus()
    })

    // Prevent body scroll
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
      prev?.focus()
    }
  }, [onClose])

  const DefaultIcon = variant === 'create' ? Plus : Pencil
  const Icon = CustomIcon || DefaultIcon
  const badgeBg = variant === 'create' ? 'bg-primary/10' : 'bg-accent'
  const badgeColor = variant === 'create' ? 'text-primary' : 'text-muted-foreground'

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog container */}
      <div className="fixed inset-0 z-[401] flex items-center justify-center pointer-events-none">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
          className={`
            pointer-events-auto
            bg-card border border-border rounded-lg shadow-lg
            flex flex-col
            w-[calc(100%-32px)] ${sizeClasses[size]}
            max-h-[calc(100dvh-32px)] sm:max-h-[85vh]
            animate-enter
          `}
        >
          {/* Header - sticky, nunca scrolla */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${badgeBg}`}>
                <Icon className={`w-5 h-5 ${badgeColor}`} />
              </div>
              <div>
                <h2 id={titleId} className="text-lg font-semibold text-foreground">
                  {title}
                </h2>
                {description && (
                  <p id={descId} className="text-xs text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-lg transition-all duration-200"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content - única área que scrolla */}
          <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain">
            {children}
          </div>

          {/* Footer - sticky, nunca scrolla */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-t border-border bg-card">
            {footer}
          </div>
        </div>
      </div>
    </>
  )
}
