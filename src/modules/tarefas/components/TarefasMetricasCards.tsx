/**
 * AIDEV-NOTE: Cards de métricas do módulo Tarefas (PRD-10)
 * 4 cards: Em Aberto, Atrasadas, Concluídas, Tempo Médio
 * Cards clicáveis para filtro rápido (exceto Tempo Médio)
 */

// AIDEV-NOTE: Removido forwardRef - componente não precisa expor ref externo
import { Clock, AlertTriangle, CheckCircle, Timer } from 'lucide-react'
import type { TarefasMetricas } from '../services/tarefas.api'

type FiltroRapido = 'em_aberto' | 'atrasadas' | 'concluidas' | null

interface TarefasMetricasCardsProps {
  metricas: TarefasMetricas | undefined
  isLoading: boolean
  filtroAtivo: FiltroRapido
  onFiltroChange: (filtro: FiltroRapido) => void
}

interface MetricaCard {
  key: FiltroRapido
  label: string
  icon: typeof Clock
  value: number | string
  colorClass: string
  borderClass: string
  iconBg: string
  clickable: boolean
}

export function TarefasMetricasCards({
  metricas,
  isLoading,
  filtroAtivo,
  onFiltroChange,
}: TarefasMetricasCardsProps) {
  const cards: MetricaCard[] = [
    {
      key: 'em_aberto',
      label: 'Em Aberto',
      icon: Clock,
      value: metricas?.em_aberto ?? 0,
      colorClass: 'text-primary',
      borderClass: 'border-primary/30',
      iconBg: 'bg-primary/10',
      clickable: true,
    },
    {
      key: 'atrasadas',
      label: 'Atrasadas',
      icon: AlertTriangle,
      value: metricas?.atrasadas ?? 0,
      colorClass: 'text-destructive',
      borderClass: 'border-destructive/30',
      iconBg: 'bg-destructive/10',
      clickable: true,
    },
    {
      key: 'concluidas',
      label: 'Concluídas',
      icon: CheckCircle,
      value: metricas?.concluidas ?? 0,
      colorClass: 'text-[hsl(var(--success))]',
      borderClass: 'border-[hsl(var(--success))]/30',
      iconBg: 'bg-[hsl(var(--success))]/10',
      clickable: true,
    },
    {
      key: null,
      label: 'Tempo Médio',
      icon: Timer,
      value: metricas?.tempo_medio_dias != null
        ? `${metricas.tempo_medio_dias}d`
        : '—',
      colorClass: 'text-muted-foreground',
      borderClass: 'border-border',
      iconBg: 'bg-muted',
      clickable: false,
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-3 sm:px-4 lg:px-6 py-3">
      {cards.map((card) => {
        const Icon = card.icon
        const isActive = card.key !== null && filtroAtivo === card.key

        return (
          <button
            key={card.label}
            type="button"
            disabled={!card.clickable || isLoading}
            onClick={() => {
              if (!card.clickable || card.key === null) return
              onFiltroChange(isActive ? null : card.key)
            }}
            className={`
              flex items-center gap-3 p-3 rounded-lg border transition-all duration-200
              ${card.clickable ? 'cursor-pointer hover:shadow-sm' : 'cursor-default'}
              ${isActive
                ? `${card.borderClass} bg-card shadow-sm ring-1 ring-inset ring-primary/10`
                : 'border-border bg-card hover:bg-accent/30'
              }
            `}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${card.iconBg}`}>
              <Icon className={`w-4 h-4 ${card.colorClass}`} />
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs text-muted-foreground truncate">{card.label}</p>
              {isLoading ? (
                <div className="h-6 w-10 bg-muted animate-pulse rounded mt-0.5" />
              ) : (
                <p className={`text-lg font-semibold ${card.colorClass}`}>
                  {card.value}
                </p>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
