import { useState, useRef } from 'react'
import { ChevronDown, Check, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * AIDEV-NOTE: Componente de dropdown de status para Toolbar
 * Conforme Design System - Seção 11.3 (Progressive Disclosure)
 * 
 * - Mobile: Ícone de filtro + chevron
 * - Desktop: Label do status selecionado + chevron
 */

interface StatusOption {
  value: string
  label: string
}

interface StatusDropdownProps {
  value: string
  onChange: (value: string) => void
  options: StatusOption[]
  placeholder?: string
  defaultValue?: string
}

export function StatusDropdown({
  value,
  onChange,
  options,
  placeholder = 'Filtrar',
  defaultValue = 'todas',
}: StatusDropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((o) => o.value === value)
  const selectedLabel = selectedOption?.label || placeholder
  const isFiltering = value !== defaultValue

  return (
    <div ref={containerRef} className="relative">
      {/* Botão trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-md border transition-colors',
          isFiltering
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
        )}
      >
        <Filter className="w-4 h-4 md:hidden" />
        <span className="hidden md:inline">{selectedLabel}</span>
        <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
      </button>

      {/* Dropdown menu */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full right-0 mt-1 w-44 bg-popover border border-border rounded-md shadow-lg py-1 z-50">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={cn(
                  'flex items-center justify-between w-full px-3 py-2 text-sm text-left transition-colors',
                  value === option.value
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-foreground hover:bg-accent'
                )}
              >
                <span>{option.label}</span>
                {value === option.value && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
