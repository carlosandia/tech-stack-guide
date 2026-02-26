/**
 * AIDEV-NOTE: Funil de Conversão visual (PRD-18)
 * 5 blocos: Leads → MQLs → SQLs → Reuniões → Ganhos
 * Com taxas de conversão entre etapas
 */

import { ArrowRight, Users, Target, UserCheck, Calendar, Trophy, Info } from 'lucide-react'
import type { RelatorioFunilResponse } from '../../types/relatorio.types'

interface FunilConversaoProps {
  data: RelatorioFunilResponse
}

interface EtapaFunil {
  label: string
  value: number
  icon: React.ElementType
  color: string
  bgColor: string
  taxa: number | null
  taxaLabel: string
  dica: string
}

export default function FunilConversao({ data }: FunilConversaoProps) {
  const etapas: EtapaFunil[] = [
    {
      label: 'Leads',
      value: data.funil.total_leads,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
      taxa: null,
      taxaLabel: '100%',
      dica: 'Oportunidades criadas no período e funil selecionado',
    },
    {
      label: 'MQLs',
      value: data.funil.mqls,
      icon: Target,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20',
      taxa: data.conversoes.lead_para_mql,
      taxaLabel: data.conversoes.lead_para_mql ? `${data.conversoes.lead_para_mql}%` : '—',
      dica: 'Leads qualificados como Marketing Qualified Lead',
    },
    {
      label: 'SQLs',
      value: data.funil.sqls,
      icon: UserCheck,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10 border-violet-500/20',
      taxa: data.conversoes.mql_para_sql,
      taxaLabel: data.conversoes.mql_para_sql ? `${data.conversoes.mql_para_sql}%` : '—',
      dica: 'Leads qualificados como Sales Qualified Lead',
    },
    {
      label: 'Reuniões',
      value: data.funil.reunioes,
      icon: Calendar,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      taxa: data.conversoes.sql_para_reuniao,
      taxaLabel: data.conversoes.sql_para_reuniao ? `${data.conversoes.sql_para_reuniao}%` : '—',
      dica: 'Reuniões concluídas no período',
    },
    {
      label: 'Ganhos',
      value: data.funil.fechados,
      icon: Trophy,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      taxa: data.conversoes.reuniao_para_fechado,
      taxaLabel: data.conversoes.reuniao_para_fechado ? `${data.conversoes.reuniao_para_fechado}%` : '—',
      dica: 'Negócios fechados como ganhos',
    },
  ]

  const taxaGeral = data.conversoes.lead_para_fechado

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Funil de Conversão
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {data.periodo.label}
          </p>
        </div>
        {taxaGeral !== null && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full">
            <span className="text-xs font-semibold text-emerald-500">
              {taxaGeral}% conversão geral
            </span>
          </div>
        )}
      </div>

      {/* Desktop: horizontal */}
      <div className="hidden md:flex items-stretch gap-2">
        {etapas.map((etapa, index) => {
          const Icon = etapa.icon
          return (
            <div key={etapa.label} className="flex items-center gap-2 flex-1">
              <div className={`flex-1 border rounded-xl p-4 ${etapa.bgColor} transition-all hover:shadow-md`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${etapa.bgColor}`}>
                    <Icon className={`w-4 h-4 ${etapa.color}`} />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {etapa.label}
                  </span>
                </div>
                <p className={`text-2xl font-bold ${etapa.color}`}>
                  {etapa.value.toLocaleString('pt-BR')}
                </p>
                {index > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {etapa.taxaLabel} conversão
                  </p>
                )}
                {etapa.value === 0 && (
                  <div className="flex items-start gap-1 mt-2 p-2 bg-background/50 rounded-md">
                    <Info className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      {etapa.dica}
                    </span>
                  </div>
                )}
              </div>
              {index < etapas.length - 1 && (
                <div className="flex flex-col items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
                  {etapas[index + 1].taxa !== null && (
                    <span className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                      {etapas[index + 1].taxaLabel}
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile: vertical cards */}
      <div className="md:hidden space-y-3">
        {etapas.map((etapa, index) => {
          const Icon = etapa.icon
          return (
            <div key={etapa.label}>
              <div className={`border rounded-xl p-4 ${etapa.bgColor}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${etapa.bgColor}`}>
                      <Icon className={`w-5 h-5 ${etapa.color}`} />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase">
                        {etapa.label}
                      </span>
                      <p className={`text-xl font-bold ${etapa.color}`}>
                        {etapa.value.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  {index > 0 && (
                    <span className={`text-sm font-semibold ${etapa.color}`}>
                      {etapa.taxaLabel}
                    </span>
                  )}
                </div>
              </div>
              {index < etapas.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowRight className="w-4 h-4 text-muted-foreground/30 rotate-90" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
