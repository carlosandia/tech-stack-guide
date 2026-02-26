/**
 * AIDEV-NOTE: Seção colapsável para blocos do dashboard.
 * Persiste estado no localStorage para lembrar preferência do usuário.
 */

import { useState, useCallback, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface CollapsibleSectionProps {
  id: string
  children: ReactNode
  defaultOpen?: boolean
}

function getStorageKey(id: string) {
  return `dashboard_section_${id}`
}

function getInitialState(id: string, defaultOpen: boolean): boolean {
  try {
    const stored = localStorage.getItem(getStorageKey(id))
    if (stored !== null) return stored === '1'
  } catch (_) {}
  return defaultOpen
}

export default function CollapsibleSection({ id, children, defaultOpen = true }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(() => getInitialState(id, defaultOpen))

  const toggle = useCallback(() => {
    setOpen(prev => {
      const next = !prev
      try { localStorage.setItem(getStorageKey(id), next ? '1' : '0') } catch (_) {}
      return next
    })
  }, [id])

  return (
    <div className="relative group/collapse">
      {/* Toggle button - aparece no hover */}
      <button
        type="button"
        onClick={toggle}
        className="absolute -top-1 right-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-muted-foreground bg-muted/60 opacity-0 group-hover/collapse:opacity-100 transition-opacity duration-200 hover:bg-muted hover:text-foreground"
        title={open ? 'Minimizar' : 'Expandir'}
      >
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
        {open ? 'Ocultar' : 'Mostrar'}
      </button>

      {/* Content */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
