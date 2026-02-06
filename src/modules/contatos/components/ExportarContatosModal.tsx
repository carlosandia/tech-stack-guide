/**
 * AIDEV-NOTE: Modal de exportação com seleção de colunas
 * Conforme PRD-06 RF-009 e Design System
 */

import { useState } from 'react'
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

export function ExportarContatosModal({
  open,
  onClose,
  tipo,
  filtros,
  selectedIds,
}: ExportarContatosModalProps) {
  const colunas = tipo === 'pessoa' ? COLUNAS_PESSOA : COLUNAS_EMPRESA
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    () => new Set(colunas.map(c => c.key))
  )
  const [loading, setLoading] = useState(false)

  const allSelected = selectedColumns.size === colunas.length

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
    <div className="fixed inset-0 z-[500] flex items-center justify-center">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Exportar Contatos</h3>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-md transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-sm text-muted-foreground">
            {selectedIds && selectedIds.length > 0
              ? `Exportando ${selectedIds.length} contato(s) selecionado(s)`
              : temFiltros
                ? 'Exportando contatos com filtros aplicados'
                : `Exportando todos(as) ${tipo === 'pessoa' ? 'pessoas' : 'empresas'}`}
          </div>

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
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 cursor-pointer"
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
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-md border border-border text-foreground hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleExportar}
            disabled={loading || selectedColumns.size === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {loading ? 'Exportando...' : 'Exportar CSV'}
          </button>
        </div>
      </div>
    </div>
  )
}
