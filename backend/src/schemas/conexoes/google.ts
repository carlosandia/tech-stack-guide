/**
 * AIDEV-NOTE: Schemas Zod para Google Calendar
 * Conforme PRD-08 - Secao 5.2. Google Calendar
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const StatusGoogleEnum = z.enum(['active', 'expired', 'revoked', 'error'])
export type StatusGoogle = z.infer<typeof StatusGoogleEnum>

// =====================================================
// Schema da Conexao Google
// =====================================================

export const ConexaoGoogleSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  usuario_id: z.string().uuid(),
  access_token_encrypted: z.string(),
  refresh_token_encrypted: z.string().nullable().optional(),
  token_expires_at: z.string().datetime().nullable().optional(),
  google_user_id: z.string().nullable().optional(),
  google_user_email: z.string().nullable().optional(),
  google_user_name: z.string().nullable().optional(),
  calendar_id: z.string().nullable().optional(),
  calendar_name: z.string().nullable().optional(),
  criar_google_meet: z.boolean().default(true),
  sincronizar_eventos: z.boolean().default(true),
  status: StatusGoogleEnum,
  ultimo_sync: z.string().datetime().nullable().optional(),
  ultimo_erro: z.string().nullable().optional(),
  conectado_em: z.string().datetime().nullable().optional(),
  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
})

export type ConexaoGoogle = z.infer<typeof ConexaoGoogleSchema>

// =====================================================
// Response Schemas
// =====================================================

export const AuthUrlResponseSchema = z.object({
  url: z.string().url(),
  state: z.string(),
})

export type AuthUrlResponse = z.infer<typeof AuthUrlResponseSchema>

export const CallbackPayloadSchema = z.object({
  code: z.string(),
  state: z.string(),
})

export type CallbackPayload = z.infer<typeof CallbackPayloadSchema>

export const StatusGoogleResponseSchema = z.object({
  id: z.string().uuid().optional(),
  conectado: z.boolean(),
  status: StatusGoogleEnum.optional(),
  google_user_email: z.string().nullable().optional(),
  google_user_name: z.string().nullable().optional(),
  calendar_id: z.string().nullable().optional(),
  calendar_name: z.string().nullable().optional(),
  criar_google_meet: z.boolean().optional(),
  conectado_em: z.string().datetime().nullable().optional(),
  ultimo_sync: z.string().datetime().nullable().optional(),
})

export type StatusGoogleResponse = z.infer<typeof StatusGoogleResponseSchema>

// =====================================================
// Calendario Schemas
// =====================================================

export const CalendarioSchema = z.object({
  id: z.string(),
  summary: z.string(),
  description: z.string().optional(),
  primary: z.boolean().optional(),
  accessRole: z.string().optional(),
})

export type Calendario = z.infer<typeof CalendarioSchema>

export const ListarCalendariosResponseSchema = z.object({
  calendarios: z.array(CalendarioSchema),
})

export type ListarCalendariosResponse = z.infer<typeof ListarCalendariosResponseSchema>

export const SelecionarCalendarioSchema = z.object({
  calendar_id: z.string(),
  calendar_name: z.string().optional(),
})

export type SelecionarCalendario = z.infer<typeof SelecionarCalendarioSchema>

// =====================================================
// Evento Schemas
// =====================================================

export const CriarEventoGoogleSchema = z.object({
  meeting_id: z.string().uuid().optional(), // ID da reuniao no CRM
  summary: z.string(),
  description: z.string().optional(),
  start: z.string(), // ISO datetime
  end: z.string(), // ISO datetime
  attendees: z.array(z.object({
    email: z.string().email(),
    displayName: z.string().optional(),
  })).optional(),
  add_google_meet: z.boolean().default(true),
  location: z.string().optional(),
  reminders: z.object({
    useDefault: z.boolean().default(true),
    overrides: z.array(z.object({
      method: z.enum(['email', 'popup']),
      minutes: z.number(),
    })).optional(),
  }).optional(),
})

export type CriarEventoGoogle = z.infer<typeof CriarEventoGoogleSchema>

export const EventoGoogleResponseSchema = z.object({
  event_id: z.string(),
  html_link: z.string().url(),
  google_meet_link: z.string().url().nullable().optional(),
  status: z.string(),
})

export type EventoGoogleResponse = z.infer<typeof EventoGoogleResponseSchema>

export const AtualizarEventoGoogleSchema = CriarEventoGoogleSchema.partial()

export type AtualizarEventoGoogle = z.infer<typeof AtualizarEventoGoogleSchema>

// =====================================================
// Config Update Schema
// =====================================================

export const AtualizarConfigGoogleSchema = z.object({
  criar_google_meet: z.boolean().optional(),
  sincronizar_eventos: z.boolean().optional(),
})

export type AtualizarConfigGoogle = z.infer<typeof AtualizarConfigGoogleSchema>
