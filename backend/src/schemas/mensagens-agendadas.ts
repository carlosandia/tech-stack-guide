/**
 * AIDEV-NOTE: Schemas Zod para mensagens agendadas (PRD-09)
 * Mensagens programadas para envio futuro
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const StatusMensagemAgendadaEnum = z.enum(['agendada', 'enviada', 'cancelada', 'falha'])
export type StatusMensagemAgendada = z.infer<typeof StatusMensagemAgendadaEnum>

export const TipoMensagemAgendadaEnum = z.enum(['text', 'image', 'video', 'audio', 'document'])
export type TipoMensagemAgendada = z.infer<typeof TipoMensagemAgendadaEnum>

// =====================================================
// Schema Principal
// =====================================================

export const MensagemAgendadaSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  conversa_id: z.string().uuid(),
  usuario_id: z.string().uuid(),

  tipo: TipoMensagemAgendadaEnum,
  conteudo: z.string(),
  media_url: z.string().nullable().optional(),

  agendado_para: z.string().datetime(),
  timezone: z.string().default('America/Sao_Paulo'),

  status: StatusMensagemAgendadaEnum,
  enviada_em: z.string().datetime().nullable().optional(),
  erro: z.string().nullable().optional(),

  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
})

export type MensagemAgendada = z.infer<typeof MensagemAgendadaSchema>

// =====================================================
// Schema com Conversa (para listagem)
// =====================================================

export const MensagemAgendadaComConversaSchema = MensagemAgendadaSchema.extend({
  conversa: z.object({
    id: z.string().uuid(),
    canal: z.string(),
    contato: z.object({
      id: z.string().uuid(),
      nome: z.string(),
    }).optional(),
  }).optional(),
})

export type MensagemAgendadaComConversa = z.infer<typeof MensagemAgendadaComConversaSchema>

// =====================================================
// Query Schemas
// =====================================================

export const ListarMensagensAgendadasQuerySchema = z.object({
  // Filtros
  status: StatusMensagemAgendadaEnum.optional(),
  conversa_id: z.string().uuid().optional(),

  // Paginacao
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

export type ListarMensagensAgendadasQuery = z.infer<typeof ListarMensagensAgendadasQuerySchema>

// =====================================================
// Response Schemas
// =====================================================

export const ListarMensagensAgendadasResponseSchema = z.object({
  mensagens_agendadas: z.array(MensagemAgendadaComConversaSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export type ListarMensagensAgendadasResponse = z.infer<typeof ListarMensagensAgendadasResponseSchema>

// =====================================================
// Body Schemas (Request)
// =====================================================

export const CriarMensagemAgendadaSchema = z.object({
  conversa_id: z.string().uuid(),
  tipo: TipoMensagemAgendadaEnum.default('text'),
  conteudo: z.string().min(1),
  media_url: z.string().url().optional(),
  agendado_para: z.string().datetime(),
  timezone: z.string().default('America/Sao_Paulo'),
})

export type CriarMensagemAgendada = z.infer<typeof CriarMensagemAgendadaSchema>
