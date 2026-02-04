import { useState } from 'react'
import { Plus, Edit, CreditCard, Users, HardDrive, Puzzle } from 'lucide-react'
import { usePlanos, useModulos } from '../hooks/usePlanos'
import { PlanoFormModal } from '../components/PlanoFormModal'
import type { Plano } from '../services/admin.api'
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
  const { data: planos, isLoading, error } = usePlanos()
  const { data: modulos } = useModulos()
  const [planoEditando, setPlanoEditando] = useState<Plano | null>(null)
  const [showModal, setShowModal] = useState(false)

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

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <p className="text-destructive">Erro ao carregar planos</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Planos</h1>
          <p className="text-muted-foreground mt-1">Gerencie os planos da plataforma</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Plano
        </button>
      </div>

      {/* Cards de Planos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {planos?.map((plano) => (
          <PlanoCard
            key={plano.id}
            plano={plano}
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
  onEdit,
  formatCurrency,
}: {
  plano: Plano
  onEdit: () => void
  formatCurrency: (value: number) => string
}) {
  return (
    <div className="bg-card rounded-lg border border-border p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">{plano.nome}</h3>
        {!plano.ativo && (
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
            Inativo
          </span>
        )}
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
      {plano.descricao && (
        <p className="text-sm text-muted-foreground mt-4 line-clamp-2">{plano.descricao}</p>
      )}

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
