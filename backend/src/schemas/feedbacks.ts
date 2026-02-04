/**
 * AIDEV-NOTE: Schemas Zod para o modulo de Feedbacks (PRD-15)
 * Canal de comunicacao entre usuarios do CRM (Admin/Member) e equipe de produto (Super Admin)
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const TipoFeedbackEnum = z.enum(['bug', 'sugestao', 'duvida'])
export type TipoFeedback = z.infer<typeof TipoFeedbackEnum>

export const StatusFeedbackEnum = z.enum(['aberto', 'resolvido'])
export type StatusFeedback = z.infer<typeof StatusFeedbackEnum>

// =====================================================
// Schema Principal
// =====================================================

export const FeedbackSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  usuario_id: z.string().uuid(),
  tipo: TipoFeedbackEnum,
  descricao: z.string(),
  status: StatusFeedbackEnum,
  resolvido_em: z.string().datetime().nullable().optional(),
  resolvido_por: z.string().uuid().nullable().optional(),
  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
})

export type Feedback = z.infer<typeof FeedbackSchema>

// =====================================================
// Schema com Dados Relacionados (para listagem Super Admin)
// =====================================================

export const FeedbackComDetalhesSchema = FeedbackSchema.extend({
  organizacao: z.object({
    id: z.string().uuid(),
    nome: z.string(),
  }),
  usuario: z.object({
    id: z.string().uuid(),
    nome: z.string(),
    email: z.string(),
    role: z.string(),
  }),
  resolvido_por_usuario: z.object({
    id: z.string().uuid(),
    nome: z.string(),
  }).nullable().optional(),
})

export type FeedbackComDetalhes = z.infer<typeof FeedbackComDetalhesSchema>

// =====================================================
// Request Schemas
// =====================================================

/**
 * POST /api/v1/feedbacks - Criar feedback (Admin/Member)
 */
export const CriarFeedbackSchema = z.object({
  tipo: TipoFeedbackEnum,
  descricao: z.string().min(10, 'Descricao deve ter no minimo 10 caracteres').max(10000, 'Descricao deve ter no maximo 10.000 caracteres'),
})

export type CriarFeedback = z.infer<typeof CriarFeedbackSchema>

/**
 * GET /api/v1/admin/feedbacks - Listar feedbacks (Super Admin)
 */
export const ListarFeedbacksQuerySchema = z.object({
  empresa_id: z.string().uuid().optional(),
  tipo: TipoFeedbackEnum.optional(),
  status: StatusFeedbackEnum.optional(),
  busca: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
})

export type ListarFeedbacksQuery = z.infer<typeof ListarFeedbacksQuerySchema>

/**
 * PATCH /api/v1/admin/feedbacks/:id/status - Alterar status (Super Admin)
 */
export const AlterarStatusFeedbackSchema = z.object({
  status: z.literal('resolvido'), // So pode resolver, nao pode reabrir
})

export type AlterarStatusFeedback = z.infer<typeof AlterarStatusFeedbackSchema>

// =====================================================
// Response Schemas
// =====================================================

export const ListarFeedbacksResponseSchema = z.object({
  feedbacks: z.array(FeedbackComDetalhesSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  total_pages: z.number(),
})

export type ListarFeedbacksResponse = z.infer<typeof ListarFeedbacksResponseSchema>

export const CriarFeedbackResponseSchema = z.object({
  id: z.string().uuid(),
  tipo: TipoFeedbackEnum,
  descricao: z.string(),
  status: StatusFeedbackEnum,
  criado_em: z.string().datetime(),
})

export type CriarFeedbackResponse = z.infer<typeof CriarFeedbackResponseSchema>
