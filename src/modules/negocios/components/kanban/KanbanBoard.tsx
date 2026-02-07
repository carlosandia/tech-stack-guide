/**
 * AIDEV-NOTE: Board principal do Kanban
 * Scroll horizontal com colunas, responsivo com snap no mobile
 * Conforme PRD-07 e Design System
 */

import { useCallback, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import type { Oportunidade, KanbanData } from '../../services/negocios.api'
import { KanbanColumn } from './KanbanColumn'
import { toast } from 'sonner'
import { useMoverEtapa } from '../../hooks/useKanban'

interface KanbanBoardProps {
  data: KanbanData
  isLoading: boolean
  onDropGanhoPerda: (oportunidade: Oportunidade, etapaId: string, tipo: 'ganho' | 'perda') => void
  onCardClick: (oportunidade: Oportunidade) => void
}

export function KanbanBoard({ data, isLoading, onDropGanhoPerda, onCardClick }: KanbanBoardProps) {
  const draggedOpRef = useRef<Oportunidade | null>(null)
  const moverEtapa = useMoverEtapa()

  const handleDragStart = useCallback((e: React.DragEvent, oportunidade: Oportunidade) => {
    draggedOpRef.current = oportunidade
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', oportunidade.id)
    // Adiciona uma sombra visual ao arrastar
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, etapaDestinoId: string, tipoEtapa: string) => {
    e.preventDefault()

    const oportunidade = draggedOpRef.current
    if (!oportunidade) return

    // Restore opacity
    document.querySelectorAll('[draggable]').forEach((el) => {
      ;(el as HTMLElement).style.opacity = '1'
    })

    // Não mover se é a mesma etapa
    if (oportunidade.etapa_id === etapaDestinoId) {
      draggedOpRef.current = null
      return
    }

    // Se a etapa de destino é ganho/perda, abrir modal
    if (tipoEtapa === 'ganho' || tipoEtapa === 'perda') {
      onDropGanhoPerda(oportunidade, etapaDestinoId, tipoEtapa as 'ganho' | 'perda')
      draggedOpRef.current = null
      return
    }

    // Mover normalmente
    moverEtapa.mutate(
      { oportunidadeId: oportunidade.id, etapaDestinoId },
      {
        onError: () => {
          toast.error('Erro ao mover oportunidade')
        },
      }
    )

    draggedOpRef.current = null
  }, [moverEtapa, onDropGanhoPerda])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden">
      <div className="flex gap-3 p-3 sm:p-4 h-full min-w-min">
        {data.etapas.map(etapa => (
          <KanbanColumn
            key={etapa.id}
            etapa={etapa}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </div>
  )
}
