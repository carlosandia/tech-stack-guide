/**
 * AIDEV-NOTE: Breakdown por Canal de Origem (PRD-18)
 * Donut chart + lista com barras proporcionais
 * Usa Recharts diretamente (já na stack)
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { BreakdownCanalItem } from '../../types/relatorio.types'

interface BreakdownCanalProps {
  data: BreakdownCanalItem[]
}

const CORES_CANAL: Record<string, string> = {
  meta_ads: '#3B82F6',
  google: '#F59E0B',
  google_ads: '#F59E0B',
  organico: '#10B981',
  indicacao: '#8B5CF6',
  direto: '#6B7280',
  whatsapp: '#22C55E',
  instagram: '#EC4899',
  email: '#06B6D4',
  outros: '#94A3B8',
}

function getCorCanal(canal: string): string {
  const key = canal.toLowerCase().replace(/\s+/g, '_')
  return CORES_CANAL[key] || CORES_CANAL.outros
}

function formatarNomeCanal(canal: string): string {
  const nomes: Record<string, string> = {
    meta_ads: 'Meta Ads',
    google_ads: 'Google Ads',
    google: 'Google',
    organico: 'Orgânico',
    indicacao: 'Indicação',
    direto: 'Direto',
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
    email: 'Email',
    outros: 'Outros',
  }
  return nomes[canal.toLowerCase()] || canal
}

export default function BreakdownCanal({ data }: BreakdownCanalProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
          Por Canal de Origem
        </h3>
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            Nenhum dado de canal disponível no período.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Os canais são populados via campo utm_source das oportunidades.
          </p>
        </div>
      </div>
    )
  }

  const chartData = data.map((item) => ({
    name: formatarNomeCanal(item.canal),
    value: item.oportunidades,
    color: getCorCanal(item.canal),
  }))

  const totalOportunidades = data.reduce((sum, item) => sum + item.oportunidades, 0)

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-6">
        Por Canal de Origem
      </h3>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Donut Chart */}
        <div className="w-full lg:w-48 h-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const item = payload[0]
                  return (
                    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                      <p className="text-xs font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(item.value as number).toLocaleString('pt-BR')} oportunidades
                      </p>
                    </div>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Lista de canais */}
        <div className="flex-1 space-y-3">
          {data.map((item) => {
            const cor = getCorCanal(item.canal)
            const barWidth = totalOportunidades > 0
              ? Math.max((item.oportunidades / totalOportunidades) * 100, 2)
              : 0

            return (
              <div key={item.canal} className="group">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cor }}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {formatarNomeCanal(item.canal)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.percentual_total.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {item.oportunidades.toLocaleString('pt-BR')} leads
                    </span>
                    <span className="hidden sm:inline">
                      {item.fechados} fechados ({item.taxa_fechamento.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: cor,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
