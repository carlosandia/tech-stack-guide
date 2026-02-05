import { useState, useEffect } from 'react'
 import { Plus, Edit, CreditCard, Users, HardDrive, Puzzle, Shield, RefreshCw, WifiOff, AlertTriangle } from 'lucide-react'
import { usePlanos, useModulos } from '../hooks/usePlanos'
import { useConfigGlobal } from '../hooks/useConfigGlobal'
 import { useToolbar } from '../contexts/ToolbarContext'
import { PlanoFormModal } from '../components/PlanoFormModal'
import type { Plano } from '../services/admin.api'

/**
 * AIDEV-NOTE: Helper para identificar plano Trial (padrão do sistema)
 * Trial é identificado pelo nome "Trial" ou preço zero
 */
function isTrialPlan(plano: Plano): boolean {
  return plano.nome.toLowerCase() === 'trial' || plano.preco_mensal === 0
}

/**
 * AIDEV-NOTE: Pagina de Gestao de Planos
 * Conforme PRD-14 - Gestao de Planos
 *
 * Exibe:
 * - Cards com planos disponiveis
 * - Modal de criacao/edicao
 * - Modulos vinculados
 */

export function PlanosPage() {
   const { data: planos, isLoading, error, isError, refetch, fetchStatus } = usePlanos()
  const { data: modulos } = useModulos()
  const { data: configStripe } = useConfigGlobal('stripe')
  const { setActions, setSubtitle } = useToolbar()
  const [planoEditando, setPlanoEditando] = useState<Plano | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Extrair dias de trial da config do Stripe
  const trialDias = (configStripe?.configuracoes as { trial_dias?: number })?.trial_dias ?? 14

  // Injetar ação no toolbar
  useEffect(() => {
    setSubtitle('Gerencie os planos da plataforma')
    setActions(
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Novo Plano
      </button>
    )
    return () => {
      setSubtitle(null)
      setActions(null)
    }
  }, [setActions, setSubtitle])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

   // Estado: Sem conexão (paused)
   if (fetchStatus === 'paused') {
    return (
       <div className="bg-card rounded-lg border border-border p-8">
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
     )
   }
 
   if (isError) {
     return (
       <div className="bg-card rounded-lg border border-border p-8">
         <div className="flex flex-col items-center justify-center text-center">
           <AlertTriangle className="w-12 h-12 text-destructive mb-3" />
           <h3 className="text-lg font-medium text-destructive mb-1">
             Erro ao carregar planos
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
    )
  }

  return (
    <div className="space-y-6">
      {/* Cards de Planos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {planos?.map((plano) => (
          <PlanoCard
            key={plano.id}
            plano={plano}
            isTrial={isTrialPlan(plano)}
            trialDias={trialDias}
            onEdit={() => {
              setPlanoEditando(plano)
              setShowModal(true)
            }}
            formatCurrency={formatCurrency}
          />
        ))}
        {(!planos || planos.length === 0) && (
          <div className="col-span-full bg-card rounded-lg border border-border p-8 text-center">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum plano cadastrado</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Criar primeiro plano
            </button>
          </div>
        )}
      </div>

      {/* Modulos Disponiveis */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Modulos Disponiveis</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {modulos?.map((modulo) => (
            <div
              key={modulo.id}
              className="p-3 rounded-lg border border-border bg-muted/30"
            >
              <div className="flex items-center gap-2">
                <Puzzle className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{modulo.nome}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {modulo.descricao}
              </p>
              {modulo.obrigatorio && (
                <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  Obrigatorio
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Criação/Edição */}
      {showModal && (
        <PlanoFormModal
          plano={planoEditando}
          onClose={() => {
            setShowModal(false)
            setPlanoEditando(null)
          }}
        />
      )}
    </div>
  )
}

// Componente de Card do Plano
function PlanoCard({
  plano,
  isTrial,
  trialDias,
  onEdit,
  formatCurrency,
}: {
  plano: Plano
  isTrial: boolean
  trialDias: number
  onEdit: () => void
  formatCurrency: (value: number) => string
}) {
  return (
    <div className="bg-card rounded-lg border border-border p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">{plano.nome}</h3>
        <div className="flex items-center gap-2">
          {isTrial && (
            <span 
              className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium"
              title="Plano padrão do sistema - não pode ser removido"
            >
              <Shield className="w-3 h-3" />
              PADRÃO
            </span>
          )}
          {!plano.ativo && (
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
              Inativo
            </span>
          )}
        </div>
      </div>

      {/* Preco */}
      <div className="mb-4">
        <p className="text-3xl font-bold text-primary">
          {plano.preco_mensal === 0 ? 'Gratis' : formatCurrency(plano.preco_mensal)}
        </p>
        <p className="text-sm text-muted-foreground">/mes</p>
      </div>

      {/* Limites */}
      <div className="space-y-2 flex-1">
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-foreground">
            {plano.limite_usuarios === -1 ? 'Usuarios ilimitados' : `${plano.limite_usuarios} usuarios`}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <HardDrive className="w-4 h-4 text-muted-foreground" />
          <span className="text-foreground">{plano.limite_storage_mb} MB storage</span>
        </div>
        {plano.limite_oportunidades && (
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">
              {plano.limite_oportunidades === -1 ? 'Oportunidades ilimitadas' : `${plano.limite_oportunidades} oportunidades`}
            </span>
          </div>
        )}
      </div>

      {/* Descricao */}
      {isTrial ? (
        <p className="text-sm text-muted-foreground mt-4">
          Teste gratuito por {trialDias} dias
        </p>
      ) : plano.descricao ? (
        <p className="text-sm text-muted-foreground mt-4 line-clamp-2">{plano.descricao}</p>
      ) : null}

      {/* Actions */}
      <button
        onClick={onEdit}
        className="mt-4 flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-accent transition-colors"
      >
        <Edit className="w-4 h-4" />
        Editar
      </button>
    </div>
  )
}

export default PlanosPage
