/**
 * AIDEV-NOTE: Dropdown de seleção de pipeline
 * Conforme Design System 10.6 Popover
 */

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Plus, Layers } from 'lucide-react'
import type { Funil } from '../../services/negocios.api'

interface PipelineSelectorProps {
  funis: Funil[]
  funilAtivo: Funil | null
  onSelect: (funil: Funil) => void
  onNovaPipeline: () => void
  isAdmin: boolean
}

export function PipelineSelector({
  funis,
  funilAtivo,
  onSelect,
  onNovaPipeline,
  isAdmin,
}: PipelineSelectorProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const funisAtivas = funis.filter(f => f.ativo !== false && !f.arquivado)

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-accent text-sm font-medium text-foreground transition-all duration-200 max-w-[200px]"
      >
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: funilAtivo?.cor || '#3B82F6' }}
        />
        <span className="truncate">{funilAtivo?.nome || 'Pipeline'}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-card border border-border rounded-lg shadow-lg z-[60] py-1 animate-enter">
          <div className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Pipelines ({funisAtivas.length})
          </div>

          {funisAtivas.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
              <Layers className="w-5 h-5 mx-auto mb-1.5 text-muted-foreground/50" />
              Nenhuma pipeline
            </div>
          ) : (
            <div className="max-h-[240px] overflow-y-auto">
              {funisAtivas.map(funil => (
                <button
                  key={funil.id}
                  onClick={() => {
                    onSelect(funil)
                    setOpen(false)
                  }}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left
                    transition-all duration-200
                    ${funil.id === funilAtivo?.id
                      ? 'bg-primary/5 text-primary font-medium'
                      : 'text-foreground hover:bg-accent'
                    }
                  `}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: funil.cor || '#3B82F6' }}
                  />
                  <span className="truncate">{funil.nome}</span>
                </button>
              ))}
            </div>
          )}

          {isAdmin && (
            <>
              <div className="border-t border-border my-1" />
              <button
                onClick={() => {
                  setOpen(false)
                  onNovaPipeline()
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-accent transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Nova Pipeline
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
