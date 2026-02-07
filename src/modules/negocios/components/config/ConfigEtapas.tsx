/**
 * AIDEV-NOTE: Aba Etapas da configuração de pipeline
 * Conforme PRD-07 RF-04 - Etapas com drag reorder
 */

import { useState, useMemo, useRef } from 'react'
import { GripVertical, Plus, Pencil, Trash2, Lock } from 'lucide-react'
import { useEtapasFunil, useCriarEtapa, useAtualizarEtapa, useExcluirEtapa, useReordenarEtapas } from '../../hooks/usePipelineConfig'
import { EtapaFormModal } from './EtapaFormModal'
import type { EtapaFunil } from '../../services/pipeline-config.api'

interface Props {
  funilId: string
}

export function ConfigEtapas({ funilId }: Props) {
  const { data: etapas, isLoading } = useEtapasFunil(funilId)
  const criarEtapa = useCriarEtapa(funilId)
  const atualizarEtapa = useAtualizarEtapa(funilId)
  const excluirEtapa = useExcluirEtapa(funilId)
  const reordenar = useReordenarEtapas(funilId)

  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<EtapaFunil | null>(null)

  // Drag state — tracked by ID to avoid index confusion
  const dragIdRef = useRef<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  // Ordenar: Entrada → Personalizados (por ordem) → Ganho → Perda
  const etapasOrdenadas = useMemo(() => {
    if (!etapas) return []
    const entrada = etapas.filter(e => e.tipo === 'entrada')
    const custom = etapas.filter(e => e.tipo !== 'entrada' && e.tipo !== 'ganho' && e.tipo !== 'perda')
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
    const ganho = etapas.filter(e => e.tipo === 'ganho')
    const perda = etapas.filter(e => e.tipo === 'perda')
    return [...entrada, ...custom, ...ganho, ...perda]
  }, [etapas])

  // Lista visual: reordena em tempo real durante o drag
  const etapasVisuais = useMemo(() => {
    if (!dragId || !overId || dragId === overId) return etapasOrdenadas
    const fromIdx = etapasOrdenadas.findIndex(e => e.id === dragId)
    const toIdx = etapasOrdenadas.findIndex(e => e.id === overId)
    if (fromIdx === -1 || toIdx === -1) return etapasOrdenadas
    const result = [...etapasOrdenadas]
    const [moved] = result.splice(fromIdx, 1)
    result.splice(toIdx, 0, moved)
    return result
  }, [etapasOrdenadas, dragId, overId])

  const isSistema = (etapa: EtapaFunil) =>
    etapa.tipo === 'entrada' || etapa.tipo === 'ganho' || etapa.tipo === 'perda'

  const tipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'entrada': return 'Entrada'
      case 'ganho': return 'Ganho'
      case 'perda': return 'Perda'
      default: return 'Personalizado'
    }
  }

  const handleDragStart = (e: React.DragEvent, etapa: EtapaFunil) => {
    if (isSistema(etapa)) { e.preventDefault(); return }
    e.dataTransfer.effectAllowed = 'move'
    dragIdRef.current = etapa.id
    setDragId(etapa.id)
    setOverId(etapa.id)
  }

  const handleDragEnter = (etapa: EtapaFunil) => {
    if (!dragIdRef.current || isSistema(etapa)) return
    setOverId(etapa.id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = () => {
    const currentDragId = dragIdRef.current
    if (!currentDragId || !overId || currentDragId === overId) {
      resetDrag()
      return
    }

    // Reordenar usando a lista visual final
    const fromIdx = etapasOrdenadas.findIndex(e => e.id === currentDragId)
    const toIdx = etapasOrdenadas.findIndex(e => e.id === overId)
    if (fromIdx === -1 || toIdx === -1) { resetDrag(); return }

    const newEtapas = [...etapasOrdenadas]
    const [moved] = newEtapas.splice(fromIdx, 1)
    newEtapas.splice(toIdx, 0, moved)

    reordenar.mutate(newEtapas.map((e, i) => ({ id: e.id, ordem: i })))
    resetDrag()
  }

  const resetDrag = () => {
    dragIdRef.current = null
    setDragId(null)
    setOverId(null)
  }

  const handleSave = async (payload: { nome: string; cor: string; probabilidade: number }) => {
    if (editando) {
      await atualizarEtapa.mutateAsync({ etapaId: editando.id, payload })
    } else {
      await criarEtapa.mutateAsync(payload)
    }
    setShowModal(false)
    setEditando(null)
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando etapas...</div>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Etapas da Pipeline</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gerencie as etapas do funil de vendas
          </p>
        </div>
        <button
          onClick={() => { setEditando(null); setShowModal(true) }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Nova Etapa
        </button>
      </div>

      {/* Lista de etapas */}
      <div className="space-y-1.5">
        {etapasVisuais.map((etapa) => {
          const isDragging = dragId === etapa.id

          return (
            <div
              key={etapa.id}
              draggable={!isSistema(etapa)}
              onDragStart={(e) => handleDragStart(e, etapa)}
              onDragEnter={() => handleDragEnter(etapa)}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={resetDrag}
              className={`
                flex items-center gap-3 p-3 rounded-lg border border-border bg-card
                ${!isSistema(etapa) ? 'cursor-grab active:cursor-grabbing hover:border-primary/30' : ''}
                ${isDragging ? 'opacity-30' : ''}
                transition-all duration-150
              `}
            >
              {/* Grip */}
              <div className={`flex-shrink-0 ${isSistema(etapa) ? 'opacity-20' : 'text-muted-foreground'}`}>
                {isSistema(etapa) ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <GripVertical className="w-4 h-4" />
                )}
              </div>

              {/* Color dot */}
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: etapa.cor || '#6B7280' }}
              />

              {/* Name */}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground">{etapa.nome}</span>
              </div>

              {/* Badge */}
              <span className={`
                px-2 py-0.5 rounded text-xs font-medium flex-shrink-0
                ${isSistema(etapa)
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-primary/10 text-primary'
                }
              `}>
                {tipoLabel(etapa.tipo)}
              </span>

              {/* Probabilidade */}
              <span className="text-xs text-muted-foreground flex-shrink-0 w-10 text-right">
                {etapa.probabilidade ?? 0}%
              </span>

              {/* Actions */}
              {!isSistema(etapa) && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => { setEditando(etapa); setShowModal(true) }}
                    className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-all duration-200"
                    title="Editar"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => excluirEtapa.mutate(etapa.id)}
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-all duration-200"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <EtapaFormModal
          etapa={editando}
          onClose={() => { setShowModal(false); setEditando(null) }}
          onSave={handleSave}
          loading={criarEtapa.isPending || atualizarEtapa.isPending}
        />
      )}
    </div>
  )
}