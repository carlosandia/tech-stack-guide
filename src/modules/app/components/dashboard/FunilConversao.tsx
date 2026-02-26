/**
 * AIDEV-NOTE: Funil de Conversão visual (PRD-18)
 * 6 blocos: Leads → MQLs → SQLs → Reuniões Agendadas → Reuniões Realizadas → Ganhos
 * Com taxas de conversão e custos de investimento integrados
 * Suporta configuração de etapas visíveis com recálculo inteligente
 * Suporta filtro por canal de investimento (Meta Ads, Google Ads, Outros)
 */

import { useState } from 'react'
import { ArrowRight, Users, Target, UserCheck, CalendarPlus, CalendarCheck, Trophy, DollarSign, HelpCircle, SlidersHorizontal, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useFunilEtapasConfig } from '../../hooks/useFunilEtapasConfig'
import { useRelatorioFunil } from '../../hooks/useRelatorioFunil'
import type { RelatorioFunilResponse, InvestMode, FunilQuery } from '../../types/relatorio.types'

interface FunilConversaoProps {
  data: RelatorioFunilResponse
  query?: FunilQuery
}

// AIDEV-NOTE: configKey null = etapa fixa (Leads/Ganhos), string = etapa configurável
interface EtapaFunil {
  label: string
  configKey: string | null
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
  tooltip: string
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

// AIDEV-NOTE: Canais de investimento agora são dinâmicos via invest_mode.canais
function canalToLabel(canal: string): string {
  if (canal === 'meta_ads') return 'Meta Ads'
  if (canal === 'google_ads') return 'Google Ads'
  return canal.charAt(0).toUpperCase() + canal.slice(1).replace(/_/g, ' ')
}

const ETAPAS_CONFIGURAVEIS = [
  { id: 'mqls' as const, label: 'MQLs' },
  { id: 'sqls' as const, label: 'SQLs' },
  { id: 'reunioes_agendadas' as const, label: 'R. Agendadas' },
  { id: 'reunioes_realizadas' as const, label: 'R. Realizadas' },
]

export default function FunilConversao({ data, query }: FunilConversaoProps) {
  const [canalFiltro, setCanalFiltro] = useState<string | null>(null)
  const { config, toggleEtapa, hiddenCount } = useFunilEtapasConfig()

  const queryCanal = canalFiltro && query ? { ...query, canal: canalFiltro } : { periodo: '30d' as const }
  const canalQueryEnabled = !!canalFiltro && !!query
  const { data: dataCanal, isLoading: isLoadingCanal } = useRelatorioFunil(queryCanal, { enabled: canalQueryEnabled })

  // Dados efetivos: canal filtrado ou dados gerais
  const dadosEfetivos = canalQueryEnabled && dataCanal ? dataCanal : data

  const custos = getCustos(dadosEfetivos.invest_mode)
  const investAtivo = data.invest_mode.ativo // usar data original para saber se invest mode existe

  // Canais com investimento > 0 (dinâmico)
  const canaisDisponiveis: Array<[string, number]> = investAtivo && data.invest_mode.ativo
    ? Object.entries(data.invest_mode.canais).filter(([_, valor]) => valor > 0)
    : []

  const todasEtapas: EtapaFunil[] = [
    {
      label: 'Leads', configKey: null,
      value: dadosEfetivos.funil.total_leads, icon: Users,
      color: 'text-blue-500', bgColor: 'bg-blue-500/10 border-blue-500/20',
      taxa: null, taxaLabel: '100%',
      dica: 'Oportunidades criadas no período e funil selecionado',
      custo: custos.cpl, custoLabel: 'CPL',
      tooltip: 'Total de oportunidades criadas no período e funil selecionado. Base de cálculo (100%) para todas as taxas de conversão do funil.',
    },
    {
      label: 'MQLs', configKey: 'mqls',
      value: dadosEfetivos.funil.mqls, icon: Target,
      color: 'text-cyan-500', bgColor: 'bg-cyan-500/10 border-cyan-500/20',
      taxa: dadosEfetivos.conversoes.lead_para_mql,
      taxaLabel: dadosEfetivos.conversoes.lead_para_mql !== null ? `${dadosEfetivos.conversoes.lead_para_mql}%` : '—',
      dica: 'Leads qualificados como Marketing Qualified Lead',
      custo: custos.cpmql, custoLabel: 'Custo/MQL',
      tooltip: 'Marketing Qualified Leads — leads que atenderam critérios de qualificação de marketing. Cálculo: MQLs / Leads × 100.',
    },
    {
      label: 'SQLs', configKey: 'sqls',
      value: dadosEfetivos.funil.sqls, icon: UserCheck,
      color: 'text-violet-500', bgColor: 'bg-violet-500/10 border-violet-500/20',
      taxa: dadosEfetivos.conversoes.mql_para_sql,
      taxaLabel: dadosEfetivos.conversoes.mql_para_sql !== null ? `${dadosEfetivos.conversoes.mql_para_sql}%` : '—',
      dica: 'Leads qualificados como Sales Qualified Lead',
      custo: custos.custoSql, custoLabel: 'Custo/SQL',
      tooltip: 'Sales Qualified Leads — leads validados pela equipe comercial para abordagem de vendas. Cálculo: SQLs / Leads × 100.',
    },
    {
      label: 'R. Agendadas', configKey: 'reunioes_agendadas',
      value: dadosEfetivos.funil.reunioes_agendadas, icon: CalendarPlus,
      color: 'text-amber-500', bgColor: 'bg-amber-500/10 border-amber-500/20',
      taxa: dadosEfetivos.conversoes.lead_para_reuniao_agendada,
      taxaLabel: dadosEfetivos.conversoes.lead_para_reuniao_agendada !== null ? `${dadosEfetivos.conversoes.lead_para_reuniao_agendada}%` : '—',
      dica: 'Oportunidades com reunião agendada',
      custo: custos.custoReuniaoAgendada, custoLabel: 'Custo/Agendada',
      tooltip: 'Oportunidades distintas com pelo menos 1 reunião agendada (múltiplas reuniões no mesmo card contam como 1). Cálculo: Oportunidades com reunião agendada / Leads × 100.',
    },
    {
      label: 'R. Realizadas', configKey: 'reunioes_realizadas',
      value: dadosEfetivos.funil.reunioes_realizadas, icon: CalendarCheck,
      color: 'text-orange-500', bgColor: 'bg-orange-500/10 border-orange-500/20',
      taxa: dadosEfetivos.conversoes.reuniao_agendada_para_realizada,
      taxaLabel: dadosEfetivos.conversoes.reuniao_agendada_para_realizada !== null ? `${dadosEfetivos.conversoes.reuniao_agendada_para_realizada}%` : '—',
      dica: 'Oportunidades com reunião realizada',
      custo: custos.custoReuniaoRealizada, custoLabel: 'Custo/Realizada',
      tooltip: 'Oportunidades distintas com pelo menos 1 reunião realizada (múltiplas reuniões no mesmo card contam como 1). Cálculo: Oportunidades com reunião realizada / Leads × 100.',
    },
    {
      label: 'Ganhos', configKey: null,
      value: dadosEfetivos.funil.fechados, icon: Trophy,
      color: 'text-emerald-500', bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      taxa: dadosEfetivos.conversoes.reuniao_realizada_para_fechado,
      taxaLabel: dadosEfetivos.conversoes.reuniao_realizada_para_fechado !== null ? `${dadosEfetivos.conversoes.reuniao_realizada_para_fechado}%` : '—',
      dica: 'Negócios fechados como ganhos',
      custo: custos.cac, custoLabel: 'CAC',
      extraInfo: custos.romi !== null ? `ROMI: ${custos.romi}%` : undefined,
      tooltip: 'Negócios fechados com sucesso. Cálculo: Ganhos / Leads × 100.\n\n• CAC: Investido / Ganhos.\n• ROMI: (Receita − Investido) / Investido × 100.',
    },
  ]

  // AIDEV-NOTE: Filtrar etapas visíveis e recalcular taxas entre adjacentes
  const etapasVisiveis = todasEtapas.filter(e =>
    e.configKey === null || config[e.configKey as keyof typeof config]
  )

  // AIDEV-NOTE: Conversão relativa ao topo do funil (Leads) — padrão HubSpot/Salesforce
  const primeiraEtapa = etapasVisiveis[0]
  const etapas = etapasVisiveis.map((etapa, index) => {
    if (index === 0) return { ...etapa, taxa: null, taxaLabel: '100%', taxaEntreEtapas: null }
    const anterior = etapasVisiveis[index - 1]
    const taxaDoTopo = primeiraEtapa.value > 0
      ? Math.min(Math.round((etapa.value / primeiraEtapa.value) * 1000) / 10, 100)
      : 0
    const taxaEntreEtapas = anterior.value > 0
      ? Math.min(Math.round((etapa.value / anterior.value) * 1000) / 10, 100)
      : 0
    return { ...etapa, taxa: taxaDoTopo, taxaLabel: `${taxaDoTopo}%`, taxaEntreEtapas }
  })

  const taxaGeral = dadosEfetivos.conversoes.lead_para_fechado
  const totalInvestido = dadosEfetivos.invest_mode.ativo ? (dadosEfetivos.invest_mode as { total_investido: number }).total_investido : null

  return (
    <TooltipProvider delayDuration={200}>
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Funil de Conversão
          </h3>
          {/* Tooltip informativo sobre o funil */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="p-1 rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/30 transition-colors"
                title="Como funciona o funil?"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 sm:w-96 p-4 text-xs leading-relaxed" align="start" side="bottom">
              <p className="font-semibold text-foreground mb-2">Como funciona o Funil de Conversão?</p>
              <p className="text-muted-foreground mb-3">
                O funil mostra a jornada dos seus leads desde a entrada até o fechamento.
              </p>
              <p className="font-semibold text-foreground mb-1">Como os leads são atribuídos a um canal:</p>
              <ul className="text-muted-foreground mb-3 space-y-1 list-disc pl-4">
                <li><strong>Canais digitais</strong> (Meta Ads, Google Ads): a atribuição é automática via parâmetros UTM capturados nos formulários e integrações.</li>
                <li><strong>Canais offline</strong> (Panfleto, Evento, Indicação): ao criar uma oportunidade, selecione a <strong>Origem</strong> correta no card do negócio. Isso vincula o lead ao canal.</li>
              </ul>
              <p className="font-semibold text-foreground mb-1">Como funciona o investimento:</p>
              <ul className="text-muted-foreground mb-3 space-y-1 list-disc pl-4">
                <li>Registre quanto investiu em cada canal no botão "Investimento"</li>
                <li>O sistema calcula automaticamente CPL, CAC e ROMI por canal</li>
                <li>Filtre por canal para ver a eficiência individual de cada investimento</li>
              </ul>
              <p className="font-semibold text-foreground mb-1">Métricas:</p>
              <ul className="text-muted-foreground space-y-1 list-disc pl-4">
                <li><strong>CPL</strong>: Custo por Lead (investido ÷ leads)</li>
                <li><strong>CAC</strong>: Custo de Aquisição de Cliente (investido ÷ ganhos)</li>
                <li><strong>ROMI</strong>: Retorno sobre Investimento em Marketing ((receita - investido) ÷ investido)</li>
              </ul>
            </PopoverContent>
          </Popover>
          {/* Popover de configuração de etapas */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="flex items-center gap-1 p-1 rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/30 transition-colors"
                title="Configurar etapas visíveis"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {hiddenCount > 0 && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[9px] font-bold">
                    {hiddenCount}
                  </Badge>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="start" side="bottom">
              <div className="flex items-center gap-2 mb-3">
                <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">Etapas do funil</span>
              </div>
              <div className="space-y-1">
                {ETAPAS_CONFIGURAVEIS.map(ec => (
                  <label
                    key={ec.id}
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <span className="text-xs text-foreground">{ec.label}</span>
                    <Switch
                      checked={config[ec.id]}
                      onCheckedChange={() => toggleEtapa(ec.id)}
                    />
                  </label>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 px-2">
                Leads e Ganhos são sempre visíveis
              </p>
            </PopoverContent>
          </Popover>
        </div>
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

      {/* AIDEV-NOTE: Chips de filtro por canal dinâmico */}
      {investAtivo && canaisDisponiveis.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mr-1">
            Canal:
          </span>
          <button
            onClick={() => setCanalFiltro(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              canalFiltro === null
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            Todos
          </button>
          {canaisDisponiveis.map(([canal, valor]) => (
            <button
              key={canal}
              onClick={() => setCanalFiltro(canalFiltro === canal ? null : canal)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                canalFiltro === canal
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {canalToLabel(canal)}: {formatarMoeda(valor as number)}
            </button>
          ))}
          {isLoadingCanal && canalFiltro && (
            <span className="text-[10px] text-muted-foreground animate-pulse ml-1">Carregando...</span>
          )}
        </div>
      )}

      {/* AIDEV-NOTE: Mensagem orientativa quando canal filtrado não tem leads */}
      {canalFiltro !== null && dadosEfetivos.funil.total_leads === 0 && !isLoadingCanal && (
        <div className="flex items-start gap-3 mb-4 p-4 bg-muted/30 border border-border rounded-lg">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            <p className="font-medium text-foreground mb-1">
              Nenhuma oportunidade vinculada a este canal no período.
            </p>
            <p>
              Para que os dados apareçam aqui, defina a <strong>Origem</strong> como "<strong>{canalToLabel(canalFiltro)}</strong>" no card da oportunidade em <strong>Negócios</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Desktop: horizontal */}
      <div className="hidden lg:flex items-stretch gap-1.5">
        {etapas.map((etapa, index) => {
          const Icon = etapa.icon
          return (
            <div key={etapa.label} className="flex items-center gap-1 flex-1 min-w-0">
              <div className={`flex-1 min-w-0 border rounded-xl p-2.5 ${etapa.bgColor} transition-all hover:shadow-md`}>
                <div className="flex items-center gap-1 mb-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${etapa.bgColor}`}>
                    <Icon className={`w-3 h-3 ${etapa.color}`} />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">
                    {etapa.label}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/40 hover:text-muted-foreground cursor-help shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[220px] bg-popover text-popover-foreground border border-border shadow-md">
                      <p className="text-xs leading-relaxed">{etapa.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
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
                {(dadosEfetivos.invest_mode.ativo) && (
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
              </div>
              {index < etapas.length - 1 && (
                <div className="flex flex-col items-center justify-center shrink-0">
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                  {etapas[index + 1].taxaEntreEtapas !== null && etapas[index + 1].taxaEntreEtapas !== undefined && (
                    <span className="text-[9px] font-semibold text-muted-foreground mt-0.5">
                      {etapas[index + 1].taxaEntreEtapas}%
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
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase">
                          {etapa.label}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/40 hover:text-muted-foreground cursor-help shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[220px] bg-popover text-popover-foreground border border-border shadow-md">
                            <p className="text-xs leading-relaxed">{etapa.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
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
                    {(dadosEfetivos.invest_mode.ativo) && etapa.custo !== null && (
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
    </TooltipProvider>
  )
}
