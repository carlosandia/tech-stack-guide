/**
 * AIDEV-NOTE: Toolbar de ações do módulo Tarefas (PRD-10)
 * Injeta conteúdo no AppToolbar via context
 * Busca com popover + toggle filtros
 */

import { useEffect, useState, useRef, forwardRef } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { useAppToolbar } from '@/modules/app/contexts/AppToolbarContext'

interface TarefasToolbarProps {
  busca: string
  onBuscaChange: (value: string) => void
  filtrosVisiveis: boolean
  onToggleFiltros: () => void
  hasFiltros: boolean
}

export const TarefasToolbar = forwardRef<HTMLDivElement, TarefasToolbarProps>(function TarefasToolbar({
  busca,
  onBuscaChange,
  filtrosVisiveis,
  onToggleFiltros,
  hasFiltros,
}: TarefasToolbarProps, _ref) {
  const { setSubtitle, setActions } = useAppToolbar()
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Click outside for search
  useEffect(() => {
    if (!searchOpen) return
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [searchOpen])

  // Focus search input
  useEffect(() => {
    if (searchOpen) {
      requestAnimationFrame(() => searchInputRef.current?.focus())
    }
  }, [searchOpen])

  // Inject subtitle
  useEffect(() => {
    setSubtitle(
      <span className="text-xs text-muted-foreground ml-1">· Acompanhamento</span>
    )
    return () => setSubtitle(null)
  }, [setSubtitle])

  // Inject actions
  useEffect(() => {
    setActions(
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Filtros toggle */}
        <button
          onClick={onToggleFiltros}
          className={`
            relative p-2 rounded-md transition-all duration-200
            ${filtrosVisiveis
              ? 'text-primary hover:bg-primary/10'
              : 'text-muted-foreground hover:bg-accent'
            }
          `}
          title={filtrosVisiveis ? 'Ocultar filtros' : 'Exibir filtros'}
        >
          <Filter className="w-4 h-4" />
          {hasFiltros && !filtrosVisiveis && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
          )}
        </button>

        {/* Busca (popover) */}
        <div className="relative" ref={searchContainerRef}>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="relative p-2 rounded-md hover:bg-accent text-muted-foreground transition-all duration-200"
            title="Buscar"
          >
            <Search className="w-4 h-4" />
            {busca && !searchOpen && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
            )}
          </button>

          {searchOpen && (
            <div className="fixed left-3 right-3 sm:absolute sm:left-auto sm:right-0 top-[calc(100%+6px)] sm:top-full sm:mt-1.5 sm:w-80 bg-card border border-border rounded-lg shadow-lg z-[60] p-3 animate-enter">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={busca}
                  onChange={(e) => onBuscaChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setSearchOpen(false)
                  }}
                  placeholder="Buscar tarefas..."
                  className="w-full pl-8 pr-8 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
                />
                {busca && (
                  <button
                    onClick={() => onBuscaChange('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-accent"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
    return () => setActions(null)
  }, [busca, searchOpen, filtrosVisiveis, hasFiltros, setActions, onBuscaChange, onToggleFiltros])

  return null // Renderiza via context
})
TarefasToolbar.displayName = 'TarefasToolbar'
