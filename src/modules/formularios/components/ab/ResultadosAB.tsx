/**
 * AIDEV-NOTE: Resultados de um teste A/B
 */

import { Trophy } from 'lucide-react'
import type { TesteAB, VarianteAB } from '../../services/formularios.api'

interface Props {
  teste: TesteAB
  variantes: VarianteAB[]
}

export function ResultadosAB({ teste, variantes }: Props) {
  if (variantes.length === 0) return null

  const totalViews = variantes.reduce((s, v) => s + (v.contagem_visualizacoes ?? 0), 0)
  const totalConv = variantes.reduce((s, v) => s + (v.contagem_submissoes ?? 0), 0)
  const vencedora = variantes.find((v) => v.id === teste.variante_vencedora_id)

  return (
    <div className="space-y-3 p-3 rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-foreground">Resultados</h4>
        <span className="text-[10px] text-muted-foreground">
          {totalViews.toLocaleString('pt-BR')} views · {totalConv.toLocaleString('pt-BR')} conversões
        </span>
      </div>

      {vencedora && teste.status === 'concluido' && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10 border border-primary/20">
          <Trophy className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-foreground">
            Vencedora: <strong>{vencedora.nome_variante}</strong> ({(vencedora.taxa_conversao ?? 0).toFixed(1)}%)
          </span>
        </div>
      )}

      <div className="space-y-1.5">
        {variantes.map((v) => {
          const isVencedora = v.id === teste.variante_vencedora_id

          return (
            <div key={v.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">{v.letra_variante}: {v.nome_variante}</span>

                  {isVencedora && <Trophy className="w-3 h-3 text-primary" />}
                </div>
                <span className="font-semibold">{(v.taxa_conversao ?? 0).toFixed(1)}%</span>
              </div>
              <div className="h-4 rounded bg-muted overflow-hidden">
                <div
                  className={`h-full rounded transition-all duration-500 ${
                    isVencedora ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                  style={{ width: `${Math.max((v.taxa_conversao ?? 0), 2)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
