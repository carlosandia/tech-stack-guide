/**
 * AIDEV-NOTE: Schemas Zod para Integracoes OAuth
 * Conforme PRD-05 - Conexoes com Plataformas Externas
 *
 * Plataformas suportadas:
 * whatsapp, instagram, meta_ads, google, email
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const PlataformaEnum = z.enum(['whatsapp', 'instagram', 'meta_ads', 'google', 'email', 'api4com'])
export type Plataforma = z.infer<typeof PlataformaEnum>

// Alias para PlataformaIntegracao para compatibilidade
export const PlataformaIntegracaoEnum = PlataformaEnum
export type PlataformaIntegracao = Plataforma

export const StatusIntegracaoEnum = z.enum(['conectado', 'desconectado', 'erro', 'expirando'])
export type StatusIntegracao = z.infer<typeof StatusIntegracaoEnum>

// =====================================================
// Schema da Integracao
// =====================================================

export const IntegracaoSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  plataforma: PlataformaEnum,
  status: StatusIntegracaoEnum.default('desconectado'),
  access_token: z.string().nullable().optional(),
  refresh_token: z.string().nullable().optional(),
  token_expira_em: z.string().datetime().nullable().optional(),
  conta_externa_id: z.string().nullable().optional(),
  conta_externa_nome: z.string().nullable().optional(),
  conta_externa_email: z.string().nullable().optional(),
  metadata: z.record(z.any()).default({}),
  waha_session_id: z.string().nullable().optional(),
  waha_phone: z.string().nullable().optional(),
  ultimo_sync: z.string().datetime().nullable().optional(),
  ultimo_erro: z.string().nullable().optional(),
  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
})

export type Integracao = z.infer<typeof IntegracaoSchema>

// =====================================================
// Schemas de Request
// =====================================================

export const ConectarIntegracaoSchema = z.object({
  plataforma: PlataformaEnum,
  code: z.string().optional(), // OAuth code
  redirect_uri: z.string().optional(),
  // Para WAHA
  waha_session_id: z.string().optional(),
  waha_phone: z.string().optional(),
  // Para Email SMTP
  smtp_host: z.string().optional(),
  smtp_port: z.number().optional(),
  smtp_user: z.string().optional(),
  smtp_pass: z.string().optional(),
  smtp_secure: z.boolean().optional(),
})

export type ConectarIntegracaoPayload = z.infer<typeof ConectarIntegracaoSchema>

export const ListarIntegracoesQuerySchema = z.object({
  plataforma: PlataformaEnum.optional(),
  status: StatusIntegracaoEnum.optional(),
})

export type ListarIntegracoesQuery = z.infer<typeof ListarIntegracoesQuerySchema>

// =====================================================
// Response Types
// =====================================================

export const ListaIntegracoesResponseSchema = z.object({
  integracoes: z.array(IntegracaoSchema),
  total: z.number().optional(),
})

export type ListaIntegracoesResponse = z.infer<typeof ListaIntegracoesResponseSchema>

export const AuthUrlResponseSchema = z.object({
  url: z.string().url(),
  state: z.string().optional(),
})

export type AuthUrlResponse = z.infer<typeof AuthUrlResponseSchema>

// =====================================================
// Integracao Simplificada para Listagem
// =====================================================

export const IntegracaoResumoSchema = z.object({
  id: z.string().uuid(),
  plataforma: PlataformaEnum,
  status: StatusIntegracaoEnum,
  conta_externa_nome: z.string().nullable().optional(),
  conta_externa_email: z.string().nullable().optional(),
  waha_phone: z.string().nullable().optional(),
  ultimo_sync: z.string().datetime().nullable().optional(),
  ultimo_erro: z.string().nullable().optional(),
})

export type IntegracaoResumo = z.infer<typeof IntegracaoResumoSchema>
