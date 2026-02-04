import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MoreVertical, Users, BarChart3, Settings, Pause, Play, User } from 'lucide-react'
import {
  useOrganizacao,
  useSuspenderOrganizacao,
  useReativarOrganizacao,
  useImpersonarOrganizacao,
} from '../hooks/useOrganizacoes'
import { OrganizacaoUsuariosTab } from '../components/OrganizacaoUsuariosTab'
import { OrganizacaoRelatoriosTab } from '../components/OrganizacaoRelatoriosTab'
import { OrganizacaoConfigTab } from '../components/OrganizacaoConfigTab'

/**
 * AIDEV-NOTE: Pagina de Detalhes da Organizacao
 * Conforme PRD-14 - RF-012
 *
 * Tabs:
 * - Usuarios: Lista de admin e members
 * - Relatorios: Metricas do tenant
 * - Configuracoes: Limites e modulos
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

type TabId = 'usuarios' | 'relatorios' | 'configuracoes'

const TABS = [
  { id: 'usuarios' as const, label: 'Usuarios', icon: Users },
  { id: 'relatorios' as const, label: 'Relatorios', icon: BarChart3 },
  { id: 'configuracoes' as const, label: 'Configuracoes', icon: Settings },
]

export function OrganizacaoDetalhesPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabId>('usuarios')
  const [menuAberto, setMenuAberto] = useState(false)

  const { data: org, isLoading, error } = useOrganizacao(id || '')
  const { mutate: suspender, isPending: suspendendo } = useSuspenderOrganizacao()
  const { mutate: reativar, isPending: reativando } = useReativarOrganizacao()
  const { mutate: impersonar } = useImpersonarOrganizacao()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const handleSuspender = () => {
    if (!id) return
    const motivo = prompt('Informe o motivo da suspensao:')
    if (motivo) {
      suspender({ id, motivo })
      setMenuAberto(false)
    }
  }

  const handleReativar = () => {
    if (!id) return
    reativar(id)
    setMenuAberto(false)
  }

  const handleImpersonar = () => {
    if (!id) return
    const motivo = prompt('Informe o motivo da impersonacao (sera registrado no audit log):')
    if (motivo) {
      impersonar(
        { id, motivo },
        {
          onSuccess: (data) => {
            alert(`Impersonando organizacao: ${data.organizacao_nome}`)
          },
        }
      )
      setMenuAberto(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-muted rounded mb-4" />
          <div className="h-4 w-48 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (error || !org) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <p className="text-destructive">Erro ao carregar organizacao</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/admin/organizacoes')}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{org.nome}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[org.status]}`}>
                {statusLabels[org.status]}
              </span>
            </div>
            <p className="text-muted-foreground mt-1">
              {org.segmento} {org.plano && `• ${org.plano.nome}`} • Criado em {formatDate(org.criado_em)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {org.status === 'ativa' || org.status === 'trial' ? (
            <button
              onClick={handleSuspender}
              disabled={suspendendo}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-destructive text-destructive rounded-md hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              <Pause className="w-4 h-4" />
              Suspender
            </button>
          ) : org.status === 'suspensa' ? (
            <button
              onClick={handleReativar}
              disabled={reativando}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-primary text-primary rounded-md hover:bg-primary/10 transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              Reativar
            </button>
          ) : null}

          <div className="relative">
            <button
              onClick={() => setMenuAberto(!menuAberto)}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-muted-foreground" />
            </button>
            {menuAberto && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuAberto(false)} />
                <div className="absolute right-0 mt-1 w-48 bg-card rounded-lg shadow-lg border border-border py-1 z-50">
                  <button
                    onClick={handleImpersonar}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground hover:bg-accent"
                  >
                    <User className="w-4 h-4" />
                    Impersonar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'usuarios' && <OrganizacaoUsuariosTab orgId={id || ''} />}
        {activeTab === 'relatorios' && <OrganizacaoRelatoriosTab orgId={id || ''} />}
        {activeTab === 'configuracoes' && <OrganizacaoConfigTab orgId={id || ''} org={org} />}
      </div>
    </div>
  )
}

export default OrganizacaoDetalhesPage
