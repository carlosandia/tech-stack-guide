/**
 * AIDEV-NOTE: Schemas Zod para WhatsApp via WAHA
 * Conforme PRD-08 - Secao 1. WhatsApp via WAHA Plus
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const StatusWhatsAppEnum = z.enum([
  'disconnected',
  'qr_pending',
  'connecting',
  'connected',
  'failed'
])
export type StatusWhatsApp = z.infer<typeof StatusWhatsAppEnum>

// =====================================================
// Schema da Sessao WhatsApp
// =====================================================

export const SessaoWhatsAppSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  usuario_id: z.string().uuid(),
  session_name: z.string(),
  phone_number: z.string().nullable().optional(),
  phone_name: z.string().nullable().optional(),
  status: StatusWhatsAppEnum,
  ultimo_qr_gerado: z.string().datetime().nullable().optional(),
  conectado_em: z.string().datetime().nullable().optional(),
  desconectado_em: z.string().datetime().nullable().optional(),
  ultima_mensagem_em: z.string().datetime().nullable().optional(),
  webhook_url: z.string().nullable().optional(),
  webhook_events: z.array(z.string()).default(['message', 'message.ack', 'session.status']),
  total_mensagens_enviadas: z.number().default(0),
  total_mensagens_recebidas: z.number().default(0),
  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
})

export type SessaoWhatsApp = z.infer<typeof SessaoWhatsAppSchema>

// =====================================================
// Request Schemas
// =====================================================

export const IniciarSessaoResponseSchema = z.object({
  id: z.string().uuid(),
  session_name: z.string(),
  status: StatusWhatsAppEnum,
  message: z.string(),
})

export type IniciarSessaoResponse = z.infer<typeof IniciarSessaoResponseSchema>

export const QrCodeResponseSchema = z.object({
  qr_code: z.string(), // base64
  expires_in: z.number(), // segundos
  status: StatusWhatsAppEnum,
})

export type QrCodeResponse = z.infer<typeof QrCodeResponseSchema>

export const StatusWhatsAppResponseSchema = z.object({
  id: z.string().uuid().optional(),
  status: StatusWhatsAppEnum,
  phone_number: z.string().nullable().optional(),
  phone_name: z.string().nullable().optional(),
  conectado_em: z.string().datetime().nullable().optional(),
  ultima_mensagem_em: z.string().datetime().nullable().optional(),
})

export type StatusWhatsAppResponse = z.infer<typeof StatusWhatsAppResponseSchema>

// =====================================================
// Webhook Schemas (WAHA)
// =====================================================

export const WahaWebhookEventSchema = z.enum([
  'session.status',
  'message',
  'message.ack',
  'message.any',
  'message.reaction',
  'state.change'
])
export type WahaWebhookEvent = z.infer<typeof WahaWebhookEventSchema>

export const WahaSessionStatusPayloadSchema = z.object({
  status: z.string(), // CONNECTED, DISCONNECTED, etc.
})

export const WahaMessagePayloadSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  body: z.string().optional(),
  timestamp: z.number(),
  type: z.string(),
  hasMedia: z.boolean().optional(),
  ack: z.number().optional(),
})

export const WahaWebhookPayloadSchema = z.object({
  event: WahaWebhookEventSchema,
  session: z.string(),
  payload: z.union([
    WahaSessionStatusPayloadSchema,
    WahaMessagePayloadSchema,
    z.record(z.any())
  ]),
})

export type WahaWebhookPayload = z.infer<typeof WahaWebhookPayloadSchema>

// =====================================================
// Enviar Mensagem
// =====================================================

export const EnviarMensagemWhatsAppSchema = z.object({
  to: z.string(), // numero destino
  text: z.string().optional(),
  media_url: z.string().url().optional(),
  media_type: z.enum(['image', 'video', 'audio', 'document']).optional(),
  caption: z.string().optional(),
})

export type EnviarMensagemWhatsApp = z.infer<typeof EnviarMensagemWhatsAppSchema>

export const EnviarMensagemResponseSchema = z.object({
  message_id: z.string(),
  status: z.string(),
})

export type EnviarMensagemResponse = z.infer<typeof EnviarMensagemResponseSchema>
