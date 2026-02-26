/**
 * AIDEV-NOTE: Types espelho do backend para o módulo de Relatório de Funil (PRD-18)
 * Derivados de backend/src/schemas/relatorio.ts
 */

// ─────────────────────────────────────────────────────
// Query params
// ─────────────────────────────────────────────────────

export type Periodo = '7d' | '30d' | '90d' | 'personalizado'

export interface FunilQuery {
  periodo: Periodo
  data_inicio?: string
  data_fim?: string
  funil_id?: string
  canal?: string
}

// ─────────────────────────────────────────────────────
// Métricas brutas (retorno do RPC fn_metricas_funil)
// ─────────────────────────────────────────────────────

export interface MetricasBrutas {
  total_leads: number
  mqls: number
  sqls: number
  reunioes_agendadas: number
  reunioes_realizadas: number
  reunioes: number // compatibilidade (= realizadas)
  reunioes_noshow: number
  reunioes_canceladas: number
  reunioes_reagendadas: number
  fechados: number
  valor_gerado: number
  ticket_medio: number
  forecast: number
  ciclo_medio_dias: number | null
}

// ─────────────────────────────────────────────────────
// Breakdown por canal
// ─────────────────────────────────────────────────────

export interface BreakdownCanalItem {
  canal: string
  oportunidades: number
  fechados: number
  valor_gerado: number
  ticket_medio: number
  taxa_fechamento: number
  percentual_total: number
}

// ─────────────────────────────────────────────────────
// Invest Mode
// ─────────────────────────────────────────────────────

export type InvestMode =
  | { ativo: false }
  | {
      ativo: true
      total_investido: number
      meta_ads: number
      google_ads: number
      outros: number
      cpl: number | null
      cpmql: number | null
      custo_por_sql: number | null
      custo_por_reuniao_agendada: number | null
      custo_por_reuniao_realizada: number | null
      cac: number | null
      romi: number | null
    }

// ─────────────────────────────────────────────────────
// Response completo
// ─────────────────────────────────────────────────────

export interface RelatorioFunilResponse {
  periodo: {
    inicio: string
    fim: string
    dias: number
    label: string
  }
  funil: {
    total_leads: number
    mqls: number
    sqls: number
    reunioes_agendadas: number
    reunioes_realizadas: number
    reunioes_noshow: number
    reunioes_canceladas: number
    reunioes_reagendadas: number
    fechados: number
  }
  // Taxas derivadas de reuniões
  taxas_reunioes: {
    taxa_noshow: number | null
    taxa_comparecimento: number | null
    taxa_cancelamento: number | null
    taxa_reagendamento: number | null
  }
  conversoes: {
    lead_para_mql: number | null
    mql_para_sql: number | null
    sql_para_reuniao_agendada: number | null
    reuniao_agendada_para_realizada: number | null
    reuniao_realizada_para_fechado: number | null
    lead_para_fechado: number | null
  }
  kpis: {
    ticket_medio: number
    valor_gerado: number
    ciclo_medio_dias: number | null
    forecast: number
  }
  variacao: {
    leads: number | null
    fechados: number | null
    valor_gerado: number | null
    ticket_medio: number | null
  }
  breakdown_canal: BreakdownCanalItem[]
  invest_mode: InvestMode
}

// ─────────────────────────────────────────────────────
// Payload para salvar investimento
// ─────────────────────────────────────────────────────

export interface SalvarInvestimentoPayload {
  periodo_inicio: string
  periodo_fim: string
  meta_ads: number
  google_ads: number
  outros: number
}

// ─────────────────────────────────────────────────────
// Funil simples (para select)
// ─────────────────────────────────────────────────────

export interface FunilOption {
  id: string
  nome: string
}

// ─────────────────────────────────────────────────────
// Métricas Gerais do Dashboard (fn_dashboard_metricas_gerais)
// ─────────────────────────────────────────────────────

export interface MotivosPerdaItem {
  nome: string
  cor: string
  quantidade: number
  percentual: number
}

export interface ProdutoRankingItem {
  nome: string
  quantidade: number
  receita: number
}

export interface DashboardMetricasGerais {
  perdas: number
  valor_perdas: number
  tarefas_abertas: number
  total_oportunidades_historico: number
  total_oportunidades_periodo: number
  motivos_perda: MotivosPerdaItem[]
  motivos_ganho: MotivosPerdaItem[]
  produtos_ranking: ProdutoRankingItem[]
}

export interface DashboardMetricasGeraisComVariacao extends DashboardMetricasGerais {
  variacao_perdas: number | null
  variacao_oportunidades: number | null
}

// ─────────────────────────────────────────────────────
// Métricas de Atendimento (fn_metricas_atendimento)
// ─────────────────────────────────────────────────────

export interface MetricasAtendimento {
  primeira_resposta_media_segundos: number | null
  tempo_medio_resposta_segundos: number | null
  sem_resposta: number
  total_conversas: number
  mensagens_recebidas: number
  mensagens_enviadas: number
  conversas_whatsapp: number
  conversas_instagram: number
}

// ─────────────────────────────────────────────────────
// Relatório de Metas e Performance (fn_relatorio_metas_dashboard)
// ─────────────────────────────────────────────────────

export interface MetaEmpresaDashboard {
  nome: string
  metrica: string
  valor_meta: number
  valor_atual: number
  percentual: number
  periodo: string
}

export interface VendedorPerformance {
  usuario_id: string
  nome: string
  avatar_url: string | null
  equipe_nome: string | null
  percentual_medio: number
  total_vendas: number
  receita_gerada: number
  metas: Array<{
    metrica: string
    valor_meta: number
    valor_atual: number
    percentual: number
  }>
}

export interface RankingVendedor {
  posicao: number
  nome: string
  avatar_url: string | null
  percentual_medio: number
  receita: number
}

export interface RankingEquipe {
  posicao: number
  nome: string
  cor: string | null
  total_membros: number
  percentual_medio: number
  receita: number
}

export interface MetaNomeItem {
  nome: string
  metrica: string
  percentual: number
}

export interface RelatorioMetasDashboard {
  resumo: {
    total_metas: number
    metas_atingidas: number
    media_atingimento: number
    em_risco: number
    metas_nomes: MetaNomeItem[]
  }
  metas_empresa: MetaEmpresaDashboard[]
  vendedores: VendedorPerformance[]
  ranking_vendedores: RankingVendedor[]
  ranking_equipes: RankingEquipe[]
}
