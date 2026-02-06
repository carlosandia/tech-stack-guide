/**
 * AIDEV-NOTE: Dropdown para segmentar contatos em massa
 * Conforme PRD-06 RF-016 - Apenas Pessoas
 */

import { useState, useRef, useEffect } from 'react'
import { Tag, Plus, Minus } from 'lucide-react'
import { useSegmentos, useSegmentarLote } from '../hooks/useSegmentos'

interface SegmentarDropdownProps {
  selectedIds: string[]
  onComplete: () => void
}

export function SegmentarDropdown({ selectedIds, onComplete }: SegmentarDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { data: segmentosData } = useSegmentos()
  const segmentarLote = useSegmentarLote()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const segmentos = segmentosData?.segmentos || []

  const handleAdicionar = (segmentoId: string) => {
    segmentarLote.mutate(
      { ids: selectedIds, adicionar: [segmentoId], remover: [] },
      { onSuccess: () => { setOpen(false); onComplete() } }
    )
  }

  const handleRemover = (segmentoId: string) => {
    segmentarLote.mutate(
      { ids: selectedIds, adicionar: [], remover: [segmentoId] },
      { onSuccess: () => { setOpen(false); onComplete() } }
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-background/10 transition-colors"
        title="Segmentar"
      >
        <Tag className="w-4 h-4" />
        <span className="hidden sm:inline">Segmentar</span>
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-60 bg-background rounded-lg shadow-lg border border-border py-1 z-50">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-sm font-medium text-foreground">
              Segmentar {selectedIds.length} contato(s):
            </p>
          </div>

          {segmentos.length === 0 ? (
            <p className="px-3 py-4 text-xs text-muted-foreground text-center">Nenhum segmento criado</p>
          ) : (
            <>
              <div className="px-3 py-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Adicionar Segmento</p>
              </div>
              {segmentos.map((seg) => (
                <button
                  key={`add-${seg.id}`}
                  onClick={() => handleAdicionar(seg.id)}
                  disabled={segmentarLote.isPending}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <Plus className="w-3 h-3 text-muted-foreground" />
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.cor }} />
                  <span className="truncate">{seg.nome}</span>
                </button>
              ))}

              <div className="border-t border-border mt-1 pt-1">
                <div className="px-3 py-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Remover Segmento</p>
                </div>
                {segmentos.map((seg) => (
                  <button
                    key={`rem-${seg.id}`}
                    onClick={() => handleRemover(seg.id)}
                    disabled={segmentarLote.isPending}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.cor }} />
                    <span className="truncate">{seg.nome}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
