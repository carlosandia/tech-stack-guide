/**
 * AIDEV-NOTE: Página principal do módulo de Contatos
 * Conforme PRD-06 - Tabs Pessoas/Empresas no Toolbar
 * Toolbar: Título + Tabs + Busca + Filtros + Segmentos + Colunas + Exportar + Ações
 * Body: Apenas a lista de contatos
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, Download, Upload, Users2, Building2, X, Tag, GitMerge, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useAppToolbar } from '@/modules/app/contexts/AppToolbarContext'
import { useContatos, useCriarContato, useAtualizarContato, useExcluirContato, useExcluirContatosLote, useDuplicatas } from '../hooks/useContatos'
import { useSegmentos } from '../hooks/useSegmentos'
import { useUsuarios } from '@/modules/configuracoes/hooks/useEquipe'
import type { Contato, TipoContato, ListarContatosParams } from '../services/contatos.api'
import { ContatosList } from '../components/ContatosList'
import { ContatoFormModal } from '../components/ContatoFormModal'
import { ContatoViewModal } from '../components/ContatoViewModal'
import { ContatoBulkActions } from '../components/ContatoBulkActions'
import { ConfirmarExclusaoModal } from '../components/ConfirmarExclusaoModal'
import { SegmentosManager } from '../components/SegmentosManager'
import { DuplicatasModal } from '../components/DuplicatasModal'
import { ImportarContatosModal } from '../components/ImportarContatosModal'
import { ExportarContatosModal } from '../components/ExportarContatosModal'
import { ContatoColumnsToggle, getInitialColumns, type ColumnConfig } from '../components/ContatoColumnsToggle'
import { MobileOverflowMenu } from '../components/MobileOverflowMenu'

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
  const [searchOpen, setSearchOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [origemFilter, setOrigemFilter] = useState('')
  const [segmentoFilter, setSegmentoFilter] = useState('')
  const [responsavelFilter, setResponsavelFilter] = useState('')
  const [dataInicioFilter, setDataInicioFilter] = useState('')
  const [dataFimFilter, setDataFimFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const perPage = 50
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Estado de ordenação
  const [ordenarPor, setOrdenarPor] = useState('criado_em')
  const [ordem, setOrdem] = useState<'asc' | 'desc'>('desc')

  // Estado de seleção
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Estado de modais
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [segmentosModalOpen, setSegmentosModalOpen] = useState(false)
  const [duplicatasModalOpen, setDuplicatasModalOpen] = useState(false)
  const [importarModalOpen, setImportarModalOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [editingContato, setEditingContato] = useState<Contato | null>(null)
  const [viewingContato, setViewingContato] = useState<Contato | null>(null)
  const [deletingContato, setDeletingContato] = useState<Contato | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [openedFormFromView, setOpenedFormFromView] = useState(false)

  // Estado de vínculos (exclusão)
  const [deleteBloqueado, setDeleteBloqueado] = useState(false)
  const [deleteVinculos, setDeleteVinculos] = useState<Array<{ tipo: string; nome: string; id: string }>>([])

  // Toggle de colunas
  const [columns, setColumns] = useState<ColumnConfig[]>(() => getInitialColumns(tipo))

  // Segmentos para filtro
  const { data: segmentosData } = useSegmentos()
  const segmentos = segmentosData?.segmentos || []

  // Debounce da busca - mínimo 3 caracteres ou Enter
  useEffect(() => {
    if (busca.length === 0) {
      setDebouncedBusca('')
      return
    }
    if (busca.length >= 3) {
      const timer = setTimeout(() => setDebouncedBusca(busca), 300)
      return () => clearTimeout(timer)
    }
  }, [busca])

  // Focus no input de busca ao abrir
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchOpen])

  // Parâmetros da query
  const params: ListarContatosParams = useMemo(() => ({
    tipo,
    busca: debouncedBusca || undefined,
    status: (statusFilter || undefined) as ListarContatosParams['status'],
    origem: (origemFilter || undefined) as ListarContatosParams['origem'],
    segmento_id: segmentoFilter || undefined,
    owner_id: responsavelFilter || undefined,
    data_inicio: dataInicioFilter || undefined,
    data_fim: dataFimFilter || undefined,
    page,
    limit: perPage,
    ordenar_por: ordenarPor,
    ordem,
  }), [tipo, debouncedBusca, statusFilter, origemFilter, segmentoFilter, responsavelFilter, dataInicioFilter, dataFimFilter, page, ordenarPor, ordem])

  const { data, isLoading } = useContatos(params)
  const criarContato = useCriarContato()
  const atualizarContato = useAtualizarContato()
  const excluirContato = useExcluirContato()
  const excluirLote = useExcluirContatosLote()

  // Buscar empresas para vincular (quando tipo=pessoa) + contagem
  const { data: empresasData } = useContatos({ tipo: 'empresa', limit: 500 })
  const empresasLista = useMemo(
    () => (empresasData?.contatos || []).map(e => ({ id: e.id, nome_fantasia: e.nome_fantasia, razao_social: e.razao_social })),
    [empresasData]
  )

  // Buscar contagem da outra aba para exibir no badge
  const { data: pessoasCountData } = useContatos({ tipo: 'pessoa', limit: 1, page: 1 })
  const totalPessoas = tipo === 'pessoa' ? (data?.total ?? null) : (pessoasCountData?.total ?? null)
  const totalEmpresas = tipo === 'empresa' ? (data?.total ?? null) : (empresasData?.total ?? null)

  // Buscar membros da equipe (para atribuir responsável)
  const { data: usuariosData } = useUsuarios({ status: 'ativo' })
  const usuariosLista = useMemo(
    () => (usuariosData?.usuarios || []).map((u: any) => ({ id: u.id, nome: u.nome, sobrenome: u.sobrenome })),
    [usuariosData]
  )

  // Buscar duplicatas para mostrar botão condicionalmente
  const { data: duplicatasData } = useDuplicatas()
  const temDuplicatas = (duplicatasData?.duplicatas?.length ?? 0) > 0
  const totalDuplicatas = duplicatasData?.duplicatas?.length ?? 0

  // Limpar seleção e resetar página ao trocar de tab
  useEffect(() => {
    setSelectedIds(new Set())
    setPage(1)
    setColumns(getInitialColumns(tipo))
    setResponsavelFilter('')
    setDataInicioFilter('')
    setDataFimFilter('')
    setOrdenarPor('criado_em')
    setOrdem('desc')
  }, [tipo])

  // Contagem de filtros ativos
  const filtrosAtivos = [statusFilter, origemFilter, segmentoFilter, responsavelFilter, dataInicioFilter, dataFimFilter].filter(Boolean).length

  // --- Toolbar: Subtitle (Tabs Pessoas/Empresas) ---
  useEffect(() => {
    setSubtitle(
      <div className="flex items-center gap-1">
        <button
          onClick={() => navigate('/app/contatos/pessoas')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
            tipo === 'pessoa'
              ? 'border border-primary/40 bg-primary/5 text-primary'
              : 'border border-transparent text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          <Users2 className="w-3.5 h-3.5 hidden sm:block" />
          Pessoas
          {totalPessoas !== null && (
            <span className="text-xs ml-0.5 opacity-70">{totalPessoas}</span>
          )}
        </button>
        <button
          onClick={() => navigate('/app/contatos/empresas')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
            tipo === 'empresa'
              ? 'border border-primary/40 bg-primary/5 text-primary'
              : 'border border-transparent text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 hidden sm:block" />
          Empresas
          {totalEmpresas !== null && (
            <span className="text-xs ml-0.5 opacity-70">{totalEmpresas}</span>
          )}
        </button>
      </div>
    )
    return () => { setSubtitle(null) }
  }, [tipo, totalPessoas, totalEmpresas, navigate, setSubtitle])

  // --- Toolbar: Actions (busca, filtros, segmentos, colunas, exportar, importar, duplicatas, novo) ---
  useEffect(() => {
    setActions(
      <div className="flex items-center gap-1.5">
        {/* Busca */}
        {searchOpen ? (
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={`Buscar ${tipo === 'pessoa' ? 'pessoas' : 'empresas'}...`}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && busca.length > 0) setDebouncedBusca(busca) }}
              onBlur={() => { if (!busca) setSearchOpen(false) }}
              className="w-40 sm:w-48 pl-8 pr-7 py-1.5 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={() => { setBusca(''); setSearchOpen(false) }}
              className="absolute right-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Buscar"
          >
            <Search className="w-4 h-4" />
          </button>
        )}

        {/* ---- Desktop: ações inline (lg+) ---- */}
        <div className="hidden lg:flex items-center gap-1.5">
          {/* Filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-md border transition-colors ${
              showFilters || filtrosAtivos > 0
                ? 'border-primary/40 bg-primary/5 text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filtros
            {filtrosAtivos > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                {filtrosAtivos}
              </span>
            )}
          </button>

          {/* Segmentos (Admin) */}
          {isAdmin && (
            <button
              onClick={() => setSegmentosModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-md border border-transparent text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Tag className="w-3.5 h-3.5" />
              Segmentos
            </button>
          )}

          {/* Colunas */}
          <ContatoColumnsToggle tipo={tipo} columns={columns} onChange={setColumns} />

          {/* Separador */}
          <div className="w-px h-5 bg-border mx-0.5" />

          {/* Exportar */}
          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar
          </button>

          {/* Importar (Admin) */}
          {isAdmin && (
            <button
              onClick={() => setImportarModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-md border border-border text-foreground hover:bg-accent transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Importar
            </button>
          )}

          {/* Duplicatas - só aparece se existirem */}
          {isAdmin && temDuplicatas && (
            <button
              onClick={() => setDuplicatasModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium rounded-md border border-warning/60 bg-warning-muted text-warning-foreground hover:bg-warning-muted/80 transition-colors"
            >
              <GitMerge className="w-3.5 h-3.5" />
              Duplicatas
              <span className="w-5 h-5 rounded-full bg-warning text-warning-foreground text-[10px] flex items-center justify-center font-bold">
                {totalDuplicatas}
              </span>
            </button>
          )}
        </div>

        {/* ---- Mobile/Tablet: menu overflow (<lg) ---- */}
        <MobileOverflowMenu
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          filtrosAtivos={filtrosAtivos}
          isAdmin={isAdmin}
          temDuplicatas={temDuplicatas}
          totalDuplicatas={totalDuplicatas}
          onSegmentos={() => setSegmentosModalOpen(true)}
          onExportar={() => setExportModalOpen(true)}
          onImportar={() => setImportarModalOpen(true)}
          onDuplicatas={() => setDuplicatasModalOpen(true)}
          tipo={tipo}
          columns={columns}
          onColumnsChange={setColumns}
        />

        {/* Novo Contato - sempre visível */}
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
    return () => { setActions(null) }
  }, [tipo, data, isAdmin, setActions, searchOpen, busca, showFilters, filtrosAtivos, columns, temDuplicatas, totalDuplicatas])

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

  const handleFormSubmit = async (formData: Record<string, unknown>) => {
    const segmentoIds = formData.segmento_ids as string[] | undefined
    const cleanData = { ...formData }
    delete cleanData.segmento_ids

    if (editingContato) {
      atualizarContato.mutate(
        { id: editingContato.id, payload: cleanData },
        {
          onSuccess: async () => {
            if (segmentoIds) {
              try { await contatosApi.vincularSegmentos(editingContato.id, segmentoIds) } catch {}
            }
            setFormModalOpen(false)
            if (openedFormFromView) {
              setViewingContato(editingContato)
              setViewModalOpen(true)
              setOpenedFormFromView(false)
            }
            setEditingContato(null)
          },
        }
      )
    } else {
      criarContato.mutate(cleanData, {
        onSuccess: async (contato: any) => {
          if (segmentoIds && segmentoIds.length > 0) {
            try { await contatosApi.vincularSegmentos(contato.id, segmentoIds) } catch {}
          }
          setFormModalOpen(false)
          setEditingContato(null)
        }
      })
    }
  }

  const handleBackToView = useCallback(() => {
    setFormModalOpen(false)
    if (openedFormFromView && viewingContato) {
      setViewModalOpen(true)
    }
    setOpenedFormFromView(false)
    setEditingContato(null)
  }, [openedFormFromView, viewingContato])

  // Iniciar exclusão: verificar vínculos primeiro
  const handleInitDelete = useCallback(async (contato: Contato) => {
    setDeletingContato(contato)
    setDeleteError(null)
    setDeleteBloqueado(false)
    setDeleteVinculos([])

    try {
      const result = await contatosApi.verificarVinculos(contato.id, contato.tipo as TipoContato)
      if (result.temVinculos) {
        setDeleteBloqueado(true)
        setDeleteVinculos(result.vinculos)
      }
    } catch {}

    setDeleteModalOpen(true)
  }, [])

  // Confirmar exclusão (quando não bloqueado)
  const handleConfirmDelete = useCallback(() => {
    if (!deletingContato || deleteBloqueado) return
    setDeleteError(null)
    excluirContato.mutate(deletingContato.id, {
      onSuccess: () => {
        setDeleteModalOpen(false)
        setDeletingContato(null)
        setViewModalOpen(false)
      },
      onError: (err: any) => {
        setDeleteError(err?.response?.data?.error || err?.message || 'Erro ao excluir contato')
      },
    })
  }, [deletingContato, deleteBloqueado, excluirContato])

  // Exclusão em massa com verificação de vínculos
  const handleBulkDelete = useCallback(async () => {
    if (tipo === 'empresa') {
      try {
        const result = await contatosApi.verificarVinculosLote(Array.from(selectedIds), tipo)
        if (result.temVinculos) {
          setDeletingContato(null)
          setDeleteBloqueado(true)
          setDeleteVinculos(result.vinculos)
          setDeleteError(null)
          setDeleteModalOpen(true)
          return
        }
      } catch {}
    }

    excluirLote.mutate(
      { ids: Array.from(selectedIds), tipo },
      { onSuccess: () => setSelectedIds(new Set()) }
    )
  }, [selectedIds, tipo, excluirLote])

  // Handler de ordenação
  const handleSort = useCallback((column: string) => {
    setOrdenarPor(prev => {
      if (prev === column) {
        setOrdem(o => o === 'asc' ? 'desc' : 'asc')
        return column
      }
      setOrdem('desc')
      return column
    })
    setPage(1)
  }, [])

  const contatos = data?.contatos || []
  const totalPages = data ? Math.ceil(data.total / perPage) : 0

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Painel de filtros expandido */}
      {showFilters && (
        <div className="flex-shrink-0 flex items-center gap-3 p-3 bg-muted/50 border-b border-border flex-wrap">
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

          {/* Filtro de Responsável (Admin only) */}
          {isAdmin && (
            <select
              value={responsavelFilter}
              onChange={(e) => { setResponsavelFilter(e.target.value); setPage(1) }}
              className="text-sm rounded-md border border-input bg-background px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos os responsáveis</option>
              {usuariosLista.map((u) => (
                <option key={u.id} value={u.id}>{u.nome} {u.sobrenome || ''}</option>
              ))}
            </select>
          )}

          {/* Filtro de Período de Criação */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <input
              type="date"
              value={dataInicioFilter}
              onChange={(e) => { setDataInicioFilter(e.target.value); setPage(1) }}
              className="text-sm rounded-md border border-input bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="text-xs text-muted-foreground">até</span>
            <input
              type="date"
              value={dataFimFilter}
              onChange={(e) => { setDataFimFilter(e.target.value); setPage(1) }}
              className="text-sm rounded-md border border-input bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {filtrosAtivos > 0 && (
            <button
              onClick={() => {
                setStatusFilter(''); setOrigemFilter(''); setSegmentoFilter('')
                setResponsavelFilter(''); setDataInicioFilter(''); setDataFimFilter('')
                setPage(1)
              }}
              className="text-xs text-primary hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Área da tabela - flex-1 para preencher todo o espaço restante */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ContatosList
          contatos={contatos}
          tipo={tipo}
          loading={isLoading}
          selectedIds={selectedIds}
          columns={columns}
          sortConfig={{ column: ordenarPor, direction: ordem }}
          onSort={handleSort}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onView={(c) => { setViewingContato(c); setViewModalOpen(true) }}
          onEdit={(c) => { setEditingContato(c); setFormModalOpen(true) }}
          onDelete={handleInitDelete}
        />

        {/* Paginação fixa no rodapé */}
        {data && data.total > 0 && (
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-t border-border bg-background">
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
        onExportar={() => setExportModalOpen(true)}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      {/* Modais */}
      <ContatoFormModal
        open={formModalOpen}
        onClose={() => { setFormModalOpen(false); setEditingContato(null); setOpenedFormFromView(false) }}
        onSubmit={handleFormSubmit}
        tipo={tipo}
        contato={editingContato}
        loading={criarContato.isPending || atualizarContato.isPending}
        isAdmin={isAdmin}
        empresas={empresasLista}
        usuarios={usuariosLista}
        onBack={openedFormFromView ? handleBackToView : undefined}
      />

      <ContatoViewModal
        open={viewModalOpen}
        onClose={() => { setViewModalOpen(false); setViewingContato(null) }}
        contato={viewingContato}
        onEdit={() => {
          setViewModalOpen(false)
          setEditingContato(viewingContato)
          setOpenedFormFromView(true)
          setFormModalOpen(true)
        }}
        onDelete={() => {
          setViewModalOpen(false)
          if (viewingContato) handleInitDelete(viewingContato)
        }}
      />

      <ConfirmarExclusaoModal
        open={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setDeletingContato(null); setDeleteError(null); setDeleteBloqueado(false); setDeleteVinculos([]) }}
        onConfirm={handleConfirmDelete}
        loading={excluirContato.isPending}
        erro={deleteError}
        bloqueado={deleteBloqueado}
        vinculos={deleteVinculos}
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

      <ExportarContatosModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        tipo={tipo}
        filtros={params}
        selectedIds={selectedIds.size > 0 ? Array.from(selectedIds) : undefined}
      />
    </div>
  )
}
