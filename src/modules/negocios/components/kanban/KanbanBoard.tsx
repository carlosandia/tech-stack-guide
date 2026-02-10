/**
 * AIDEV-NOTE: Board principal do Kanban
 * Scroll horizontal com colunas, responsivo com snap no mobile
 * Inclui coluna "Solicitações" (RF-11) antes das etapas
 * Busca config de cards de /configuracoes/cards e repassa aos cards
 * Suporte a seleção múltipla de cards com bulk actions
 */

import { useCallback, useMemo, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { Oportunidade, KanbanData } from '../../services/negocios.api'
import { KanbanColumn } from './KanbanColumn'
import { SolicitacoesColumn } from './SolicitacoesColumn'
import { OportunidadeBulkActions } from './OportunidadeBulkActions'
import { toast } from 'sonner'
import { useMoverEtapa, useExcluirOportunidadesEmMassa, useMoverOportunidadesEmMassa } from '../../hooks/useKanban'
import { useConfigCard } from '@/modules/configuracoes/hooks/useRegras'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CardConfig, SlaConfig } from './KanbanCard'

interface KanbanBoardProps {
  data: KanbanData
  isLoading: boolean
  onDropGanhoPerda: (oportunidade: Oportunidade, etapaId: string, tipo: 'ganho' | 'perda') => void
  onCardClick: (oportunidade: Oportunidade) => void
}

export function KanbanBoard({ data, isLoading, onDropGanhoPerda, onCardClick }: KanbanBoardProps) {
  const draggedOpRef = useRef<Oportunidade | null>(null)
  const moverEtapa = useMoverEtapa()
  const excluirEmMassa = useExcluirOportunidadesEmMassa()
  const moverEmMassa = useMoverOportunidadesEmMassa()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

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
  const { selectedIdsArr, contatoIds } = useMemo(() => {
    const arr = Array.from(selectedIds)
    const allOps = data?.etapas?.flatMap(e => e.oportunidades) || []
    const cIds = arr
      .map(id => allOps.find(o => o.id === id)?.contato_id)
      .filter((id): id is string => !!id)
    return { selectedIdsArr: arr, contatoIds: [...new Set(cIds)] }
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
              slaConfig={slaConfig || undefined}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
            />
          ))}
        </div>
      </div>

      <OportunidadeBulkActions
        selectedCount={selectedIds.size}
        selectedIds={selectedIdsArr}
        contatoIds={contatoIds}
        etapas={data.etapas}
        onExcluir={handleExcluir}
        onExportar={handleExportar}
        onMoverEtapa={handleMoverEtapa}
        onClearSelection={handleClearSelection}
        isDeleting={excluirEmMassa.isPending}
        isMoving={moverEmMassa.isPending}
      />
    </>
  )
}
