/**
 * AIDEV-NOTE: Barra flutuante de ações em massa para contatos
 * Conforme PRD-06 RF-016 e Design System
 * Integra AtribuirVendedorDropdown e SegmentarDropdown
 */

import { forwardRef, useState } from 'react'
import { Trash2, Download, AlertTriangle } from 'lucide-react'
import type { TipoContato } from '../services/contatos.api'
import { AtribuirVendedorDropdown } from './AtribuirVendedorDropdown'
import { SegmentarDropdown } from './SegmentarDropdown'

interface ContatoBulkActionsProps {
  selectedCount: number
  selectedIds: string[]
  tipo: TipoContato
  isAdmin: boolean
  onExcluir: () => void
  onExportar: () => void
  onClearSelection: () => void
}

export const ContatoBulkActions = forwardRef<HTMLDivElement, ContatoBulkActionsProps>(function ContatoBulkActions({
  selectedCount,
  selectedIds,
  tipo,
  isAdmin,
  onExcluir,
  onExportar,
  onClearSelection,
}, _ref) {
  const [confirmando, setConfirmando] = useState(false)

  if (selectedCount === 0) return null

  const handleExcluirClick = () => {
    if (confirmando) return
    setConfirmando(true)
  }

  const handleConfirmar = () => {
    setConfirmando(false)
    onExcluir()
  }

  const handleCancelar = () => {
    setConfirmando(false)
  }

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

      {tipo === 'pessoa' && isAdmin && (
        <>
          <AtribuirVendedorDropdown selectedIds={selectedIds} onComplete={onClearSelection} />
          <SegmentarDropdown selectedIds={selectedIds} onComplete={onClearSelection} />
        </>
      )}

      {!confirmando ? (
        <button
          onClick={handleExcluirClick}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md text-destructive hover:bg-destructive/20 transition-colors"
          title="Excluir selecionados"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Excluir</span>
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <span className="text-sm text-destructive font-medium">Confirmar?</span>
          <button
            onClick={handleConfirmar}
            className="px-3 py-1 text-sm font-medium bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
          >
            Sim
          </button>
          <button
            onClick={handleCancelar}
            className="px-3 py-1 text-sm text-background/70 hover:text-background transition-colors"
          >
            Não
          </button>
        </div>
      )}

      <div className="w-px h-5 bg-background/20" />

      <button
        onClick={onClearSelection}
        className="text-sm text-background/60 hover:text-background transition-colors"
      >
        Limpar
      </button>
    </div>
  )
})
ContatoBulkActions.displayName = 'ContatoBulkActions'
