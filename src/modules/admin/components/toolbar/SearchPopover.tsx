import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * AIDEV-NOTE: Componente de busca com popover para Toolbar
 * Conforme Design System - Seção 11.3 (Progressive Disclosure)
 * 
 * - Mobile: Apenas ícone de busca
 * - Desktop: Ícone + texto "Buscar" ou valor atual
 */

interface SearchPopoverProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchPopover({ value, onChange, placeholder = 'Buscar...' }: SearchPopoverProps) {
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Focus no input quando abre
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const hasValue = value.length > 0

  return (
    <div ref={containerRef} className="relative">
      {/* Botão trigger - Estilo ghost */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
          hasValue
            ? 'bg-primary/5 text-primary'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
        )}
      >
        <Search className="w-4 h-4" />
        <span className="hidden md:inline max-w-[100px] truncate">
          {hasValue ? `"${value}"` : 'Buscar'}
        </span>
      </button>

      {/* Popover */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full right-0 mt-1 w-64 bg-popover border border-border rounded-md shadow-lg p-2 z-50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-9 pr-8 py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setOpen(false)
                  if (e.key === 'Enter') setOpen(false)
                }}
              />
              {hasValue && (
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            {hasValue && (
              <button
                type="button"
                onClick={() => {
                  onChange('')
                  inputRef.current?.focus()
                }}
                className="w-full mt-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
              >
                Limpar busca
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
