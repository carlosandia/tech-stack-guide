/**
 * AIDEV-NOTE: Schemas Zod para validação de formulários de Webhooks
 * Conforme PRD-05 - Webhooks de Entrada e Saída
 */

import { z } from 'zod'

// =====================================================
// Webhook de Entrada
// =====================================================

export const webhookEntradaFormSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255, 'Máximo 255 caracteres'),
  descricao: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  // AIDEV-NOTE: Seg — max(256) para prevenir payload excessivo em chaves
  api_key: z.string().max(256, 'Máximo 256 caracteres').optional().or(z.literal('')),
  secret_key: z.string().max(256, 'Máximo 256 caracteres').optional().or(z.literal('')),
})

export type WebhookEntradaFormData = z.infer<typeof webhookEntradaFormSchema>

// =====================================================
// Webhook de Saída
// =====================================================

export const eventoWebhookOptions = [
  { value: 'contato.criado', label: 'Contato criado' },
  { value: 'contato.atualizado', label: 'Contato atualizado' },
  { value: 'oportunidade.criada', label: 'Oportunidade criada' },
  { value: 'oportunidade.etapa_alterada', label: 'Oportunidade mudou de etapa' },
  { value: 'oportunidade.ganha', label: 'Oportunidade ganha' },
  { value: 'oportunidade.perdida', label: 'Oportunidade perdida' },
  { value: 'tarefa.criada', label: 'Tarefa criada' },
  { value: 'tarefa.concluida', label: 'Tarefa concluída' },
] as const

export const tipoAuthOptions = [
  { value: 'nenhum', label: 'Nenhum' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'api_key', label: 'API Key' },
  { value: 'basic', label: 'Basic Auth' },
] as const

// AIDEV-NOTE: Seg — SSRF prevention no schema: bloquear URLs privadas/localhost
const PRIVATE_HOST_PATTERN =
  /^(localhost|0\.0\.0\.0|\[::1\]|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/

export const webhookSaidaFormSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255, 'Máximo 255 caracteres'),
  descricao: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  url: z
    .string()
    .url('URL inválida')
    .min(1, 'URL é obrigatória')
    .refine((u) => {
      try {
        const parsed = new URL(u)
        if (!['http:', 'https:'].includes(parsed.protocol)) return false
        return !PRIVATE_HOST_PATTERN.test(parsed.hostname.toLowerCase())
      } catch {
        return false
      }
    }, 'URL deve ser pública (HTTP/HTTPS, sem IPs privados)'),
  eventos: z.array(z.string()).min(1, 'Selecione pelo menos um evento'),
  auth_tipo: z.enum(['nenhum', 'bearer', 'api_key', 'basic']).default('nenhum'),
  // AIDEV-NOTE: Seg — validar nome de header para prevenir header injection
  auth_header: z
    .string()
    .regex(/^[a-zA-Z0-9\-_]*$/, 'Nome de header inválido')
    .max(128, 'Máximo 128 caracteres')
    .optional()
    .or(z.literal('')),
  auth_valor: z.string().max(1024, 'Máximo 1024 caracteres').optional().or(z.literal('')),
  retry_ativo: z.boolean().default(true),
  max_tentativas: z.number().min(1).max(10).default(3),
})

export type WebhookSaidaFormData = z.infer<typeof webhookSaidaFormSchema>
