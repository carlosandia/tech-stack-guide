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
  api_key: z.string().optional().or(z.literal('')),
  secret_key: z.string().optional().or(z.literal('')),
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

export const webhookSaidaFormSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255, 'Máximo 255 caracteres'),
  descricao: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  url: z.string().url('URL inválida').min(1, 'URL é obrigatória'),
  eventos: z.array(z.string()).min(1, 'Selecione pelo menos um evento'),
  auth_tipo: z.enum(['nenhum', 'bearer', 'api_key', 'basic']).default('nenhum'),
  auth_header: z.string().optional().or(z.literal('')),
  auth_valor: z.string().optional().or(z.literal('')),
  retry_ativo: z.boolean().default(true),
  max_tentativas: z.number().min(1).max(10).default(3),
})

export type WebhookSaidaFormData = z.infer<typeof webhookSaidaFormSchema>
