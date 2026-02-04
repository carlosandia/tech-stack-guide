/**
 * AIDEV-NOTE: Schemas Zod para o modulo de Notificacoes (PRD-15)
 * Sistema generico de notificacoes - reutilizavel por outros modulos
 *
 * Tipos de notificacao atuais:
 * - feedback_resolvido: Quando Super Admin resolve um feedback
 *
 * Extensivel para:
 * - tarefa_atribuida
 * - oportunidade_ganha
 * - etc.
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const TipoNotificacaoEnum = z.enum([
  'feedback_resolvido',
  'tarefa_atribuida',
  'oportunidade_ganha',
  'mensagem_recebida',
  'sistema',
])
export type TipoNotificacao = z.infer<typeof TipoNotificacaoEnum>

// =====================================================
// Schema Principal
// =====================================================

export const NotificacaoSchema = z.object({
  id: z.string().uuid(),
  usuario_id: z.string().uuid(),
  tipo: z.string(), // Flexivel para novos tipos
  titulo: z.string(),
  mensagem: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  referencia_tipo: z.string().nullable().optional(), // 'feedback', 'tarefa', etc.
  referencia_id: z.string().uuid().nullable().optional(),
  lida: z.boolean(),
  lida_em: z.string().datetime().nullable().optional(),
  criado_em: z.string().datetime(),
})

export type Notificacao = z.infer<typeof NotificacaoSchema>

// =====================================================
// Request Schemas
// =====================================================

/**
 * GET /api/v1/notificacoes - Listar notificacoes
 */
export const ListarNotificacoesQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
})

export type ListarNotificacoesQuery = z.infer<typeof ListarNotificacoesQuerySchema>

// =====================================================
// Response Schemas
// =====================================================

export const ListarNotificacoesResponseSchema = z.object({
  notificacoes: z.array(NotificacaoSchema),
  total: z.number(),
})

export type ListarNotificacoesResponse = z.infer<typeof ListarNotificacoesResponseSchema>

export const ContagemNotificacoesResponseSchema = z.object({
  nao_lidas: z.number(),
})

export type ContagemNotificacoesResponse = z.infer<typeof ContagemNotificacoesResponseSchema>

// =====================================================
// Internal Schemas (para criacao via service)
// =====================================================

export const CriarNotificacaoSchema = z.object({
  usuario_id: z.string().uuid(),
  tipo: z.string(),
  titulo: z.string().max(255),
  mensagem: z.string().optional(),
  link: z.string().max(500).optional(),
  referencia_tipo: z.string().max(50).optional(),
  referencia_id: z.string().uuid().optional(),
})

export type CriarNotificacao = z.infer<typeof CriarNotificacaoSchema>
