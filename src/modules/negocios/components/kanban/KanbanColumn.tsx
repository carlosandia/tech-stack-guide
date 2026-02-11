/**
 * AIDEV-NOTE: Coluna individual do Kanban (uma etapa)
 * Header com cor da etapa via borderTop
 * Scroll vertical interno para cards
 * Drop zones visuais entre cards para feedback de posição
 */

import { useState, useCallback, useRef } from 'react'
import type { EtapaFunil, Oportunidade } from '../../services/negocios.api'
import { KanbanCard } from './KanbanCard'
import type { CardConfig, SlaConfig } from './KanbanCard'

interface KanbanColumnProps {
  etapa: EtapaFunil & {
    oportunidades: Oportunidade[]
    total_oportunidades: number
    valor_total: number
  }
  onDragStart: (e: React.DragEvent, oportunidade: Oportunidade) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, etapaId: string, tipoEtapa: string, dropIndex?: number) => void
  onCardClick: (oportunidade: Oportunidade) => void
  cardConfig?: CardConfig
  slaConfig?: SlaConfig
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
}

function formatValorResumido(valor: number): string {
  if (valor === 0) return 'R$ 0'
  if (valor >= 1_000_000) return `R$ ${(valor / 1_000_000).toFixed(1)}M`
  if (valor >= 1_000) return `R$ ${(valor / 1_000).toFixed(1)}K`
  return `R$ ${valor.toFixed(0)}`
}

function getColumnBg(tipo: string): string {
  switch (tipo) {
    case 'ganho': return 'bg-success/5'
    case 'perda': return 'bg-destructive/5'
    default: return 'bg-muted/30'
  }
}

function getColumnBorderColor(tipo: string): string {
  switch (tipo) {
    case 'ganho': return 'border-success/20'
    case 'perda': return 'border-destructive/20'
    default: return 'border-border'
  }
}

export function KanbanColumn({ etapa, onDragStart, onDragOver, onDrop, onCardClick, cardConfig, slaConfig, selectedIds, onToggleSelect }: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const cardsContainerRef = useRef<HTMLDivElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
    onDragOver(e)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Só limpa se realmente saiu da coluna (não para elementos filhos)
    const relatedTarget = e.relatedTarget as Node | null
    const currentTarget = e.currentTarget as Node
    if (relatedTarget && currentTarget.contains(relatedTarget)) return
    setIsDragOver(false)
    setDropIndex(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const currentDropIndex = dropIndex
    setIsDragOver(false)
    setDropIndex(null)
    onDrop(e, etapa.id, etapa.tipo, currentDropIndex ?? undefined)
  }

  // AIDEV-NOTE: Calcula o índice de drop baseado na posição do cursor em relação aos cards
  const handleCardAreaDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const container = cardsContainerRef.current
    if (!container) return

    const cards = container.querySelectorAll('[data-kanban-card]')
    if (cards.length === 0) {
      setDropIndex(0)
      return
    }

    const mouseY = e.clientY
    let newIndex = cards.length // default: no final

    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect()
      const midY = rect.top + rect.height / 2
      if (mouseY < midY) {
        newIndex = i
        break
      }
    }

    setDropIndex(newIndex)
  }, [])

  const handleCardAreaDragLeave = useCallback((e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as Node | null
    const currentTarget = e.currentTarget as Node
    if (relatedTarget && currentTarget.contains(relatedTarget)) return
    setDropIndex(null)
  }, [])

  const bgClass = getColumnBg(etapa.tipo)
  const borderClass = getColumnBorderColor(etapa.tipo)

  // Renderiza cards com drop indicators entre eles
  const renderCardsWithDropZones = () => {
    const elements: React.ReactNode[] = []

    etapa.oportunidades.forEach((op, index) => {
      // Drop indicator antes do card
      if (dropIndex === index) {
        elements.push(
          <div key={`drop-${index}`} className="h-[72px] bg-muted-foreground/10 rounded-lg border-2 border-dashed border-muted-foreground/20 transition-all duration-150" />
        )
      }

      elements.push(
        <div key={op.id} data-kanban-card>
          <KanbanCard
            oportunidade={op}
            onDragStart={onDragStart}
            onClick={onCardClick}
            config={cardConfig}
            slaConfig={slaConfig}
            etapaTipo={etapa.tipo}
            isSelected={selectedIds?.has(op.id)}
            onToggleSelect={onToggleSelect}
          />
        </div>
      )
    })

    // Drop indicator no final
    if (dropIndex === etapa.oportunidades.length) {
      elements.push(
        <div key="drop-end" className="h-[72px] bg-muted-foreground/10 rounded-lg border-2 border-dashed border-muted-foreground/20 transition-all duration-150" />
      )
    }

    return elements
  }

  return (
    <div
      className={`
        flex flex-col min-w-[288px] w-[288px] ${bgClass} rounded-lg border ${borderClass}
        transition-all duration-200
        ${isDragOver ? 'ring-2 ring-primary/40 bg-primary/5' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header da etapa */}
      <div className="flex-shrink-0 px-3 py-2.5 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {etapa.nome}
            </h3>
            <span className="flex-shrink-0 text-xs font-medium text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
              {etapa.total_oportunidades}
            </span>
            {etapa.valor_total > 0 && (
              <span className="text-xs text-muted-foreground">
                {formatValorResumido(etapa.valor_total)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Cards com scroll vertical e drop zones */}
      <div
        ref={cardsContainerRef}
        className="flex-1 overflow-y-auto min-h-0 px-2 pb-2 space-y-2"
        onDragOver={handleCardAreaDragOver}
        onDragLeave={handleCardAreaDragLeave}
      >
        {etapa.oportunidades.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
            {isDragOver ? 'Solte aqui' : 'Nenhuma oportunidade'}
          </div>
        ) : (
          renderCardsWithDropZones()
        )}
      </div>
    </div>
  )
}
