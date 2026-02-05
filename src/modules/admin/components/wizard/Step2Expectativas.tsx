import { useFormContext } from 'react-hook-form'
import { Check, Loader2, RefreshCw, WifiOff, AlertTriangle, Gift } from 'lucide-react'
import { usePlanos } from '../../hooks/usePlanos'
import type { CriarOrganizacaoData } from '../../schemas/organizacao.schema'

/**
 * AIDEV-NOTE: Etapa 2 do Wizard - Selecao de Plano + Cortesia
 * Conforme PRD-14 - RF-002
 */

export function Step2Expectativas() {
  const {
    watch,
    setValue,
    register,
    formState: { errors },
  } = useFormContext<CriarOrganizacaoData>()
  
  const { data: planos, isLoading, isError, error, refetch, fetchStatus } = usePlanos()
  const selectedPlanoId = watch('plano_id')
  const cortesia = watch('cortesia')

  // Encontrar plano selecionado para verificar se é pago
  const selectedPlano = planos?.find(p => p.id === selectedPlanoId)
  const isPlanoPago = selectedPlano && selectedPlano.preco_mensal > 0

  const formatLimit = (value: number | null) => {
    if (value === null || value === -1) return 'Ilimitado'
    return value.toString()
  }

  const formatPrice = (preco: number) => {
    if (preco === 0) return 'Grátis'
    return `R$ ${preco.toFixed(0)}/mês`
  }

  // Estado: Sem conexão (paused)
  if (fetchStatus === 'paused') {
    return (
      <div className="py-8 flex flex-col items-center justify-center text-center">
        <WifiOff className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground mb-1">Sem conexão</p>
        <p className="text-xs text-muted-foreground mb-4">
          Verifique sua internet e tente novamente.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar novamente
        </button>
      </div>
    )
  }

  // Estado: Erro
  if (isError) {
    return (
      <div className="py-8 flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-10 h-10 text-destructive mb-3" />
        <p className="text-sm font-medium text-destructive mb-1">Erro ao carregar planos</p>
        <p className="text-xs text-muted-foreground mb-4 max-w-xs">
          {String((error as Error)?.message || 'Não foi possível conectar ao servidor.')}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar novamente
        </button>
      </div>
    )
  }

  // Estado: Carregando
  if (isLoading) {
    return (
      <div className="py-8 flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Carregando planos...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Selecione o plano <span className="text-destructive">*</span>
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {planos?.map((plano) => {
            const isSelected = selectedPlanoId === plano.id
            const isTrial = plano.nome.toLowerCase() === 'trial'
            
            return (
              <button
                key={plano.id}
                type="button"
                onClick={() => {
                  setValue('plano_id', plano.id, { shouldValidate: true })
                  // Se mudar para plano grátis, desativa cortesia
                  if (plano.preco_mensal === 0) {
                    setValue('cortesia', false)
                    setValue('cortesia_motivo', '')
                  }
                }}
                className={`
                  relative p-4 rounded-lg border-2 text-left transition-all
                  ${isSelected 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50 bg-background'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                )}
                
                {/* Badge de Cortesia no card */}
                {isSelected && cortesia && plano.preco_mensal > 0 && (
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <Gift className="w-3 h-3" />
                      Cortesia
                    </span>
                  </div>
                )}
                
                <div className={`font-semibold text-foreground ${isSelected && cortesia && plano.preco_mensal > 0 ? 'mt-5' : ''}`}>
                  {plano.nome}
                </div>
                <div className={`text-lg font-bold ${isTrial ? 'text-green-600' : 'text-primary'}`}>
                  {cortesia && isSelected && plano.preco_mensal > 0 ? (
                    <span className="text-green-600">Cortesia</span>
                  ) : (
                    formatPrice(plano.preco_mensal)
                  )}
                </div>
                
                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                  <div>{formatLimit(plano.limite_usuarios)} usuários</div>
                  <div>{formatLimit(plano.limite_oportunidades)} oportunidades</div>
                </div>
              </button>
            )
          })}
        </div>
        
        {errors.plano_id && (
          <p className="mt-2 text-sm text-destructive">{errors.plano_id.message}</p>
        )}
      </div>

      {/* Toggle de Cortesia - apenas para planos pagos */}
      {isPlanoPago && (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={cortesia || false}
              onChange={(e) => {
                setValue('cortesia', e.target.checked, { shouldValidate: true })
                if (!e.target.checked) {
                  setValue('cortesia_motivo', '')
                }
              }}
              className="mt-0.5 w-4 h-4 rounded border-input text-primary focus:ring-primary"
            />
            <div className="flex-1">
              <span className="font-medium text-foreground flex items-center gap-2">
                <Gift className="w-4 h-4 text-green-600" />
                Conceder como cortesia
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                A organização usará o plano sem cobrança
              </p>
            </div>
          </label>
          
          {cortesia && (
            <div className="mt-3">
              <textarea
                placeholder="Motivo da cortesia (obrigatório)"
                {...register('cortesia_motivo')}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              {errors.cortesia_motivo && (
                <p className="mt-1 text-sm text-destructive">{errors.cortesia_motivo.message}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
