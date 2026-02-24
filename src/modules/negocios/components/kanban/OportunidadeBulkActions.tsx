/**
 * AIDEV-NOTE: Barra flutuante de ações em massa para oportunidades do Kanban
 * Segue o padrão visual de ContatoBulkActions
 * Inclui: Exportar, Mover etapa (mesma pipeline ou outra), Segmentar/Tags, Excluir
 */

import React, { useState, useRef, useEffect } from 'react'
import { Trash2, Download, ArrowRightLeft, Tag, Plus, Minus, AlertTriangle, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import type { EtapaFunil } from '../../services/negocios.api'
import { useSegmentos, useSegmentarLote } from '@/modules/contatos/hooks/useSegmentos'
import { useFunis, useFunilComEtapas } from '../../hooks/useFunis'

interface OportunidadeBulkActionsProps {
  selectedCount: number
  selectedIds: string[]
  contatoIds: string[]
  etapas: EtapaFunil[]
  etapasAtuaisIds: Set<string>
  funilAtualId: string
  onExcluir: () => void
  onExportar: () => void
  onMoverEtapa: (etapaId: string) => void
  onMoverParaOutraPipeline: (funilId: string, etapaId: string) => void
  onClearSelection: () => void
  isDeleting?: boolean
  isMoving?: boolean
}

export const OportunidadeBulkActions = React.forwardRef<HTMLDivElement, OportunidadeBulkActionsProps>(
  function OportunidadeBulkActionsInner({
  selectedCount,
  selectedIds: _selectedIds,
  contatoIds,
  etapas,
  etapasAtuaisIds,
  funilAtualId,
  onExcluir,
  onExportar,
  onMoverEtapa,
  onMoverParaOutraPipeline,
  onClearSelection,
  isDeleting,
  isMoving,
}, _ref) {
  const [showMover, setShowMover] = useState(false)
  const [showTags, setShowTags] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null)
  const moverRef = useRef<HTMLDivElement>(null)
  const tagsRef = useRef<HTMLDivElement>(null)

  const { data: segmentosData } = useSegmentos()
  const segmentarLote = useSegmentarLote()
  const segmentos = segmentosData?.segmentos || []

  // Pipelines disponíveis (excluindo a atual)
  const { data: funisData } = useFunis()
  const outrasPipelines = (funisData || []).filter(
    (f: any) => f.id !== funilAtualId && !f.arquivado
  )

  // Etapas da pipeline selecionada
  const { data: funilSelecionado } = useFunilComEtapas(selectedPipelineId)
  const etapasPipelineSelecionada = funilSelecionado?.etapas?.filter(
    (e: any) => e.tipo !== 'ganho' && e.tipo !== 'perda'
  ) || []

  // Reset selectedPipeline quando dropdown fecha
  useEffect(() => {
    if (!showMover) setSelectedPipelineId(null)
  }, [showMover])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moverRef.current && !moverRef.current.contains(e.target as Node)) setShowMover(false)
      if (tagsRef.current && !tagsRef.current.contains(e.target as Node)) setShowTags(false)
    }
    if (showMover || showTags) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMover, showTags])

  if (selectedCount === 0) return null

  const queryClient = useQueryClient()

  const handleAdicionar = (segmentoId: string) => {
    segmentarLote.mutate(
      { ids: contatoIds, adicionar: [segmentoId], remover: [] },
      { onSuccess: () => {
        // AIDEV-NOTE: Invalidar kanban para refletir tags nos cards imediatamente
        queryClient.invalidateQueries({ queryKey: ['kanban'] })
        setShowTags(false)
        onClearSelection()
      }}
    )
  }

  const handleRemover = (segmentoId: string) => {
    segmentarLote.mutate(
      { ids: contatoIds, adicionar: [], remover: [segmentoId] },
      { onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['kanban'] })
        setShowTags(false)
        onClearSelection()
      }}
    )
  }

  // Etapas normais (sem ganho/perda) para mover em massa na pipeline atual
  const etapasMoviveis = etapas.filter(e => e.tipo !== 'ganho' && e.tipo !== 'perda')

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-foreground text-background rounded-lg shadow-xl px-2 py-2 sm:px-4 sm:py-3 flex items-center gap-1.5 sm:gap-3 animate-in slide-in-from-bottom-4 max-w-[calc(100vw-32px)]">
      <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
        {selectedCount} sel.
      </span>

      <div className="w-px h-5 bg-background/20" />

      <button
        onClick={onExportar}
        className="flex items-center justify-center gap-1.5 min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 px-2 py-1.5 sm:px-3 text-sm rounded-md hover:bg-background/10 transition-colors"
        title="Exportar selecionados"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Exportar</span>
      </button>

      {/* Mover Etapa Dropdown */}
      <div ref={moverRef} className="relative">
        <button
          onClick={() => { setShowMover(!showMover); setShowTags(false) }}
          disabled={isMoving}
          className="flex items-center justify-center gap-1.5 min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 px-2 py-1.5 sm:px-3 text-sm rounded-md hover:bg-background/10 transition-colors disabled:opacity-50"
          title="Mover de etapa"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Mover</span>
        </button>

        {showMover && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 w-56 bg-background rounded-lg shadow-lg border border-border py-1 z-50 max-h-80 overflow-y-auto">
            {/* Se nenhuma pipeline selecionada: mostrar lista principal */}
            {!selectedPipelineId ? (
              <>
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium text-foreground">Mover para:</p>
                </div>

                {/* Seção: Pipeline atual */}
                <div className="px-3 py-1.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pipeline atual</p>
                </div>
                {etapasMoviveis.map(etapa => {
                  const isAtual = etapasAtuaisIds.has(etapa.id)
                  return (
                    <button
                      key={etapa.id}
                      onClick={() => { onMoverEtapa(etapa.id); setShowMover(false) }}
                      className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm transition-colors ${
                        isAtual
                          ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary'
                          : 'text-foreground hover:bg-accent'
                      }`}
                    >
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: etapa.cor || '#6B7280' }} />
                      <span className="truncate">{etapa.nome}</span>
                      {isAtual && <span className="ml-auto text-[10px] text-primary/70">atual</span>}
                    </button>
                  )
                })}

                {/* Seção: Outra pipeline */}
                {outrasPipelines.length > 0 && (
                  <>
                    <div className="border-t border-border mt-1 pt-1">
                      <div className="px-3 py-1.5">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Outra pipeline</p>
                      </div>
                      {outrasPipelines.map((funil: any) => (
                        <button
                          key={funil.id}
                          onClick={() => setSelectedPipelineId(funil.id)}
                          className="flex items-center justify-between gap-2 w-full px-3 py-1.5 text-sm text-foreground hover:bg-accent transition-colors"
                        >
                          <span className="truncate">{funil.nome}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              /* Sub-tela: etapas da pipeline selecionada */
              <>
                <button
                  onClick={() => setSelectedPipelineId(null)}
                  className="flex items-center gap-1.5 w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors border-b border-border"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Voltar</span>
                </button>
                <div className="px-3 py-1.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                    {outrasPipelines.find((f: any) => f.id === selectedPipelineId)?.nome}
                  </p>
                </div>
                {etapasPipelineSelecionada.length === 0 ? (
                  <p className="px-3 py-3 text-xs text-muted-foreground text-center">Carregando...</p>
                ) : (
                  etapasPipelineSelecionada.map((etapa: any) => (
                    <button
                      key={etapa.id}
                      onClick={() => {
                        onMoverParaOutraPipeline(selectedPipelineId!, etapa.id)
                        setShowMover(false)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: etapa.cor || '#6B7280' }} />
                      <span className="truncate">{etapa.nome}</span>
                    </button>
                  ))
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Tags/Segmentar Dropdown */}
      <div ref={tagsRef} className="relative">
        <button
          onClick={() => { setShowTags(!showTags); setShowMover(false) }}
          disabled={segmentarLote.isPending}
          className="flex items-center justify-center gap-1.5 min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 px-2 py-1.5 sm:px-3 text-sm rounded-md hover:bg-background/10 transition-colors disabled:opacity-50"
          title="Segmentar"
        >
          <Tag className="w-4 h-4" />
          <span className="hidden sm:inline">Tags</span>
        </button>

        {showTags && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 w-60 bg-background rounded-lg shadow-lg border border-border py-1 z-50 max-h-64 overflow-y-auto">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-sm font-medium text-foreground">
                Segmentar {selectedCount} oportunidade(s):
              </p>
            </div>

            {segmentos.length === 0 ? (
              <p className="px-3 py-4 text-xs text-muted-foreground text-center">Nenhum segmento criado</p>
            ) : (
              <>
                <div className="px-3 py-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Adicionar</p>
                </div>
                {segmentos.map(seg => (
                  <button
                    key={`add-${seg.id}`}
                    onClick={() => handleAdicionar(seg.id)}
                    disabled={segmentarLote.isPending}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <Plus className="w-3 h-3 text-muted-foreground" />
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.cor }} />
                    <span className="truncate">{seg.nome}</span>
                  </button>
                ))}
                <div className="border-t border-border mt-1 pt-1">
                  <div className="px-3 py-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Remover</p>
                  </div>
                  {segmentos.map(seg => (
                    <button
                      key={`rem-${seg.id}`}
                      onClick={() => handleRemover(seg.id)}
                      disabled={segmentarLote.isPending}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.cor }} />
                      <span className="truncate">{seg.nome}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Excluir com confirmação */}
      {!showConfirmDelete ? (
        <button
          onClick={() => setShowConfirmDelete(true)}
          className="flex items-center justify-center gap-1.5 min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 px-2 py-1.5 sm:px-3 text-sm rounded-md text-destructive hover:bg-destructive/20 transition-colors"
          title="Excluir selecionados"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Excluir</span>
        </button>
      ) : (
        <div className="flex items-center gap-1">
          <AlertTriangle className="w-4 h-4 text-destructive hidden sm:block" />
          <span className="text-xs text-destructive hidden sm:inline">Confirmar?</span>
          <button
            onClick={() => { onExcluir(); setShowConfirmDelete(false) }}
            disabled={isDeleting}
            className="px-2 py-1 text-xs rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
          >
            {isDeleting ? '...' : 'Sim'}
          </button>
          <button
            onClick={() => setShowConfirmDelete(false)}
            className="px-2 py-1 text-xs rounded hover:bg-background/10 transition-colors"
          >
            Não
          </button>
        </div>
      )}

      <div className="w-px h-5 bg-background/20" />

      <button
        onClick={onClearSelection}
        className="flex items-center justify-center w-7 h-7 rounded-md text-background/60 hover:text-background hover:bg-background/10 transition-colors"
        title="Fechar e desselecionar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
})

OportunidadeBulkActions.displayName = 'OportunidadeBulkActions'
