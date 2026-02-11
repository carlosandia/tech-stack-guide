/**
 * AIDEV-NOTE: Barra flutuante de ações em massa para oportunidades do Kanban
 * Segue o padrão visual de ContatoBulkActions
 * Inclui: Exportar, Mover etapa, Segmentar/Tags, Excluir
 */

import { useState, useRef, useEffect } from 'react'
import { Trash2, Download, ArrowRightLeft, Tag, Plus, Minus, AlertTriangle, X } from 'lucide-react'
import type { EtapaFunil } from '../../services/negocios.api'
import { useSegmentos, useSegmentarLote } from '@/modules/contatos/hooks/useSegmentos'

interface OportunidadeBulkActionsProps {
  selectedCount: number
  selectedIds: string[]
  contatoIds: string[]
  etapas: EtapaFunil[]
  onExcluir: () => void
  onExportar: () => void
  onMoverEtapa: (etapaId: string) => void
  onClearSelection: () => void
  isDeleting?: boolean
  isMoving?: boolean
}

export function OportunidadeBulkActions({
  selectedCount,
  selectedIds: _selectedIds,
  contatoIds,
  etapas,
  onExcluir,
  onExportar,
  onMoverEtapa,
  onClearSelection,
  isDeleting,
  isMoving,
}: OportunidadeBulkActionsProps) {
  const [showMover, setShowMover] = useState(false)
  const [showTags, setShowTags] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const moverRef = useRef<HTMLDivElement>(null)
  const tagsRef = useRef<HTMLDivElement>(null)

  const { data: segmentosData } = useSegmentos()
  const segmentarLote = useSegmentarLote()
  const segmentos = segmentosData?.segmentos || []

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

  const handleAdicionar = (segmentoId: string) => {
    segmentarLote.mutate(
      { ids: contatoIds, adicionar: [segmentoId], remover: [] },
      { onSuccess: () => { setShowTags(false); onClearSelection() } }
    )
  }

  const handleRemover = (segmentoId: string) => {
    segmentarLote.mutate(
      { ids: contatoIds, adicionar: [], remover: [segmentoId] },
      { onSuccess: () => { setShowTags(false); onClearSelection() } }
    )
  }

  // Etapas normais (sem ganho/perda) para mover em massa
  const etapasMoviveis = etapas.filter(e => e.tipo !== 'ganho' && e.tipo !== 'perda')

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-foreground text-background rounded-lg shadow-xl px-4 py-3 flex items-center gap-3 animate-in slide-in-from-bottom-4">
      <span className="text-sm font-medium whitespace-nowrap">
        {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
      </span>

      <div className="w-px h-5 bg-background/20" />

      <button
        onClick={onExportar}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-background/10 transition-colors"
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
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-background/10 transition-colors disabled:opacity-50"
          title="Mover de etapa"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Mover</span>
        </button>

        {showMover && (
          <div className="absolute bottom-full mb-2 left-0 w-52 bg-background rounded-lg shadow-lg border border-border py-1 z-50">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-sm font-medium text-foreground">Mover para:</p>
            </div>
            {etapasMoviveis.map(etapa => (
              <button
                key={etapa.id}
                onClick={() => { onMoverEtapa(etapa.id); setShowMover(false) }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-foreground hover:bg-accent transition-colors"
              >
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: etapa.cor || '#6B7280' }} />
                <span className="truncate">{etapa.nome}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tags/Segmentar Dropdown */}
      <div ref={tagsRef} className="relative">
        <button
          onClick={() => { setShowTags(!showTags); setShowMover(false) }}
          disabled={segmentarLote.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-background/10 transition-colors disabled:opacity-50"
          title="Segmentar"
        >
          <Tag className="w-4 h-4" />
          <span className="hidden sm:inline">Tags</span>
        </button>

        {showTags && (
          <div className="absolute bottom-full mb-2 left-0 w-60 bg-background rounded-lg shadow-lg border border-border py-1 z-50 max-h-64 overflow-y-auto">
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
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md text-destructive hover:bg-destructive/20 transition-colors"
          title="Excluir selecionados"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Excluir</span>
        </button>
      ) : (
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <span className="text-xs text-destructive">Confirmar?</span>
          <button
            onClick={() => { onExcluir(); setShowConfirmDelete(false) }}
            disabled={isDeleting}
            className="px-2 py-1 text-xs rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Excluindo...' : 'Sim'}
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
}
