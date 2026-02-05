import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, CreditCard, Loader2, Trash2, AlertTriangle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, type Plano, type Modulo } from '../services/admin.api'
import { useModulos, useExcluirPlano } from '../hooks/usePlanos'

/**
 * AIDEV-NOTE: Modal de Criação/Edição de Plano
 * Conforme PRD-14 - RF-004
 * Reestruturado com footer fixo conforme Design System 10.5
 */

const planoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: z.string().optional(),
  preco_mensal: z.coerce.number().min(0, 'Preço deve ser positivo'),
  preco_anual: z.coerce.number().optional(),
  moeda: z.string().default('BRL'),
  limite_usuarios: z.coerce.number().min(-1, 'Use -1 para ilimitado'),
  limite_oportunidades: z.coerce.number().optional(),
  limite_storage_mb: z.coerce.number().min(1, 'Mínimo 1 MB'),
  limite_contatos: z.coerce.number().optional(),
  stripe_price_id_mensal: z.string().optional(),
  stripe_price_id_anual: z.string().optional(),
  ativo: z.boolean().default(true),
  visivel: z.boolean().default(true),
  ordem: z.coerce.number().default(0),
})

type PlanoFormData = z.infer<typeof planoSchema>

interface Props {
  plano?: Plano | null
  onClose: () => void
}

/**
 * AIDEV-NOTE: Helper para identificar plano Trial (padrão do sistema)
 */
function isTrialPlan(plano?: Plano | null): boolean {
  if (!plano) return false
  return plano.nome.toLowerCase() === 'trial' || plano.preco_mensal === 0
}

export function PlanoFormModal({ plano, onClose }: Props) {
  const queryClient = useQueryClient()
  const { data: modulos } = useModulos()
  const [selectedModulos, setSelectedModulos] = useState<string[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const isEditing = !!plano
  const isTrial = isTrialPlan(plano)

  const excluirMutation = useExcluirPlano()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PlanoFormData>({
    resolver: zodResolver(planoSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      preco_mensal: 0,
      preco_anual: 0,
      moeda: 'BRL',
      limite_usuarios: 5,
      limite_oportunidades: -1,
      limite_storage_mb: 500,
      limite_contatos: -1,
      stripe_price_id_mensal: '',
      stripe_price_id_anual: '',
      ativo: true,
      visivel: true,
      ordem: 0,
    },
  })

  useEffect(() => {
    if (plano) {
      reset({
        nome: plano.nome,
        descricao: plano.descricao || '',
        preco_mensal: plano.preco_mensal,
        preco_anual: plano.preco_anual || 0,
        moeda: plano.moeda,
        limite_usuarios: plano.limite_usuarios,
        limite_oportunidades: plano.limite_oportunidades || -1,
        limite_storage_mb: plano.limite_storage_mb,
        limite_contatos: plano.limite_contatos || -1,
        stripe_price_id_mensal: plano.stripe_price_id_mensal || '',
        stripe_price_id_anual: plano.stripe_price_id_anual || '',
        ativo: plano.ativo,
        visivel: plano.visivel,
        ordem: plano.ordem,
      })
    }
  }, [plano, reset])

  const createMutation = useMutation({
    mutationFn: (data: Omit<Plano, 'id'>) => adminApi.criarPlano(data),
    onSuccess: async (planoId) => {
      if (selectedModulos.length > 0) {
        await adminApi.definirModulosPlano(
          planoId,
          selectedModulos.map((id) => ({ modulo_id: id }))
        )
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'planos'] })
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Plano>) =>
      adminApi.atualizarPlano(plano!.id, data),
    onSuccess: async () => {
      if (plano) {
        await adminApi.definirModulosPlano(
          plano.id,
          selectedModulos.map((id) => ({ modulo_id: id }))
        )
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'planos'] })
      onClose()
    },
  })

  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const isDeleting = excluirMutation.isPending

  const onSubmit = (data: PlanoFormData) => {
    const payload = {
      ...data,
      descricao: data.descricao || null,
      preco_anual: data.preco_anual || null,
      limite_oportunidades: data.limite_oportunidades === -1 ? null : data.limite_oportunidades,
      limite_contatos: data.limite_contatos === -1 ? null : data.limite_contatos,
      stripe_price_id_mensal: data.stripe_price_id_mensal || null,
      stripe_price_id_anual: data.stripe_price_id_anual || null,
    }

    if (isEditing) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload as Omit<Plano, 'id'>)
    }
  }

  const toggleModulo = (moduloId: string) => {
    setSelectedModulos((prev) =>
      prev.includes(moduloId)
        ? prev.filter((id) => id !== moduloId)
        : [...prev, moduloId]
    )
  }

  const handleDelete = () => {
    if (!plano) return
    excluirMutation.mutate(plano.id, {
      onSuccess: () => {
        onClose()
      },
      onError: () => {
        // O erro será exibido pelo próprio componente
        setShowDeleteConfirm(false)
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-lg shadow-xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
        {/* Header - Fixo */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {isEditing ? 'Editar Plano' : 'Novo Plano'}
              </h2>
              {isTrial && (
                <p className="text-xs text-muted-foreground">
                  Plano padrão do sistema
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content - Área scrollável */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <form id="plano-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Informações Básicas
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Nome do Plano *
                  </label>
                  <input
                    {...register('nome')}
                    readOnly={isTrial}
                    className={`w-full h-11 px-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary ${isTrial ? 'bg-muted cursor-not-allowed' : ''}`}
                    placeholder="Ex: Professional"
                  />
                  {errors.nome && (
                    <p className="text-sm text-destructive mt-1">{errors.nome.message}</p>
                  )}
                  {isTrial && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Nome do plano padrão não pode ser alterado
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Ordem
                  </label>
                  <input
                    type="number"
                    {...register('ordem')}
                    className="w-full h-11 px-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Descrição
                </label>
                <textarea
                  {...register('descricao')}
                  rows={2}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                  placeholder="Descrição do plano..."
                />
              </div>
            </div>

            {/* Preços - Oculto para Trial */}
            {!isTrial && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Preços
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Preço Mensal (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('preco_mensal')}
                      className="w-full h-11 px-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                    {errors.preco_mensal && (
                      <p className="text-sm text-destructive mt-1">{errors.preco_mensal.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Preço Anual (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('preco_anual')}
                      className="w-full h-11 px-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Moeda
                    </label>
                    <select
                      {...register('moeda')}
                      className="w-full h-11 px-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="BRL">BRL</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Integração Stripe - Oculto para Trial */}
            {!isTrial && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Integração Stripe
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Vincule os Price IDs do Stripe para habilitar o checkout automático
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Stripe Price ID (Mensal)
                    </label>
                    <input
                      {...register('stripe_price_id_mensal')}
                      placeholder="price_1ABC123..."
                      className="w-full h-11 px-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Copie do Stripe Dashboard → Products → Price ID
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Stripe Price ID (Anual)
                    </label>
                    <input
                      {...register('stripe_price_id_anual')}
                      placeholder="price_1XYZ789..."
                      className="w-full h-11 px-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Opcional - deixe vazio se não oferecer plano anual
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Limites */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Limites (-1 = ilimitado)
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Usuários *
                  </label>
                  <input
                    type="number"
                    {...register('limite_usuarios')}
                    className="w-full h-11 px-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Oportunidades
                  </label>
                  <input
                    type="number"
                    {...register('limite_oportunidades')}
                    className="w-full h-11 px-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Storage (MB) *
                  </label>
                  <input
                    type="number"
                    {...register('limite_storage_mb')}
                    className="w-full h-11 px-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Contatos
                  </label>
                  <input
                    type="number"
                    {...register('limite_contatos')}
                    className="w-full h-11 px-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </h3>
              
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('ativo')}
                    className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground">Plano Ativo</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('visivel')}
                    className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground">Visível para Clientes</span>
                </label>
              </div>
            </div>

            {/* Módulos */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Módulos Incluídos
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {modulos?.map((modulo: Modulo) => (
                  <label
                    key={modulo.id}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedModulos.includes(modulo.id)
                        ? 'bg-primary/5 border-primary'
                        : 'bg-card border-border hover:bg-accent'
                    } ${modulo.obrigatorio ? 'opacity-75' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedModulos.includes(modulo.id) || modulo.obrigatorio}
                      disabled={modulo.obrigatorio}
                      onChange={() => !modulo.obrigatorio && toggleModulo(modulo.id)}
                      className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="text-sm font-medium text-foreground">{modulo.nome}</span>
                      {modulo.obrigatorio && (
                        <span className="ml-1 text-xs text-muted-foreground">(obrigatório)</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Footer - Fixo */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-border bg-background flex items-center justify-between gap-3">
          {/* Botão Excluir (apenas em edição de planos não-Trial) */}
          <div>
            {isEditing && !isTrial && !showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting || isDeleting}
                className="px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            )}
            {showDeleteConfirm && (
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">Confirmar exclusão?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-1.5 text-sm font-medium bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors flex items-center gap-2"
                >
                  {isDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
                  Sim, excluir
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-accent transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
            {excluirMutation.isError && (
              <p className="text-sm text-destructive mt-1">
                {(excluirMutation.error as Error).message}
              </p>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isDeleting}
              className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="plano-form"
              disabled={isSubmitting || isDeleting}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Criar Plano'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
