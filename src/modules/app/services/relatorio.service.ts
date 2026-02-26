/**
 * AIDEV-NOTE: Service do Relatório de Funil (PRD-18)
 * Usa Supabase RPC diretamente (backend Express NÃO é deployed)
 * Funções PostgreSQL: fn_metricas_funil, fn_breakdown_canal_funil
 */

import { supabase } from '@/integrations/supabase/client'
import { getOrganizacaoId, getUsuarioId } from '@/shared/services/auth-context'
import type {
  FunilQuery,
  MetricasBrutas,
  BreakdownCanalItem,
  RelatorioFunilResponse,
  SalvarInvestimentoPayload,
  FunilOption,
  DashboardMetricasGerais,
  DashboardMetricasGeraisComVariacao,
  MetricasAtendimento,
  RelatorioMetasDashboard,
  HeatmapAtendimentoItem,
} from '../types/relatorio.types'

// ─────────────────────────────────────────────────────
// Helpers de período
// ─────────────────────────────────────────────────────

interface PeriodoResolvido {
  inicio: Date
  fim: Date
  dias: number
  label: string
}

function resolverPeriodo(query: FunilQuery): PeriodoResolvido {
  const agora = new Date()

  if (query.periodo === 'personalizado') {
    if (!query.data_inicio || !query.data_fim) {
      throw new Error('data_inicio e data_fim são obrigatórios para período personalizado')
    }
    // Interpretar datas como local (meia-noite local → fim do dia local)
    const inicio = new Date(query.data_inicio + 'T00:00:00')
    const fim = new Date(query.data_fim + 'T23:59:59.999')
    const dias = Math.ceil((fim.getTime() - inicio.getTime()) / 86400000)
    return { inicio, fim, dias, label: `${query.data_inicio} → ${query.data_fim}` }
  }

  const diasMap = { '7d': 7, '30d': 30, '90d': 90 } as const
  const dias = diasMap[query.periodo]

  // Início: X dias atrás à meia-noite local
  const inicio = new Date(agora)
  inicio.setDate(inicio.getDate() - dias)
  inicio.setHours(0, 0, 0, 0)

  // Fim: final do dia atual (local)
  const fimDia = new Date(agora)
  fimDia.setHours(23, 59, 59, 999)

  const labelMap = { '7d': 'Últimos 7 dias', '30d': 'Últimos 30 dias', '90d': 'Últimos 90 dias' }
  return { inicio, fim: fimDia, dias, label: labelMap[query.periodo] }
}

function periodoAnterior(periodo: PeriodoResolvido): PeriodoResolvido {
  const inicio = new Date(periodo.inicio)
  const fim = new Date(periodo.inicio)
  inicio.setDate(inicio.getDate() - periodo.dias)
  fim.setDate(fim.getDate() - 1)
  fim.setHours(23, 59, 59, 999)
  return { inicio, fim, dias: periodo.dias, label: 'Período anterior' }
}

// ─────────────────────────────────────────────────────
// Helpers de cálculo
// ─────────────────────────────────────────────────────

function calcularTaxa(numerador: number, denominador: number): number | null {
  if (!denominador || denominador === 0) return null
  return Math.round((numerador / denominador) * 1000) / 10
}

function calcularVariacao(atual: number, anterior: number): number | null {
  if (anterior === 0) return null
  return Math.round(((atual - anterior) / anterior) * 1000) / 10
}

// ─────────────────────────────────────────────────────
// RPC calls
// ─────────────────────────────────────────────────────

async function buscarMetricasBrutas(
  organizacaoId: string,
  periodo: PeriodoResolvido,
  funil_id?: string,
  canal?: string
): Promise<MetricasBrutas> {
  const { data, error } = await supabase.rpc('fn_metricas_funil', {
    p_organizacao_id: organizacaoId,
    p_periodo_inicio: periodo.inicio.toISOString(),
    p_periodo_fim: periodo.fim.toISOString(),
    p_funil_id: funil_id ?? undefined,
    p_canal: canal ?? undefined,
  })

  if (error) throw new Error(`Erro ao calcular métricas do funil: ${error.message}`)

  const m = data as unknown as MetricasBrutas
  return {
    total_leads: Number(m?.total_leads ?? 0),
    mqls: Number(m?.mqls ?? 0),
    sqls: Number(m?.sqls ?? 0),
    reunioes_agendadas: Number((m as any)?.reunioes_agendadas ?? 0),
    reunioes_realizadas: Number((m as any)?.reunioes_realizadas ?? 0),
    reunioes: Number(m?.reunioes ?? 0),
    reunioes_noshow: Number((m as any)?.reunioes_noshow ?? 0),
    reunioes_canceladas: Number((m as any)?.reunioes_canceladas ?? 0),
    reunioes_reagendadas: Number((m as any)?.reunioes_reagendadas ?? 0),
    fechados: Number(m?.fechados ?? 0),
    valor_gerado: Number(m?.valor_gerado ?? 0),
    ticket_medio: Number(m?.ticket_medio ?? 0),
    forecast: Number(m?.forecast ?? 0),
    ciclo_medio_dias: m?.ciclo_medio_dias !== null ? Number(m?.ciclo_medio_dias) : null,
  }
}

async function buscarBreakdownCanal(
  organizacaoId: string,
  periodo: PeriodoResolvido,
  funil_id?: string
): Promise<BreakdownCanalItem[]> {
  const { data, error } = await supabase.rpc('fn_breakdown_canal_funil', {
    p_organizacao_id: organizacaoId,
    p_periodo_inicio: periodo.inicio.toISOString(),
    p_periodo_fim: periodo.fim.toISOString(),
    p_funil_id: funil_id ?? undefined,
  })

  if (error) throw new Error(`Erro ao calcular breakdown por canal: ${error.message}`)
  if (!data || !Array.isArray(data)) return []

  return (data as unknown as BreakdownCanalItem[]).map((item) => ({
    canal: item.canal,
    oportunidades: Number(item.oportunidades ?? 0),
    fechados: Number(item.fechados ?? 0),
    valor_gerado: Number(item.valor_gerado ?? 0),
    ticket_medio: Number(item.ticket_medio ?? 0),
    taxa_fechamento: Number(item.taxa_fechamento ?? 0),
    percentual_total: Number(item.percentual_total ?? 0),
  }))
}

interface InvestimentoDetalhado {
  total: number
  meta_ads: number
  google_ads: number
  outros: number
}

async function buscarInvestimentoPeriodo(
  organizacaoId: string,
  inicio: Date,
  fim: Date
): Promise<InvestimentoDetalhado | null> {
  const { data, error } = await supabase
    .from('investimentos_marketing' as never)
    .select('canal, valor')
    .eq('organizacao_id', organizacaoId)
    .gte('periodo_inicio', inicio.toISOString().slice(0, 10))
    .lte('periodo_fim', fim.toISOString().slice(0, 10))

  if (error || !data || data.length === 0) return null

  const rows = data as Array<{ canal: string; valor: number }>
  const resultado: InvestimentoDetalhado = { total: 0, meta_ads: 0, google_ads: 0, outros: 0 }

  for (const row of rows) {
    const valor = Number(row.valor)
    if (row.canal === 'meta_ads') resultado.meta_ads = valor
    else if (row.canal === 'google_ads') resultado.google_ads = valor
    else if (row.canal === 'outros') resultado.outros = valor
    else if (row.canal === 'total') resultado.total = valor
  }

  if (resultado.total === 0) {
    resultado.total = resultado.meta_ads + resultado.google_ads + resultado.outros
  }

  return resultado.total > 0 ? resultado : null
}

function construirInvestMode(
  investimento: InvestimentoDetalhado | null,
  metricas: MetricasBrutas
): RelatorioFunilResponse['invest_mode'] {
  if (!investimento) return { ativo: false }

  const t = investimento.total
  return {
    ativo: true,
    total_investido: t,
    meta_ads: investimento.meta_ads,
    google_ads: investimento.google_ads,
    outros: investimento.outros,
    cpl: metricas.total_leads > 0 ? Math.round((t / metricas.total_leads) * 100) / 100 : null,
    cpmql: metricas.mqls > 0 ? Math.round((t / metricas.mqls) * 100) / 100 : null,
    custo_por_sql: metricas.sqls > 0 ? Math.round((t / metricas.sqls) * 100) / 100 : null,
    custo_por_reuniao_agendada: metricas.reunioes_agendadas > 0 ? Math.round((t / metricas.reunioes_agendadas) * 100) / 100 : null,
    custo_por_reuniao_realizada: metricas.reunioes_realizadas > 0 ? Math.round((t / metricas.reunioes_realizadas) * 100) / 100 : null,
    cac: metricas.fechados > 0 ? Math.round((t / metricas.fechados) * 100) / 100 : null,
    romi: metricas.valor_gerado > 0 && t > 0
      ? Math.round(((metricas.valor_gerado - t) / t) * 1000) / 10
      : null,
  }
}

// ─────────────────────────────────────────────────────
// Função principal: calcular relatório completo
// ─────────────────────────────────────────────────────

export async function fetchRelatorioFunil(query: FunilQuery): Promise<RelatorioFunilResponse> {
  const organizacaoId = await getOrganizacaoId()
  const periodo = resolverPeriodo(query)
  const anterior = periodoAnterior(periodo)

  const [metricas, metricasAnteriores, breakdownCanal, totalInvestido] = await Promise.all([
    buscarMetricasBrutas(organizacaoId, periodo, query.funil_id, query.canal),
    buscarMetricasBrutas(organizacaoId, anterior, query.funil_id, query.canal),
    buscarBreakdownCanal(organizacaoId, periodo, query.funil_id),
    buscarInvestimentoPeriodo(organizacaoId, periodo.inicio, periodo.fim),
  ])

  return {
    periodo: {
      inicio: periodo.inicio.toISOString(),
      fim: periodo.fim.toISOString(),
      dias: periodo.dias,
      label: periodo.label,
    },
    funil: {
      total_leads: metricas.total_leads,
      mqls: metricas.mqls,
      sqls: metricas.sqls,
      reunioes_agendadas: metricas.reunioes_agendadas,
      reunioes_realizadas: metricas.reunioes_realizadas,
      reunioes_noshow: metricas.reunioes_noshow,
      reunioes_canceladas: metricas.reunioes_canceladas,
      reunioes_reagendadas: metricas.reunioes_reagendadas,
      fechados: metricas.fechados,
    },
    taxas_reunioes: {
      taxa_noshow: calcularTaxa(metricas.reunioes_noshow, metricas.reunioes_agendadas + metricas.reunioes_noshow),
      taxa_comparecimento: calcularTaxa(metricas.reunioes_realizadas, metricas.reunioes_agendadas + metricas.reunioes_noshow),
      taxa_cancelamento: calcularTaxa(metricas.reunioes_canceladas, metricas.reunioes_agendadas + metricas.reunioes_canceladas + metricas.reunioes_noshow),
      taxa_reagendamento: calcularTaxa(metricas.reunioes_reagendadas, metricas.reunioes_agendadas + metricas.reunioes_noshow),
    },
    conversoes: {
      lead_para_mql: calcularTaxa(metricas.mqls, metricas.total_leads),
      mql_para_sql: calcularTaxa(metricas.sqls, metricas.mqls),
      sql_para_reuniao_agendada: calcularTaxa(metricas.reunioes_agendadas, metricas.sqls),
      reuniao_agendada_para_realizada: calcularTaxa(metricas.reunioes_realizadas, metricas.reunioes_agendadas),
      reuniao_realizada_para_fechado: calcularTaxa(metricas.fechados, metricas.reunioes_realizadas),
      lead_para_fechado: calcularTaxa(metricas.fechados, metricas.total_leads),
    },
    kpis: {
      ticket_medio: Math.round(metricas.ticket_medio * 100) / 100,
      valor_gerado: Math.round(metricas.valor_gerado * 100) / 100,
      ciclo_medio_dias: metricas.ciclo_medio_dias,
      forecast: Math.round(metricas.forecast * 100) / 100,
    },
    variacao: {
      leads: calcularVariacao(metricas.total_leads, metricasAnteriores.total_leads),
      fechados: calcularVariacao(metricas.fechados, metricasAnteriores.fechados),
      valor_gerado: calcularVariacao(metricas.valor_gerado, metricasAnteriores.valor_gerado),
      ticket_medio: calcularVariacao(metricas.ticket_medio, metricasAnteriores.ticket_medio),
    },
    breakdown_canal: breakdownCanal,
    invest_mode: construirInvestMode(totalInvestido, metricas),
  }
}

// ─────────────────────────────────────────────────────
// Salvar investimento (Invest Mode)
// ─────────────────────────────────────────────────────

export async function salvarInvestimento(payload: SalvarInvestimentoPayload): Promise<void> {
  const organizacaoId = await getOrganizacaoId()
  const usuarioId = await getUsuarioId()

  const canais = [
    { canal: 'meta_ads', valor: payload.meta_ads },
    { canal: 'google_ads', valor: payload.google_ads },
    { canal: 'outros', valor: payload.outros },
    { canal: 'total', valor: payload.meta_ads + payload.google_ads + payload.outros },
  ]

  for (const { canal, valor } of canais) {
    const { error } = await supabase
      .from('investimentos_marketing' as never)
      .upsert(
        {
          organizacao_id: organizacaoId,
          periodo_inicio: payload.periodo_inicio,
          periodo_fim: payload.periodo_fim,
          canal,
          valor,
          criado_por_id: usuarioId,
        } as never,
        { onConflict: 'organizacao_id,periodo_inicio,periodo_fim,canal' }
      )

    if (error) throw new Error(`Erro ao salvar investimento (${canal}): ${error.message}`)
  }
}

// ─────────────────────────────────────────────────────
// Remover investimento (Invest Mode)
// ─────────────────────────────────────────────────────

export async function removerInvestimento(periodoInicio: string, periodoFim: string): Promise<void> {
  const organizacaoId = await getOrganizacaoId()

  const { error } = await supabase
    .from('investimentos_marketing' as never)
    .delete()
    .eq('organizacao_id', organizacaoId)
    .eq('periodo_inicio', periodoInicio)
    .eq('periodo_fim', periodoFim)

  if (error) throw new Error(`Erro ao remover investimento: ${error.message}`)
}

// ─────────────────────────────────────────────────────
// Buscar lista de funis para o select
// ─────────────────────────────────────────────────────

export async function fetchFunis(): Promise<FunilOption[]> {
  const organizacaoId = await getOrganizacaoId()

  const { data, error } = await supabase
    .from('funis')
    .select('id, nome')
    .eq('organizacao_id', organizacaoId)
    .eq('ativo', true)
    .is('deletado_em', null)
    .order('nome', { ascending: true })

  if (error) throw new Error(`Erro ao buscar funis: ${error.message}`)
  return (data ?? []) as FunilOption[]
}

// ─────────────────────────────────────────────────────
// Métricas gerais do dashboard (fn_dashboard_metricas_gerais)
// ─────────────────────────────────────────────────────

async function buscarMetricasGerais(
  organizacaoId: string,
  periodo: PeriodoResolvido,
  funil_id?: string
): Promise<DashboardMetricasGerais> {
  const { data, error } = await supabase.rpc('fn_dashboard_metricas_gerais' as never, {
    p_organizacao_id: organizacaoId,
    p_periodo_inicio: periodo.inicio.toISOString(),
    p_periodo_fim: periodo.fim.toISOString(),
    p_funil_id: funil_id ?? undefined,
  } as never)

  if (error) throw new Error(`Erro ao calcular métricas gerais: ${error.message}`)

  const m = data as unknown as DashboardMetricasGerais
  return {
    perdas: Number(m?.perdas ?? 0),
    valor_perdas: Number(m?.valor_perdas ?? 0),
    tarefas_abertas: Number(m?.tarefas_abertas ?? 0),
    total_oportunidades_historico: Number(m?.total_oportunidades_historico ?? 0),
    total_oportunidades_periodo: Number((m as any)?.total_oportunidades_periodo ?? 0),
    motivos_perda: Array.isArray(m?.motivos_perda) ? m.motivos_perda : [],
    motivos_ganho: Array.isArray((m as any)?.motivos_ganho) ? (m as any).motivos_ganho : [],
    produtos_ranking: Array.isArray(m?.produtos_ranking) ? m.produtos_ranking : [],
  }
}

export async function fetchDashboardMetricasGerais(
  query: FunilQuery
): Promise<DashboardMetricasGeraisComVariacao> {
  const organizacaoId = await getOrganizacaoId()
  const periodo = resolverPeriodo(query)
  const anterior = periodoAnterior(periodo)

  const [atual, ant] = await Promise.all([
    buscarMetricasGerais(organizacaoId, periodo, query.funil_id),
    buscarMetricasGerais(organizacaoId, anterior, query.funil_id),
  ])

  return {
    ...atual,
    variacao_perdas: calcularVariacao(atual.perdas, ant.perdas),
    variacao_oportunidades: calcularVariacao(atual.total_oportunidades_periodo, ant.total_oportunidades_periodo),
  }
}

// ─────────────────────────────────────────────────────
// Métricas de Atendimento (fn_metricas_atendimento)
// ─────────────────────────────────────────────────────

export async function fetchMetricasAtendimento(query: FunilQuery, canal?: string): Promise<MetricasAtendimento> {
  const organizacaoId = await getOrganizacaoId()
  const periodo = resolverPeriodo(query)

  const rpcParams: Record<string, unknown> = {
    p_organizacao_id: organizacaoId,
    p_periodo_inicio: periodo.inicio.toISOString(),
    p_periodo_fim: periodo.fim.toISOString(),
  }
  if (canal) {
    rpcParams.p_canal = canal
  }

  const { data, error } = await supabase.rpc('fn_metricas_atendimento' as never, rpcParams as never)

  if (error) throw new Error(`Erro ao calcular métricas de atendimento: ${error.message}`)

  const m = data as unknown as MetricasAtendimento
  return {
    primeira_resposta_media_segundos: m?.primeira_resposta_media_segundos ? Number(m.primeira_resposta_media_segundos) : null,
    tempo_medio_resposta_segundos: m?.tempo_medio_resposta_segundos ? Number(m.tempo_medio_resposta_segundos) : null,
    sem_resposta: Number(m?.sem_resposta ?? 0),
    total_conversas: Number(m?.total_conversas ?? 0),
    mensagens_recebidas: Number(m?.mensagens_recebidas ?? 0),
    mensagens_enviadas: Number(m?.mensagens_enviadas ?? 0),
    conversas_whatsapp: Number(m?.conversas_whatsapp ?? 0),
    conversas_instagram: Number(m?.conversas_instagram ?? 0),
  }
}

// ─────────────────────────────────────────────────────
// Relatório de Metas e Performance (fn_relatorio_metas_dashboard)
// ─────────────────────────────────────────────────────

export async function fetchRelatorioMetas(query: FunilQuery): Promise<RelatorioMetasDashboard | null> {
  const organizacaoId = await getOrganizacaoId()
  const periodo = resolverPeriodo(query)

  const { data, error } = await supabase.rpc('fn_relatorio_metas_dashboard' as never, {
    p_organizacao_id: organizacaoId,
    p_periodo_inicio: periodo.inicio.toISOString(),
    p_periodo_fim: periodo.fim.toISOString(),
  } as never)

  if (error) throw new Error(`Erro ao calcular relatório de metas: ${error.message}`)

  const result = data as unknown as RelatorioMetasDashboard
  if (!result || result.resumo.total_metas === 0) return null

  return result
}

// ─────────────────────────────────────────────────────
// Heatmap de Atendimento (fn_heatmap_atendimento)
// ─────────────────────────────────────────────────────

export async function fetchHeatmapAtendimento(query: FunilQuery, canal?: string): Promise<HeatmapAtendimentoItem[]> {
  const organizacaoId = await getOrganizacaoId()
  const periodo = resolverPeriodo(query)

  const rpcParams: Record<string, unknown> = {
    p_organizacao_id: organizacaoId,
    p_periodo_inicio: periodo.inicio.toISOString(),
    p_periodo_fim: periodo.fim.toISOString(),
  }
  if (canal) {
    rpcParams.p_canal = canal
  }

  const { data, error } = await supabase.rpc('fn_heatmap_atendimento' as never, rpcParams as never)

  if (error) throw new Error(`Erro ao calcular heatmap de atendimento: ${error.message}`)

  if (!data || !Array.isArray(data)) return []

  return (data as unknown as HeatmapAtendimentoItem[]).map(item => ({
    dia_semana: Number(item.dia_semana),
    hora: Number(item.hora),
    total: Number(item.total),
  }))
}
