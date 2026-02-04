import { useState } from 'react'
import { useLimitesOrganizacao, useModulosOrganizacao } from '../hooks/useOrganizacoes'
import { usePlanos } from '../hooks/usePlanos'
import { HardDrive, Users, Target, FileText, Puzzle, CreditCard } from 'lucide-react'
import type { Organizacao } from '../services/admin.api'
import { GerenciarModulosModal } from './GerenciarModulosModal'

/**
 * AIDEV-NOTE: Tab de Configuracoes da Organizacao
 * Conforme PRD-14 - RF-012
 *
 * Exibe:
 * - Limites de uso vs utilizado
 * - Modulos ativos
 * - Plano atual
 */

interface Props {
  orgId: string
  org: Organizacao
}

export function OrganizacaoConfigTab({ orgId, org }: Props) {
  const { data: limites, isLoading: loadingLimites } = useLimitesOrganizacao(orgId)
  const { data: modulos, isLoading: loadingModulos } = useModulosOrganizacao(orgId)
  const { data: planos } = usePlanos()
  const [showModulosModal, setShowModulosModal] = useState(false)

  const formatPercentual = (percentual: number | null) => {
    if (percentual === null) return 'Ilimitado'
    return `${Math.round(percentual)}%`
  }

  const getProgressColor = (percentual: number | null) => {
    if (percentual === null) return 'bg-primary'
    if (percentual >= 90) return 'bg-destructive'
    if (percentual >= 75) return 'bg-yellow-500'
    return 'bg-primary'
  }

  return (
    <div className="space-y-6">
      {/* Plano Atual */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Plano Atual</h3>
              <p className="text-sm text-muted-foreground">Configuracoes do plano contratado</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-primary">{org.plano?.nome || 'Sem plano'}</span>
          {planos && planos.length > 0 && (
            <select
              value={org.plano_id || ''}
              disabled
              className="px-3 py-1.5 text-sm border border-input rounded-md bg-muted text-muted-foreground"
            >
              {planos.map((plano) => (
                <option key={plano.id} value={plano.id}>
                  {plano.nome}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Limites de Uso */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">Limites de Uso</h3>

        {loadingLimites ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        ) : limites ? (
          <div className="space-y-4">
            {/* Usuarios */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  Usuarios
                </div>
                <span className="text-sm text-muted-foreground">
                  {limites.usuarios.usado} / {limites.usuarios.limite} ({formatPercentual(limites.usuarios.percentual)})
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getProgressColor(limites.usuarios.percentual)}`}
                  style={{ width: `${Math.min(limites.usuarios.percentual, 100)}%` }}
                />
              </div>
            </div>

            {/* Oportunidades */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  Oportunidades
                </div>
                <span className="text-sm text-muted-foreground">
                  {limites.oportunidades.usado} / {limites.oportunidades.limite || '∞'} ({formatPercentual(limites.oportunidades.percentual)})
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getProgressColor(limites.oportunidades.percentual)}`}
                  style={{ width: `${Math.min(limites.oportunidades.percentual || 0, 100)}%` }}
                />
              </div>
            </div>

            {/* Storage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <HardDrive className="w-4 h-4 text-muted-foreground" />
                  Armazenamento
                </div>
                <span className="text-sm text-muted-foreground">
                  {Math.round(limites.storage.usado_mb)} MB / {limites.storage.limite_mb} MB ({formatPercentual(limites.storage.percentual)})
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getProgressColor(limites.storage.percentual)}`}
                  style={{ width: `${Math.min(limites.storage.percentual, 100)}%` }}
                />
              </div>
            </div>

            {/* Contatos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Contatos
                </div>
                <span className="text-sm text-muted-foreground">
                  {limites.contatos.usado} / {limites.contatos.limite || '∞'} ({formatPercentual(limites.contatos.percentual)})
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getProgressColor(limites.contatos.percentual)}`}
                  style={{ width: `${Math.min(limites.contatos.percentual || 0, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Erro ao carregar limites</p>
        )}
      </div>

      {/* Modulos Ativos */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Modulos Ativos</h3>
          <button
            onClick={() => setShowModulosModal(true)}
            className="text-sm text-primary hover:underline"
          >
            Gerenciar
          </button>
        </div>

        {loadingModulos ? (
          <div className="animate-pulse grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        ) : modulos && modulos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {modulos.map((modulo) => (
              <div
                key={modulo.id}
                className={`p-3 rounded-lg border ${
                  modulo.ativo
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-muted/50 border-border opacity-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Puzzle className={`w-4 h-4 ${modulo.ativo ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${modulo.ativo ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {modulo.nome}
                  </span>
                </div>
                {modulo.obrigatorio && (
                  <span className="text-xs text-muted-foreground mt-1 block">Obrigatorio</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Nenhum modulo configurado</p>
        )}
      </div>

      {/* Modal de Gerenciamento de Módulos */}
      {showModulosModal && (
        <GerenciarModulosModal
          orgId={orgId}
          orgNome={org.nome}
          onClose={() => setShowModulosModal(false)}
        />
      )}
    </div>
  )
}
