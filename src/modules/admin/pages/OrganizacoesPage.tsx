import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { adminApi, type Organizacao } from '../services/admin.api'
import { useToolbar } from '../contexts/ToolbarContext'
import { NovaOrganizacaoModal } from '../components/NovaOrganizacaoModal'
import { SearchPopover, StatusDropdown } from '../components/toolbar'
import { OrganizacaoActionsMenu } from '../components/OrganizacaoActionsMenu'
import { ImpersonarModal } from '../components/ImpersonarModal'
import { toast } from 'sonner'
import {
  Plus,
  Eye,
  Building2,
  Gift,
  RefreshCw,
  WifiOff,
  AlertTriangle,
} from 'lucide-react'


/**
 * AIDEV-NOTE: Listagem de Organizacoes
 * Conforme PRD-14 - Gestao de Organizacoes
 *
 * Exibe:
 * - Lista de tenants com filtros (no Toolbar)
 * - Acoes: Visualizar, Configurar, Impersonar
 * - Botao para criar nova organizacao (injetado no toolbar)
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

const statusOptions = [
  { value: 'todas', label: 'Todos os status' },
  { value: 'ativa', label: 'Ativas' },
  { value: 'trial', label: 'Em Trial' },
  { value: 'suspensa', label: 'Suspensas' },
  { value: 'cancelada', label: 'Canceladas' },
]

export function OrganizacoesPage() {
  const navigate = useNavigate()
  const { setActions, setSubtitle } = useToolbar()
  const [busca, setBusca] = useState('')
  const [statusFilter, setStatusFilter] = useState('todas')
  const [page, setPage] = useState(1)
  const [menuAberto, setMenuAberto] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [impersonarModalOpen, setImpersonarModalOpen] = useState(false)
  const [impersonarOrg, setImpersonarOrg] = useState<{ id: string; nome: string } | null>(null)
  const [impersonarLoading, setImpersonarLoading] = useState(false)

   const { data, isLoading, error, isError, refetch, fetchStatus } = useQuery({
    queryKey: ['admin', 'organizacoes', { busca, status: statusFilter, page }],
    queryFn: () =>
      adminApi.listarOrganizacoes({
        busca: busca || undefined,
        status: statusFilter,
        page,
        limit: 10,
      }),
  })

  // Injetar subtítulo no toolbar
  useEffect(() => {
    setSubtitle('Gerencie os tenants da plataforma')
    return () => setSubtitle(null)
  }, [setSubtitle])

  // Injetar ações no toolbar (busca + status + CTA)
  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        {/* Busca - Popover */}
        <SearchPopover
          value={busca}
          onChange={(val) => {
            setBusca(val)
            setPage(1)
          }}
          placeholder="Buscar por nome ou email..."
        />

        {/* Status - Dropdown */}
        <StatusDropdown
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val)
            setPage(1)
          }}
          options={statusOptions}
          defaultValue="todas"
        />

        {/* CTA - Nova Organização */}
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Organização</span>
        </button>
      </div>
    )
    return () => setActions(null)
  }, [setActions, busca, statusFilter])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getInitial = (nome: string) => nome.charAt(0).toUpperCase()

  const handleImpersonar = (org: Organizacao) => {
    setImpersonarOrg({ id: org.id, nome: org.nome })
    setImpersonarModalOpen(true)
  }

  const handleConfirmImpersonar = async (motivo: string) => {
    if (!impersonarOrg) return
    setImpersonarLoading(true)
    try {
      const result = await adminApi.impersonarOrganizacao(impersonarOrg.id, motivo)
      // Abrir magic link em nova aba
      window.open(result.magic_link_url, '_blank')
      toast.success(`Impersonação iniciada para ${result.organizacao_nome}`)
      setImpersonarModalOpen(false)
      setImpersonarOrg(null)
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao impersonar')
    } finally {
      setImpersonarLoading(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-6">
      {/* Modal Nova Organizacao */}
      <NovaOrganizacaoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      {/* Modal Impersonar */}
      <ImpersonarModal
        open={impersonarModalOpen}
        onOpenChange={(v) => { setImpersonarModalOpen(v); if (!v) setImpersonarOrg(null) }}
        orgNome={impersonarOrg?.nome || ''}
        loading={impersonarLoading}
        onConfirm={handleConfirmImpersonar}
      />

       {/* Estado: Sem conexão (paused) */}
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
                 Erro ao carregar organizações
               </h3>
               <p className="text-sm text-muted-foreground mb-1">
                 Não foi possível conectar ao servidor.
               </p>
               <p className="text-xs text-muted-foreground mb-4 max-w-md">
                 {String((error as Error)?.message || '')}
               </p>
               <div className="flex gap-2">
                 <button
                   onClick={() => refetch()}
                   className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
                 >
                   <RefreshCw className="w-4 h-4" />
                   Tentar novamente
                 </button>
                 <button
                   onClick={() => window.location.reload()}
                   className="inline-flex items-center gap-2 px-4 py-2 border border-border text-sm font-medium rounded-md hover:bg-accent transition-colors"
                 >
                   Recarregar página
                 </button>
               </div>
             </div>
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
                      onImpersonar={handleImpersonar}
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
       )}
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
  onImpersonar,
}: {
  org: Organizacao
  formatDate: (date: string) => string
  getInitial: (nome: string) => string
  menuAberto: string | null
  setMenuAberto: (id: string | null) => void
  navigate: ReturnType<typeof useNavigate>
  onImpersonar: (org: Organizacao) => void
}) {
  return (
    <tr className="hover:bg-accent/50 cursor-pointer" onClick={() => navigate(`/admin/organizacoes/${org.id}`)}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-semibold text-muted-foreground">
              {getInitial(org.nome)}
            </span>
          </div>
          <div className="flex flex-col justify-center">
            <p className="font-medium text-foreground">{org.nome}</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit ${statusColors[org.status]}`}>
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
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{org.plano || 'Sem plano'}</span>
          {org.cortesia && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
              <Gift className="w-3 h-3" />
              Cortesia
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-muted-foreground">{formatDate(org.criado_em)}</span>
      </td>
      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
        <OrganizacaoActionsMenu
          open={menuAberto === org.id}
          onOpenChange={(open) => setMenuAberto(open ? org.id : null)}
          onVisualizar={() => navigate(`/admin/organizacoes/${org.id}`)}
          onGerenciarModulos={() => navigate(`/admin/organizacoes/${org.id}`)}
          onImpersonar={() => onImpersonar(org)}
        />
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
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Plano:</span>
          <span className="ml-1 text-foreground">{org.plano || '-'}</span>
          {org.cortesia && (
            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
              <Gift className="w-2.5 h-2.5" />
            </span>
          )}
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
