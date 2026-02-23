import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToolbar } from '../contexts/ToolbarContext'
import { SearchPopover, StatusDropdown } from '../components/toolbar'
import { useParceiros, useUpdateParceiro, useConfigPrograma } from '../hooks/useParceiros'
import { formatCurrency } from '@/lib/formatters'
import {
  Plus,
  Eye,
  Users2,
  RefreshCw,
  WifiOff,
  AlertTriangle,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import type { Parceiro } from '../schemas/parceiro.schema'
import { NovoParceirModal } from '../components/NovoParceirModal'

const statusColors: Record<string, string> = {
  ativo: 'bg-green-100 text-green-700',
  suspenso: 'bg-amber-100 text-amber-700',
  inativo: 'bg-muted text-muted-foreground',
}

const statusLabels: Record<string, string> = {
  ativo: 'Ativo',
  suspenso: 'Suspenso',
  inativo: 'Inativo',
}

const statusOptions = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'ativo', label: 'Ativos' },
  { value: 'suspenso', label: 'Suspensos' },
  { value: 'inativo', label: 'Inativos' },
]

/**
 * AIDEV-NOTE: ParceirosPage — segue padrao identico a OrganizacoesPage (PRD Programa de Parceiros)
 * Exibe lista de parceiros com filtros no toolbar, tabela desktop e cards mobile.
 */
function ParceirosPage() {
  const navigate = useNavigate()
  const { setActions, setSubtitle } = useToolbar()
  const [busca, setBusca] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [page, setPage] = useState(1)
  const [menuAberto, setMenuAberto] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const statusParam =
    statusFilter !== 'todos'
      ? (statusFilter as 'ativo' | 'suspenso' | 'inativo')
      : undefined

  const { data, isLoading, error, isError, refetch, fetchStatus } = useParceiros({
    busca: busca || undefined,
    status: statusParam,
    page,
  })

  // AIDEV-NOTE: useConfigPrograma aqui evita N+1 — config é compartilhada, não por parceiro
  const { data: config } = useConfigPrograma()
  const updateParceiro = useUpdateParceiro()

  // Injetar subtítulo no toolbar
  useEffect(() => {
    setSubtitle('Gerencie os parceiros e indicações')
    return () => setSubtitle(null)
  }, [setSubtitle])

  // Injetar ações no toolbar
  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        <SearchPopover
          value={busca}
          onChange={(val) => {
            setBusca(val)
            setPage(1)
          }}
          placeholder="Buscar por empresa ou código..."
        />

        <StatusDropdown
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val)
            setPage(1)
          }}
          options={statusOptions}
          defaultValue="todos"
        />

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Parceiro</span>
        </button>
      </div>,
    )
    return () => setActions(null)
  }, [setActions, busca, statusFilter])

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('pt-BR')

  const getInitial = (nome: string) => nome.charAt(0).toUpperCase()

  const handleSuspender = (parceiro: Parceiro) => {
    updateParceiro.mutate({
      id: parceiro.id,
      data: { status: 'suspenso', motivo_suspensao: 'Suspensão manual pelo Super Admin' },
    })
    setMenuAberto(null)
  }

  const handleReativar = (parceiro: Parceiro) => {
    updateParceiro.mutate({ id: parceiro.id, data: { status: 'ativo' } })
    setMenuAberto(null)
  }

  const totalPaginas = data ? Math.ceil(data.total / 20) : 0

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-6">
      {/* Modal Novo Parceiro */}
      <NovoParceirModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      {/* Estado: Sem conexão */}
      {fetchStatus === 'paused' && (
        <div className="bg-card rounded-lg border border-border shadow-sm p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <WifiOff className="w-12 h-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-1">Sem conexão</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Verifique sua internet e tente novamente.
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* Tabela */}
      {fetchStatus !== 'paused' && (
        <div className="flex-1 min-h-0">
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-visible">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded" />
                  ))}
                </div>
              </div>
            ) : isError ? (
              <div className="p-8">
                <div className="flex flex-col items-center justify-center text-center">
                  <AlertTriangle className="w-12 h-12 text-destructive mb-3" />
                  <h3 className="text-lg font-medium text-destructive mb-1">
                    Erro ao carregar parceiros
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {String((error as Error)?.message || '')}
                  </p>
                  <button
                    onClick={() => refetch()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Tentar novamente
                  </button>
                </div>
              </div>
            ) : !data?.parceiros.length ? (
              <div className="p-8 text-center">
                <Users2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">Nenhum parceiro cadastrado</p>
                <button
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Cadastrar primeiro parceiro
                </button>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Empresa Parceira
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Código
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Indicados Ativos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Comissão Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        {config?.regras_gratuidade.ativo && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Meta
                          </th>
                        )}
                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.parceiros.map((parceiro) => (
                        <ParceiroRow
                          key={parceiro.id}
                          parceiro={parceiro}
                          formatDate={formatDate}
                          getInitial={getInitial}
                          menuAberto={menuAberto}
                          setMenuAberto={setMenuAberto}
                          navigate={navigate}
                          onSuspender={handleSuspender}
                          onReativar={handleReativar}
                          metaProgramaAtiva={config?.regras_gratuidade.ativo ?? false}
                          metaIndicados={config?.regras_gratuidade.meta_inicial_indicados ?? 0}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-border">
                  {data.parceiros.map((parceiro) => (
                    <ParceiroCard
                      key={parceiro.id}
                      parceiro={parceiro}
                      formatDate={formatDate}
                      getInitial={getInitial}
                      navigate={navigate}
                    />
                  ))}
                </div>

                {/* Paginação */}
                {totalPaginas > 1 && (
                  <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {(page - 1) * 20 + 1} a{' '}
                      {Math.min(page * 20, data.total)} de {data.total}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPaginas}
                        className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
                      >
                        Próximo
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponentes
// ─────────────────────────────────────────────────────────────────────────────

function MetaBadge({ indicadosAtivos }: { indicadosAtivos: number }) {
  if (indicadosAtivos > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <CheckCircle2 className="w-3 h-3" />
        {indicadosAtivos} ativo{indicadosAtivos !== 1 ? 's' : ''}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
      <AlertCircle className="w-3 h-3" />
      Sem indicados
    </span>
  )
}

function ParceiroRow({
  parceiro,
  formatDate: _formatDate,
  getInitial,
  menuAberto,
  setMenuAberto,
  navigate,
  onSuspender,
  onReativar,
  metaProgramaAtiva,
  metaIndicados,
}: {
  parceiro: Parceiro
  formatDate: (date: string) => string
  getInitial: (nome: string) => string
  menuAberto: string | null
  setMenuAberto: (id: string | null) => void
  navigate: ReturnType<typeof useNavigate>
  onSuspender: (p: Parceiro) => void
  onReativar: (p: Parceiro) => void
  metaProgramaAtiva: boolean
  metaIndicados: number
}) {
  const orgNome = parceiro.organizacao?.nome ?? '—'
  const orgEmail = parceiro.organizacao?.email ?? ''
  const indicadosAtivos = parceiro.total_indicados_ativos ?? 0
  const cumpriuMeta = metaIndicados > 0 && indicadosAtivos >= metaIndicados

  return (
    <tr
      className="hover:bg-accent/50 cursor-pointer"
      onClick={() => navigate(`/admin/parceiros/${parceiro.id}`)}
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-semibold text-muted-foreground">
              {getInitial(orgNome)}
            </span>
          </div>
          <div className="flex flex-col justify-center">
            <p className="font-medium text-foreground">{orgNome}</p>
            {orgEmail && (
              <p className="text-xs text-muted-foreground">{orgEmail}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center px-2 py-0.5 bg-muted text-muted-foreground text-xs font-mono rounded">
          {parceiro.codigo_indicacao}
        </span>
      </td>
      <td className="px-6 py-4">
        <MetaBadge indicadosAtivos={indicadosAtivos} />
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-foreground font-medium">
          {formatCurrency(parceiro.total_comissoes_geradas ?? 0)}
        </span>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[parceiro.status]}`}
        >
          {statusLabels[parceiro.status]}
        </span>
      </td>
      {metaProgramaAtiva && (
        <td className="px-6 py-4">
          {cumpriuMeta ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
              <CheckCircle2 className="w-3 h-3" />
              Cumprindo ✓
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              <AlertCircle className="w-3 h-3" />
              Em risco
            </span>
          )}
        </td>
      )}
      <td
        className="px-6 py-4 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative inline-block">
          <button
            onClick={() => setMenuAberto(menuAberto === parceiro.id ? null : parceiro.id)}
            className="p-1.5 hover:bg-accent rounded-md transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </button>
          {menuAberto === parceiro.id && (
            <div className="absolute right-0 top-8 z-20 bg-popover border border-border rounded-md shadow-md min-w-[140px] py-1">
              <button
                className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent flex items-center gap-2"
                onClick={() => navigate(`/admin/parceiros/${parceiro.id}`)}
              >
                <Eye className="w-3.5 h-3.5" />
                Visualizar
              </button>
              {parceiro.status === 'ativo' && (
                <button
                  className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent text-amber-600 flex items-center gap-2"
                  onClick={() => onSuspender(parceiro)}
                >
                  Suspender
                </button>
              )}
              {parceiro.status === 'suspenso' && (
                <button
                  className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent text-green-600 flex items-center gap-2"
                  onClick={() => onReativar(parceiro)}
                >
                  Reativar
                </button>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

function ParceiroCard({
  parceiro,
  formatDate: _formatDate,
  getInitial,
  navigate,
}: {
  parceiro: Parceiro
  formatDate: (date: string) => string
  getInitial: (nome: string) => string
  navigate: ReturnType<typeof useNavigate>
}) {
  const orgNome = parceiro.organizacao?.nome ?? '—'

  return (
    <div className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
            <span className="text-lg font-semibold text-muted-foreground">
              {getInitial(orgNome)}
            </span>
          </div>
          <div>
            <p className="font-medium text-foreground">{orgNome}</p>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[parceiro.status]}`}
            >
              {statusLabels[parceiro.status]}
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate(`/admin/parceiros/${parceiro.id}`)}
          className="p-2 hover:bg-accent rounded-lg"
        >
          <Eye className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Código:</span>
          <span className="ml-1 text-foreground font-mono text-xs">
            {parceiro.codigo_indicacao}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Indicados:</span>
          <span className="ml-1 text-foreground">
            {parceiro.total_indicados_ativos ?? 0}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Comissão:</span>
          <span className="ml-1 text-foreground">
            {formatCurrency(parceiro.total_comissoes_geradas ?? 0)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ParceirosPage
