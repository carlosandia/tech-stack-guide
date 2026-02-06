/**
 * AIDEV-NOTE: Popover inline para gerenciar segmentos de um contato
 * Usado na tabela de contatos (pessoas) — coluna Segmentação
 */

import { useState, useRef, useEffect } from 'react'
import { Check } from 'lucide-react'
import { useSegmentos, useVincularSegmentos } from '../hooks/useSegmentos'

interface InlineSegmentoPopoverProps {
  contatoId: string
  segmentosAtuais?: Array<{ id: string; nome: string; cor: string }>
  children: React.ReactNode
}

export function InlineSegmentoPopover({ contatoId, segmentosAtuais = [], children }: InlineSegmentoPopoverProps) {
  const [open, setOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(segmentosAtuais.map(s => s.id)))
  const ref = useRef<HTMLDivElement>(null)
  const { data: segmentosData } = useSegmentos()
  const vincular = useVincularSegmentos()

  const segmentos = segmentosData?.segmentos || []

  // Sync selected when segmentosAtuais changes
  useEffect(() => {
    setSelectedIds(new Set(segmentosAtuais.map(s => s.id)))
  }, [segmentosAtuais])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        // Save on close
        const currentSet = new Set(segmentosAtuais.map(s => s.id))
        const newSet = selectedIds
        const hasChanged = currentSet.size !== newSet.size || [...currentSet].some(id => !newSet.has(id))

        if (hasChanged) {
          vincular.mutate({ contatoId, segmentoIds: Array.from(newSet) })
        }
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, selectedIds, segmentosAtuais, contatoId, vincular])

  const toggleSegmento = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div ref={ref} className="relative">
      <div
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className="cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 transition-colors"
      >
        {children}
      </div>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-background rounded-md shadow-lg border border-border py-1 z-[600]" onClick={e => e.stopPropagation()}>
          <div className="px-3 py-1.5 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground">Segmentos</p>
          </div>

          <div className="max-h-[200px] overflow-y-auto py-1">
            {segmentos.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">Nenhum segmento criado</p>
            )}

            {segmentos.map(seg => {
              const isSelected = selectedIds.has(seg.id)
              return (
                <button
                  key={seg.id}
                  onClick={() => toggleSegmento(seg.id)}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-accent transition-colors text-left"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: seg.cor }}
                  />
                  <span className="flex-1 truncate text-foreground">{seg.nome}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
