/**
 * AIDEV-NOTE: Modal de exportação com seleção de colunas
 * Conforme PRD-06 RF-009 e Design System 10.5 - Modal/Dialog
 * - z-index: overlay 400, content 401
 * - Overlay: bg-black/80 backdrop-blur-sm
 * - Estrutura flex-col: header fixo, content scrollable, footer fixo
 * - Responsividade: w-[calc(100%-32px)] mobile, max-w-md desktop
 * - ARIA, ESC to close, focus trap
 */

import { useState, useEffect, useRef, useId, forwardRef } from 'react'
import { X, Download } from 'lucide-react'
import { contatosApi, type ListarContatosParams, type TipoContato } from '../services/contatos.api'

interface ColumnOption {
  key: string
  label: string
  dbField: string
}

const COLUNAS_PESSOA: ColumnOption[] = [
  { key: 'nome', label: 'Nome', dbField: 'nome' },
  { key: 'sobrenome', label: 'Sobrenome', dbField: 'sobrenome' },
  { key: 'email', label: 'Email', dbField: 'email' },
  { key: 'telefone', label: 'Telefone', dbField: 'telefone' },
  { key: 'cargo', label: 'Cargo', dbField: 'cargo' },
  { key: 'linkedin_url', label: 'LinkedIn', dbField: 'linkedin_url' },
  { key: 'status', label: 'Status', dbField: 'status' },
  { key: 'origem', label: 'Origem', dbField: 'origem' },
  { key: 'criado_em', label: 'Criado em', dbField: 'criado_em' },
]

const COLUNAS_EMPRESA: ColumnOption[] = [
  { key: 'razao_social', label: 'Razão Social', dbField: 'razao_social' },
  { key: 'nome_fantasia', label: 'Nome Fantasia', dbField: 'nome_fantasia' },
  { key: 'cnpj', label: 'CNPJ', dbField: 'cnpj' },
  { key: 'email', label: 'Email', dbField: 'email' },
  { key: 'telefone', label: 'Telefone', dbField: 'telefone' },
  { key: 'website', label: 'Website', dbField: 'website' },
  { key: 'segmento', label: 'Segmento', dbField: 'segmento' },
  { key: 'porte', label: 'Porte', dbField: 'porte' },
  { key: 'status', label: 'Status', dbField: 'status' },
  { key: 'origem', label: 'Origem', dbField: 'origem' },
  { key: 'criado_em', label: 'Criado em', dbField: 'criado_em' },
]

interface ExportarContatosModalProps {
  open: boolean
  onClose: () => void
  tipo: TipoContato
  filtros: ListarContatosParams
  selectedIds?: string[]
}

export const ExportarContatosModal = forwardRef<HTMLDivElement, ExportarContatosModalProps>(function ExportarContatosModal({
  open,
  onClose,
  tipo,
  filtros,
  selectedIds,
}, _ref) {
  const colunas = tipo === 'pessoa' ? COLUNAS_PESSOA : COLUNAS_EMPRESA
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    () => new Set(colunas.map(c => c.key))
  )
  const [loading, setLoading] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  const allSelected = selectedColumns.size === colunas.length

  // ESC to close + focus trap
  useEffect(() => {
    if (!open) return

    const prev = document.activeElement as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
      prev?.focus()
    }
  }, [open, onClose])

  const toggleColumn = (key: string) => {
    setSelectedColumns(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size > 1) next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (allSelected) {
      setSelectedColumns(new Set([colunas[0].key]))
    } else {
      setSelectedColumns(new Set(colunas.map(c => c.key)))
    }
  }

  const handleExportar = async () => {
    setLoading(true)
    try {
      const colunasExportar = colunas.filter(c => selectedColumns.has(c.key))
      const csv = await contatosApi.exportarComColunas({
        ...filtros,
        tipo,
        colunas: colunasExportar.map(c => ({ key: c.dbField, label: c.label })),
        ids: selectedIds,
      })

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `contatos_${tipo}_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      onClose()
    } catch {
      // Error handled by toast
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const temFiltros = filtros.status || filtros.origem || filtros.busca || filtros.segmento_id || filtros.owner_id || filtros.data_inicio

  return (
    <>
      {/* Overlay - z-400 */}
      <div
        className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog container - z-401 */}
      <div className="fixed inset-0 z-[401] flex items-center justify-center pointer-events-none">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="
            pointer-events-auto
            bg-card border border-border rounded-lg shadow-lg
            flex flex-col
            w-[calc(100%-32px)] sm:max-w-md
            max-h-[calc(100dvh-32px)] sm:max-h-[85vh]
          "
        >
          {/* Header */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <h2 id={titleId} className="text-lg font-semibold text-foreground">Exportar Contatos</h2>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-accent rounded-md transition-all duration-200" aria-label="Fechar">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 min-h-0 overscroll-contain space-y-4">
            <p className="text-sm text-muted-foreground">
              {selectedIds && selectedIds.length > 0
                ? `Exportando ${selectedIds.length} contato(s) selecionado(s)`
                : temFiltros
                  ? 'Exportando contatos com filtros aplicados'
                  : `Exportando todos(as) ${tipo === 'pessoa' ? 'pessoas' : 'empresas'}`}
            </p>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Colunas para exportar</label>
                <button type="button" onClick={toggleAll} className="text-xs text-primary hover:underline">
                  {allSelected ? 'Desmarcar todas' : 'Selecionar todas'}
                </button>
              </div>
              <div className="space-y-1 max-h-[240px] overflow-y-auto border border-border rounded-md p-2">
                {colunas.map(col => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedColumns.has(col.key)}
                      onChange={() => toggleColumn(col.key)}
                      className="rounded border-input"
                    />
                    <span className="text-sm text-foreground">{col.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-t border-border bg-card rounded-b-lg">
            <div className="flex justify-end gap-2 sm:gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-md border border-border text-foreground hover:bg-accent transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleExportar}
                disabled={loading || selectedColumns.size === 0}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {loading ? 'Exportando...' : 'Exportar CSV'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
})
ExportarContatosModal.displayName = 'ExportarContatosModal'
