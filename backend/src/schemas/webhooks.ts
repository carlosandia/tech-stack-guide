/**
 * AIDEV-NOTE: Schemas Zod para Webhooks de Entrada e Saida
 * Conforme PRD-05 - Webhooks Bidirecionais
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const TipoAuthWebhookEnum = z.enum(['nenhum', 'bearer', 'api_key', 'basic'])
export type TipoAuthWebhook = z.infer<typeof TipoAuthWebhookEnum>

export const EventoWebhookEnum = z.enum([
  'contato.criado',
  'contato.atualizado',
  'oportunidade.criada',
  'oportunidade.etapa_alterada',
  'oportunidade.ganha',
  'oportunidade.perdida',
  'tarefa.criada',
  'tarefa.concluida',
])
export type EventoWebhook = z.infer<typeof EventoWebhookEnum>

// =====================================================
// Schema do Webhook de Entrada
// =====================================================

export const WebhookEntradaSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  nome: z.string().min(1).max(255),
  descricao: z.string().nullable().optional(),
  url_token: z.string(),
  api_key: z.string().nullable().optional(),
  secret_key: z.string().nullable().optional(),
  ativo: z.boolean().default(true),
  total_requests: z.number().default(0),
  ultimo_request: z.string().datetime().nullable().optional(),
  criado_em: z.string().datetime(),
  criado_por: z.string().uuid().nullable().optional(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
})

export type WebhookEntrada = z.infer<typeof WebhookEntradaSchema>

// =====================================================
// Schemas de Request - Webhook Entrada
// =====================================================

export const CriarWebhookEntradaSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio').max(255),
  descricao: z.string().optional(),
  api_key: z.string().optional(),
  secret_key: z.string().optional(),
})

export type CriarWebhookEntradaPayload = z.infer<typeof CriarWebhookEntradaSchema>

export const AtualizarWebhookEntradaSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  descricao: z.string().nullable().optional(),
  api_key: z.string().nullable().optional(),
  secret_key: z.string().nullable().optional(),
  ativo: z.boolean().optional(),
})

export type AtualizarWebhookEntradaPayload = z.infer<typeof AtualizarWebhookEntradaSchema>

// =====================================================
// Schema do Webhook de Saida
// =====================================================

export const WebhookSaidaSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  nome: z.string().min(1).max(255),
  descricao: z.string().nullable().optional(),
  url: z.string().url(),
  eventos: z.array(EventoWebhookEnum),
  auth_tipo: TipoAuthWebhookEnum.default('nenhum'),
  auth_header: z.string().nullable().optional(),
  auth_valor: z.string().nullable().optional(),
  headers_customizados: z.record(z.string()).default({}),
  retry_ativo: z.boolean().default(true),
  max_tentativas: z.number().default(3),
  ativo: z.boolean().default(true),
  criado_em: z.string().datetime(),
  criado_por: z.string().uuid().nullable().optional(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
})

export type WebhookSaida = z.infer<typeof WebhookSaidaSchema>

// =====================================================
// Schemas de Request - Webhook Saida
// =====================================================

export const CriarWebhookSaidaSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio').max(255),
  descricao: z.string().optional(),
  url: z.string().url('URL invalida'),
  eventos: z.array(EventoWebhookEnum).min(1, 'Selecione pelo menos um evento'),
  auth_tipo: TipoAuthWebhookEnum.optional().default('nenhum'),
  auth_header: z.string().optional(),
  auth_valor: z.string().optional(),
  headers_customizados: z.record(z.string()).optional().default({}),
  retry_ativo: z.boolean().optional().default(true),
  max_tentativas: z.number().min(1).max(10).optional().default(3),
})

export type CriarWebhookSaidaPayload = z.infer<typeof CriarWebhookSaidaSchema>

export const AtualizarWebhookSaidaSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  descricao: z.string().nullable().optional(),
  url: z.string().url().optional(),
  eventos: z.array(EventoWebhookEnum).optional(),
  auth_tipo: TipoAuthWebhookEnum.optional(),
  auth_header: z.string().nullable().optional(),
  auth_valor: z.string().nullable().optional(),
  headers_customizados: z.record(z.string()).optional(),
  retry_ativo: z.boolean().optional(),
  max_tentativas: z.number().min(1).max(10).optional(),
  ativo: z.boolean().optional(),
})

export type AtualizarWebhookSaidaPayload = z.infer<typeof AtualizarWebhookSaidaSchema>

// =====================================================
// Schema de Log de Webhook Saida
// =====================================================

export const WebhookSaidaLogSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  webhook_id: z.string().uuid(),
  evento: z.string(),
  payload: z.record(z.any()),
  status_code: z.number().nullable().optional(),
  response_body: z.string().nullable().optional(),
  tentativa: z.number().default(1),
  sucesso: z.boolean().default(false),
  erro_mensagem: z.string().nullable().optional(),
  duracao_ms: z.number().nullable().optional(),
  criado_em: z.string().datetime(),
})

export type WebhookSaidaLog = z.infer<typeof WebhookSaidaLogSchema>

export const ListarLogsQuerySchema = z.object({
  evento: z.string().optional(),
  sucesso: z.enum(['true', 'false']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
})

export type ListarLogsQuery = z.infer<typeof ListarLogsQuerySchema>

// =====================================================
// Response Types
// =====================================================

export const ListaWebhooksEntradaResponseSchema = z.object({
  webhooks: z.array(WebhookEntradaSchema),
  total: z.number(),
})

export type ListaWebhooksEntradaResponse = z.infer<typeof ListaWebhooksEntradaResponseSchema>

export const ListaWebhooksSaidaResponseSchema = z.object({
  webhooks: z.array(WebhookSaidaSchema),
  total: z.number(),
})

export type ListaWebhooksSaidaResponse = z.infer<typeof ListaWebhooksSaidaResponseSchema>

export const ListaLogsResponseSchema = z.object({
  logs: z.array(WebhookSaidaLogSchema),
  total: z.number(),
  page: z.number(),
  total_paginas: z.number(),
})

export type ListaLogsResponse = z.infer<typeof ListaLogsResponseSchema>

// =====================================================
// Webhook Entrada com URL completa
// =====================================================

export const WebhookEntradaComUrlSchema = WebhookEntradaSchema.extend({
  url_completa: z.string().url(),
})

export type WebhookEntradaComUrl = z.infer<typeof WebhookEntradaComUrlSchema>
