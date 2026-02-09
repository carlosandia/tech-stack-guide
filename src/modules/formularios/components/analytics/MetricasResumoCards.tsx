/**
 * AIDEV-NOTE: Cards de métricas resumo do formulário
 */

import { Eye, Send, TrendingUp, LogOut, Play } from 'lucide-react'
import type { MetricasFormulario } from '../../services/formularios.api'

interface Props {
  metricas: MetricasFormulario
}

const CARDS: { key: keyof MetricasFormulario; label: string; icon: typeof Eye; color: string; suffix?: string }[] = [
  { key: 'total_visualizacoes', label: 'Visualizações', icon: Eye, color: 'text-blue-500' },
  { key: 'total_submissoes', label: 'Submissões', icon: Send, color: 'text-green-500' },
  { key: 'taxa_conversao', label: 'Taxa de Conversão', icon: TrendingUp, color: 'text-primary', suffix: '%' },
  { key: 'total_inicios', label: 'Inícios', icon: Play, color: 'text-amber-500' },
  { key: 'total_abandonos', label: 'Abandonos', icon: LogOut, color: 'text-destructive' },
]

export function MetricasResumoCards({ metricas }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {CARDS.map(({ key, label, icon: Icon, color, suffix }) => (
        <div
          key={key}
          className="flex flex-col gap-1 p-3 rounded-lg border border-border bg-card"
        >
          <div className="flex items-center gap-1.5">
            <Icon className={`w-3.5 h-3.5 ${color}`} />
            <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
          </div>
          <span className="text-lg font-semibold text-foreground">
            {metricas[key]?.toLocaleString('pt-BR') ?? 0}
            {suffix || ''}
          </span>
        </div>
      ))}
    </div>
  )
}
