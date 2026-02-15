/**
 * AIDEV-NOTE: Coluna individual do Kanban (uma etapa)
 * Header com cor da etapa via borderTop
 * Scroll vertical interno para cards
 * Drop zones visuais entre cards para feedback de posição
 * Menu de 3 pontos com selecionar todos, ordenar e mover etapa
 */

import { useState, useCallback, useRef, forwardRef } from 'react'
import { MoreVertical, CheckSquare, ArrowUpDown, ArrowLeft, ArrowRight } from 'lucide-react'
import type { EtapaFunil, Oportunidade } from '../../services/negocios.api'
import { KanbanCard } from './KanbanCard'
import type { CardConfig, SlaConfig } from './KanbanCard'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'

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
  onAgendar?: (oportunidade: Oportunidade) => void
  cardConfig?: CardConfig
  slaConfig?: SlaConfig
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
  onSelectAll?: (etapaId: string) => void
  onSortColumn?: (etapaId: string, criterio: string) => void
  onMoveColumn?: (etapaId: string, direcao: 'esquerda' | 'direita') => void
  isFirst?: boolean
  isLast?: boolean
}

function formatValorResumido(valor: number): string {
  if (valor === 0) return 'R$ 0'
  if (valor >= 1_000_000) return `R$ ${(valor / 1_000_000).toFixed(1)}M`
  if (valor >= 1_000) return `R$ ${(valor / 1_000).toFixed(1)}K`
  return `R$ ${valor.toFixed(0)}`
}

function getColumnBg(_tipo: string): string {
  return 'bg-transparent'
}

function getColumnBorderColor(_tipo: string): string {
  return 'border-transparent'
}

// AIDEV-NOTE: Etapas padrão não podem ser movidas (entrada, ganho, perda)
function canMoveEtapa(tipo: string): boolean {
  return tipo === 'normal'
}

export const KanbanColumn = forwardRef<HTMLDivElement, KanbanColumnProps>(function KanbanColumn({ etapa, onDragStart, onDragOver, onDrop, onCardClick, onAgendar, cardConfig, slaConfig, selectedIds, onToggleSelect, onSelectAll, onSortColumn, onMoveColumn, isFirst, isLast }, _ref) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const cardsContainerRef = useRef<HTMLDivElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
    onDragOver(e)
  }

  const handleDragLeave = (e: React.DragEvent) => {
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
    let newIndex = cards.length

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
  const movable = canMoveEtapa(etapa.tipo)

  const renderCardsWithDropZones = () => {
    const elements: React.ReactNode[] = []

    etapa.oportunidades.forEach((op, index) => {
      if (dropIndex === index) {
        elements.push(
          <div key={`drop-${index}`} className="h-[72px] bg-primary/5 rounded-lg border-2 border-dashed border-primary/30 transition-all duration-150" />
        )
      }

      elements.push(
        <div key={op.id} data-kanban-card>
          <KanbanCard
            oportunidade={op}
            onDragStart={onDragStart}
            onClick={onCardClick}
            onAgendar={onAgendar}
            config={cardConfig}
            slaConfig={slaConfig}
            etapaTipo={etapa.tipo}
            isSelected={selectedIds?.has(op.id)}
            onToggleSelect={onToggleSelect}
          />
        </div>
      )
    })

    if (dropIndex === etapa.oportunidades.length) {
      elements.push(
        <div key="drop-end" className="h-[72px] bg-primary/5 rounded-lg border-2 border-dashed border-primary/30 transition-all duration-150" />
      )
    }

    return elements
  }

  return (
    <div
      className={`
        flex flex-col min-w-[288px] w-[288px] ${bgClass} rounded-lg border ${borderClass}
        transition-all duration-200
        ${isDragOver ? 'bg-primary/5' : ''}
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

          {/* Menu 3 pontos */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">Ações da etapa</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onSelectAll?.(etapa.id)}
                disabled={etapa.oportunidades.length === 0}
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                Selecionar todos
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs">Ordenar por</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onSortColumn?.(etapa.id, 'criado_em')}>
                <ArrowUpDown className="w-4 h-4 mr-2" />
                Data de criação
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortColumn?.(etapa.id, 'valor')}>
                <ArrowUpDown className="w-4 h-4 mr-2" />
                Valor
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortColumn?.(etapa.id, 'titulo')}>
                <ArrowUpDown className="w-4 h-4 mr-2" />
                Alfabético
              </DropdownMenuItem>
              {movable && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs">Mover etapa</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => onMoveColumn?.(etapa.id, 'esquerda')}
                    disabled={isFirst}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Mover para esquerda
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onMoveColumn?.(etapa.id, 'direita')}
                    disabled={isLast}
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Mover para direita
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
})
KanbanColumn.displayName = 'KanbanColumn'
