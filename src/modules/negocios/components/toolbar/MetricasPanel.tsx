/**
 * AIDEV-NOTE: Painel de métricas do Kanban
 * Conforme PRD-07 RF-13 + RF-15.4 (filtro de métricas)
 * Calcula métricas a partir dos dados filtrados do Kanban
 * Visibilidade controlada via toolbar (BarChart3 icon)
 * Se todas as métricas forem desmarcadas, o painel desaparece completamente
 */

import { useMemo } from 'react'
import {
  TrendingUp, TrendingDown, DollarSign, Target, Clock,
  AlertTriangle, CheckCircle, XCircle, BarChart3,
} from 'lucide-react'
import type { KanbanData } from '../../services/negocios.api'
import { type MetricasVisiveis, isMetricaVisivel } from './FiltrarMetricasPopover'
import { differenceInDays } from 'date-fns'

interface MetricasPanelProps {
  data: KanbanData
  metricasVisiveis: MetricasVisiveis
}

interface Metrica {
  id: string
  label: string
  valor: string
  icon: React.ElementType
  cor: 'default' | 'success' | 'warning' | 'destructive' | 'primary'
}

const COR_CLASSES: Record<string, string> = {
  default: 'text-foreground bg-muted/50',
  success: 'text-success bg-success/10',
  warning: 'text-warning bg-warning/10',
  destructive: 'text-destructive bg-destructive/10',
  primary: 'text-primary bg-primary/10',
}

const ICON_COR_CLASSES: Record<string, string> = {
  default: 'text-muted-foreground',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  primary: 'text-primary',
}

function formatCurrency(valor: number): string {
  if (valor >= 1_000_000) return `R$ ${(valor / 1_000_000).toFixed(1)}M`
  if (valor >= 1_000) return `R$ ${(valor / 1_000).toFixed(1)}K`
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor)
}

function calcularMetricas(data: KanbanData): Metrica[] {
  const todasOps = data.etapas.flatMap(e => e.oportunidades)
  const total = todasOps.length

  // Classificar por tipo de etapa
  const etapasMap = new Map(data.etapas.map(e => [e.id, e]))
  const abertas = todasOps.filter(o => {
    const etapa = etapasMap.get(o.etapa_id)
    return etapa && etapa.tipo !== 'ganho' && etapa.tipo !== 'perda'
  })
  const ganhas = todasOps.filter(o => {
    const etapa = etapasMap.get(o.etapa_id)
    return etapa?.tipo === 'ganho'
  })
  const perdidas = todasOps.filter(o => {
    const etapa = etapasMap.get(o.etapa_id)
    return etapa?.tipo === 'perda'
  })

  // Valores
  const valorTotal = abertas.reduce((sum, o) => sum + (o.valor || 0), 0)
  const valorGanho = ganhas.reduce((sum, o) => sum + (o.valor || 0), 0)
  const ticketMedio = abertas.length > 0
    ? valorTotal / abertas.length
    : 0

  // Taxa de conversão
  const finalizadas = ganhas.length + perdidas.length
  const taxaConversao = finalizadas > 0
    ? Math.round((ganhas.length / finalizadas) * 100)
    : 0

  // Forecast (valor ponderado pela probabilidade da etapa)
  const forecast = abertas.reduce((sum, o) => {
    const etapa = etapasMap.get(o.etapa_id)
    const prob = (etapa?.probabilidade || 0) / 100
    return sum + (o.valor || 0) * prob
  }, 0)

  // Tempo médio (dias desde criação das abertas)
  const agora = new Date()
  const tempoTotal = abertas.reduce((sum, o) => {
    return sum + differenceInDays(agora, new Date(o.criado_em))
  }, 0)
  const tempoMedio = abertas.length > 0 ? Math.round(tempoTotal / abertas.length) : 0

  // Stagnadas (>7 dias sem atualização)
  const stagnadas = abertas.filter(o => {
    return differenceInDays(agora, new Date(o.atualizado_em)) > 7
  }).length

  // Vencendo em 7 dias
  const vencendo = abertas.filter(o => {
    if (!o.previsao_fechamento) return false
    const diasAte = differenceInDays(new Date(o.previsao_fechamento), agora)
    return diasAte >= 0 && diasAte <= 7
  }).length

  // Atrasadas (previsão já passou)
  const atrasadas = abertas.filter(o => {
    if (!o.previsao_fechamento) return false
    return new Date(o.previsao_fechamento) < agora
  }).length

  return [
    { id: 'total', label: 'Total', valor: String(total), icon: BarChart3, cor: 'default' },
    { id: 'abertas', label: 'Abertas', valor: String(abertas.length), icon: Target, cor: 'primary' },
    { id: 'ganhas', label: 'Ganhas', valor: String(ganhas.length), icon: CheckCircle, cor: 'success' },
    { id: 'perdidas', label: 'Perdidas', valor: String(perdidas.length), icon: XCircle, cor: 'destructive' },
    { id: 'valor_pipeline', label: 'Valor Pipeline', valor: formatCurrency(valorTotal), icon: DollarSign, cor: 'primary' },
    { id: 'valor_ganho', label: 'Valor Ganho', valor: formatCurrency(valorGanho), icon: TrendingUp, cor: 'success' },
    { id: 'ticket_medio', label: 'Ticket Médio', valor: formatCurrency(ticketMedio), icon: DollarSign, cor: 'default' },
    { id: 'conversao', label: 'Conversão', valor: `${taxaConversao}%`, icon: TrendingUp, cor: taxaConversao >= 30 ? 'success' : taxaConversao >= 15 ? 'warning' : 'destructive' },
    { id: 'forecast', label: 'Forecast', valor: formatCurrency(forecast), icon: Target, cor: 'primary' },
    { id: 'tempo_medio', label: 'Tempo Médio', valor: `${tempoMedio}d`, icon: Clock, cor: tempoMedio <= 14 ? 'success' : tempoMedio <= 30 ? 'warning' : 'destructive' },
    { id: 'stagnadas', label: 'Estagnadas', valor: String(stagnadas), icon: AlertTriangle, cor: stagnadas > 0 ? 'warning' : 'success' },
    { id: 'vencendo', label: 'Vencendo 7d', valor: String(vencendo), icon: Clock, cor: vencendo > 0 ? 'warning' : 'default' },
    { id: 'atrasadas', label: 'Atrasadas', valor: String(atrasadas), icon: TrendingDown, cor: atrasadas > 0 ? 'destructive' : 'success' },
  ]
}

export function MetricasPanel({ data, metricasVisiveis }: MetricasPanelProps) {
  const metricas = useMemo(() => calcularMetricas(data), [data])

  const metricasFiltradas = useMemo(() => {
    if (Object.keys(metricasVisiveis).length === 0) return metricas
    return metricas.filter(m => isMetricaVisivel(metricasVisiveis, m.id))
  }, [metricas, metricasVisiveis])

  // Se nenhuma métrica visível, não renderiza nada
  if (metricasFiltradas.length === 0) return null

  return (
    <div className="flex-shrink-0 border-b border-border bg-card/50 px-3 sm:px-4 py-3 animate-enter">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2">
        {metricasFiltradas.map(m => (
          <div
            key={m.id}
            className={`
              flex items-center gap-2 px-2.5 py-2 rounded-lg
              ${COR_CLASSES[m.cor]}
              transition-all duration-200
            `}
          >
            <m.icon className={`w-3.5 h-3.5 flex-shrink-0 ${ICON_COR_CLASSES[m.cor]}`} />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground leading-none truncate">
                {m.label}
              </p>
              <p className="text-sm font-semibold leading-tight mt-0.5 truncate">
                {m.valor}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
