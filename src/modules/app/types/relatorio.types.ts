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
  reunioes: number
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
      cpl: number | null
      cpmql: number | null
      custo_por_reuniao: number | null
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
    reunioes: number
    fechados: number
  }
  conversoes: {
    lead_para_mql: number | null
    mql_para_sql: number | null
    sql_para_reuniao: number | null
    reuniao_para_fechado: number | null
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
