/**
 * AIDEV-NOTE: KPIs Estratégicos do Dashboard (PRD-18)
 * 4 cards: Ticket Médio, Valor Gerado, Ciclo Médio, Forecast
 * Com variação vs período anterior
 */

import { DollarSign, TrendingUp, Clock, Target, ArrowUpRight, ArrowDownRight, Minus, HelpCircle } from 'lucide-react'
import type { RelatorioFunilResponse } from '../../types/relatorio.types'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface KPIsEstrategicosProps {
  data: RelatorioFunilResponse
}

function formatarMoeda(valor: number): string {
  if (valor >= 1_000_000) return `R$ ${(valor / 1_000_000).toFixed(1)}M`
  if (valor >= 1_000) return `R$ ${(valor / 1_000).toFixed(1)}k`
  return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function VariacaoBadge({ valor }: { valor: number | null }) {
  if (valor === null) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="w-3 h-3" />
        <span>s/d</span>
      </span>
    )
  }

  const isPositive = valor > 0
  const isNeutral = valor === 0

  if (isNeutral) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="w-3 h-3" />
        <span>0%</span>
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
        isPositive ? 'text-emerald-500' : 'text-red-500'
      }`}
    >
      {isPositive ? (
        <ArrowUpRight className="w-3.5 h-3.5" />
      ) : (
        <ArrowDownRight className="w-3.5 h-3.5" />
      )}
      <span>{isPositive ? '+' : ''}{valor}%</span>
    </span>
  )
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

export default function KPIsEstrategicos({ data }: KPIsEstrategicosProps) {
  const kpis = [
    {
      label: 'Ticket Médio',
      value: formatarMoeda(data.kpis.ticket_medio),
      variacao: data.variacao.ticket_medio,
      icon: DollarSign,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      tooltip: 'Média de valor dos negócios ganhos no período. Fórmula: Soma dos valores / Total de negócios ganhos.',
    },
    {
      label: 'Valor Gerado',
      value: formatarMoeda(data.kpis.valor_gerado),
      variacao: data.variacao.valor_gerado,
      icon: TrendingUp,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      tooltip: 'Soma total dos valores de todos os negócios ganhos no período selecionado.',
    },
    {
      label: 'Ciclo Médio',
      value: data.kpis.ciclo_medio_dias !== null
        ? `${data.kpis.ciclo_medio_dias} dias`
        : '—',
      variacao: null,
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      tooltip: 'Tempo médio entre a criação do contato e o fechamento do negócio como ganho.',
    },
    {
      label: 'Forecast',
      value: formatarMoeda(data.kpis.forecast),
      variacao: null,
      icon: Target,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
      tooltip: 'Valor ponderado do pipeline atual. Fórmula: Soma de (valor × probabilidade da etapa). Não filtrado por período.',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        return (
          <div
            key={kpi.label}
            className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.bgColor}`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {kpi.label}
                </span>
              </div>
              <TooltipInfo>
                <p>{kpi.tooltip}</p>
              </TooltipInfo>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">
              {kpi.value}
            </p>
            <VariacaoBadge valor={kpi.variacao} />
          </div>
        )
      })}
    </div>
  )
}
