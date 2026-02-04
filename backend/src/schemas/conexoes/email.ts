/**
 * AIDEV-NOTE: Schemas Zod para Email (Gmail OAuth + SMTP Manual)
 * Conforme PRD-08 - Secao 6. Email Pessoal
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const TipoConexaoEmailEnum = z.enum(['gmail_oauth', 'smtp_manual'])
export type TipoConexaoEmail = z.infer<typeof TipoConexaoEmailEnum>

export const StatusEmailEnum = z.enum(['active', 'expired', 'error', 'testing'])
export type StatusEmail = z.infer<typeof StatusEmailEnum>

// =====================================================
// Schema da Conexao Email
// =====================================================

export const ConexaoEmailSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  usuario_id: z.string().uuid(),
  tipo: TipoConexaoEmailEnum,
  email: z.string().email(),
  nome_remetente: z.string().nullable().optional(),
  // Gmail OAuth
  google_user_id: z.string().nullable().optional(),
  access_token_encrypted: z.string().nullable().optional(),
  refresh_token_encrypted: z.string().nullable().optional(),
  token_expires_at: z.string().datetime().nullable().optional(),
  // SMTP Manual
  smtp_host: z.string().nullable().optional(),
  smtp_port: z.number().nullable().optional(),
  smtp_user: z.string().nullable().optional(),
  smtp_pass_encrypted: z.string().nullable().optional(),
  smtp_tls: z.boolean().nullable().optional(),
  smtp_auto_detected: z.boolean().nullable().optional(),
  // Status
  status: StatusEmailEnum,
  ultimo_envio: z.string().datetime().nullable().optional(),
  total_emails_enviados: z.number().default(0),
  ultimo_erro: z.string().nullable().optional(),
  conectado_em: z.string().datetime().nullable().optional(),
  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
})

export type ConexaoEmail = z.infer<typeof ConexaoEmailSchema>

// =====================================================
// Response Schemas
// =====================================================

export const StatusEmailResponseSchema = z.object({
  id: z.string().uuid().optional(),
  conectado: z.boolean(),
  tipo: TipoConexaoEmailEnum.optional(),
  email: z.string().nullable().optional(),
  nome_remetente: z.string().nullable().optional(),
  status: StatusEmailEnum.optional(),
  smtp_host: z.string().nullable().optional(),
  smtp_auto_detected: z.boolean().nullable().optional(),
  conectado_em: z.string().datetime().nullable().optional(),
  ultimo_envio: z.string().datetime().nullable().optional(),
  total_emails_enviados: z.number().optional(),
})

export type StatusEmailResponse = z.infer<typeof StatusEmailResponseSchema>

// =====================================================
// SMTP Schemas
// =====================================================

export const ConfigurarSmtpSchema = z.object({
  email: z.string().email(),
  senha: z.string(),
  nome_remetente: z.string().optional(),
  // Opcionais (para override manual)
  smtp_host: z.string().optional(),
  smtp_port: z.number().optional(),
  smtp_tls: z.boolean().optional(),
})

export type ConfigurarSmtp = z.infer<typeof ConfigurarSmtpSchema>

export const SmtpConfigResponseSchema = z.object({
  id: z.string().uuid(),
  tipo: z.literal('smtp_manual'),
  email: z.string(),
  smtp_host: z.string(),
  smtp_port: z.number(),
  smtp_auto_detected: z.boolean(),
  status: StatusEmailEnum,
  message: z.string(),
})

export type SmtpConfigResponse = z.infer<typeof SmtpConfigResponseSchema>

export const DetectarSmtpSchema = z.object({
  email: z.string().email(),
})

export type DetectarSmtp = z.infer<typeof DetectarSmtpSchema>

export const DetectarSmtpResponseSchema = z.object({
  detected: z.boolean(),
  provider: z.string().nullable().optional(),
  smtp_host: z.string().nullable().optional(),
  smtp_port: z.number().nullable().optional(),
  smtp_tls: z.boolean().nullable().optional(),
  requires_app_password: z.boolean().nullable().optional(),
  help_url: z.string().url().nullable().optional(),
})

export type DetectarSmtpResponse = z.infer<typeof DetectarSmtpResponseSchema>

export const TestarSmtpSchema = z.object({
  email: z.string().email(),
  senha: z.string(),
  smtp_host: z.string().optional(),
  smtp_port: z.number().optional(),
  smtp_tls: z.boolean().optional(),
})

export type TestarSmtp = z.infer<typeof TestarSmtpSchema>

export const TestarSmtpResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  error: z.string().nullable().optional(),
})

export type TestarSmtpResponse = z.infer<typeof TestarSmtpResponseSchema>

// =====================================================
// Enviar Email Schema
// =====================================================

export const EnviarEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  body: z.string(), // HTML ou texto
  body_type: z.enum(['html', 'text']).default('html'),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  reply_to: z.string().email().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(), // base64
    content_type: z.string().optional(),
  })).optional(),
  // Rastreamento
  track_opens: z.boolean().default(false),
  // Relacionamento com CRM
  oportunidade_id: z.string().uuid().optional(),
  contato_id: z.string().uuid().optional(),
})

export type EnviarEmail = z.infer<typeof EnviarEmailSchema>

export const EnviarEmailResponseSchema = z.object({
  success: z.boolean(),
  message_id: z.string().optional(),
  error: z.string().optional(),
})

export type EnviarEmailResponse = z.infer<typeof EnviarEmailResponseSchema>

// =====================================================
// Provedores SMTP conhecidos
// =====================================================

export interface SmtpProvider {
  name: string
  domains: string[]
  host: string
  port: number
  tls: boolean
  requires_app_password: boolean
  help_url?: string
}

export const SMTP_PROVIDERS: SmtpProvider[] = [
  {
    name: 'Gmail',
    domains: ['gmail.com', 'googlemail.com'],
    host: 'smtp.gmail.com',
    port: 587,
    tls: true,
    requires_app_password: true,
    help_url: 'https://support.google.com/accounts/answer/185833'
  },
  {
    name: 'Outlook',
    domains: ['outlook.com', 'hotmail.com', 'live.com'],
    host: 'smtp.office365.com',
    port: 587,
    tls: true,
    requires_app_password: false
  },
  {
    name: 'Yahoo',
    domains: ['yahoo.com', 'yahoo.com.br'],
    host: 'smtp.mail.yahoo.com',
    port: 587,
    tls: true,
    requires_app_password: true,
    help_url: 'https://help.yahoo.com/kb/generate-third-party-passwords-sln15241.html'
  },
  {
    name: 'iCloud',
    domains: ['icloud.com', 'me.com', 'mac.com'],
    host: 'smtp.mail.me.com',
    port: 587,
    tls: true,
    requires_app_password: true,
    help_url: 'https://support.apple.com/en-us/HT204397'
  },
  {
    name: 'Zoho',
    domains: ['zoho.com'],
    host: 'smtp.zoho.com',
    port: 587,
    tls: true,
    requires_app_password: false
  },
  {
    name: 'UOL',
    domains: ['uol.com.br'],
    host: 'smtps.uol.com.br',
    port: 587,
    tls: true,
    requires_app_password: false
  },
  {
    name: 'Terra',
    domains: ['terra.com.br'],
    host: 'smtp.terra.com.br',
    port: 587,
    tls: true,
    requires_app_password: false
  },
  {
    name: 'BOL',
    domains: ['bol.com.br'],
    host: 'smtps.bol.com.br',
    port: 587,
    tls: true,
    requires_app_password: false
  }
]
