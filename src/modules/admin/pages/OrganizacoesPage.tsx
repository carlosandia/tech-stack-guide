import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { adminApi, type Organizacao } from '../services/admin.api'
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
 * - Botao para criar nova organizacao
 */

const statusColors: Record<string, string> = {
  ativa: 'bg-green-100 text-green-700',
  suspensa: 'bg-red-100 text-red-700',
  trial: 'bg-yellow-100 text-yellow-700',
  cancelada: 'bg-gray-100 text-gray-700',
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizacoes</h1>
          <p className="text-gray-500 mt-1">Gerencie os tenants da plataforma</p>
        </div>
        <button
          onClick={() => navigate('/admin/organizacoes/nova')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Organizacao
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600">Erro ao carregar organizacoes</p>
          </div>
        ) : !data?.organizacoes.length ? (
          <div className="p-8 text-center">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma organizacao encontrada</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Administrador
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Segmento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plano
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criado em
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acoes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
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
            <div className="md:hidden divide-y divide-gray-200">
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
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Mostrando {(page - 1) * 10 + 1} a {Math.min(page * 10, data.total)} de {data.total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === data.total_paginas}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-lg font-semibold text-gray-600">
              {getInitial(org.nome)}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{org.nome}</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[org.status]}`}>
              {statusLabels[org.status]}
            </span>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        {org.admin ? (
          <div>
            <p className="text-sm text-gray-900">
              {org.admin.nome} {org.admin.sobrenome}
            </p>
            <p className="text-xs text-gray-500">{org.admin.email}</p>
          </div>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-600 capitalize">{org.segmento}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-600">{org.plano?.nome || 'Sem plano'}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-600">{formatDate(org.criado_em)}</span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="relative">
          <button
            onClick={() => setMenuAberto(menuAberto === org.id ? null : org.id)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
          {menuAberto === org.id && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuAberto(null)}
              />
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={() => {
                    navigate(`/admin/organizacoes/${org.id}`)
                    setMenuAberto(null)
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Eye className="w-4 h-4" />
                  Visualizar
                </button>
                <button
                  onClick={() => {
                    navigate(`/admin/organizacoes/${org.id}/modulos`)
                    setMenuAberto(null)
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Settings className="w-4 h-4" />
                  Gerenciar Modulos
                </button>
                <button
                  onClick={() => {
                    // TODO: Implementar impersonacao
                    alert('Funcao de impersonacao sera implementada')
                    setMenuAberto(null)
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-lg font-semibold text-gray-600">
              {getInitial(org.nome)}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{org.nome}</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[org.status]}`}>
              {statusLabels[org.status]}
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate(`/admin/organizacoes/${org.id}`)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <Eye className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-500">Segmento:</span>
          <span className="ml-1 text-gray-900 capitalize">{org.segmento}</span>
        </div>
        <div>
          <span className="text-gray-500">Plano:</span>
          <span className="ml-1 text-gray-900">{org.plano?.nome || '-'}</span>
        </div>
        <div>
          <span className="text-gray-500">Criado:</span>
          <span className="ml-1 text-gray-900">{formatDate(org.criado_em)}</span>
        </div>
      </div>
    </div>
  )
}

export default OrganizacoesPage
