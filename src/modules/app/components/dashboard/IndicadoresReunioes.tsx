/**
 * AIDEV-NOTE: Indicadores estratégicos de reuniões (PRD-18)
 * Explica o gap entre Agendadas e Realizadas no funil
 */

import { AlertTriangle, XCircle, RefreshCw, UserX, CheckCircle, HelpCircle, CalendarClock, CalendarCheck } from 'lucide-react'
import type { RelatorioFunilResponse } from '../../types/relatorio.types'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface IndicadoresReunioesProps {
  data: RelatorioFunilResponse
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

export default function IndicadoresReunioes({ data }: IndicadoresReunioesProps) {
  const { funil, taxas_reunioes } = data

  // Só exibir se houver reuniões no período
  const totalReunioes = funil.reunioes_agendadas + funil.reunioes_noshow + funil.reunioes_canceladas
  if (totalReunioes === 0) return null

  const cards = [
    {
      label: 'Agendadas',
      value: funil.reunioes_agendadas.toString(),
      icon: CalendarCheck,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      tooltip: 'Total de reuniões agendadas no período selecionado.',
    },
    {
      label: 'No-Shows',
      value: funil.reunioes_noshow.toString(),
      icon: UserX,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      tooltip: 'Reuniões agendadas em que o prospect não compareceu.',
    },
    {
      label: 'Canceladas',
      value: funil.reunioes_canceladas.toString(),
      icon: XCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      tooltip: 'Reuniões que foram canceladas no período.',
    },
    {
      label: 'Reagendadas',
      value: funil.reunioes_reagendadas.toString(),
      icon: RefreshCw,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
      tooltip: 'Reuniões que foram reagendadas para outra data.',
    },
    {
      label: 'Taxa No-Show',
      value: taxas_reunioes.taxa_noshow !== null ? `${taxas_reunioes.taxa_noshow}%` : '—',
      icon: AlertTriangle,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      tooltip: 'Percentual de reuniões em que o prospect não compareceu. Fórmula: no-shows ÷ total agendadas × 100.',
      isRate: true,
      rateColor: taxas_reunioes.taxa_noshow !== null && taxas_reunioes.taxa_noshow > 20
        ? 'text-destructive'
        : taxas_reunioes.taxa_noshow !== null && taxas_reunioes.taxa_noshow > 10
          ? 'text-amber-500'
          : 'text-emerald-500',
    },
    {
      label: 'Comparecimento',
      value: taxas_reunioes.taxa_comparecimento !== null ? `${taxas_reunioes.taxa_comparecimento}%` : '—',
      icon: CheckCircle,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      tooltip: 'Percentual de reuniões realizadas sobre o total agendado. Fórmula: realizadas ÷ total agendadas × 100.',
      isRate: true,
      rateColor: taxas_reunioes.taxa_comparecimento !== null && taxas_reunioes.taxa_comparecimento >= 80
        ? 'text-emerald-500'
        : taxas_reunioes.taxa_comparecimento !== null && taxas_reunioes.taxa_comparecimento >= 60
          ? 'text-amber-500'
          : 'text-destructive',
    },
  ]

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
        <CalendarClock className="w-4 h-4 text-muted-foreground" />
        Indicadores de Reuniões
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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
              <p className={`text-xl font-bold ${'isRate' in card && card.isRate && card.rateColor ? card.rateColor : 'text-foreground'}`}>
                {card.value}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
