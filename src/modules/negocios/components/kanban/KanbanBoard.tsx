/**
 * AIDEV-NOTE: Board principal do Kanban
 * Scroll horizontal com colunas, responsivo com snap no mobile
 * Inclui coluna "Solicitações" (RF-11) antes das etapas
 * Busca config de cards de /configuracoes/cards e repassa aos cards
 * Suporte a seleção múltipla de cards com bulk actions
 * Menu de 3 pontos nas colunas: selecionar todos, ordenar, mover etapa
 */

import { useCallback, useMemo, useRef, useState, forwardRef } from 'react'
import { ChevronRight, Loader2 } from 'lucide-react'
import type { Oportunidade, KanbanData } from '../../services/negocios.api'
import { KanbanColumn } from './KanbanColumn'
import { SolicitacoesColumn } from './SolicitacoesColumn'
import { OportunidadeBulkActions } from './OportunidadeBulkActions'
import { toast } from 'sonner'
import { useMoverEtapa, useExcluirOportunidadesEmMassa, useMoverOportunidadesEmMassa, useMoverOportunidadesParaOutraPipeline } from '../../hooks/useKanban'
import { useConfigCard } from '@/modules/configuracoes/hooks/useRegras'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CardConfig, SlaConfig } from './KanbanCard'
import { useReordenarEtapas } from '../../hooks/usePipelineConfig'
import { usePreOportunidadesPendentes } from '../../hooks/usePreOportunidades'

interface KanbanBoardProps {
  data: KanbanData
  isLoading: boolean
  onDropGanhoPerda: (oportunidade: Oportunidade, etapaId: string, tipo: 'ganho' | 'perda') => void
  onCardClick: (oportunidade: Oportunidade) => void
  onAgendar?: (oportunidade: Oportunidade) => void
}

export const KanbanBoard = forwardRef<HTMLDivElement, KanbanBoardProps>(function KanbanBoard({ data, isLoading, onDropGanhoPerda, onCardClick, onAgendar }, _ref) {
  const draggedOpRef = useRef<Oportunidade | null>(null)
  const moverEtapa = useMoverEtapa()
  const excluirEmMassa = useExcluirOportunidadesEmMassa()
  const moverEmMassa = useMoverOportunidadesEmMassa()
  const moverParaOutraPipeline = useMoverOportunidadesParaOutraPipeline()
  const reordenarEtapas = useReordenarEtapas(data?.funil?.id || '')
  const queryClient = useQueryClient()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // AIDEV-NOTE: Verificar se coluna Solicitações está visível para ocultar seta da primeira etapa
  const { data: preOps } = usePreOportunidadesPendentes(data?.funil?.id || null)
  const solicitacoesVisiveis = (preOps?.length || 0) > 0

  // Buscar configuração de cards
  const { data: configCard } = useConfigCard()
  const cardConfig: CardConfig | undefined = configCard ? {
    camposVisiveis: Array.isArray(configCard.campos_visiveis) ? configCard.campos_visiveis : undefined as any,
    acoesRapidas: Array.isArray((configCard as any).acoes_rapidas) ? (configCard as any).acoes_rapidas : undefined as any,
  } : undefined

  // AIDEV-NOTE: Buscar config de SLA da pipeline (RF-06)
  const { data: slaConfig } = useQuery<SlaConfig | null>({
    queryKey: ['configuracoes_distribuicao', data?.funil?.id],
    queryFn: async () => {
      if (!data?.funil?.id) return null
      const { data: config } = await supabase
        .from('configuracoes_distribuicao')
        .select('sla_ativo, sla_tempo_minutos')
        .eq('funil_id', data.funil.id)
        .single()
      if (!config) return null
      return {
        sla_ativo: config.sla_ativo ?? false,
        sla_tempo_minutos: config.sla_tempo_minutos ?? 30,
      }
    },
    enabled: !!data?.funil?.id,
  })

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

  // Mapear selectedIds para contato_ids (para segmentar)
  const { selectedIdsArr, contatoIds, etapasAtuaisIds } = useMemo(() => {
    const arr = Array.from(selectedIds)
    const allOps = data?.etapas?.flatMap(e => e.oportunidades) || []
    const cIds = arr
      .map(id => allOps.find(o => o.id === id)?.contato_id)
      .filter((id): id is string => !!id)
    // AIDEV-NOTE: Coletar etapas onde os cards selecionados estão para destacar no popover de mover
    const eIds = new Set<string>()
    for (const id of arr) {
      const etapa = data?.etapas?.find(e => e.oportunidades.some(o => o.id === id))
      if (etapa) eIds.add(etapa.id)
    }
    return { selectedIdsArr: arr, contatoIds: [...new Set(cIds)], etapasAtuaisIds: eIds }
  }, [selectedIds, data])

  const handleExcluir = useCallback(() => {
    excluirEmMassa.mutate(selectedIdsArr, {
      onSuccess: () => {
        toast.success(`${selectedIdsArr.length} oportunidade(s) excluída(s)`)
        handleClearSelection()
      },
      onError: () => toast.error('Erro ao excluir oportunidades'),
    })
  }, [selectedIdsArr, excluirEmMassa, handleClearSelection])

  const handleMoverEtapa = useCallback((etapaId: string) => {
    moverEmMassa.mutate({ ids: selectedIdsArr, etapaDestinoId: etapaId }, {
      onSuccess: () => {
        toast.success(`${selectedIdsArr.length} oportunidade(s) movida(s)`)
        handleClearSelection()
      },
      onError: () => toast.error('Erro ao mover oportunidades'),
    })
  }, [selectedIdsArr, moverEmMassa, handleClearSelection])

  const handleMoverParaOutraPipeline = useCallback((funilId: string, etapaId: string) => {
    moverParaOutraPipeline.mutate({ ids: selectedIdsArr, funilDestinoId: funilId, etapaDestinoId: etapaId }, {
      onSuccess: () => {
        toast.success(`${selectedIdsArr.length} oportunidade(s) movida(s) para outra pipeline`)
        handleClearSelection()
      },
      onError: () => toast.error('Erro ao mover oportunidades'),
    })
  }, [selectedIdsArr, moverParaOutraPipeline, handleClearSelection])

  const handleExportar = useCallback(() => {
    const allOps = data?.etapas?.flatMap(e => e.oportunidades) || []
    const selected = allOps.filter(o => selectedIds.has(o.id))
    if (selected.length === 0) return

    const headers = ['Título', 'Valor', 'Contato', 'Etapa', 'Criado em']
    const rows = selected.map(o => {
      const contato = o.contato
      const nomeContato = contato
        ? (contato.tipo === 'empresa' ? contato.nome_fantasia || contato.razao_social : [contato.nome, contato.sobrenome].filter(Boolean).join(' '))
        : ''
      const etapa = data.etapas.find(e => e.id === o.etapa_id)?.nome || ''
      return [o.titulo, String(o.valor || 0), nomeContato, etapa, o.criado_em].map(v => `"${(v || '').replace(/"/g, '""')}"`)
    })

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `oportunidades_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${selected.length} oportunidade(s) exportada(s)`)
    handleClearSelection()
  }, [data, selectedIds, handleClearSelection])

  // AIDEV-NOTE: Selecionar todos os cards de uma etapa
  const handleSelectAll = useCallback((etapaId: string) => {
    const etapa = data?.etapas?.find(e => e.id === etapaId)
    if (!etapa) return
    setSelectedIds(prev => {
      const next = new Set(prev)
      const allSelected = etapa.oportunidades.every(op => next.has(op.id))
      if (allSelected) {
        etapa.oportunidades.forEach(op => next.delete(op.id))
      } else {
        etapa.oportunidades.forEach(op => next.add(op.id))
      }
      return next
    })
  }, [data])

  // AIDEV-NOTE: Ordenar cards de uma etapa e persistir posições
  const handleSortColumn = useCallback(async (etapaId: string, criterio: string) => {
    const etapa = data?.etapas?.find(e => e.id === etapaId)
    if (!etapa || etapa.oportunidades.length < 2) return

    const sorted = [...etapa.oportunidades].sort((a, b) => {
      switch (criterio) {
        case 'criado_em':
          return new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime()
        case 'valor':
          return (b.valor || 0) - (a.valor || 0)
        case 'titulo':
          return (a.titulo || '').localeCompare(b.titulo || '', 'pt-BR')
        default:
          return 0
      }
    })

    // AIDEV-NOTE: Batch update via RPC em 1 roundtrip (Plano de Escala 1.2)
    const items = sorted.map((op, idx) => ({ id: op.id, posicao: idx }))
    const { error: rpcError } = await supabase.rpc('reordenar_posicoes_etapa', { items: JSON.stringify(items) } as any)
    if (rpcError) console.error('Erro RPC reordenar_posicoes_etapa:', rpcError)
    queryClient.invalidateQueries({ queryKey: ['kanban'] })
    toast.success('Cards ordenados')
  }, [data, queryClient])

  // AIDEV-NOTE: Mover etapa para esquerda ou direita (apenas tipo normal)
  const handleMoveColumn = useCallback((etapaId: string, direcao: 'esquerda' | 'direita') => {
    if (!data?.etapas) return
    const idx = data.etapas.findIndex(e => e.id === etapaId)
    if (idx === -1) return

    const targetIdx = direcao === 'esquerda' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= data.etapas.length) return

    // Trocar ordens entre as duas etapas
    const current = data.etapas[idx]
    const target = data.etapas[targetIdx]
    
    reordenarEtapas.mutate(
      [
        { id: current.id, ordem: target.ordem ?? targetIdx },
        { id: target.id, ordem: current.ordem ?? idx },
      ],
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['kanban'] })
          toast.success('Etapa movida')
        },
        onError: () => toast.error('Erro ao mover etapa'),
      }
    )
  }, [data, reordenarEtapas, queryClient])

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

  const handleDrop = useCallback((e: React.DragEvent, etapaDestinoId: string, tipoEtapa: string, dropIndex?: number) => {
    e.preventDefault()

    const oportunidade = draggedOpRef.current
    if (!oportunidade) return

    document.querySelectorAll('[draggable]').forEach((el) => {
      ;(el as HTMLElement).style.opacity = '1'
    })

    // AIDEV-NOTE: Se mesma etapa, permitir reordenação com ajuste de off-by-one
    if (oportunidade.etapa_id === etapaDestinoId) {
      if (dropIndex === undefined) {
        draggedOpRef.current = null
        return
      }
      const etapaAtual = data?.etapas?.find(e => e.id === etapaDestinoId)
      const indexOriginal = etapaAtual?.oportunidades?.findIndex(op => op.id === oportunidade.id) ?? -1
      
      let adjustedIndex = dropIndex
      if (indexOriginal !== -1 && indexOriginal < dropIndex) {
        adjustedIndex = dropIndex - 1
      }
      
      if (indexOriginal === adjustedIndex) {
        draggedOpRef.current = null
        return
      }

      moverEtapa.mutate(
        { oportunidadeId: oportunidade.id, etapaDestinoId, dropIndex: adjustedIndex },
        {
          onError: () => {
            toast.error('Erro ao reordenar oportunidade')
          },
        }
      )
      draggedOpRef.current = null
      return
    }

    if (tipoEtapa === 'ganho' || tipoEtapa === 'perda') {
      onDropGanhoPerda(oportunidade, etapaDestinoId, tipoEtapa as 'ganho' | 'perda')
      draggedOpRef.current = null
      return
    }

    moverEtapa.mutate(
      { oportunidadeId: oportunidade.id, etapaDestinoId, dropIndex },
      {
        onError: () => {
          toast.error('Erro ao mover oportunidade')
        },
      }
    )

    draggedOpRef.current = null
  }, [moverEtapa, onDropGanhoPerda, data])

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
        <div className="flex gap-0 px-3 sm:px-4 pt-0 pb-3 h-full min-w-min">
          <SolicitacoesColumn funilId={data.funil.id} />

          {data.etapas.map((etapa, idx) => {
            const normalEtapas = data.etapas.filter(e => e.tipo === 'normal')
            const isFirstNormal = normalEtapas[0]?.id === etapa.id
            const isLastNormal = normalEtapas[normalEtapas.length - 1]?.id === etapa.id
            const isFirstEtapa = idx === 0

            return (
              <div key={etapa.id} className="flex items-stretch">
                {/* Seta sutil entre colunas - oculta na primeira etapa normal quando Solicitações não está visível */}
                {(solicitacoesVisiveis || !isFirstEtapa) && (
                  <div className="flex items-start pt-3 px-0.5">
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                  </div>
                )}
                <KanbanColumn
                  etapa={etapa}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onCardClick={onCardClick}
                  onAgendar={onAgendar}
                  cardConfig={cardConfig}
                  slaConfig={slaConfig || undefined}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onSelectAll={handleSelectAll}
                  onSortColumn={handleSortColumn}
                  onMoveColumn={handleMoveColumn}
                  isFirst={isFirstNormal}
                  isLast={isLastNormal}
                />
              </div>
            )
          })}
        </div>
      </div>

      <OportunidadeBulkActions
        selectedCount={selectedIds.size}
        selectedIds={selectedIdsArr}
        contatoIds={contatoIds}
        etapas={data.etapas}
        etapasAtuaisIds={etapasAtuaisIds}
        funilAtualId={data.funil.id}
        onExcluir={handleExcluir}
        onExportar={handleExportar}
        onMoverEtapa={handleMoverEtapa}
        onMoverParaOutraPipeline={handleMoverParaOutraPipeline}
        onClearSelection={handleClearSelection}
        isDeleting={excluirEmMassa.isPending}
        isMoving={moverEmMassa.isPending || moverParaOutraPipeline.isPending}
      />
    </>
  )
})
KanbanBoard.displayName = 'KanbanBoard'
