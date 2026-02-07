/**
 * AIDEV-NOTE: Aba Etapas da configuração de pipeline
 * Conforme PRD-07 RF-04 - Etapas com drag reorder
 * Usa CSS transforms para reordenação visual (DOM estável, sem flickering)
 */

import { useState, useMemo, useRef, useCallback } from 'react'
import { GripVertical, Plus, Pencil, Trash2, Lock } from 'lucide-react'
import { useEtapasFunil, useCriarEtapa, useAtualizarEtapa, useExcluirEtapa, useReordenarEtapas } from '../../hooks/usePipelineConfig'
import { EtapaFormModal } from './EtapaFormModal'
import type { EtapaFunil } from '../../services/pipeline-config.api'

const ITEM_HEIGHT = 52 // altura aproximada de cada linha (p-3 + gap)

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

  // Drag state — refs para evitar re-renders desnecessários no dragEnter
  const dragIdRef = useRef<string | null>(null)
  const overIdRef = useRef<string | null>(null)
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

  // Calcula o estilo CSS (transform) para cada item durante o drag
  const getItemStyle = useCallback((etapaId: string): React.CSSProperties => {
    if (!dragId || !overId || dragId === overId) {
      return { transition: 'transform 150ms ease' }
    }

    const dragIdx = etapasOrdenadas.findIndex(e => e.id === dragId)
    const overIdx = etapasOrdenadas.findIndex(e => e.id === overId)
    const currentIdx = etapasOrdenadas.findIndex(e => e.id === etapaId)

    if (dragIdx === -1 || overIdx === -1 || currentIdx === -1) {
      return { transition: 'transform 150ms ease' }
    }

    // O item sendo arrastado fica translúcido
    if (etapaId === dragId) {
      return {
        opacity: 0.4,
        transition: 'transform 150ms ease',
      }
    }

    // Arrastando para baixo: itens entre drag+1 e over sobem
    if (dragIdx < overIdx) {
      if (currentIdx > dragIdx && currentIdx <= overIdx) {
        return {
          transform: `translateY(-${ITEM_HEIGHT}px)`,
          transition: 'transform 150ms ease',
        }
      }
    }

    // Arrastando para cima: itens entre over e drag-1 descem
    if (dragIdx > overIdx) {
      if (currentIdx >= overIdx && currentIdx < dragIdx) {
        return {
          transform: `translateY(${ITEM_HEIGHT}px)`,
          transition: 'transform 150ms ease',
        }
      }
    }

    return { transition: 'transform 150ms ease' }
  }, [dragId, overId, etapasOrdenadas])

  const handleDragStart = (e: React.DragEvent, etapa: EtapaFunil) => {
    if (isSistema(etapa)) { e.preventDefault(); return }
    e.dataTransfer.effectAllowed = 'move'
    // Criar imagem de drag transparente (1x1) para esconder o "fantasma" padrão do browser
    const emptyImg = document.createElement('canvas')
    emptyImg.width = 1
    emptyImg.height = 1
    e.dataTransfer.setDragImage(emptyImg, 0, 0)
    dragIdRef.current = etapa.id
    overIdRef.current = etapa.id
    setDragId(etapa.id)
    setOverId(etapa.id)
  }

  const handleDragEnter = (e: React.DragEvent, etapa: EtapaFunil) => {
    e.preventDefault()
    if (!dragIdRef.current || isSistema(etapa)) return
    // Só atualiza state se realmente mudou — evita re-renders
    if (overIdRef.current !== etapa.id) {
      overIdRef.current = etapa.id
      setOverId(etapa.id)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = () => {
    const currentDragId = dragIdRef.current
    const currentOverId = overIdRef.current
    if (!currentDragId || !currentOverId || currentDragId === currentOverId) {
      resetDrag()
      return
    }

    const fromIdx = etapasOrdenadas.findIndex(e => e.id === currentDragId)
    const toIdx = etapasOrdenadas.findIndex(e => e.id === currentOverId)
    if (fromIdx === -1 || toIdx === -1) { resetDrag(); return }

    // Montar nova ordem
    const newEtapas = [...etapasOrdenadas]
    const [moved] = newEtapas.splice(fromIdx, 1)
    newEtapas.splice(toIdx, 0, moved)

    reordenar.mutate(newEtapas.map((e, i) => ({ id: e.id, ordem: i })))
    resetDrag()
  }

  const resetDrag = () => {
    dragIdRef.current = null
    overIdRef.current = null
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

      {/* Lista de etapas — DOM estável, reordenação visual via CSS transform */}
      <div className="space-y-1.5">
        {etapasOrdenadas.map((etapa) => (
          <div
            key={etapa.id}
            draggable={!isSistema(etapa)}
            onDragStart={(e) => handleDragStart(e, etapa)}
            onDragEnter={(e) => handleDragEnter(e, etapa)}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={resetDrag}
            style={getItemStyle(etapa.id)}
            className={`
              flex items-center gap-3 p-3 rounded-lg border border-border bg-card
              ${!isSistema(etapa) ? 'cursor-grab active:cursor-grabbing hover:border-primary/30' : ''}
            `}
          >
            {/* Grip — pointer-events: none durante drag para evitar interceptar eventos */}
            <div
              className={`flex-shrink-0 ${isSistema(etapa) ? 'opacity-20' : 'text-muted-foreground'}`}
              style={dragId ? { pointerEvents: 'none' } : undefined}
            >
              {isSistema(etapa) ? (
                <Lock className="w-4 h-4" />
              ) : (
                <GripVertical className="w-4 h-4" />
              )}
            </div>

            {/* Color dot */}
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: etapa.cor || '#6B7280', ...(dragId ? { pointerEvents: 'none' } : {}) } as React.CSSProperties}
            />

            {/* Name */}
            <div className="flex-1 min-w-0" style={dragId ? { pointerEvents: 'none' } : undefined}>
              <span className="text-sm font-medium text-foreground">{etapa.nome}</span>
            </div>

            {/* Badge */}
            <span
              className={`
                px-2 py-0.5 rounded text-xs font-medium flex-shrink-0
                ${isSistema(etapa)
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-primary/10 text-primary'
                }
              `}
              style={dragId ? { pointerEvents: 'none' } : undefined}
            >
              {tipoLabel(etapa.tipo)}
            </span>

            {/* Probabilidade */}
            <span
              className="text-xs text-muted-foreground flex-shrink-0 w-10 text-right"
              style={dragId ? { pointerEvents: 'none' } : undefined}
            >
              {etapa.probabilidade ?? 0}%
            </span>

            {/* Actions */}
            {!isSistema(etapa) && (
              <div
                className="flex items-center gap-1 flex-shrink-0"
                style={dragId ? { pointerEvents: 'none' } : undefined}
              >
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
        ))}
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
