import { z } from 'zod'

// =====================================================
// PRD-18: Schemas Zod para o módulo de Relatório de Funil
// AIDEV-NOTE: Types derived from Zod — do not edit manually
// =====================================================

// ─────────────────────────────────────────────────────
// Query params do endpoint GET /relatorio/funil
// ─────────────────────────────────────────────────────

export const FunilQuerySchema = z.object({
  periodo: z.enum(['7d', '30d', '90d', 'personalizado']).default('30d'),
  data_inicio: z.string().date().optional(), // Requerido quando periodo = 'personalizado'
  data_fim: z.string().date().optional(),    // Requerido quando periodo = 'personalizado'
  funil_id: z.string().uuid().optional(),
  canal: z.string().max(100).optional(),
})

export type FunilQuery = z.infer<typeof FunilQuerySchema>

// ─────────────────────────────────────────────────────
// Response do endpoint — métricas brutas do funil
// ─────────────────────────────────────────────────────

export const MetricasBrutasSchema = z.object({
  total_leads: z.number(),
  mqls: z.number(),
  sqls: z.number(),
  reunioes: z.number(),
  fechados: z.number(),
  valor_gerado: z.number(),
  ticket_medio: z.number(),
  forecast: z.number(),
  ciclo_medio_dias: z.number().nullable(),
})

export type MetricasBrutas = z.infer<typeof MetricasBrutasSchema>

export const BreakdownCanalItemSchema = z.object({
  canal: z.string(),
  oportunidades: z.number(),
  fechados: z.number(),
  valor_gerado: z.number(),
  taxa_fechamento: z.number(), // %
  percentual_total: z.number(), // % do total de oportunidades no período
})

export type BreakdownCanalItem = z.infer<typeof BreakdownCanalItemSchema>

// ─────────────────────────────────────────────────────
// Response completo do funil
// ─────────────────────────────────────────────────────

export const RelatorioFunilResponseSchema = z.object({
  periodo: z.object({
    inicio: z.string(),
    fim: z.string(),
    dias: z.number(),
    label: z.string(),
  }),
  funil: z.object({
    total_leads: z.number(),
    mqls: z.number(),
    sqls: z.number(),
    reunioes: z.number(),
    fechados: z.number(),
  }),
  conversoes: z.object({
    lead_para_mql: z.number().nullable(),        // %
    mql_para_sql: z.number().nullable(),         // %
    sql_para_reuniao: z.number().nullable(),     // %
    reuniao_para_fechado: z.number().nullable(), // %
    lead_para_fechado: z.number().nullable(),    // %
  }),
  kpis: z.object({
    ticket_medio: z.number(),
    valor_gerado: z.number(),
    ciclo_medio_dias: z.number().nullable(),
    forecast: z.number(),
  }),
  variacao: z.object({
    leads: z.number().nullable(),        // % vs período anterior
    fechados: z.number().nullable(),
    valor_gerado: z.number().nullable(),
    ticket_medio: z.number().nullable(),
  }),
  breakdown_canal: z.array(BreakdownCanalItemSchema),
  // Invest Mode — preenchido quando há investimento registrado
  invest_mode: z.object({
    ativo: z.literal(false),
  }).or(z.object({
    ativo: z.literal(true),
    total_investido: z.number(),
    cpl: z.number().nullable(),
    cpmql: z.number().nullable(),
    custo_por_sql: z.number().nullable(),
    custo_por_reuniao: z.number().nullable(),
    cac: z.number().nullable(),
    romi: z.number().nullable(),
  })),
})

export type RelatorioFunilResponse = z.infer<typeof RelatorioFunilResponseSchema>

// ─────────────────────────────────────────────────────
// Schemas para Invest Mode (Fase 2)
// ─────────────────────────────────────────────────────

export const SalvarInvestimentoSchema = z.object({
  periodo_inicio: z.string().date(),
  periodo_fim: z.string().date(),
  meta_ads: z.number().nonnegative().default(0),
  google_ads: z.number().nonnegative().default(0),
  outros: z.number().nonnegative().default(0),
})

export type SalvarInvestimentoPayload = z.infer<typeof SalvarInvestimentoSchema>
