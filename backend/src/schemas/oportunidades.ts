/**
 * AIDEV-NOTE: Schemas Zod para Oportunidades (Negocios)
 * Conforme PRD-07 - Modulo de Negocios
 *
 * Oportunidades sao os cards do Kanban.
 * Vinculadas a: Funil, Etapa, Contato, Usuario Responsavel.
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const TipoValorEnum = z.enum(['manual', 'produtos'])
export type TipoValor = z.infer<typeof TipoValorEnum>

export const MoedaEnum = z.enum(['BRL', 'USD', 'EUR'])
export type Moeda = z.infer<typeof MoedaEnum>

// =====================================================
// Schema da Oportunidade
// =====================================================

export const OportunidadeSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  funil_id: z.string().uuid(),
  etapa_id: z.string().uuid(),
  contato_id: z.string().uuid(),

  titulo: z.string().min(1).max(500),
  valor: z.number().nonnegative().default(0),
  tipo_valor: TipoValorEnum.default('manual'),
  moeda: MoedaEnum.default('BRL'),
  previsao_fechamento: z.string().date().nullable().optional(),

  usuario_responsavel_id: z.string().uuid().nullable().optional(),

  qualificado_mql: z.boolean().default(false),
  qualificado_sql: z.boolean().default(false),
  qualificado_mql_em: z.string().datetime().nullable().optional(),
  qualificado_sql_em: z.string().datetime().nullable().optional(),

  fechado_em: z.string().datetime().nullable().optional(),
  motivo_resultado_id: z.string().uuid().nullable().optional(),

  observacoes: z.string().nullable().optional(),

  // UTM Tracking
  utm_source: z.string().max(255).nullable().optional(),
  utm_campaign: z.string().max(255).nullable().optional(),
  utm_medium: z.string().max(255).nullable().optional(),
  utm_term: z.string().max(255).nullable().optional(),
  utm_content: z.string().max(255).nullable().optional(),

  criado_em: z.string().datetime(),
  criado_por: z.string().uuid().nullable().optional(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
})

export type Oportunidade = z.infer<typeof OportunidadeSchema>

// =====================================================
// Schemas de Request - Criar Oportunidade
// =====================================================

export const CriarOportunidadeSchema = z.object({
  funil_id: z.string().uuid(),
  etapa_id: z.string().uuid().optional(), // Se nao informado, usa etapa 'entrada'
  contato_id: z.string().uuid().optional(), // Pode criar contato inline
  titulo: z.string().min(1, 'Titulo e obrigatorio').max(500),
  valor: z.number().nonnegative().optional(),
  tipo_valor: TipoValorEnum.optional(),
  moeda: MoedaEnum.optional(),
  previsao_fechamento: z.string().date().optional(),
  usuario_responsavel_id: z.string().uuid().optional(),
  observacoes: z.string().optional(),

  // UTM opcional
  utm_source: z.string().max(255).optional(),
  utm_campaign: z.string().max(255).optional(),
  utm_medium: z.string().max(255).optional(),
  utm_term: z.string().max(255).optional(),
  utm_content: z.string().max(255).optional(),

  // Contato inline (se contato_id nao informado)
  contato: z
    .object({
      nome: z.string().min(1).max(255),
      email: z.string().email().optional(),
      telefone: z.string().max(50).optional(),
    })
    .optional(),

  // Produtos (se tipo_valor = 'produtos')
  produtos: z
    .array(
      z.object({
        produto_id: z.string().uuid(),
        quantidade: z.number().positive(),
        preco_unitario: z.number().nonnegative().optional(), // Se nao informado, usa preco do produto
        desconto_percentual: z.number().min(0).max(100).optional(),
      })
    )
    .optional(),

  // Campos customizados
  campos_customizados: z.record(z.string(), z.unknown()).optional(),
})

export type CriarOportunidadePayload = z.infer<typeof CriarOportunidadeSchema>

// =====================================================
// Schemas de Request - Atualizar Oportunidade
// =====================================================

export const AtualizarOportunidadeSchema = z.object({
  titulo: z.string().min(1).max(500).optional(),
  valor: z.number().nonnegative().optional(),
  tipo_valor: TipoValorEnum.optional(),
  moeda: MoedaEnum.optional(),
  previsao_fechamento: z.string().date().nullable().optional(),
  usuario_responsavel_id: z.string().uuid().nullable().optional(),
  observacoes: z.string().nullable().optional(),

  // UTM
  utm_source: z.string().max(255).nullable().optional(),
  utm_campaign: z.string().max(255).nullable().optional(),
  utm_medium: z.string().max(255).nullable().optional(),
  utm_term: z.string().max(255).nullable().optional(),
  utm_content: z.string().max(255).nullable().optional(),

  // Campos customizados
  campos_customizados: z.record(z.string(), z.unknown()).optional(),
})

export type AtualizarOportunidadePayload = z.infer<typeof AtualizarOportunidadeSchema>

// =====================================================
// Schemas de Request - Mover Etapa (Drag & Drop)
// =====================================================

export const MoverEtapaSchema = z.object({
  etapa_destino_id: z.string().uuid(),
  posicao: z.number().int().min(0).optional(), // Posicao na coluna de destino
})

export type MoverEtapaPayload = z.infer<typeof MoverEtapaSchema>

// =====================================================
// Schemas de Request - Fechar Oportunidade (Ganho/Perda)
// =====================================================

export const FecharOportunidadeSchema = z.object({
  tipo: z.enum(['ganho', 'perda']),
  motivo_id: z.string().uuid().optional(), // Obrigatorio se exigir_motivo_resultado = true
  observacoes: z.string().optional(),
  valor_final: z.number().nonnegative().optional(), // Pode ajustar valor ao fechar
})

export type FecharOportunidadePayload = z.infer<typeof FecharOportunidadeSchema>

// =====================================================
// Schemas de Request - Atribuir Responsavel
// =====================================================

export const AtribuirResponsavelSchema = z.object({
  usuario_responsavel_id: z.string().uuid().nullable(), // null = desatribuir
})

export type AtribuirResponsavelPayload = z.infer<typeof AtribuirResponsavelSchema>

// =====================================================
// Schemas de Request - Qualificar
// =====================================================

export const QualificarOportunidadeSchema = z.object({
  tipo: z.enum(['mql', 'sql']),
  qualificado: z.boolean(),
})

export type QualificarOportunidadePayload = z.infer<typeof QualificarOportunidadeSchema>

// =====================================================
// Schemas de Query - Listagem com Filtros (Kanban)
// =====================================================

export const ListarOportunidadesQuerySchema = z.object({
  funil_id: z.string().uuid().optional(),
  etapa_id: z.string().uuid().optional(),
  contato_id: z.string().uuid().optional(),
  usuario_responsavel_id: z.string().uuid().optional(),
  qualificado_mql: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  qualificado_sql: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  fechado: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  busca: z.string().max(255).optional(),

  // Filtros de valor
  valor_min: z.coerce.number().nonnegative().optional(),
  valor_max: z.coerce.number().nonnegative().optional(),

  // Filtros de data
  data_criacao_inicio: z.string().date().optional(),
  data_criacao_fim: z.string().date().optional(),
  previsao_fechamento_inicio: z.string().date().optional(),
  previsao_fechamento_fim: z.string().date().optional(),

  // Ordenacao
  ordenar_por: z.enum(['criado_em', 'atualizado_em', 'valor', 'titulo', 'previsao_fechamento']).default('criado_em'),
  ordem: z.enum(['asc', 'desc']).default('desc'),

  // Paginacao
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(50),
})

export type ListarOportunidadesQuery = z.infer<typeof ListarOportunidadesQuerySchema>

// =====================================================
// Response Types
// =====================================================

export const ListaOportunidadesResponseSchema = z.object({
  oportunidades: z.array(OportunidadeSchema),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  total_pages: z.number(),
})

export type ListaOportunidadesResponse = z.infer<typeof ListaOportunidadesResponseSchema>

// =====================================================
// Oportunidade para Card do Kanban (dados resumidos)
// =====================================================

export const OportunidadeKanbanSchema = z.object({
  id: z.string().uuid(),
  titulo: z.string(),
  valor: z.number(),
  moeda: z.string(),
  etapa_id: z.string().uuid(),
  previsao_fechamento: z.string().date().nullable(),
  qualificado_mql: z.boolean(),
  qualificado_sql: z.boolean(),
  dias_na_etapa: z.number(),
  criado_em: z.string().datetime(),

  // Contato resumido
  contato: z.object({
    id: z.string().uuid(),
    nome: z.string(),
    email: z.string().nullable(),
    telefone: z.string().nullable(),
    tipo: z.enum(['pessoa', 'empresa']),
  }),

  // Responsavel resumido
  responsavel: z
    .object({
      id: z.string().uuid(),
      nome: z.string(),
      avatar_url: z.string().nullable(),
    })
    .nullable(),

  // Badges
  tarefas_pendentes: z.number(),
  tem_anotacoes: z.boolean(),
  tem_documentos: z.boolean(),

  // Campos customizados para card
  campos_card: z.array(
    z.object({
      campo_id: z.string().uuid(),
      nome: z.string(),
      valor: z.unknown(),
    })
  ),
})

export type OportunidadeKanban = z.infer<typeof OportunidadeKanbanSchema>

// =====================================================
// Oportunidade Completa (para Modal de Detalhes)
// =====================================================

export const OportunidadeDetalheSchema = OportunidadeSchema.extend({
  // Relacoes expandidas
  funil: z.object({
    id: z.string().uuid(),
    nome: z.string(),
    cor: z.string(),
  }),
  etapa: z.object({
    id: z.string().uuid(),
    nome: z.string(),
    tipo: z.string(),
    cor: z.string(),
    probabilidade: z.number(),
  }),
  contato: z.object({
    id: z.string().uuid(),
    tipo: z.enum(['pessoa', 'empresa']),
    nome: z.string(),
    email: z.string().nullable(),
    telefone: z.string().nullable(),
    empresa: z
      .object({
        id: z.string().uuid(),
        razao_social: z.string(),
      })
      .nullable(),
  }),
  responsavel: z
    .object({
      id: z.string().uuid(),
      nome: z.string(),
      email: z.string(),
      avatar_url: z.string().nullable(),
    })
    .nullable(),
  motivo_resultado: z
    .object({
      id: z.string().uuid(),
      nome: z.string(),
      tipo: z.enum(['ganho', 'perda']),
    })
    .nullable(),

  // Produtos vinculados
  produtos: z.array(
    z.object({
      id: z.string().uuid(),
      produto_id: z.string().uuid(),
      nome: z.string(),
      quantidade: z.number(),
      preco_unitario: z.number(),
      desconto_percentual: z.number(),
      subtotal: z.number(),
    })
  ),

  // Campos customizados
  campos_customizados: z.array(
    z.object({
      campo_id: z.string().uuid(),
      nome: z.string(),
      tipo: z.string(),
      valor: z.unknown(),
    })
  ),

  // Contadores
  total_anotacoes: z.number(),
  total_documentos: z.number(),
  total_emails: z.number(),
  total_reunioes: z.number(),
  tarefas_pendentes: z.number(),
  tarefas_concluidas: z.number(),
})

export type OportunidadeDetalhe = z.infer<typeof OportunidadeDetalheSchema>

// =====================================================
// Kanban Response (dados completos do board)
// =====================================================

export const KanbanEtapaSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  tipo: z.string(),
  cor: z.string(),
  probabilidade: z.number(),
  ordem: z.number(),
  total_oportunidades: z.number(),
  valor_total: z.number(),
  oportunidades: z.array(OportunidadeKanbanSchema),
})

export type KanbanEtapa = z.infer<typeof KanbanEtapaSchema>

export const KanbanResponseSchema = z.object({
  funil: z.object({
    id: z.string().uuid(),
    nome: z.string(),
    cor: z.string(),
  }),
  etapas: z.array(KanbanEtapaSchema),
  metricas: z.object({
    total_aberto: z.number(),
    quantidade: z.number(),
    ticket_medio: z.number(),
    taxa_conversao: z.number(),
    ganhos_mes: z.number(),
    perdidos_mes: z.number(),
    valor_perdido: z.number(),
  }),
  filtros_aplicados: z.record(z.string(), z.unknown()),
})

export type KanbanResponse = z.infer<typeof KanbanResponseSchema>

// =====================================================
// Oportunidade Produto (vinculo)
// =====================================================

export const OportunidadeProdutoSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  oportunidade_id: z.string().uuid(),
  produto_id: z.string().uuid(),
  quantidade: z.number().positive(),
  preco_unitario: z.number().nonnegative(),
  desconto_percentual: z.number().min(0).max(100),
  subtotal: z.number().nonnegative(),
  criado_em: z.string().datetime(),
})

export type OportunidadeProduto = z.infer<typeof OportunidadeProdutoSchema>

export const AdicionarProdutoSchema = z.object({
  produto_id: z.string().uuid(),
  quantidade: z.number().positive(),
  preco_unitario: z.number().nonnegative().optional(),
  desconto_percentual: z.number().min(0).max(100).optional(),
})

export type AdicionarProdutoPayload = z.infer<typeof AdicionarProdutoSchema>

export const AtualizarProdutoOportunidadeSchema = z.object({
  quantidade: z.number().positive().optional(),
  preco_unitario: z.number().nonnegative().optional(),
  desconto_percentual: z.number().min(0).max(100).optional(),
})

export type AtualizarProdutoOportunidadePayload = z.infer<typeof AtualizarProdutoOportunidadeSchema>
