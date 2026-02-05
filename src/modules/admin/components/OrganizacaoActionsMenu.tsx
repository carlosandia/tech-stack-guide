import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Eye, Settings, User, MoreVertical } from 'lucide-react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVisualizar: () => void
  onGerenciarModulos: () => void
  onImpersonar: () => void
}

type MenuPos = { top: number; left: number }

/**
 * AIDEV-NOTE: Menu de ações com portal
 * Motivo: containers com overflow/scroll (ex: overflow-x-auto) cortam dropdowns.
 * Solução: renderizar em portal (document.body) com position: fixed.
 *
 * Design System:
 * - z-popover: 600
 */
export function OrganizacaoActionsMenu({
  open,
  onOpenChange,
  onVisualizar,
  onGerenciarModulos,
  onImpersonar,
}: Props) {
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [pos, setPos] = useState<MenuPos>({ top: 0, left: 0 })

  const menuWidth = 192 // w-48

  const computePos = () => {
    const el = triggerRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()

    // Default: abre abaixo do botão
    const next: MenuPos = {
      top: rect.bottom + 6,
      left: rect.right - menuWidth,
    }

    // Clamp básico na viewport
    next.left = Math.max(8, Math.min(next.left, window.innerWidth - menuWidth - 8))
    next.top = Math.max(8, Math.min(next.top, window.innerHeight - 8))

    setPos(next)
  }

  // Recalcular posição ao abrir
  useEffect(() => {
    if (!open) return
    computePos()

    const handleScrollOrResize = () => computePos()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }

    window.addEventListener('resize', handleScrollOrResize)
    // capture=true ajuda quando o scroll acontece em containers internos
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('resize', handleScrollOrResize)
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('keydown', handleKeyDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Ajuste fino (evitar estourar embaixo / à direita) depois que o menu monta
  useEffect(() => {
    if (!open) return
    const trigger = triggerRef.current
    const menu = menuRef.current
    if (!trigger || !menu) return

    const rect = trigger.getBoundingClientRect()
    const menuRect = menu.getBoundingClientRect()

    let top = pos.top
    let left = pos.left

    // Se estourar embaixo, abre acima
    if (menuRect.bottom > window.innerHeight - 8) {
      top = rect.top - menuRect.height - 6
    }

    // Clamp final
    top = Math.max(8, Math.min(top, window.innerHeight - menuRect.height - 8))
    left = Math.max(8, Math.min(left, window.innerWidth - menuRect.width - 8))

    if (top !== pos.top || left !== pos.left) setPos({ top, left })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pos.top, pos.left])

  const actions = useMemo(
    () => [
      {
        key: 'visualizar',
        label: 'Visualizar',
        Icon: Eye,
        onClick: onVisualizar,
      },
      {
        key: 'modulos',
        label: 'Gerenciar Módulos',
        Icon: Settings,
        onClick: onGerenciarModulos,
      },
      {
        key: 'impersonar',
        label: 'Impersonar',
        Icon: User,
        onClick: onImpersonar,
      },
    ],
    [onGerenciarModulos, onImpersonar, onVisualizar]
  )

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => onOpenChange(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="p-2 hover:bg-accent rounded-lg"
      >
        <MoreVertical className="w-4 h-4 text-muted-foreground" />
      </button>

      {open &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[590]"
              onClick={() => onOpenChange(false)}
            />
            <div
              ref={menuRef}
              role="menu"
              className="fixed z-[600] w-48 bg-card rounded-lg shadow-md border border-border py-1"
              style={{ top: pos.top, left: pos.left }}
            >
              {actions.map(({ key, label, Icon, onClick }) => (
                <button
                  key={key}
                  role="menuitem"
                  onClick={() => {
                    onOpenChange(false)
                    onClick()
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground hover:bg-accent"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </>,
          document.body
        )}
    </>
  )
}
