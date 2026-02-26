/**
 * AIDEV-NOTE: Breakdown por Canal de Origem (PRD-18)
 * Donut chart CSS puro + lista com barras proporcionais
 * Sem dependência de Recharts para evitar conflito de instância React duplicada
 */

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

/**
 * Donut chart CSS puro usando conic-gradient
 */
function CSSDonutChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total === 0) return null

  // Build conic-gradient stops
  let accumulated = 0
  const stops = data.flatMap((d) => {
    const start = accumulated
    const end = accumulated + (d.value / total) * 100
    accumulated = end
    return [`${d.color} ${start}% ${end}%`]
  })

  const gradient = `conic-gradient(${stops.join(', ')})`

  return (
    <div className="relative w-44 h-44 mx-auto lg:mx-0 shrink-0">
      <div
        className="w-full h-full rounded-full"
        style={{ background: gradient }}
      />
      {/* Inner circle for donut effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-card flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{total.toLocaleString('pt-BR')}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
          </div>
        </div>
      </div>
    </div>
  )
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

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Donut Chart CSS */}
        <CSSDonutChart data={chartData} />

        {/* Lista de canais */}
        <div className="flex-1 space-y-3 w-full">
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
