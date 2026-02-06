/**
 * AIDEV-NOTE: Página principal do módulo de Contatos
 * Conforme PRD-06 - Tabs Pessoas/Empresas
 * Integra com AppToolbar via useAppToolbar
 * Inclui: busca, filtros completos, toggle colunas, paginação,
 * segmentos manager, duplicatas, importação
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, Download, Upload, Users2, Building2, X, Tag, GitMerge, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useAppToolbar } from '@/modules/app/contexts/AppToolbarContext'
import { useContatos, useCriarContato, useAtualizarContato, useExcluirContato, useExcluirContatosLote } from '../hooks/useContatos'
import { useSegmentos } from '../hooks/useSegmentos'
import type { Contato, TipoContato, ListarContatosParams } from '../services/contatos.api'
import { ContatosList } from '../components/ContatosList'
import { ContatoFormModal } from '../components/ContatoFormModal'
import { ContatoViewModal } from '../components/ContatoViewModal'
import { ContatoBulkActions } from '../components/ContatoBulkActions'
import { ConfirmarExclusaoModal } from '../components/ConfirmarExclusaoModal'
import { SegmentosManager } from '../components/SegmentosManager'
import { DuplicatasModal } from '../components/DuplicatasModal'
import { ImportarContatosModal } from '../components/ImportarContatosModal'
import { ContatoColumnsToggle, getInitialColumns, type ColumnConfig } from '../components/ContatoColumnsToggle'
import { StatusContatoOptions, OrigemContatoOptions } from '../schemas/contatos.schema'
import { contatosApi } from '../services/contatos.api'

export function ContatosPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { role } = useAuth()
  const { setActions, setSubtitle } = useAppToolbar()

  const isAdmin = role === 'admin'

  // Tab ativa baseada na URL
  const tipo: TipoContato = location.pathname.includes('/empresas') ? 'empresa' : 'pessoa'

  // Estado de filtros
  const [busca, setBusca] = useState('')
  const [debouncedBusca, setDebouncedBusca] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [origemFilter, setOrigemFilter] = useState('')
  const [segmentoFilter, setSegmentoFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const perPage = 50

  // Estado de seleção
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Estado de modais
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [segmentosModalOpen, setSegmentosModalOpen] = useState(false)
  const [duplicatasModalOpen, setDuplicatasModalOpen] = useState(false)
  const [importarModalOpen, setImportarModalOpen] = useState(false)
  const [editingContato, setEditingContato] = useState<Contato | null>(null)
  const [viewingContato, setViewingContato] = useState<Contato | null>(null)
  const [deletingContato, setDeletingContato] = useState<Contato | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Toggle de colunas
  const [columns, setColumns] = useState<ColumnConfig[]>(() => getInitialColumns(tipo))

  // Segmentos para filtro
  const { data: segmentosData } = useSegmentos()
  const segmentos = segmentosData?.segmentos || []

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedBusca(busca), 300)
    return () => clearTimeout(timer)
  }, [busca])

  // Parâmetros da query
  const params: ListarContatosParams = useMemo(() => ({
    tipo,
    busca: debouncedBusca || undefined,
    status: (statusFilter || undefined) as ListarContatosParams['status'],
    origem: (origemFilter || undefined) as ListarContatosParams['origem'],
    segmento_id: segmentoFilter || undefined,
    page,
    limit: perPage,
  }), [tipo, debouncedBusca, statusFilter, origemFilter, segmentoFilter, page])

  const { data, isLoading } = useContatos(params)
  const criarContato = useCriarContato()
  const atualizarContato = useAtualizarContato()
  const excluirContato = useExcluirContato()
  const excluirLote = useExcluirContatosLote()

  // Limpar seleção e resetar página ao trocar de tab
  useEffect(() => {
    setSelectedIds(new Set())
    setPage(1)
    setColumns(getInitialColumns(tipo))
  }, [tipo])

  // Contagem de filtros ativos
  const filtrosAtivos = [statusFilter, origemFilter, segmentoFilter].filter(Boolean).length

  // Toolbar actions
  useEffect(() => {
    setSubtitle(data ? `${data.total} ${tipo === 'pessoa' ? 'pessoa(s)' : 'empresa(s)'}` : '')
    setActions(
      <div className="flex items-center gap-2">
        {isAdmin && (
          <>
            <button
              onClick={() => setImportarModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-border text-foreground hover:bg-accent transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Importar</span>
            </button>
            <button
              onClick={() => setDuplicatasModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-border text-foreground hover:bg-accent transition-colors"
            >
              <GitMerge className="w-4 h-4" />
              <span className="hidden sm:inline">Duplicatas</span>
            </button>
          </>
        )}
        <button
          onClick={() => { setEditingContato(null); setFormModalOpen(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{tipo === 'pessoa' ? 'Nova Pessoa' : 'Nova Empresa'}</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>
    )
    return () => { setActions(null); setSubtitle('') }
  }, [tipo, data, isAdmin, setActions, setSubtitle])

  // Handlers
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleToggleSelectAll = useCallback(() => {
    if (!data) return
    const all = data.contatos.every((c) => selectedIds.has(c.id))
    if (all) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(data.contatos.map((c) => c.id)))
    }
  }, [data, selectedIds])

  const handleFormSubmit = (formData: Record<string, unknown>) => {
    if (editingContato) {
      atualizarContato.mutate(
        { id: editingContato.id, payload: formData },
        { onSuccess: () => setFormModalOpen(false) }
      )
    } else {
      criarContato.mutate(formData, { onSuccess: () => setFormModalOpen(false) })
    }
  }

  const handleDelete = () => {
    if (!deletingContato) return
    setDeleteError(null)
    excluirContato.mutate(deletingContato.id, {
      onSuccess: () => {
        setDeleteModalOpen(false)
        setDeletingContato(null)
        setViewModalOpen(false)
      },
      onError: (err: any) => {
        setDeleteError(err?.response?.data?.error || 'Erro ao excluir contato')
      },
    })
  }

  const handleBulkDelete = () => {
    excluirLote.mutate(
      { ids: Array.from(selectedIds), tipo },
      { onSuccess: () => setSelectedIds(new Set()) }
    )
  }

  const handleExportSelected = async () => {
    try {
      const csv = await contatosApi.exportar({ tipo, limit: 1000 })
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `contatos_${tipo}_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // Toast de erro já tratado pelo interceptor
    }
  }

  const contatos = data?.contatos || []
  const totalPages = data ? Math.ceil(data.total / perPage) : 0

  return (
    <div className="space-y-4">
      {/* Tabs Pessoas / Empresas */}
      <div className="flex items-center gap-1 border-b border-border">
        <button
          onClick={() => navigate('/app/contatos/pessoas')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tipo === 'pessoa'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users2 className="w-4 h-4" />
          Pessoas
        </button>
        <button
          onClick={() => navigate('/app/contatos/empresas')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tipo === 'empresa'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Empresas
        </button>
      </div>

      {/* Search + Filters + Columns Toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={`Buscar ${tipo === 'pessoa' ? 'pessoas' : 'empresas'}...`}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {busca && (
            <button onClick={() => setBusca('')} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border transition-colors ${
            showFilters || filtrosAtivos > 0
              ? 'border-primary/40 bg-primary/5 text-primary'
              : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtros
          {filtrosAtivos > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {filtrosAtivos}
            </span>
          )}
        </button>

        {isAdmin && (
          <button
            onClick={() => setSegmentosModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Tag className="w-4 h-4" />
            <span className="hidden sm:inline">Segmentos</span>
          </button>
        )}

        <ContatoColumnsToggle tipo={tipo} columns={columns} onChange={setColumns} />

        <button
          onClick={handleExportSelected}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Exportar</span>
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="text-sm rounded-md border border-input bg-background px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos os status</option>
            {StatusContatoOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <select
            value={origemFilter}
            onChange={(e) => { setOrigemFilter(e.target.value); setPage(1) }}
            className="text-sm rounded-md border border-input bg-background px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todas as origens</option>
            {OrigemContatoOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {tipo === 'pessoa' && segmentos.length > 0 && (
            <select
              value={segmentoFilter}
              onChange={(e) => { setSegmentoFilter(e.target.value); setPage(1) }}
              className="text-sm rounded-md border border-input bg-background px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos os segmentos</option>
              {segmentos.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          )}

          {filtrosAtivos > 0 && (
            <button
              onClick={() => { setStatusFilter(''); setOrigemFilter(''); setSegmentoFilter(''); setPage(1) }}
              className="text-xs text-primary hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Lista */}
      <div className="bg-background rounded-lg border border-border">
        <ContatosList
          contatos={contatos}
          tipo={tipo}
          loading={isLoading}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onView={(c) => { setViewingContato(c); setViewModalOpen(true) }}
          onEdit={(c) => { setEditingContato(c); setFormModalOpen(true) }}
          onDelete={(c) => { setDeletingContato(c); setDeleteError(null); setDeleteModalOpen(true) }}
        />

        {/* Paginação */}
        {data && data.total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Mostrando {((page - 1) * perPage) + 1}–{Math.min(page * perPage, data.total)} de {data.total}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-md hover:bg-accent disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = i + 1
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 text-sm rounded-md transition-colors ${
                        page === p ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-foreground'
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}
                {totalPages > 5 && <span className="text-xs text-muted-foreground px-1">...</span>}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-md hover:bg-accent disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      <ContatoBulkActions
        selectedCount={selectedIds.size}
        selectedIds={Array.from(selectedIds)}
        tipo={tipo}
        isAdmin={isAdmin}
        onExcluir={handleBulkDelete}
        onExportar={handleExportSelected}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      {/* Modais */}
      <ContatoFormModal
        open={formModalOpen}
        onClose={() => { setFormModalOpen(false); setEditingContato(null) }}
        onSubmit={handleFormSubmit}
        tipo={tipo}
        contato={editingContato}
        loading={criarContato.isPending || atualizarContato.isPending}
        isAdmin={isAdmin}
      />

      <ContatoViewModal
        open={viewModalOpen}
        onClose={() => { setViewModalOpen(false); setViewingContato(null) }}
        contato={viewingContato}
        onEdit={() => {
          setViewModalOpen(false)
          setEditingContato(viewingContato)
          setFormModalOpen(true)
        }}
        onDelete={() => {
          setViewModalOpen(false)
          setDeletingContato(viewingContato)
          setDeleteError(null)
          setDeleteModalOpen(true)
        }}
      />

      <ConfirmarExclusaoModal
        open={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setDeletingContato(null); setDeleteError(null) }}
        onConfirm={handleDelete}
        loading={excluirContato.isPending}
        erro={deleteError}
      />

      <SegmentosManager
        open={segmentosModalOpen}
        onClose={() => setSegmentosModalOpen(false)}
      />

      <DuplicatasModal
        open={duplicatasModalOpen}
        onClose={() => setDuplicatasModalOpen(false)}
      />

      <ImportarContatosModal
        open={importarModalOpen}
        onClose={() => setImportarModalOpen(false)}
      />
    </div>
  )
}
