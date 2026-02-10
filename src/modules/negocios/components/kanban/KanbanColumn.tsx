/**
 * AIDEV-NOTE: Coluna individual do Kanban (uma etapa)
 * Header com cor da etapa via borderTop
 * Scroll vertical interno para cards
 */

import { useState } from 'react'
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
  onDrop: (e: React.DragEvent, etapaId: string, tipoEtapa: string) => void
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
    onDragOver(e)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    onDrop(e, etapa.id, etapa.tipo)
  }

  const bgClass = getColumnBg(etapa.tipo)
  const borderClass = getColumnBorderColor(etapa.tipo)

  return (
    <div
      className={`
        flex flex-col min-w-[272px] w-[272px] ${bgClass} rounded-lg border ${borderClass}
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
          </div>
        </div>
        {etapa.valor_total > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatValorResumido(etapa.valor_total)}
          </p>
        )}
      </div>

      {/* Cards com scroll vertical */}
      <div className="flex-1 overflow-y-auto min-h-0 px-2 pb-2 space-y-2">
        {etapa.oportunidades.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
            {isDragOver ? 'Solte aqui' : 'Nenhuma oportunidade'}
          </div>
        ) : (
          etapa.oportunidades.map(op => (
            <KanbanCard
              key={op.id}
              oportunidade={op}
              onDragStart={onDragStart}
              onClick={onCardClick}
              config={cardConfig}
              slaConfig={slaConfig}
              isSelected={selectedIds?.has(op.id)}
              onToggleSelect={onToggleSelect}
            />
          ))
        )}
      </div>
    </div>
  )
}
