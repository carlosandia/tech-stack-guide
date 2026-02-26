/**
 * AIDEV-NOTE: Breakdown por Canal de Origem (PRD-18)
 * Donut chart CSS puro + lista com barras proporcionais
 * Sem dependência de Recharts para evitar conflito de instância React duplicada
 */

import { HelpCircle } from 'lucide-react'
import type { BreakdownCanalItem } from '../../types/relatorio.types'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

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
  manual: '#6B7280',
  formulario: '#F97316',
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
    manual: 'Manual',
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
    email: 'Email',
    formulario: 'Formulário',
    webhook: 'Webhook',
    outros: 'Outros',
  }
  return nomes[canal.toLowerCase()] || canal.charAt(0).toUpperCase() + canal.slice(1)
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
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
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Por Canal de Origem
          </h3>
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 text-xs" side="top">
              <p className="mb-1.5">Distribuição de oportunidades por canal de aquisição.</p>
              <p className="text-muted-foreground">
                <strong>Prioridade:</strong> Se a oportunidade possui UTM (utm_source), esse valor é usado. Caso contrário, usa a origem do fluxo de criação (WhatsApp, formulário, etc.). Se nenhum estiver definido, aparece como "Direto".
              </p>
            </PopoverContent>
          </Popover>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            Nenhum dado de canal disponível no período.
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
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Por Canal de Origem
        </h3>
        <Popover>
          <PopoverTrigger asChild>
            <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 text-xs" side="top">
            <p className="mb-1.5">Distribuição de oportunidades por canal de aquisição.</p>
            <p className="text-muted-foreground">
              <strong>Prioridade:</strong> Se a oportunidade possui UTM (utm_source), esse valor é usado. Caso contrário, usa a origem do fluxo de criação (WhatsApp, formulário, etc.). Se nenhum estiver definido, aparece como "Direto".
            </p>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Donut Chart CSS */}
        <CSSDonutChart data={chartData} />

        {/* Lista de canais */}
        <div className="flex-1 space-y-4 w-full">
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
                </div>
                <div className="h-2 bg-muted/30 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: cor,
                    }}
                  />
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span>{item.oportunidades.toLocaleString('pt-BR')} leads</span>
                  <span>{item.fechados} ganhos ({item.taxa_fechamento.toFixed(1)}%)</span>
                  <span>Receita: {formatarMoeda(item.valor_gerado)}</span>
                  <span>Ticket: {formatarMoeda(item.ticket_medio)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
