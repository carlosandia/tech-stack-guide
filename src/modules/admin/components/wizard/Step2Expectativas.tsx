import { useFormContext } from 'react-hook-form'
import { Check, Loader2 } from 'lucide-react'
import { usePlanos } from '../../hooks/usePlanos'
import type { CriarOrganizacaoData } from '../../schemas/organizacao.schema'

/**
 * AIDEV-NOTE: Etapa 2 do Wizard - Selecao de Plano
 * Conforme PRD-14 - RF-002
 */

export function Step2Expectativas() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CriarOrganizacaoData>()
  
  const { data: planos, isLoading } = usePlanos()
  const selectedPlanoId = watch('plano_id')

  const formatLimit = (value: number | null) => {
    if (value === null || value === -1) return 'Ilimitado'
    return value.toString()
  }

  const formatPrice = (preco: number) => {
    if (preco === 0) return 'Grátis'
    return `R$ ${preco.toFixed(0)}/mês`
  }

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
                onClick={() => setValue('plano_id', plano.id, { shouldValidate: true })}
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
                
                <div className="font-semibold text-foreground">{plano.nome}</div>
                <div className={`text-lg font-bold ${isTrial ? 'text-green-600' : 'text-primary'}`}>
                  {formatPrice(plano.preco_mensal)}
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
    </div>
  )
}
