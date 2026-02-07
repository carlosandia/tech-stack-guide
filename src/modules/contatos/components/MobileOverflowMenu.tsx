/**
 * AIDEV-NOTE: Menu overflow para ações secundárias no mobile
 * Conforme Design System 7.7 - Progressive Disclosure
 * 
 * No mobile (<lg), ações como Filtros, Segmentos, Colunas, Exportar, Importar
 * ficam agrupadas num menu dropdown acionado por ícone "⋮"
 */

import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Filter, Tag, Download, Upload, GitMerge } from 'lucide-react'
import type { ColumnConfig } from './ContatoColumnsToggle'
import type { TipoContato } from '../services/contatos.api'

interface MobileOverflowMenuProps {
  showFilters: boolean
  setShowFilters: (v: boolean) => void
  filtrosAtivos: number
  isAdmin: boolean
  temDuplicatas: boolean
  totalDuplicatas: number
  onSegmentos: () => void
  onExportar: () => void
  onImportar: () => void
  onDuplicatas: () => void
  tipo: TipoContato
  columns: ColumnConfig[]
  onColumnsChange: (cols: ColumnConfig[]) => void
}

export function MobileOverflowMenu({
  showFilters,
  setShowFilters,
  filtrosAtivos,
  isAdmin,
  temDuplicatas,
  totalDuplicatas,
  onSegmentos,
  onExportar,
  onImportar,
  onDuplicatas,
}: MobileOverflowMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fechar ao clicar fora
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleAction = (action: () => void) => {
    action()
    setOpen(false)
  }

  return (
    <div className="relative lg:hidden" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`p-2 rounded-md transition-colors ${
          open ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        }`}
        title="Mais opções"
      >
        <MoreVertical className="w-4 h-4" />
        {filtrosAtivos > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground text-[8px] flex items-center justify-center font-bold">
            {filtrosAtivos}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-card border border-border rounded-lg shadow-md py-1 z-[50]">
          {/* Filtros */}
          <button
            onClick={() => handleAction(() => setShowFilters(!showFilters))}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
          >
            <Filter className="w-4 h-4 text-muted-foreground" />
            Filtros
            {filtrosAtivos > 0 && (
              <span className="ml-auto w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                {filtrosAtivos}
              </span>
            )}
          </button>

          {/* Segmentos */}
          {isAdmin && (
            <button
              onClick={() => handleAction(onSegmentos)}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
            >
              <Tag className="w-4 h-4 text-muted-foreground" />
              Segmentos
            </button>
          )}

          {/* Separador */}
          <div className="h-px bg-border my-1 mx-2" />

          {/* Exportar */}
          <button
            onClick={() => handleAction(onExportar)}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
            Exportar
          </button>

          {/* Importar */}
          {isAdmin && (
            <button
              onClick={() => handleAction(onImportar)}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
            >
              <Upload className="w-4 h-4 text-muted-foreground" />
              Importar
            </button>
          )}

          {/* Duplicatas */}
          {isAdmin && temDuplicatas && (
            <>
              <div className="h-px bg-border my-1 mx-2" />
              <button
                onClick={() => handleAction(onDuplicatas)}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-warning-foreground hover:bg-accent transition-colors"
              >
                <GitMerge className="w-4 h-4" />
                Duplicatas
                <span className="ml-auto w-5 h-5 rounded-full bg-warning text-warning-foreground text-[10px] flex items-center justify-center font-bold">
                  {totalDuplicatas}
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
