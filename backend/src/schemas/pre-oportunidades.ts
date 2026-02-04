/**
 * AIDEV-NOTE: Schemas Zod para Pre-Oportunidades
 * Conforme PRD-07 - Modulo de Negocios (RF-11)
 *
 * Pre-oportunidades sao leads vindos do WhatsApp que precisam
 * de triagem antes de virar uma oportunidade real.
 * Aparecem na coluna "Solicitacoes" do Kanban.
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const StatusPreOportunidadeEnum = z.enum(['pendente', 'aceito', 'rejeitado'])
export type StatusPreOportunidade = z.infer<typeof StatusPreOportunidadeEnum>

// =====================================================
// Schema da Pre-Oportunidade
// =====================================================

export const PreOportunidadeSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  integracao_id: z.string().uuid().nullable().optional(),

  // Dados do WhatsApp
  phone_number: z.string().max(20),
  phone_name: z.string().max(255).nullable().optional(),
  profile_picture_url: z.string().url().nullable().optional(),

  // Pipeline destino
  funil_destino_id: z.string().uuid(),

  // Status
  status: StatusPreOportunidadeEnum.default('pendente'),

  // Vinculo se aceito
  oportunidade_id: z.string().uuid().nullable().optional(),

  // Processamento
  processado_por: z.string().uuid().nullable().optional(),
  processado_em: z.string().datetime().nullable().optional(),
  motivo_rejeicao: z.string().nullable().optional(),

  // Mensagens
  primeira_mensagem: z.string().nullable().optional(),
  primeira_mensagem_em: z.string().datetime().nullable().optional(),
  ultima_mensagem: z.string().nullable().optional(),
  ultima_mensagem_em: z.string().datetime().nullable().optional(),
  total_mensagens: z.number().int().default(0),

  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
})

export type PreOportunidade = z.infer<typeof PreOportunidadeSchema>

// =====================================================
// Schemas de Request - Aceitar Pre-Oportunidade
// =====================================================

export const AceitarPreOportunidadeSchema = z.object({
  // Dados da oportunidade a criar
  titulo: z.string().min(1).max(500).optional(), // Se nao informado, usa phone_name ou numero
  etapa_id: z.string().uuid().optional(), // Se nao informado, usa etapa 'entrada'
  usuario_responsavel_id: z.string().uuid().optional(),
  valor: z.number().nonnegative().optional(),
  observacoes: z.string().optional(),

  // Dados do contato (se contato nao existe)
  contato: z
    .object({
      nome: z.string().min(1).max(255),
      email: z.string().email().optional(),
    })
    .optional(),

  // Se ja existe contato com este telefone
  contato_existente_id: z.string().uuid().optional(),
})

export type AceitarPreOportunidadePayload = z.infer<typeof AceitarPreOportunidadeSchema>

// =====================================================
// Schemas de Request - Rejeitar Pre-Oportunidade
// =====================================================

export const RejeitarPreOportunidadeSchema = z.object({
  motivo: z.string().min(1, 'Informe o motivo da rejeicao').max(500),
})

export type RejeitarPreOportunidadePayload = z.infer<typeof RejeitarPreOportunidadeSchema>

// =====================================================
// Schemas de Query - Listagem
// =====================================================

export const ListarPreOportunidadesQuerySchema = z.object({
  funil_destino_id: z.string().uuid().optional(),
  status: StatusPreOportunidadeEnum.optional(),
  busca: z.string().max(255).optional(), // busca por telefone ou nome

  // Ordenacao
  ordenar_por: z.enum(['criado_em', 'ultima_mensagem_em', 'total_mensagens']).default('criado_em'),
  ordem: z.enum(['asc', 'desc']).default('desc'),

  // Paginacao
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
})

export type ListarPreOportunidadesQuery = z.infer<typeof ListarPreOportunidadesQuerySchema>

// =====================================================
// Response Types
// =====================================================

export const ListaPreOportunidadesResponseSchema = z.object({
  pre_oportunidades: z.array(PreOportunidadeSchema),
  total: z.number(),
  total_pendentes: z.number(),
  page: z.number(),
  per_page: z.number(),
  total_pages: z.number(),
})

export type ListaPreOportunidadesResponse = z.infer<typeof ListaPreOportunidadesResponseSchema>

// =====================================================
// Pre-Oportunidade para Card (coluna Solicitacoes)
// =====================================================

export const PreOportunidadeCardSchema = z.object({
  id: z.string().uuid(),
  phone_number: z.string(),
  phone_name: z.string().nullable(),
  profile_picture_url: z.string().nullable(),
  primeira_mensagem: z.string().nullable(),
  ultima_mensagem: z.string().nullable(),
  total_mensagens: z.number(),
  criado_em: z.string().datetime(),
  ultima_mensagem_em: z.string().datetime().nullable(),
  tempo_espera_minutos: z.number(), // Tempo desde a primeira mensagem
})

export type PreOportunidadeCard = z.infer<typeof PreOportunidadeCardSchema>

// =====================================================
// Schema para Webhook WhatsApp (criar pre-oportunidade)
// =====================================================

export const CriarPreOportunidadeWebhookSchema = z.object({
  integracao_id: z.string().uuid(),
  funil_destino_id: z.string().uuid(),
  phone_number: z.string().max(20),
  phone_name: z.string().max(255).optional(),
  profile_picture_url: z.string().url().optional(),
  mensagem: z.string(),
  mensagem_timestamp: z.string().datetime(),
})

export type CriarPreOportunidadeWebhookPayload = z.infer<typeof CriarPreOportunidadeWebhookSchema>
