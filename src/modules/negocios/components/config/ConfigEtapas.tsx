/**
 * AIDEV-NOTE: Aba Etapas da configuração de pipeline
 * Conforme PRD-07 RF-04 - Etapas com reordenação por setas ↑↓
 */

import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Lock, ChevronUp, ChevronDown, Tag } from 'lucide-react'
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

  // Índices dos personalizados dentro de etapasOrdenadas
  const customIndices = useMemo(() => {
    return etapasOrdenadas
      .map((e, i) => ({ etapa: e, index: i }))
      .filter(({ etapa }) => !isSistema(etapa))
  }, [etapasOrdenadas])

  const canMoveUp = (etapaId: string) => {
    const pos = customIndices.findIndex(c => c.etapa.id === etapaId)
    return pos > 0
  }

  const canMoveDown = (etapaId: string) => {
    const pos = customIndices.findIndex(c => c.etapa.id === etapaId)
    return pos >= 0 && pos < customIndices.length - 1
  }

  const handleMove = (etapaId: string, direction: 'up' | 'down') => {
    const pos = customIndices.findIndex(c => c.etapa.id === etapaId)
    if (pos === -1) return

    const newCustom = customIndices.map(c => c.etapa)
    const targetPos = direction === 'up' ? pos - 1 : pos + 1
    if (targetPos < 0 || targetPos >= newCustom.length) return

    // Swap
    const temp = newCustom[pos]
    newCustom[pos] = newCustom[targetPos]
    newCustom[targetPos] = temp

    // Rebuild full list with new order
    const allEtapas = etapasOrdenadas.map(e => {
      if (isSistema(e)) return e
      const customIdx = newCustom.findIndex(c => c.id === e.id)
      return customIdx >= 0 ? newCustom[customIdx] : e
    })

    // Filtrar para só pegar os na nova ordem correta
    const entrada = allEtapas.filter(e => e.tipo === 'entrada')
    const ganho = allEtapas.filter(e => e.tipo === 'ganho')
    const perda = allEtapas.filter(e => e.tipo === 'perda')
    const finalList = [...entrada, ...newCustom, ...ganho, ...perda]

    reordenar.mutate(finalList.map((e, i) => ({ id: e.id, ordem: i })))
  }

  const handleSave = async (payload: { nome: string; cor: string; probabilidade: number; etiqueta_whatsapp?: string | null }) => {
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
        {etapasOrdenadas.map((etapa) => (
          <div
            key={etapa.id}
            className="flex items-center gap-2 sm:gap-3 p-3 rounded-lg border border-border bg-card transition-all duration-200"
          >
            {/* Setas ou Lock */}
            <div className="flex-shrink-0">
              {isSistema(etapa) ? (
                <Lock className="w-4 h-4 text-muted-foreground/30" />
              ) : (
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => handleMove(etapa.id, 'up')}
                    disabled={!canMoveUp(etapa.id) || reordenar.isPending}
                    className="p-0.5 rounded hover:bg-accent text-muted-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200"
                    title="Mover para cima"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMove(etapa.id, 'down')}
                    disabled={!canMoveDown(etapa.id) || reordenar.isPending}
                    className="p-0.5 rounded hover:bg-accent text-muted-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200"
                    title="Mover para baixo"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Color dot */}
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: etapa.cor || '#6B7280' }}
            />

            {/* Name + etiqueta */}
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground truncate block">{etapa.nome}</span>
              {(etapa as any).etiqueta_whatsapp && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                  <Tag className="w-2.5 h-2.5" />
                  {(etapa as any).etiqueta_whatsapp}
                </span>
              )}
            </div>

            {/* Badge + Probabilidade + Actions em linha, sem wrap */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={`
                px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium whitespace-nowrap
                ${isSistema(etapa)
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-primary/10 text-primary'
                }
              `}>
                {tipoLabel(etapa.tipo)}
              </span>

              <span className="text-xs text-muted-foreground w-8 text-right">
                {etapa.probabilidade ?? 0}%
              </span>

              <button
                onClick={() => { setEditando(etapa); setShowModal(true) }}
                className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-all duration-200"
                title="Editar"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              {!isSistema(etapa) && (
                <button
                  onClick={() => excluirEtapa.mutate(etapa.id)}
                  className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-all duration-200"
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
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
