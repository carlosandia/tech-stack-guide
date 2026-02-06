/**
 * AIDEV-NOTE: Componente de barra de progresso de meta
 * Conforme PRD-05 - Visualização de progresso
 */

import { getMetricaLabel, getMetricaUnidade } from '../../schemas/metas.schema'
import type { MetaComProgresso } from '../../services/configuracoes.api'

interface Props {
  meta: MetaComProgresso
  compact?: boolean
}

export function MetaProgressBar({ meta, compact }: Props) {
  const percentual = meta.progresso?.percentual_atingido || 0
  const valorAtual = meta.progresso?.valor_atual || 0
  const unidade = getMetricaUnidade(meta.metrica)

  const formatarValor = (v: number) => {
    if (unidade === 'R$') return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
    if (unidade === '%') return `${v}%`
    if (unidade === 'dias') return `${v} dias`
    return `${v}`
  }

  const corBarra = percentual >= 100
    ? 'bg-[hsl(var(--success))]'
    : percentual >= 70
    ? 'bg-primary'
    : percentual >= 40
    ? 'bg-[hsl(var(--warning))]'
    : 'bg-destructive'

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${corBarra}`}
            style={{ width: `${Math.min(percentual, 100)}%` }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground w-10 text-right">
          {Math.round(percentual)}%
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{getMetricaLabel(meta.metrica)}</span>
        <span className="text-muted-foreground">
          {formatarValor(valorAtual)} / {formatarValor(meta.valor_meta)}
        </span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${corBarra}`}
          style={{ width: `${Math.min(percentual, 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {percentual >= 100 ? '✓ Meta atingida' : `${Math.round(percentual)}% concluído`}
        </span>
        {percentual < 50 && (
          <span className="text-xs text-destructive font-medium">⚠ Em risco</span>
        )}
      </div>
    </div>
  )
}
