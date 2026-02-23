import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLimitesOrganizacao, useModulosOrganizacao } from '../hooks/useOrganizacoes'
import { usePlanos } from '../hooks/usePlanos'
import { revogarCortesia } from '../services/admin.api'
import { HardDrive, Users, Target, FileText, Puzzle, CreditCard, Gift, XCircle, Loader2 } from 'lucide-react'
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
 * - Opcao de revogar cortesia
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
  const [showRevogarConfirm, setShowRevogarConfirm] = useState(false)
  const queryClient = useQueryClient()

  const revogarMutation = useMutation({
    mutationFn: () => revogarCortesia(orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizacao', orgId] })
      queryClient.invalidateQueries({ queryKey: ['organizacoes'] })
      setShowRevogarConfirm(false)
    },
  })

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
      {/* Modal de Confirmação de Revogação */}
      {showRevogarConfirm && (
        <>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[400]" onClick={() => setShowRevogarConfirm(false)} />
          <div className="fixed inset-0 z-[401] flex items-center justify-center p-4 pointer-events-none">
            <div className="pointer-events-auto bg-card rounded-lg border border-border p-6 max-w-md w-full shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-destructive" />
                </div>
                <h3 className="font-semibold text-foreground">Revogar Cortesia</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Ao revogar a cortesia, a organização será <strong>bloqueada</strong> e os usuários precisarão escolher um plano pago para continuar usando o sistema.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowRevogarConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-md hover:bg-muted/80 transition-colors"
                  disabled={revogarMutation.isPending}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => revogarMutation.mutate()}
                  disabled={revogarMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive rounded-md hover:bg-destructive/90 transition-colors inline-flex items-center gap-2"
                >
                  {revogarMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirmar Revogação
                </button>
              </div>
              {revogarMutation.isError && (
                <p className="mt-3 text-sm text-destructive">
                  Erro: {(revogarMutation.error as Error)?.message || 'Falha ao revogar cortesia'}
                </p>
              )}
            </div>
          </div>
        </>
      )}

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
          {/* Botão de Revogar Cortesia */}
          {org.cortesia && (
            <button
              type="button"
              onClick={() => setShowRevogarConfirm(true)}
              className="px-3 py-1.5 text-sm font-medium text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10 transition-colors inline-flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              Revogar Cortesia
            </button>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-primary">{org.plano || 'Sem plano'}</span>
            {org.cortesia && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                <Gift className="w-3.5 h-3.5" />
                Cortesia
              </span>
            )}
          </div>
          {org.cortesia && org.cortesia_motivo && (
            <div className="p-3 bg-accent/50 border border-border rounded-lg">
              <p className="text-xs font-medium text-foreground mb-1">Motivo da cortesia:</p>
              <p className="text-sm text-muted-foreground">{org.cortesia_motivo}</p>
            </div>
          )}
          {planos && planos.length > 0 && (
            <select
              value={org.plano || ''}
              disabled
              className="px-3 py-1.5 text-sm border border-input rounded-md bg-muted text-muted-foreground"
            >
              {planos.map((plano) => (
                <option key={plano.id} value={plano.nome}>
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
                  style={{ width: `${Math.min(limites.usuarios.percentual ?? 0, 100)}%` }}
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
                  style={{ width: `${Math.min(limites.storage.percentual ?? 0, 100)}%` }}
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
