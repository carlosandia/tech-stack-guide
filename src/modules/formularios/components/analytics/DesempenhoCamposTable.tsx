/**
 * AIDEV-NOTE: Tabela de desempenho por campo - UI aprimorada
 */

import { BarChart3, AlertTriangle, Clock, MousePointerClick } from 'lucide-react'
import type { DesempenhoCampo } from '../../services/formularios.api'
import type { CampoFormulario } from '../../services/formularios.api'

interface Props {
  desempenho: DesempenhoCampo[]
  campos: CampoFormulario[]
}

export function DesempenhoCamposTable({ desempenho, campos }: Props) {
  if (desempenho.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Desempenho por Campo</h3>
        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
          <BarChart3 className="w-8 h-8 mb-2 opacity-30" />
          <p className="text-sm">Sem dados de desempenho por campo</p>
          <p className="text-xs mt-1 opacity-60">As métricas aparecerão com interações nos campos</p>
        </div>
      </div>
    )
  }

  const getCampoLabel = (campoId: string) => {
    const campo = campos.find((c) => c.id === campoId)
    return campo?.label || campoId
  }

  // Sort by most interactions
  const sorted = [...desempenho].sort((a, b) => b.total_interacoes - a.total_interacoes)
  const maxInteracoes = Math.max(...sorted.map(d => d.total_interacoes), 1)

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">Desempenho por Campo</h3>
      <div className="space-y-3">
        {sorted.map((d) => {
          const pct = Math.round((d.total_interacoes / maxInteracoes) * 100)

          return (
            <div key={d.campo_id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground truncate max-w-[180px]">
                  {getCampoLabel(d.campo_id)}
                </span>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-muted-foreground" title="Interações">
                    <MousePointerClick className="w-3 h-3" />
                    {d.total_interacoes}
                  </span>
                  {d.total_erros > 0 && (
                    <span className="flex items-center gap-1 text-destructive font-medium" title="Erros">
                      <AlertTriangle className="w-3 h-3" />
                      {d.total_erros}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-muted-foreground" title="Tempo médio">
                    <Clock className="w-3 h-3" />
                    {d.tempo_medio_segundos}s
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${d.total_erros > 0 ? 'bg-amber-500' : 'bg-primary/70'}`}
                  style={{ width: `${Math.max(pct, 3)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
