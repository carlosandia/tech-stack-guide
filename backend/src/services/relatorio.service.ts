import { supabaseAdmin } from '../config/supabase.js'
import type {
  FunilQuery,
  MetricasBrutas,
  BreakdownCanalItem,
  RelatorioFunilResponse,
  SalvarInvestimentoPayload,
} from '../schemas/relatorio.js'

// =====================================================
// PRD-18: Service do Relatório de Funil
// AIDEV-NOTE: Usa supabase.rpc() para chamar funções PostgreSQL
// criadas na migration add_relatorio_funil_functions
// =====================================================

// ─────────────────────────────────────────────────────
// Helpers de período
// ─────────────────────────────────────────────────────

interface Periodo {
  inicio: Date
  fim: Date
  dias: number
  label: string
}

function resolverPeriodo(query: FunilQuery): Periodo {
  const agora = new Date()
  const fimDia = new Date(agora)
  fimDia.setHours(23, 59, 59, 999)

  if (query.periodo === 'personalizado') {
    if (!query.data_inicio || !query.data_fim) {
      throw new Error('data_inicio e data_fim são obrigatórios para período personalizado')
    }
    const inicio = new Date(`${query.data_inicio}T00:00:00.000Z`)
    const fim = new Date(`${query.data_fim}T23:59:59.999Z`)
    const dias = Math.ceil((fim.getTime() - inicio.getTime()) / 86400000)
    return { inicio, fim, dias, label: `${query.data_inicio} → ${query.data_fim}` }
  }

  const diasMap = { '7d': 7, '30d': 30, '90d': 90 }
  const dias = diasMap[query.periodo]
  const inicio = new Date(agora)
  inicio.setDate(inicio.getDate() - dias)
  inicio.setHours(0, 0, 0, 0)

  const labelMap = { '7d': 'Últimos 7 dias', '30d': 'Últimos 30 dias', '90d': 'Últimos 90 dias' }

  return { inicio, fim: fimDia, dias, label: labelMap[query.periodo] }
}

function periodoAnterior(periodo: Periodo): Periodo {
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
  // AIDEV-NOTE: Cap em 100% — conversão nunca ultrapassa 100% (padrão HubSpot/Salesforce)
  return Math.min(Math.round((numerador / denominador) * 1000) / 10, 100)
}

function calcularVariacao(atual: number, anterior: number): number | null {
  if (anterior === 0) return null
  return Math.round(((atual - anterior) / anterior) * 1000) / 10 // 1 casa decimal
}

// ─────────────────────────────────────────────────────
// Chamar funções PostgreSQL via RPC
// ─────────────────────────────────────────────────────

async function buscarMetricasBrutas(
  organizacaoId: string,
  periodo: Periodo,
  funil_id?: string,
  canal?: string
): Promise<MetricasBrutas> {
  const { data, error } = await supabaseAdmin.rpc('fn_metricas_funil', {
    p_organizacao_id: organizacaoId,
    p_periodo_inicio: periodo.inicio.toISOString(),
    p_periodo_fim: periodo.fim.toISOString(),
    p_funil_id: funil_id ?? null,
    p_canal: canal ?? null,
  })

  if (error) throw new Error(`Erro ao calcular métricas do funil: ${error.message}`)

  // A função retorna JSON — Supabase retorna como objeto direto
  const m = data as MetricasBrutas
  return {
    total_leads: Number(m.total_leads ?? 0),
    mqls: Number(m.mqls ?? 0),
    sqls: Number(m.sqls ?? 0),
    reunioes_agendadas: Number((m as any).reunioes_agendadas ?? 0),
    reunioes_realizadas: Number((m as any).reunioes_realizadas ?? 0),
    reunioes: Number(m.reunioes ?? 0),
    fechados: Number(m.fechados ?? 0),
    valor_gerado: Number(m.valor_gerado ?? 0),
    ticket_medio: Number(m.ticket_medio ?? 0),
    forecast: Number(m.forecast ?? 0),
    ciclo_medio_dias: m.ciclo_medio_dias !== null ? Number(m.ciclo_medio_dias) : null,
  }
}

async function buscarBreakdownCanal(
  organizacaoId: string,
  periodo: Periodo,
  funil_id?: string
): Promise<BreakdownCanalItem[]> {
  const { data, error } = await supabaseAdmin.rpc('fn_breakdown_canal_funil', {
    p_organizacao_id: organizacaoId,
    p_periodo_inicio: periodo.inicio.toISOString(),
    p_periodo_fim: periodo.fim.toISOString(),
    p_funil_id: funil_id ?? null,
  })

  if (error) throw new Error(`Erro ao calcular breakdown por canal: ${error.message}`)

  if (!data || !Array.isArray(data)) return []

  return (data as BreakdownCanalItem[]).map((item) => ({
    canal: item.canal,
    oportunidades: Number(item.oportunidades ?? 0),
    fechados: Number(item.fechados ?? 0),
    valor_gerado: Number(item.valor_gerado ?? 0),
    taxa_fechamento: Number(item.taxa_fechamento ?? 0),
    percentual_total: Number(item.percentual_total ?? 0),
  }))
}

// ─────────────────────────────────────────────────────
// Buscar investimento registrado para o período (Invest Mode)
// ─────────────────────────────────────────────────────

async function buscarInvestimentoPeriodo(
  organizacaoId: string,
  inicio: Date,
  fim: Date
): Promise<number | null> {
  const { data, error } = await supabaseAdmin
    .from('investimentos_marketing')
    .select('canal, valor')
    .eq('organizacao_id', organizacaoId)
    .gte('periodo_inicio', inicio.toISOString().slice(0, 10))
    .lte('periodo_fim', fim.toISOString().slice(0, 10))

  if (error || !data || data.length === 0) return null

  const total = data.reduce((soma, inv) => soma + Number(inv.valor), 0)
  return total > 0 ? total : null
}

// ─────────────────────────────────────────────────────
// Função principal: calcular relatório completo
// ─────────────────────────────────────────────────────

export async function calcularRelatorioFunil(
  organizacaoId: string,
  query: FunilQuery
): Promise<RelatorioFunilResponse> {
  const periodo = resolverPeriodo(query)
  const anterior = periodoAnterior(periodo)

  // Executa consultas em paralelo
  const [metricas, metricasAnteriores, breakdownCanal, totalInvestido] = await Promise.all([
    buscarMetricasBrutas(organizacaoId, periodo, query.funil_id, query.canal),
    buscarMetricasBrutas(organizacaoId, anterior, query.funil_id, query.canal),
    buscarBreakdownCanal(organizacaoId, periodo, query.funil_id),
    buscarInvestimentoPeriodo(organizacaoId, periodo.inicio, periodo.fim),
  ])

  // Calcular taxas de conversão
  const conversoes = {
    lead_para_mql: calcularTaxa(metricas.mqls, metricas.total_leads),
    mql_para_sql: calcularTaxa(metricas.sqls, metricas.mqls),
    sql_para_reuniao_agendada: calcularTaxa(metricas.reunioes_agendadas, metricas.sqls),
    reuniao_agendada_para_realizada: calcularTaxa(metricas.reunioes_realizadas, metricas.reunioes_agendadas),
    reuniao_realizada_para_fechado: calcularTaxa(metricas.fechados, metricas.reunioes_realizadas),
    lead_para_fechado: calcularTaxa(metricas.fechados, metricas.total_leads),
  }

  // Variação vs período anterior
  const variacao = {
    leads: calcularVariacao(metricas.total_leads, metricasAnteriores.total_leads),
    fechados: calcularVariacao(metricas.fechados, metricasAnteriores.fechados),
    valor_gerado: calcularVariacao(metricas.valor_gerado, metricasAnteriores.valor_gerado),
    ticket_medio: calcularVariacao(metricas.ticket_medio, metricasAnteriores.ticket_medio),
  }

  // Invest Mode: calcular CPL, CAC, ROMI se houver investimento
  const investMode = construirInvestMode(totalInvestido, metricas)

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
      fechados: metricas.fechados,
    },
    conversoes,
    kpis: {
      ticket_medio: Math.round(metricas.ticket_medio * 100) / 100,
      valor_gerado: Math.round(metricas.valor_gerado * 100) / 100,
      ciclo_medio_dias: metricas.ciclo_medio_dias,
      forecast: Math.round(metricas.forecast * 100) / 100,
    },
    variacao,
    breakdown_canal: breakdownCanal,
    invest_mode: investMode,
  }
}

function construirInvestMode(
  totalInvestido: number | null,
  metricas: MetricasBrutas
): RelatorioFunilResponse['invest_mode'] {
  if (!totalInvestido) return { ativo: false }

  const cpl = metricas.total_leads > 0
    ? Math.round((totalInvestido / metricas.total_leads) * 100) / 100
    : null
  const cpmql = metricas.mqls > 0
    ? Math.round((totalInvestido / metricas.mqls) * 100) / 100
    : null
  const custoPorSql = metricas.sqls > 0
    ? Math.round((totalInvestido / metricas.sqls) * 100) / 100
    : null
  const custoPorReuniaoAgendada = metricas.reunioes_agendadas > 0
    ? Math.round((totalInvestido / metricas.reunioes_agendadas) * 100) / 100
    : null
  const custoPorReuniaoRealizada = metricas.reunioes_realizadas > 0
    ? Math.round((totalInvestido / metricas.reunioes_realizadas) * 100) / 100
    : null
  const cac = metricas.fechados > 0
    ? Math.round((totalInvestido / metricas.fechados) * 100) / 100
    : null
  const romi = metricas.valor_gerado > 0 && totalInvestido > 0
    ? Math.round(((metricas.valor_gerado - totalInvestido) / totalInvestido) * 1000) / 10
    : null

  return {
    ativo: true,
    total_investido: totalInvestido,
    cpl,
    cpmql,
    custo_por_sql: custoPorSql,
    custo_por_reuniao_agendada: custoPorReuniaoAgendada,
    custo_por_reuniao_realizada: custoPorReuniaoRealizada,
    cac,
    romi,
  }
}

// ─────────────────────────────────────────────────────
// Fase 2: Salvar investimento por período (Invest Mode)
// ─────────────────────────────────────────────────────

export async function salvarInvestimento(
  organizacaoId: string,
  usuarioId: string,
  payload: SalvarInvestimentoPayload
): Promise<void> {
  const canais: Array<{ canal: string; valor: number }> = [
    { canal: 'meta_ads', valor: payload.meta_ads },
    { canal: 'google_ads', valor: payload.google_ads },
    { canal: 'outros', valor: payload.outros },
    { canal: 'total', valor: payload.meta_ads + payload.google_ads + payload.outros },
  ]

  // Upsert por canal (INSERT ... ON CONFLICT DO UPDATE)
  for (const { canal, valor } of canais) {
    const { error } = await supabaseAdmin
      .from('investimentos_marketing')
      .upsert(
        {
          organizacao_id: organizacaoId,
          periodo_inicio: payload.periodo_inicio,
          periodo_fim: payload.periodo_fim,
          canal,
          valor,
          criado_por_id: usuarioId,
        },
        { onConflict: 'organizacao_id,periodo_inicio,periodo_fim,canal' }
      )

    if (error) throw new Error(`Erro ao salvar investimento (${canal}): ${error.message}`)
  }
}
