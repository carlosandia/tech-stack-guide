/**
 * AIDEV-NOTE: Gráfico de funil de conversão (CSS puro)
 */

import type { FunilConversao } from '../../services/formularios.api'

interface Props {
  funil: FunilConversao
}

export function FunilConversaoChart({ funil }: Props) {
  const { etapas } = funil
  if (!etapas || etapas.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        Sem dados de funil ainda
      </div>
    )
  }

  const maxValor = Math.max(...etapas.map((e) => e.valor), 1)

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Funil de Conversão</h3>
      <div className="space-y-2">
        {etapas.map((etapa, i) => {
          const pct = Math.round((etapa.valor / maxValor) * 100)
          const dropoff = i > 0 && etapas[i - 1].valor > 0
            ? Math.round(((etapas[i - 1].valor - etapa.valor) / etapas[i - 1].valor) * 100)
            : null

          return (
            <div key={etapa.nome} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{etapa.nome}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{etapa.valor.toLocaleString('pt-BR')}</span>
                  {dropoff !== null && dropoff > 0 && (
                    <span className="text-[10px] text-destructive">-{dropoff}%</span>
                  )}
                </div>
              </div>
              <div className="h-6 rounded bg-muted overflow-hidden">
                <div
                  className="h-full rounded bg-primary transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
