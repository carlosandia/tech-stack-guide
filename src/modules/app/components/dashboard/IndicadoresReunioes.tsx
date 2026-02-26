/**
 * AIDEV-NOTE: Indicadores estratégicos de reuniões (PRD-18)
 * Explica o gap entre Agendadas e Realizadas no funil
 */

import { XCircle, RefreshCw, UserX, HelpCircle, CalendarClock, CalendarCheck, CheckCheck } from 'lucide-react'
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

  // Cards simples (sem taxa embutida)
  const simpleCards = [
    {
      label: 'Agendadas',
      value: funil.reunioes_agendadas.toString(),
      icon: CalendarCheck,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      tooltip: 'Total de reuniões agendadas no período selecionado.',
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
  ]

  // Taxa no-show color
  const noshowRateColor = taxas_reunioes.taxa_noshow !== null && taxas_reunioes.taxa_noshow > 20
    ? 'text-destructive'
    : taxas_reunioes.taxa_noshow !== null && taxas_reunioes.taxa_noshow > 10
      ? 'text-amber-500'
      : 'text-emerald-500'

  // Taxa comparecimento color
  const compRateColor = taxas_reunioes.taxa_comparecimento !== null && taxas_reunioes.taxa_comparecimento >= 80
    ? 'text-emerald-500'
    : taxas_reunioes.taxa_comparecimento !== null && taxas_reunioes.taxa_comparecimento >= 60
      ? 'text-amber-500'
      : 'text-destructive'

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
        <CalendarClock className="w-4 h-4 text-muted-foreground" />
        Indicadores de Reuniões
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Cards simples */}
        {simpleCards.map((card) => {
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
              <p className="text-xl font-bold text-foreground">
                {card.value}
              </p>
            </div>
          )
        })}

        {/* Card unificado: No-Shows + Taxa */}
        <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-amber-500/10">
              <UserX className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <TooltipInfo>
              <p>No-shows: reuniões em que o prospect não compareceu. A taxa é calculada como no-shows ÷ agendadas × 100.</p>
            </TooltipInfo>
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
            No-Shows
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold text-foreground">
              {funil.reunioes_noshow}
            </p>
            <p className={`text-sm font-semibold ${noshowRateColor}`}>
              {taxas_reunioes.taxa_noshow !== null ? `${taxas_reunioes.taxa_noshow}%` : '—'}
            </p>
          </div>
        </div>

        {/* Card unificado: Realizadas + Comparecimento */}
        <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/10">
              <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <TooltipInfo>
              <p>Reuniões efetivamente realizadas. A taxa de comparecimento é calculada como realizadas ÷ agendadas × 100.</p>
            </TooltipInfo>
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
            Realizadas
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold text-foreground">
              {funil.reunioes_realizadas}
            </p>
            <p className={`text-sm font-semibold ${compRateColor}`}>
              {taxas_reunioes.taxa_comparecimento !== null ? `${taxas_reunioes.taxa_comparecimento}%` : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
