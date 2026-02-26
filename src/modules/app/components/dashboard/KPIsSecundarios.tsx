/**
 * AIDEV-NOTE: KPIs Secundários do Dashboard (PRD-18)
 * 4 cards: Ciclo Médio, Tarefas Abertas, Histórico Oportunidades, Conversão Geral
 */

import { Clock, CheckSquare, BarChart3, Percent, HelpCircle, TrendingUp, TrendingDown } from 'lucide-react'
import type { RelatorioFunilResponse, DashboardMetricasGeraisComVariacao } from '../../types/relatorio.types'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface KPIsSecundariosProps {
  relatorio: RelatorioFunilResponse
  metricas: DashboardMetricasGeraisComVariacao
}

function TooltipInfo({ children }: { children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 text-xs" side="top">
        {children}
      </PopoverContent>
    </Popover>
  )
}

interface CardDef {
  label: string
  value: string
  icon: typeof Clock
  color: string
  bgColor: string
  tooltip: string
  variacao?: number | null
  periodValue?: number
}

export default function KPIsSecundarios({ relatorio, metricas }: KPIsSecundariosProps) {
  const conversaoGeral = relatorio.conversoes.lead_para_fechado
  const variacaoOps = metricas.variacao_oportunidades

  const cards: CardDef[] = [
    {
      label: 'Ciclo Médio',
      value: relatorio.kpis.ciclo_medio_dias !== null
        ? `${relatorio.kpis.ciclo_medio_dias} dias`
        : '—',
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      tooltip: 'Tempo médio entre a criação e o fechamento de um negócio como ganho.',
    },
    {
      label: 'Tarefas Abertas',
      value: metricas.tarefas_abertas.toString(),
      icon: CheckSquare,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      tooltip: 'Total de tarefas pendentes ou em andamento da sua equipe neste momento.',
    },
    {
      label: 'Histórico de Oportunidades',
      value: metricas.total_oportunidades_historico.toLocaleString('pt-BR'),
      icon: BarChart3,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      tooltip: 'Total acumulado de todas as oportunidades já criadas. A variação compara a quantidade criada no período atual vs. o período anterior.',
      variacao: variacaoOps,
      periodValue: metricas.total_oportunidades_periodo,
    },
    {
      label: 'Conversão Geral',
      value: conversaoGeral !== null ? `${conversaoGeral}%` : '—',
      icon: Percent,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      tooltip: 'Percentual de leads que se tornaram vendas no período. Fórmula: vendas ÷ leads × 100.',
    },
  ]

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
        <BarChart3 className="w-4 h-4 text-muted-foreground" />
        Indicadores Operacionais
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${card.bgColor}`}>
                <Icon className={`w-3.5 h-3.5 ${card.color}`} />
              </div>
              <TooltipInfo>
                <p>{card.tooltip}</p>
              </TooltipInfo>
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
              {card.label}
            </p>
            <p className="text-xl font-bold text-foreground">{card.value}</p>
            {card.variacao !== undefined && card.variacao !== null && (
              <div className="flex items-center gap-1 mt-1.5">
                {card.variacao >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-destructive" />
                )}
                <span className={`text-[11px] font-semibold ${card.variacao >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                  {card.variacao > 0 ? '+' : ''}{card.variacao}%
                </span>
                {card.periodValue !== undefined && (
                  <span className="text-[10px] text-muted-foreground ml-1">
                    ({card.periodValue} no período)
                  </span>
                )}
              </div>
            )}
          </div>
        )
      })}
      </div>
    </div>
  )
}
