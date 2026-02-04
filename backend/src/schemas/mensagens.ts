/**
 * AIDEV-NOTE: Schemas Zod para mensagens (PRD-09)
 * Inclui schemas para todos os tipos de mensagem suportados
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const TipoMensagemEnum = z.enum([
  'text',
  'image',
  'video',
  'audio',
  'document',
  'sticker',
  'location',
  'contact',
  'poll',
  'reaction',
])
export type TipoMensagem = z.infer<typeof TipoMensagemEnum>

// ACK: 0=error, 1=pending, 2=sent, 3=delivered, 4=read, 5=played
export const AckStatusEnum = z.enum(['0', '1', '2', '3', '4', '5'])
export const AckStatusNumber = z.number().min(0).max(5)

export const AckNameEnum = z.enum(['ERROR', 'PENDING', 'SENT', 'DELIVERED', 'READ', 'PLAYED'])
export type AckName = z.infer<typeof AckNameEnum>

// =====================================================
// Schema Principal
// =====================================================

export const MensagemSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  conversa_id: z.string().uuid(),

  message_id: z.string(),
  from_me: z.boolean(),
  from_number: z.string().nullable().optional(),
  to_number: z.string().nullable().optional(),
  participant: z.string().nullable().optional(),

  tipo: TipoMensagemEnum,
  body: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),

  has_media: z.boolean().default(false),
  media_url: z.string().nullable().optional(),
  media_mimetype: z.string().nullable().optional(),
  media_filename: z.string().nullable().optional(),
  media_size: z.number().nullable().optional(),
  media_duration: z.number().nullable().optional(),

  location_latitude: z.number().nullable().optional(),
  location_longitude: z.number().nullable().optional(),
  location_name: z.string().nullable().optional(),
  location_address: z.string().nullable().optional(),

  vcard: z.string().nullable().optional(),

  poll_question: z.string().nullable().optional(),
  poll_options: z.array(z.object({
    text: z.string(),
    votes: z.number().default(0),
  })).nullable().optional(),
  poll_allow_multiple: z.boolean().nullable().optional(),

  reaction_emoji: z.string().nullable().optional(),
  reaction_message_id: z.string().nullable().optional(),

  reply_to_message_id: z.string().nullable().optional(),

  ack: z.number().min(0).max(5).default(0),
  ack_name: z.string().nullable().optional(),

  timestamp_externo: z.number().nullable().optional(),
  raw_data: z.record(z.any()).nullable().optional(),

  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
})

export type Mensagem = z.infer<typeof MensagemSchema>

// =====================================================
// Query Schemas
// =====================================================

export const ListarMensagensQuerySchema = z.object({
  // Paginacao
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),

  // Filtros
  tipo: TipoMensagemEnum.optional(),
  antes_de: z.string().datetime().optional(),
  depois_de: z.string().datetime().optional(),

  // Ordenacao
  order_dir: z.enum(['asc', 'desc']).default('desc'),
})

export type ListarMensagensQuery = z.infer<typeof ListarMensagensQuerySchema>

// =====================================================
// Response Schemas
// =====================================================

export const ListarMensagensResponseSchema = z.object({
  mensagens: z.array(MensagemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  has_more: z.boolean(),
})

export type ListarMensagensResponse = z.infer<typeof ListarMensagensResponseSchema>

// =====================================================
// Body Schemas (Request) - Enviar Mensagens
// =====================================================

export const EnviarMensagemTextoSchema = z.object({
  texto: z.string().min(1),
  reply_to: z.string().optional(),
})

export type EnviarMensagemTexto = z.infer<typeof EnviarMensagemTextoSchema>

export const EnviarMensagemMediaSchema = z.object({
  tipo: z.enum(['image', 'video', 'audio', 'document']),
  media_url: z.string().url(),
  caption: z.string().optional(),
  filename: z.string().optional(),
})

export type EnviarMensagemMedia = z.infer<typeof EnviarMensagemMediaSchema>

export const EnviarMensagemLocalizacaoSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  nome: z.string().optional(),
  endereco: z.string().optional(),
})

export type EnviarMensagemLocalizacao = z.infer<typeof EnviarMensagemLocalizacaoSchema>

export const EnviarMensagemContatoSchema = z.object({
  vcard: z.string(),
})

export type EnviarMensagemContato = z.infer<typeof EnviarMensagemContatoSchema>

export const EnviarMensagemEnqueteSchema = z.object({
  pergunta: z.string().min(1),
  opcoes: z.array(z.string().min(1)).min(2).max(12),
  permitir_multiplas: z.boolean().default(false),
})

export type EnviarMensagemEnquete = z.infer<typeof EnviarMensagemEnqueteSchema>

export const EnviarMensagemReacaoSchema = z.object({
  message_id: z.string(),
  emoji: z.string(),
})

export type EnviarMensagemReacao = z.infer<typeof EnviarMensagemReacaoSchema>

// =====================================================
// Schema para processamento de webhook
// =====================================================

export const ProcessarMensagemWebhookSchema = z.object({
  organizacao_id: z.string().uuid(),
  conversa_id: z.string().uuid(),
  message_id: z.string(),
  from_me: z.boolean(),
  from_number: z.string().optional(),
  to_number: z.string().optional(),
  participant: z.string().optional(),
  tipo: TipoMensagemEnum,
  body: z.string().optional(),
  caption: z.string().optional(),
  has_media: z.boolean().default(false),
  media_url: z.string().optional(),
  media_mimetype: z.string().optional(),
  media_filename: z.string().optional(),
  media_size: z.number().optional(),
  media_duration: z.number().optional(),
  location_latitude: z.number().optional(),
  location_longitude: z.number().optional(),
  location_name: z.string().optional(),
  location_address: z.string().optional(),
  vcard: z.string().optional(),
  poll_question: z.string().optional(),
  poll_options: z.array(z.object({
    text: z.string(),
    votes: z.number().default(0),
  })).optional(),
  poll_allow_multiple: z.boolean().optional(),
  reaction_emoji: z.string().optional(),
  reaction_message_id: z.string().optional(),
  reply_to_message_id: z.string().optional(),
  ack: z.number().min(0).max(5).default(0),
  timestamp_externo: z.number().optional(),
  raw_data: z.record(z.any()).optional(),
})

export type ProcessarMensagemWebhook = z.infer<typeof ProcessarMensagemWebhookSchema>

// =====================================================
// Schema para atualizar ACK
// =====================================================

export const AtualizarAckSchema = z.object({
  message_id: z.string(),
  ack: z.number().min(0).max(5),
  ack_name: AckNameEnum.optional(),
})

export type AtualizarAck = z.infer<typeof AtualizarAckSchema>
