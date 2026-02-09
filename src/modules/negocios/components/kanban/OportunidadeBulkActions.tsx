/**
 * AIDEV-NOTE: Barra flutuante de ações em massa para oportunidades do Kanban
 * Segue o mesmo padrão visual de ContatoBulkActions
 */

import { Trash2, Download, ArrowRightLeft } from 'lucide-react'

interface OportunidadeBulkActionsProps {
  selectedCount: number
  onExcluir: () => void
  onExportar: () => void
  onMoverEtapa: () => void
  onClearSelection: () => void
}

export function OportunidadeBulkActions({
  selectedCount,
  onExcluir,
  onExportar,
  onMoverEtapa,
  onClearSelection,
}: OportunidadeBulkActionsProps) {
  if (selectedCount === 0) return null

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

      <button
        onClick={onMoverEtapa}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-background/10 transition-colors"
        title="Mover de etapa"
      >
        <ArrowRightLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Mover</span>
      </button>

      <button
        onClick={onExcluir}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md text-red-300 hover:bg-red-500/20 transition-colors"
        title="Excluir selecionados"
      >
        <Trash2 className="w-4 h-4" />
        <span className="hidden sm:inline">Excluir</span>
      </button>

      <div className="w-px h-5 bg-background/20" />

      <button
        onClick={onClearSelection}
        className="text-sm text-background/60 hover:text-background transition-colors"
      >
        Limpar
      </button>
    </div>
  )
}
