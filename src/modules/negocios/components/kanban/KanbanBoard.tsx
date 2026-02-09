/**
 * AIDEV-NOTE: Board principal do Kanban
 * Scroll horizontal com colunas, responsivo com snap no mobile
 * Inclui coluna "Solicitações" (RF-11) antes das etapas
 * Busca config de cards de /configuracoes/cards e repassa aos cards
 * Suporte a seleção múltipla de cards com bulk actions
 */

import { useCallback, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { Oportunidade, KanbanData } from '../../services/negocios.api'
import { KanbanColumn } from './KanbanColumn'
import { SolicitacoesColumn } from './SolicitacoesColumn'
import { OportunidadeBulkActions } from './OportunidadeBulkActions'
import { toast } from 'sonner'
import { useMoverEtapa } from '../../hooks/useKanban'
import { useConfigCard } from '@/modules/configuracoes/hooks/useRegras'
import type { CardConfig } from './KanbanCard'

interface KanbanBoardProps {
  data: KanbanData
  isLoading: boolean
  onDropGanhoPerda: (oportunidade: Oportunidade, etapaId: string, tipo: 'ganho' | 'perda') => void
  onCardClick: (oportunidade: Oportunidade) => void
}

export function KanbanBoard({ data, isLoading, onDropGanhoPerda, onCardClick }: KanbanBoardProps) {
  const draggedOpRef = useRef<Oportunidade | null>(null)
  const moverEtapa = useMoverEtapa()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Buscar configuração de cards
  const { data: configCard } = useConfigCard()
  const cardConfig: CardConfig | undefined = configCard ? {
    camposVisiveis: Array.isArray(configCard.campos_visiveis) ? configCard.campos_visiveis : undefined as any,
    acoesRapidas: Array.isArray((configCard as any).acoes_rapidas) ? (configCard as any).acoes_rapidas : undefined as any,
  } : undefined

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const handleDragStart = useCallback((e: React.DragEvent, oportunidade: Oportunidade) => {
    draggedOpRef.current = oportunidade
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', oportunidade.id)
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

    document.querySelectorAll('[draggable]').forEach((el) => {
      ;(el as HTMLElement).style.opacity = '1'
    })

    if (oportunidade.etapa_id === etapaDestinoId) {
      draggedOpRef.current = null
      return
    }

    if (tipoEtapa === 'ganho' || tipoEtapa === 'perda') {
      onDropGanhoPerda(oportunidade, etapaDestinoId, tipoEtapa as 'ganho' | 'perda')
      draggedOpRef.current = null
      return
    }

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
    <>
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 p-3 sm:p-4 h-full min-w-min">
          <SolicitacoesColumn funilId={data.funil.id} />

          {data.etapas.map(etapa => (
            <KanbanColumn
              key={etapa.id}
              etapa={etapa}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onCardClick={onCardClick}
              cardConfig={cardConfig}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
            />
          ))}
        </div>
      </div>

      <OportunidadeBulkActions
        selectedCount={selectedIds.size}
        onExcluir={() => {
          toast.info('Excluir em massa: em desenvolvimento')
          handleClearSelection()
        }}
        onExportar={() => {
          toast.info('Exportar em massa: em desenvolvimento')
          handleClearSelection()
        }}
        onMoverEtapa={() => {
          toast.info('Mover em massa: em desenvolvimento')
          handleClearSelection()
        }}
        onClearSelection={handleClearSelection}
      />
    </>
  )
}
