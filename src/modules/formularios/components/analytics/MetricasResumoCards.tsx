/**
 * AIDEV-NOTE: Cards de métricas resumo do formulário - UI aprimorada
 */

import { Eye, Send, TrendingUp, LogOut, Play } from 'lucide-react'
import type { MetricasFormulario } from '../../services/formularios.api'

interface Props {
  metricas: MetricasFormulario
}

const CARDS: { key: keyof MetricasFormulario; label: string; icon: typeof Eye; bgClass: string; iconClass: string; suffix?: string }[] = [
  { key: 'total_visualizacoes', label: 'Visualizações', icon: Eye, bgClass: 'bg-blue-50 dark:bg-blue-950/30', iconClass: 'text-blue-600 dark:text-blue-400' },
  { key: 'total_submissoes', label: 'Submissões', icon: Send, bgClass: 'bg-emerald-50 dark:bg-emerald-950/30', iconClass: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'taxa_conversao', label: 'Taxa de Conversão', icon: TrendingUp, bgClass: 'bg-violet-50 dark:bg-violet-950/30', iconClass: 'text-violet-600 dark:text-violet-400', suffix: '%' },
  { key: 'total_inicios', label: 'Inícios', icon: Play, bgClass: 'bg-amber-50 dark:bg-amber-950/30', iconClass: 'text-amber-600 dark:text-amber-400' },
  { key: 'total_abandonos', label: 'Abandonos', icon: LogOut, bgClass: 'bg-red-50 dark:bg-red-950/30', iconClass: 'text-red-600 dark:text-red-400' },
]

export function MetricasResumoCards({ metricas }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {CARDS.map(({ key, label, icon: Icon, bgClass, iconClass, suffix }) => {
        const value = metricas[key] ?? 0

        return (
          <div
            key={key}
            className="flex flex-col gap-2 p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow"
          >
            <div className={`w-8 h-8 rounded-lg ${bgClass} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${iconClass}`} />
            </div>
            <div>
            <span className="text-2xl font-bold text-foreground tracking-tight">
              {typeof value === 'number' ? value.toLocaleString('pt-BR') : String(value)}
              {suffix || ''}
            </span>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{label}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
