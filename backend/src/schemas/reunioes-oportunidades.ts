/**
 * AIDEV-NOTE: Schemas Zod para Reunioes de Oportunidades
 * Conforme PRD-07 - Modal de Detalhes
 *
 * Reunioes sao agendamentos vinculados a oportunidades.
 * Podem ser marcadas como realizadas ou no-show.
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const StatusReuniaoEnum = z.enum(['agendada', 'realizada', 'cancelada', 'noshow'])
export type StatusReuniao = z.infer<typeof StatusReuniaoEnum>

export const TipoReuniaoEnum = z.enum(['presencial', 'video', 'telefone'])
export type TipoReuniao = z.infer<typeof TipoReuniaoEnum>

// =====================================================
// Schema da Reuniao
// =====================================================

export const ReuniaoOportunidadeSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  oportunidade_id: z.string().uuid(),
  usuario_id: z.string().uuid(),
  titulo: z.string().max(255),
  descricao: z.string().nullable().optional(),
  tipo: TipoReuniaoEnum,
  local: z.string().max(500).nullable().optional(), // Endereco ou link de video
  data_inicio: z.string().datetime(),
  data_fim: z.string().datetime(),
  status: StatusReuniaoEnum.default('agendada'),

  // No-show
  motivo_noshow_id: z.string().uuid().nullable().optional(),
  observacoes_noshow: z.string().nullable().optional(),

  // Realizacao
  realizada_em: z.string().datetime().nullable().optional(),
  observacoes_realizacao: z.string().nullable().optional(),

  // Cancelamento
  cancelada_em: z.string().datetime().nullable().optional(),
  motivo_cancelamento: z.string().nullable().optional(),

  // Google Calendar
  google_event_id: z.string().nullable().optional(),
  google_calendar_link: z.string().url().nullable().optional(),

  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
})

export type ReuniaoOportunidade = z.infer<typeof ReuniaoOportunidadeSchema>

// =====================================================
// Schemas de Request - Criar Reuniao
// =====================================================

export const CriarReuniaoSchema = z.object({
  titulo: z.string().min(1, 'Titulo e obrigatorio').max(255),
  descricao: z.string().optional(),
  tipo: TipoReuniaoEnum,
  local: z.string().max(500).optional(),
  data_inicio: z.string().datetime(),
  data_fim: z.string().datetime(),
  sincronizar_google: z.boolean().default(false),
})

export type CriarReuniaoPayload = z.infer<typeof CriarReuniaoSchema>

// =====================================================
// Schemas de Request - Atualizar Reuniao
// =====================================================

export const AtualizarReuniaoSchema = z.object({
  titulo: z.string().min(1).max(255).optional(),
  descricao: z.string().nullable().optional(),
  tipo: TipoReuniaoEnum.optional(),
  local: z.string().max(500).nullable().optional(),
  data_inicio: z.string().datetime().optional(),
  data_fim: z.string().datetime().optional(),
})

export type AtualizarReuniaoPayload = z.infer<typeof AtualizarReuniaoSchema>

// =====================================================
// Schemas de Request - Marcar Realizada
// =====================================================

export const MarcarRealizadaSchema = z.object({
  observacoes: z.string().optional(),
})

export type MarcarRealizadaPayload = z.infer<typeof MarcarRealizadaSchema>

// =====================================================
// Schemas de Request - Marcar No-Show
// =====================================================

export const MarcarNoShowSchema = z.object({
  motivo_id: z.string().uuid(),
  observacoes: z.string().optional(),
})

export type MarcarNoShowPayload = z.infer<typeof MarcarNoShowSchema>

// =====================================================
// Schemas de Request - Cancelar Reuniao
// =====================================================

export const CancelarReuniaoSchema = z.object({
  motivo: z.string().min(1, 'Informe o motivo do cancelamento').max(500),
})

export type CancelarReuniaoPayload = z.infer<typeof CancelarReuniaoSchema>

// =====================================================
// Response Types
// =====================================================

export const ReuniaoComDetalhesSchema = ReuniaoOportunidadeSchema.extend({
  usuario: z.object({
    id: z.string().uuid(),
    nome: z.string(),
    avatar_url: z.string().nullable(),
  }),
  motivo_noshow: z
    .object({
      id: z.string().uuid(),
      nome: z.string(),
    })
    .nullable(),
})

export type ReuniaoComDetalhes = z.infer<typeof ReuniaoComDetalhesSchema>

export const ListaReunioesResponseSchema = z.object({
  reunioes: z.array(ReuniaoComDetalhesSchema),
  total: z.number(),
  proxima_reuniao: ReuniaoComDetalhesSchema.nullable(),
})

export type ListaReunioesResponse = z.infer<typeof ListaReunioesResponseSchema>

// =====================================================
// Motivos de No-Show
// =====================================================

export const MotivoNoShowSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  nome: z.string().max(100),
  ativo: z.boolean().default(true),
  criado_em: z.string().datetime(),
})

export type MotivoNoShow = z.infer<typeof MotivoNoShowSchema>

export const CriarMotivoNoShowSchema = z.object({
  nome: z.string().min(1).max(100),
})

export type CriarMotivoNoShowPayload = z.infer<typeof CriarMotivoNoShowSchema>

export const ListaMotivosNoShowResponseSchema = z.object({
  motivos: z.array(MotivoNoShowSchema),
  total: z.number(),
})

export type ListaMotivosNoShowResponse = z.infer<typeof ListaMotivosNoShowResponseSchema>
