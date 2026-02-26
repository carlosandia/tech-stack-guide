/**
 * AIDEV-NOTE: Funil de Conversão visual (PRD-18)
 * 6 blocos: Leads → MQLs → SQLs → Reuniões Agendadas → Reuniões Realizadas → Ganhos
 * Com taxas de conversão e custos de investimento integrados
 */

import { ArrowRight, Users, Target, UserCheck, CalendarPlus, CalendarCheck, Trophy, Info, DollarSign } from 'lucide-react'
import type { RelatorioFunilResponse, InvestMode } from '../../types/relatorio.types'

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
  custo: number | null
  custoLabel: string
  extraInfo?: string
}

function formatarMoeda(valor: number): string {
  return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getCustos(investMode: InvestMode) {
  if (!investMode.ativo) {
    return { cpl: null, cpmql: null, custoSql: null, custoReuniaoAgendada: null, custoReuniaoRealizada: null, cac: null, romi: null }
  }
  return {
    cpl: investMode.cpl,
    cpmql: investMode.cpmql,
    custoSql: investMode.custo_por_sql,
    custoReuniaoAgendada: investMode.custo_por_reuniao_agendada,
    custoReuniaoRealizada: investMode.custo_por_reuniao_realizada,
    cac: investMode.cac,
    romi: investMode.romi,
  }
}

export default function FunilConversao({ data }: FunilConversaoProps) {
  const custos = getCustos(data.invest_mode)
  const investAtivo = data.invest_mode.ativo

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
      custo: custos.cpl,
      custoLabel: 'CPL',
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
      custo: custos.cpmql,
      custoLabel: 'Custo/MQL',
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
      custo: custos.custoSql,
      custoLabel: 'Custo/SQL',
    },
    {
      label: 'R. Agendadas',
      value: data.funil.reunioes_agendadas,
      icon: CalendarPlus,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      taxa: data.conversoes.sql_para_reuniao_agendada,
      taxaLabel: data.conversoes.sql_para_reuniao_agendada ? `${data.conversoes.sql_para_reuniao_agendada}%` : '—',
      dica: 'Reuniões agendadas no período',
      custo: custos.custoReuniaoAgendada,
      custoLabel: 'Custo/Agendada',
    },
    {
      label: 'R. Realizadas',
      value: data.funil.reunioes_realizadas,
      icon: CalendarCheck,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10 border-orange-500/20',
      taxa: data.conversoes.reuniao_agendada_para_realizada,
      taxaLabel: data.conversoes.reuniao_agendada_para_realizada ? `${data.conversoes.reuniao_agendada_para_realizada}%` : '—',
      dica: 'Reuniões realizadas no período',
      custo: custos.custoReuniaoRealizada,
      custoLabel: 'Custo/Realizada',
    },
    {
      label: 'Ganhos',
      value: data.funil.fechados,
      icon: Trophy,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      taxa: data.conversoes.reuniao_realizada_para_fechado,
      taxaLabel: data.conversoes.reuniao_realizada_para_fechado ? `${data.conversoes.reuniao_realizada_para_fechado}%` : '—',
      dica: 'Negócios fechados como ganhos',
      custo: custos.cac,
      custoLabel: 'CAC',
      extraInfo: custos.romi !== null ? `ROMI: ${custos.romi}%` : undefined,
    },
  ]

  const taxaGeral = data.conversoes.lead_para_fechado
  const totalInvestido = investAtivo ? (data.invest_mode as { total_investido: number }).total_investido : null

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Funil de Conversão
        </h3>
        <div className="flex items-center gap-2">
          {totalInvestido !== null && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full">
              <DollarSign className="w-3 h-3 text-primary" />
              <span className="text-xs font-semibold text-primary">
                Investido: {formatarMoeda(totalInvestido)}
              </span>
            </div>
          )}
          {taxaGeral !== null && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full">
              <span className="text-xs font-semibold text-emerald-500">
                {taxaGeral}% conversão geral
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Desktop: horizontal */}
      <div className="hidden lg:flex items-stretch gap-1.5">
        {etapas.map((etapa, index) => {
          const Icon = etapa.icon
          return (
            <div key={etapa.label} className="flex items-center gap-1.5 flex-1">
              <div className={`flex-1 border rounded-xl p-3 ${etapa.bgColor} transition-all hover:shadow-md`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${etapa.bgColor}`}>
                    <Icon className={`w-3.5 h-3.5 ${etapa.color}`} />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    {etapa.label}
                  </span>
                </div>
                <p className={`text-xl font-bold ${etapa.color}`}>
                  {etapa.value.toLocaleString('pt-BR')}
                </p>
                {index > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {etapa.taxaLabel} conversão
                  </p>
                )}

                {/* Custo de investimento integrado */}
                {investAtivo && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-2.5 h-2.5 text-muted-foreground" />
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wide">{etapa.custoLabel}</span>
                    </div>
                    <p className="text-[11px] font-semibold text-foreground mt-0.5">
                      {etapa.custo !== null ? formatarMoeda(etapa.custo) : '—'}
                    </p>
                    {etapa.extraInfo && (
                      <p className={`text-[11px] font-bold mt-0.5 ${custos.romi !== null && custos.romi > 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                        {etapa.extraInfo}
                      </p>
                    )}
                  </div>
                )}

                {etapa.value === 0 && !investAtivo && (
                  <div className="flex items-start gap-1 mt-2 p-1.5 bg-background/50 rounded-md">
                    <Info className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                    <span className="text-[9px] text-muted-foreground leading-tight">
                      {etapa.dica}
                    </span>
                  </div>
                )}
              </div>
              {index < etapas.length - 1 && (
                <div className="flex flex-col items-center justify-center shrink-0">
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                  {etapas[index + 1].taxa !== null && (
                    <span className="text-[9px] font-semibold text-muted-foreground mt-0.5">
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
      <div className="lg:hidden space-y-3">
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
                  <div className="text-right">
                    {index > 0 && (
                      <span className={`text-sm font-semibold ${etapa.color}`}>
                        {etapa.taxaLabel}
                      </span>
                    )}
                    {investAtivo && etapa.custo !== null && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {etapa.custoLabel}: {formatarMoeda(etapa.custo)}
                      </p>
                    )}
                    {etapa.extraInfo && (
                      <p className={`text-[10px] font-bold ${custos.romi !== null && custos.romi > 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                        {etapa.extraInfo}
                      </p>
                    )}
                  </div>
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
