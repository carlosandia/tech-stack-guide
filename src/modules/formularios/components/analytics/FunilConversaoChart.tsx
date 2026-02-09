/**
 * AIDEV-NOTE: Gráfico de funil de conversão visual aprimorado
 */

import { TrendingDown } from 'lucide-react'
import type { FunilConversao } from '../../services/formularios.api'

interface Props {
  funil: FunilConversao
}

const CORES_FUNIL = [
  { bg: 'bg-blue-500', light: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  { bg: 'bg-amber-500', light: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
]

export function FunilConversaoChart({ funil }: Props) {
  const { etapas } = funil
  if (!etapas || etapas.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Funil de Conversão</h3>
        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
          <TrendingDown className="w-8 h-8 mb-2 opacity-30" />
          <p className="text-sm">Sem dados de funil ainda</p>
          <p className="text-xs mt-1 opacity-60">Os dados aparecerão quando o formulário receber interações</p>
        </div>
      </div>
    )
  }

  const maxValor = Math.max(...etapas.map((e) => e.valor), 1)

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">Funil de Conversão</h3>
      <div className="space-y-3">
        {etapas.map((etapa, i) => {
          const pct = Math.round((etapa.valor / maxValor) * 100)
          const dropoff = i > 0 && etapas[i - 1].valor > 0
            ? Math.round(((etapas[i - 1].valor - etapa.valor) / etapas[i - 1].valor) * 100)
            : null
          const cor = CORES_FUNIL[i % CORES_FUNIL.length]

          return (
            <div key={etapa.nome}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${cor.bg}`} />
                  <span className="font-medium text-foreground">{etapa.nome}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{etapa.valor.toLocaleString('pt-BR')}</span>
                  {dropoff !== null && dropoff > 0 && (
                    <span className="text-[10px] text-destructive font-medium bg-destructive/10 px-1.5 py-0.5 rounded-full">
                      -{dropoff}%
                    </span>
                  )}
                </div>
              </div>
              <div className="h-8 rounded-lg bg-muted/50 overflow-hidden relative">
                <div
                  className={`h-full rounded-lg ${cor.bg} transition-all duration-700 ease-out flex items-center justify-end pr-2`}
                  style={{ width: `${Math.max(pct, 2)}%` }}
                >
                  {pct > 15 && (
                    <span className="text-[10px] font-bold text-white">{pct}%</span>
                  )}
                </div>
                {pct <= 15 && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground">{pct}%</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Taxa de conversão geral */}
      {etapas.length >= 2 && etapas[0].valor > 0 && (
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Conversão geral</span>
          <span className="text-sm font-bold text-foreground">
            {Math.round((etapas[etapas.length - 1].valor / etapas[0].valor) * 100)}%
          </span>
        </div>
      )}
    </div>
  )
}
