/**
 * AIDEV-NOTE: Painel de métricas do Kanban
 * Conforme PRD-07 RF-13 + RF-15.4 (filtro de métricas)
 * Calcula métricas a partir dos dados filtrados do Kanban
 * Visibilidade controlada via toolbar (BarChart3 icon)
 * Se todas as métricas forem desmarcadas, o painel desaparece completamente
 */

import { useMemo, useState, useRef, useCallback, forwardRef } from 'react'
import {
  TrendingUp, TrendingDown, DollarSign, Target, Clock,
  AlertTriangle, CheckCircle, XCircle, BarChart3, ChevronDown, ChevronUp,
  Info,
} from 'lucide-react'
import type { KanbanData } from '../../services/negocios.api'
import { type MetricasVisiveis, isMetricaVisivel } from './FiltrarMetricasPopover'
import { differenceInDays, differenceInHours } from 'date-fns'
import { formatarMoedaCompacta } from '@/hooks/useLocalizacao'

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
  tooltip: string
}

const COR_CLASSES: Record<string, string> = {
  default: 'text-foreground bg-card/80 shadow-none',
  success: 'text-success bg-card/80 shadow-none',
  warning: 'text-warning bg-card/80 shadow-none',
  destructive: 'text-destructive bg-card/80 shadow-none',
  primary: 'text-primary bg-card/80 shadow-none',
}

const ICON_COR_CLASSES: Record<string, string> = {
  default: 'text-muted-foreground',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  primary: 'text-primary',
}

// AIDEV-NOTE: Tooltip com posicionamento fixed + cálculo dinâmico para nunca ultrapassar o viewport
function MetricTooltip({ text }: { text: string }) {
  const iconRef = useRef<HTMLSpanElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  const show = useCallback(() => {
    if (!iconRef.current) return
    const rect = iconRef.current.getBoundingClientRect()
    const tooltipW = 300
    const margin = 8
    // Centralizar horizontalmente abaixo do ícone
    let left = rect.left + rect.width / 2 - tooltipW / 2
    // Clamp para não sair do viewport
    if (left < margin) left = margin
    if (left + tooltipW > window.innerWidth - margin) left = window.innerWidth - margin - tooltipW
    setPos({ top: rect.bottom + 6, left })
  }, [])

  const hide = useCallback(() => setPos(null), [])

  return (
    <span
      ref={iconRef}
      className="inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onClick={show}
    >
      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
      {pos && (
        <span
          className="fixed z-[999] bg-popover text-popover-foreground text-xs rounded-md shadow-lg border px-3 py-2 whitespace-pre-line pointer-events-none"
          style={{ top: pos.top, left: pos.left, width: 300 }}
        >
          {text}
        </span>
      )}
    </span>
  )
}

function formatCurrency(valor: number): string {
  return formatarMoedaCompacta(valor)
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
  // Ticket Médio = valor médio das oportunidades GANHAS
  const ticketMedio = ganhas.length > 0
    ? valorGanho / ganhas.length
    : 0

  // Taxa de conversão = ganhas / total de oportunidades criadas * 100
  const taxaConversao = total > 0
    ? Math.round((ganhas.length / total) * 100)
    : 0

  // Forecast (valor ponderado pela probabilidade da etapa)
  const forecast = abertas.reduce((sum, o) => {
    const etapa = etapasMap.get(o.etapa_id)
    const prob = (etapa?.probabilidade || 0) / 100
    return sum + (o.valor || 0) * prob
  }, 0)

  // Tempo médio = ciclo de venda das oportunidades GANHAS (da criação até fechamento)
  // AIDEV-NOTE: Usa horas para precisão, exibe em dias/horas conforme magnitude
  const agora = new Date()
  const tempoTotalHorasGanhas = ganhas.reduce((sum, o) => {
    const fechamento = o.fechado_em ? new Date(o.fechado_em) : agora
    return sum + differenceInHours(fechamento, new Date(o.criado_em))
  }, 0)
  const tempoMedioHoras = ganhas.length > 0 ? Math.round(tempoTotalHorasGanhas / ganhas.length) : 0
  // Formatar: <24h mostra horas, >=24h mostra dias
  const tempoMedioLabel = tempoMedioHoras === 0 && ganhas.length > 0
    ? '<1h'
    : tempoMedioHoras < 24
      ? `${tempoMedioHoras}h`
      : `${Math.round(tempoMedioHoras / 24)}d`

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
    { id: 'total', label: 'Total', valor: String(total), icon: BarChart3, cor: 'default', tooltip: 'Número total de oportunidades em todas as etapas do funil, incluindo ganhas e perdidas.' },
    { id: 'abertas', label: 'Abertas', valor: String(abertas.length), icon: Target, cor: 'default', tooltip: 'Oportunidades que ainda estão em andamento no funil (não ganhas nem perdidas).' },
    { id: 'ganhas', label: 'Ganhas', valor: String(ganhas.length), icon: CheckCircle, cor: 'default', tooltip: 'Oportunidades que foram movidas para a etapa de ganho (fechadas com sucesso).' },
    { id: 'perdidas', label: 'Perdidas', valor: String(perdidas.length), icon: XCircle, cor: 'default', tooltip: 'Oportunidades que foram movidas para a etapa de perda (não convertidas).' },
    { id: 'valor_pipeline', label: 'Valor Pipeline', valor: formatCurrency(valorTotal), icon: DollarSign, cor: 'default', tooltip: 'Soma dos valores de todas as oportunidades abertas (em andamento no funil).' },
    { id: 'valor_ganho', label: 'Valor Ganho', valor: formatCurrency(valorGanho), icon: TrendingUp, cor: 'default', tooltip: 'Soma dos valores de todas as oportunidades ganhas (receita confirmada).' },
    { id: 'ticket_medio', label: 'Ticket Médio', valor: formatCurrency(ticketMedio), icon: DollarSign, cor: 'default', tooltip: 'Valor médio por oportunidade ganha.\nCálculo: Valor Ganho ÷ Número de Ganhas.' },
    { id: 'conversao', label: 'Conversão', valor: `${taxaConversao}%`, icon: TrendingUp, cor: 'default', tooltip: 'Percentual de oportunidades ganhas sobre o total.\nCálculo: (Ganhas ÷ Total) × 100.' },
    { id: 'forecast', label: 'Forecast', valor: formatCurrency(forecast), icon: Target, cor: 'default', tooltip: 'Previsão de receita ponderada pela probabilidade de cada etapa. Considera apenas oportunidades abertas.' },
    { id: 'tempo_medio', label: 'Tempo Médio', valor: tempoMedioLabel, icon: Clock, cor: 'default', tooltip: 'Ciclo médio de venda das oportunidades ganhas, da criação até o fechamento.' },
    { id: 'stagnadas', label: 'Estagnadas', valor: String(stagnadas), icon: AlertTriangle, cor: 'default', tooltip: 'Oportunidades abertas sem nenhuma atualização há mais de 7 dias.' },
    { id: 'vencendo', label: 'Vencendo 7d', valor: String(vencendo), icon: Clock, cor: 'default', tooltip: 'Oportunidades abertas com previsão de fechamento nos próximos 7 dias.' },
    { id: 'atrasadas', label: 'Atrasadas', valor: String(atrasadas), icon: TrendingDown, cor: 'default', tooltip: 'Oportunidades abertas cuja previsão de fechamento já passou.' },
  ]
}

// AIDEV-NOTE: Métricas prioritárias exibidas por padrão no mobile (3 primeiras)
const MOBILE_DEFAULT_COUNT = 3

export const MetricasPanel = forwardRef<HTMLDivElement, MetricasPanelProps>(function MetricasPanel({ data, metricasVisiveis }, _ref) {
  const metricas = useMemo(() => calcularMetricas(data), [data])
  const [expandido, setExpandido] = useState(false)

  const metricasFiltradas = useMemo(() => {
    if (Object.keys(metricasVisiveis).length === 0) return metricas
    return metricas.filter(m => isMetricaVisivel(metricasVisiveis, m.id))
  }, [metricas, metricasVisiveis])

  // Se nenhuma métrica visível, não renderiza nada
  if (metricasFiltradas.length === 0) return null

  const temMais = metricasFiltradas.length > MOBILE_DEFAULT_COUNT

  return (
    <div className="flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 animate-enter">
      {/* Desktop: grid normal */}
      <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2">
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
              <div className="flex items-center gap-1">
                <p className="text-[10px] text-muted-foreground leading-none truncate">
                  {m.label}
                </p>
                <MetricTooltip text={m.tooltip} />
              </div>
              <p className="text-sm font-semibold leading-tight mt-0.5 truncate">
                {m.valor}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: grid compacto com expand */}
      <div className="sm:hidden space-y-2">
        <div className="grid grid-cols-3 gap-1.5">
          {(expandido ? metricasFiltradas : metricasFiltradas.slice(0, MOBILE_DEFAULT_COUNT)).map(m => (
            <div
              key={m.id}
              className={`
                flex flex-col items-center gap-0.5 px-1.5 py-2 rounded-lg text-center
                ${COR_CLASSES[m.cor]}
                transition-all duration-200
              `}
            >
              <m.icon className={`w-3.5 h-3.5 ${ICON_COR_CLASSES[m.cor]}`} />
              <div className="flex items-center gap-0.5 justify-center">
                <p className="text-[9px] text-muted-foreground leading-none truncate">
                  {m.label}
                </p>
                <MetricTooltip text={m.tooltip} />
              </div>
              <p className="text-xs font-semibold leading-tight truncate w-full">
                {m.valor}
              </p>
            </div>
          ))}
        </div>

        {temMais && (
          <button
            onClick={() => setExpandido(!expandido)}
            className="w-full flex items-center justify-center gap-1 py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {expandido ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Menos métricas
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Ver mais ({metricasFiltradas.length - MOBILE_DEFAULT_COUNT})
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
})
MetricasPanel.displayName = 'MetricasPanel'
