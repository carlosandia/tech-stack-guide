/**
 * AIDEV-NOTE: KPIs Principais do Dashboard (PRD-18)
 * 6 cards: Novos Leads, Vendas, Receita Total, Perdas, Ticket Médio, Forecast
 */

import { Users, Trophy, DollarSign, XCircle, Target, TrendingUp, ArrowUpRight, ArrowDownRight, Minus, HelpCircle } from 'lucide-react'
import type { RelatorioFunilResponse, DashboardMetricasGeraisComVariacao } from '../../types/relatorio.types'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface KPIsPrincipaisProps {
  relatorio: RelatorioFunilResponse
  metricas: DashboardMetricasGeraisComVariacao
}

function formatarMoeda(valor: number): string {
  if (valor >= 1_000_000) return `R$ ${(valor / 1_000_000).toFixed(1)}M`
  if (valor >= 1_000) return `R$ ${(valor / 1_000).toFixed(1)}k`
  return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function VariacaoBadge({ valor, inverso = false }: { valor: number | null; inverso?: boolean }) {
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
  // Para perdas, positivo é ruim (inverso)
  const isGood = inverso ? !isPositive : isPositive

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
        isGood ? 'text-emerald-500' : 'text-red-500'
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

export default function KPIsPrincipais({ relatorio, metricas }: KPIsPrincipaisProps) {
  const kpis = [
    {
      label: 'Novos Leads',
      value: relatorio.funil.total_leads.toString(),
      variacao: relatorio.variacao.leads,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      tooltip: 'Quantidade de oportunidades criadas no período selecionado.',
    },
    {
      label: 'Vendas',
      value: relatorio.funil.fechados.toString(),
      variacao: relatorio.variacao.fechados,
      icon: Trophy,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      tooltip: 'Quantidade de negócios fechados como ganhos no período.',
    },
    {
      label: 'Receita Total',
      value: formatarMoeda(relatorio.kpis.valor_gerado),
      variacao: relatorio.variacao.valor_gerado,
      icon: DollarSign,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      tooltip: 'Soma dos valores de todos os negócios ganhos no período.',
    },
    {
      label: 'Perdas',
      value: metricas.perdas.toString(),
      variacao: metricas.variacao_perdas,
      inverso: true,
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      tooltip: 'Quantidade de negócios perdidos no período. Se aumentar, a seta fica vermelha.',
    },
    {
      label: 'Ticket Médio',
      value: formatarMoeda(relatorio.kpis.ticket_medio),
      variacao: relatorio.variacao.ticket_medio,
      icon: TrendingUp,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      tooltip: 'Valor médio dos negócios ganhos. Fórmula: receita total dividida pelo número de vendas.',
    },
    {
      label: 'Forecast',
      value: formatarMoeda(relatorio.kpis.forecast),
      variacao: null,
      icon: Target,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
      tooltip: 'Previsão de receita baseada no valor e probabilidade de cada etapa do funil.',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        return (
          <div
            key={kpi.label}
            className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.bgColor}`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <TooltipInfo>
                <p>{kpi.tooltip}</p>
              </TooltipInfo>
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              {kpi.label}
            </p>
            <p className="text-2xl font-bold text-foreground mb-1">
              {kpi.value}
            </p>
            <VariacaoBadge valor={kpi.variacao} inverso={'inverso' in kpi && kpi.inverso === true} />
          </div>
        )
      })}
    </div>
  )
}
