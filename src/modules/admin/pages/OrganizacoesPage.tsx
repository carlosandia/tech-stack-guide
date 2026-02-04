import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { adminApi, type Organizacao } from '../services/admin.api'
import { NovaOrganizacaoModal } from '../components/NovaOrganizacaoModal'
import {
  Plus,
  Search,
  Eye,
  Settings,
  User,
  MoreVertical,
  Building2,
} from 'lucide-react'

/**
 * AIDEV-NOTE: Listagem de Organizacoes
 * Conforme PRD-14 - Gestao de Organizacoes
 *
 * Exibe:
 * - Lista de tenants com filtros
 * - Acoes: Visualizar, Configurar, Impersonar
 * - Botao para criar nova organizacao (abre modal)
 */

const statusColors: Record<string, string> = {
  ativa: 'bg-green-100 text-green-700',
  suspensa: 'bg-red-100 text-red-700',
  trial: 'bg-yellow-100 text-yellow-700',
  cancelada: 'bg-muted text-muted-foreground',
}

const statusLabels: Record<string, string> = {
  ativa: 'Ativa',
  suspensa: 'Suspensa',
  trial: 'Trial',
  cancelada: 'Cancelada',
}

export function OrganizacoesPage() {
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const [statusFilter, setStatusFilter] = useState('todas')
  const [page, setPage] = useState(1)
  const [menuAberto, setMenuAberto] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'organizacoes', { busca, status: statusFilter, page }],
    queryFn: () =>
      adminApi.listarOrganizacoes({
        busca: busca || undefined,
        status: statusFilter,
        page,
        limit: 10,
      }),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getInitial = (nome: string) => nome.charAt(0).toUpperCase()

  return (
    <div className="space-y-6">
      {/* Modal Nova Organizacao */}
      <NovaOrganizacaoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Organizacoes</h1>
          <p className="text-muted-foreground mt-1">Gerencie os tenants da plataforma</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Organizacao
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
          >
            <option value="todas">Todos os status</option>
            <option value="ativa">Ativas</option>
            <option value="trial">Em Trial</option>
            <option value="suspensa">Suspensas</option>
            <option value="cancelada">Canceladas</option>
          </select>
        </form>
      </div>

      {/* Tabela */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-destructive">Erro ao carregar organizacoes</p>
          </div>
        ) : !data?.organizacoes.length ? (
          <div className="p-8 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma organizacao encontrada</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Administrador
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Segmento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Plano
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Criado em
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Acoes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.organizacoes.map((org) => (
                    <OrganizacaoRow
                      key={org.id}
                      org={org}
                      formatDate={formatDate}
                      getInitial={getInitial}
                      menuAberto={menuAberto}
                      setMenuAberto={setMenuAberto}
                      navigate={navigate}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-border">
              {data.organizacoes.map((org) => (
                <OrganizacaoCard
                  key={org.id}
                  org={org}
                  formatDate={formatDate}
                  getInitial={getInitial}
                  navigate={navigate}
                />
              ))}
            </div>

            {/* Paginacao */}
            {data.total_paginas > 1 && (
              <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {(page - 1) * 10 + 1} a {Math.min(page * 10, data.total)} de {data.total}
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
                    disabled={page === data.total_paginas}
                    className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
                  >
                    Proximo
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Componente de linha da tabela
function OrganizacaoRow({
  org,
  formatDate,
  getInitial,
  menuAberto,
  setMenuAberto,
  navigate,
}: {
  org: Organizacao
  formatDate: (date: string) => string
  getInitial: (nome: string) => string
  menuAberto: string | null
  setMenuAberto: (id: string | null) => void
  navigate: ReturnType<typeof useNavigate>
}) {
  return (
    <tr className="hover:bg-accent/50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
            <span className="text-lg font-semibold text-muted-foreground">
              {getInitial(org.nome)}
            </span>
          </div>
          <div>
            <p className="font-medium text-foreground">{org.nome}</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[org.status]}`}>
              {statusLabels[org.status]}
            </span>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        {org.admin ? (
          <div>
            <p className="text-sm text-foreground">
              {org.admin.nome} {org.admin.sobrenome}
            </p>
            <p className="text-xs text-muted-foreground">{org.admin.email}</p>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-muted-foreground capitalize">{org.segmento}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-muted-foreground">{org.plano?.nome || 'Sem plano'}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-muted-foreground">{formatDate(org.criado_em)}</span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="relative">
          <button
            onClick={() => setMenuAberto(menuAberto === org.id ? null : org.id)}
            className="p-2 hover:bg-accent rounded-lg"
          >
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </button>
          {menuAberto === org.id && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuAberto(null)}
              />
              <div className="absolute right-0 mt-1 w-48 bg-card rounded-lg shadow-lg border border-border py-1 z-50">
                <button
                  onClick={() => {
                    navigate(`/admin/organizacoes/${org.id}`)
                    setMenuAberto(null)
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground hover:bg-accent"
                >
                  <Eye className="w-4 h-4" />
                  Visualizar
                </button>
                <button
                  onClick={() => {
                    navigate(`/admin/organizacoes/${org.id}`)
                    setMenuAberto(null)
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground hover:bg-accent"
                >
                  <Settings className="w-4 h-4" />
                  Gerenciar Modulos
                </button>
                <button
                  onClick={() => {
                    alert('Funcao de impersonacao sera implementada')
                    setMenuAberto(null)
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground hover:bg-accent"
                >
                  <User className="w-4 h-4" />
                  Impersonar
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

// Componente de card mobile
function OrganizacaoCard({
  org,
  formatDate,
  getInitial,
  navigate,
}: {
  org: Organizacao
  formatDate: (date: string) => string
  getInitial: (nome: string) => string
  navigate: ReturnType<typeof useNavigate>
}) {
  return (
    <div className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
            <span className="text-lg font-semibold text-muted-foreground">
              {getInitial(org.nome)}
            </span>
          </div>
          <div>
            <p className="font-medium text-foreground">{org.nome}</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[org.status]}`}>
              {statusLabels[org.status]}
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate(`/admin/organizacoes/${org.id}`)}
          className="p-2 hover:bg-accent rounded-lg"
        >
          <Eye className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Segmento:</span>
          <span className="ml-1 text-foreground capitalize">{org.segmento}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Plano:</span>
          <span className="ml-1 text-foreground">{org.plano?.nome || '-'}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Criado:</span>
          <span className="ml-1 text-foreground">{formatDate(org.criado_em)}</span>
        </div>
      </div>
    </div>
  )
}

export default OrganizacoesPage
