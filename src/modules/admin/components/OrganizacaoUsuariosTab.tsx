import { useUsuariosOrganizacao } from '../hooks/useOrganizacoes'
import { User, Shield, Clock } from 'lucide-react'

/**
 * AIDEV-NOTE: Tab de Usuarios da Organizacao
 * Conforme PRD-14 - RF-012
 */

interface Props {
  orgId: string
}

export function OrganizacaoUsuariosTab({ orgId }: Props) {
  const { data, isLoading, error } = useUsuariosOrganizacao(orgId)

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <p className="text-destructive">Erro ao carregar usuarios</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estatisticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data?.total || 0}</p>
              <p className="text-sm text-muted-foreground">Total de usuarios</p>
            </div>
          </div>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data?.admin ? 1 : 0}</p>
              <p className="text-sm text-muted-foreground">Administrador</p>
            </div>
          </div>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data?.members.length || 0}</p>
              <p className="text-sm text-muted-foreground">Membros</p>
            </div>
          </div>
        </div>
      </div>

      {/* Administrador */}
      {data?.admin && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Administrador
          </h3>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-purple-600">
                    {data.admin.nome.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {data.admin.nome} {data.admin.sobrenome}
                  </p>
                  <p className="text-sm text-muted-foreground">{data.admin.email}</p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    data.admin.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {data.admin.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(data.admin.ultimo_login)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Membros */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Membros ({data?.members.length || 0})
        </h3>
        {data?.members && data.members.length > 0 ? (
          <div className="bg-card rounded-lg border border-border overflow-hidden divide-y divide-border">
            {data.members.map((member) => (
              <div key={member.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-muted-foreground">
                      {member.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {member.nome} {member.sobrenome}
                    </p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      member.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {member.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(member.ultimo_login)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum membro cadastrado</p>
          </div>
        )}
      </div>
    </div>
  )
}
