/**
 * AIDEV-NOTE: Schemas Zod para Metas Hierarquicas
 * Conforme PRD-05 - Sistema de Metas (Admin Only)
 *
 * Hierarquia: Empresa → Equipe → Individual
 * 15 tipos de metricas suportadas
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const TipoMetaEnum = z.enum(['empresa', 'equipe', 'individual'])
export type TipoMeta = z.infer<typeof TipoMetaEnum>

export const CategoriaMetricaEnum = z.enum(['receita', 'quantidade', 'atividades', 'leads', 'tempo'])
export type CategoriaMetrica = z.infer<typeof CategoriaMetricaEnum>

export const MetricaEnum = z.enum([
  // Receita
  'valor_vendas',
  'mrr',
  'ticket_medio',
  // Quantidade
  'quantidade_vendas',
  'novos_negocios',
  'taxa_conversao',
  // Atividades
  'reunioes',
  'ligacoes',
  'emails',
  'tarefas',
  // Leads
  'novos_contatos',
  'mqls',
  'sqls',
  // Tempo
  'tempo_fechamento',
  'velocidade_pipeline',
])
export type Metrica = z.infer<typeof MetricaEnum>

export const PeriodoMetaEnum = z.enum(['mensal', 'trimestral', 'semestral', 'anual'])
export type PeriodoMeta = z.infer<typeof PeriodoMetaEnum>

export const TipoDistribuicaoEnum = z.enum(['igual', 'proporcional', 'manual'])
export type TipoDistribuicao = z.infer<typeof TipoDistribuicaoEnum>

// =====================================================
// Mapeamento de Metricas por Categoria
// =====================================================

export const MetricasPorCategoria = {
  receita: ['valor_vendas', 'mrr', 'ticket_medio'],
  quantidade: ['quantidade_vendas', 'novos_negocios', 'taxa_conversao'],
  atividades: ['reunioes', 'ligacoes', 'emails', 'tarefas'],
  leads: ['novos_contatos', 'mqls', 'sqls'],
  tempo: ['tempo_fechamento', 'velocidade_pipeline'],
} as const

export const MetricaLabels: Record<string, string> = {
  valor_vendas: 'Valor de Vendas',
  mrr: 'MRR (Receita Recorrente)',
  ticket_medio: 'Ticket Medio',
  quantidade_vendas: 'Quantidade de Vendas',
  novos_negocios: 'Novos Negocios',
  taxa_conversao: 'Taxa de Conversao',
  reunioes: 'Reunioes',
  ligacoes: 'Ligacoes',
  emails: 'Emails Enviados',
  tarefas: 'Tarefas Concluidas',
  novos_contatos: 'Novos Contatos',
  mqls: 'MQLs Gerados',
  sqls: 'SQLs Gerados',
  tempo_fechamento: 'Tempo de Fechamento (dias)',
  velocidade_pipeline: 'Velocidade do Pipeline (dias)',
}

export const MetricaUnidades: Record<string, string> = {
  valor_vendas: 'R$',
  mrr: 'R$',
  ticket_medio: 'R$',
  quantidade_vendas: 'un',
  novos_negocios: 'un',
  taxa_conversao: '%',
  reunioes: 'un',
  ligacoes: 'un',
  emails: 'un',
  tarefas: 'un',
  novos_contatos: 'un',
  mqls: 'un',
  sqls: 'un',
  tempo_fechamento: 'dias',
  velocidade_pipeline: 'dias',
}

// =====================================================
// Schema da Meta
// =====================================================

export const MetaSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  tipo: TipoMetaEnum,
  metrica: MetricaEnum,
  valor_alvo: z.number().positive(),
  periodo: PeriodoMetaEnum,
  data_inicio: z.string().datetime(),
  data_fim: z.string().datetime(),
  equipe_id: z.string().uuid().nullable().optional(),
  usuario_id: z.string().uuid().nullable().optional(),
  meta_pai_id: z.string().uuid().nullable().optional(),
  distribuicao_tipo: TipoDistribuicaoEnum.nullable().optional(),
  ativa: z.boolean().default(true),
  criado_em: z.string().datetime(),
  criado_por: z.string().uuid().nullable().optional(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
})

export type Meta = z.infer<typeof MetaSchema>

// =====================================================
// Schemas de Request - Meta
// =====================================================

export const CriarMetaSchema = z.object({
  tipo: TipoMetaEnum,
  metrica: MetricaEnum,
  valor_alvo: z.number().positive('Valor alvo deve ser positivo'),
  periodo: PeriodoMetaEnum,
  data_inicio: z.string().datetime(),
  data_fim: z.string().datetime(),
  equipe_id: z.string().uuid().optional(),
  usuario_id: z.string().uuid().optional(),
  meta_pai_id: z.string().uuid().optional(),
}).refine(
  (data) => {
    // Meta de equipe precisa de equipe_id
    if (data.tipo === 'equipe' && !data.equipe_id) {
      return false
    }
    // Meta individual precisa de usuario_id
    if (data.tipo === 'individual' && !data.usuario_id) {
      return false
    }
    return true
  },
  {
    message: 'Meta de equipe requer equipe_id, meta individual requer usuario_id',
  }
)

export type CriarMetaPayload = z.infer<typeof CriarMetaSchema>

export const AtualizarMetaSchema = z.object({
  valor_alvo: z.number().positive().optional(),
  data_inicio: z.string().datetime().optional(),
  data_fim: z.string().datetime().optional(),
  ativa: z.boolean().optional(),
})

export type AtualizarMetaPayload = z.infer<typeof AtualizarMetaSchema>

// =====================================================
// Distribuicao de Metas
// =====================================================

export const DistribuicaoItemSchema = z.object({
  id: z.string().uuid(), // equipe_id ou usuario_id
  valor: z.number().positive(),
  percentual: z.number().min(0).max(100).optional(),
})

export type DistribuicaoItem = z.infer<typeof DistribuicaoItemSchema>

export const DistribuirMetaSchema = z.object({
  tipo_distribuicao: TipoDistribuicaoEnum,
  nivel_destino: z.enum(['equipe', 'individual']),
  distribuicao: z.array(DistribuicaoItemSchema).optional(),
})

export type DistribuirMetaPayload = z.infer<typeof DistribuirMetaSchema>

// =====================================================
// Progresso da Meta
// =====================================================

export const MetaProgressoSchema = z.object({
  id: z.string().uuid(),
  meta_id: z.string().uuid(),
  valor_atual: z.number().default(0),
  percentual_atingido: z.number().default(0),
  ultima_atualizacao: z.string().datetime(),
})

export type MetaProgresso = z.infer<typeof MetaProgressoSchema>

// =====================================================
// Meta com Progresso e Detalhes (Response)
// =====================================================

export const MetaComProgressoSchema = MetaSchema.extend({
  progresso: MetaProgressoSchema.nullable().optional(),
  equipe_nome: z.string().nullable().optional(),
  usuario_nome: z.string().nullable().optional(),
  metas_filhas_count: z.number().default(0),
})

export type MetaComProgresso = z.infer<typeof MetaComProgressoSchema>

// =====================================================
// Meta Detalhada (com filhas)
// =====================================================

export const MetaDetalhadaSchema = MetaComProgressoSchema.extend({
  metas_filhas: z.array(MetaComProgressoSchema).optional(),
})

export type MetaDetalhada = z.infer<typeof MetaDetalhadaSchema>

// =====================================================
// Response Types
// =====================================================

export const ListaMetasResponseSchema = z.object({
  metas: z.array(MetaComProgressoSchema),
  total: z.number(),
})

export type ListaMetasResponse = z.infer<typeof ListaMetasResponseSchema>

// Metas da Empresa (visao geral)
export const MetasEmpresaResponseSchema = z.object({
  metas: z.array(MetaDetalhadaSchema),
  resumo: z.object({
    total_metas: z.number(),
    media_atingimento: z.number(),
    metas_atingidas: z.number(),
    metas_em_risco: z.number(),
  }),
})

export type MetasEmpresaResponse = z.infer<typeof MetasEmpresaResponseSchema>

// Metas por Equipe
export const MetasEquipeResponseSchema = z.object({
  equipe_id: z.string().uuid(),
  equipe_nome: z.string(),
  metas: z.array(MetaComProgressoSchema),
  membros_metas: z.array(
    z.object({
      usuario_id: z.string().uuid(),
      usuario_nome: z.string(),
      metas: z.array(MetaComProgressoSchema),
    })
  ),
})

export type MetasEquipeResponse = z.infer<typeof MetasEquipeResponseSchema>

// =====================================================
// Progresso Geral
// =====================================================

export const ProgressoGeralSchema = z.object({
  empresa: z.object({
    total_metas: z.number(),
    metas_atingidas: z.number(),
    media_atingimento: z.number(),
    valor_total_alvo: z.number(),
    valor_total_atual: z.number(),
  }),
  equipes: z.array(
    z.object({
      equipe_id: z.string().uuid(),
      equipe_nome: z.string(),
      total_metas: z.number(),
      media_atingimento: z.number(),
    })
  ),
  periodo_atual: z.object({
    inicio: z.string().datetime(),
    fim: z.string().datetime(),
    dias_restantes: z.number(),
  }),
})

export type ProgressoGeral = z.infer<typeof ProgressoGeralSchema>

// =====================================================
// Ranking
// =====================================================

export const RankingItemSchema = z.object({
  posicao: z.number(),
  usuario_id: z.string().uuid(),
  usuario_nome: z.string(),
  avatar_url: z.string().nullable().optional(),
  equipe_nome: z.string().nullable().optional(),
  valor_atingido: z.number(),
  percentual_meta: z.number(),
  variacao: z.number(), // positivo = subiu, negativo = caiu
})

export type RankingItem = z.infer<typeof RankingItemSchema>

export const RankingResponseSchema = z.object({
  ranking: z.array(RankingItemSchema),
  metrica: MetricaEnum,
  periodo: z.object({
    inicio: z.string().datetime(),
    fim: z.string().datetime(),
  }),
  atualizado_em: z.string().datetime(),
})

export type RankingResponse = z.infer<typeof RankingResponseSchema>

// =====================================================
// Minhas Metas (Member View)
// =====================================================

export const MinhasMetasResponseSchema = z.object({
  metas: z.array(MetaComProgressoSchema),
  resumo: z.object({
    total_metas: z.number(),
    metas_atingidas: z.number(),
    media_atingimento: z.number(),
    proxima_meta: MetaComProgressoSchema.nullable().optional(),
  }),
  posicao_ranking: z.number().nullable().optional(),
})

export type MinhasMetasResponse = z.infer<typeof MinhasMetasResponseSchema>

// =====================================================
// Query Params
// =====================================================

export const ListarMetasQuerySchema = z.object({
  tipo: TipoMetaEnum.optional(),
  metrica: MetricaEnum.optional(),
  periodo: PeriodoMetaEnum.optional(),
  equipe_id: z.string().uuid().optional(),
  usuario_id: z.string().uuid().optional(),
  ativa: z.enum(['true', 'false']).optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
})

export type ListarMetasQuery = z.infer<typeof ListarMetasQuerySchema>

export const RankingQuerySchema = z.object({
  metrica: MetricaEnum.optional(),
  periodo: PeriodoMetaEnum.optional(),
  equipe_id: z.string().uuid().optional(),
  limit: z.string().optional(),
})

export type RankingQuery = z.infer<typeof RankingQuerySchema>
