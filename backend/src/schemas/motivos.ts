/**
 * AIDEV-NOTE: Schemas Zod para Motivos de Resultado
 * Conforme PRD-05 - Motivos de Ganho/Perda
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const TipoMotivoEnum = z.enum(['ganho', 'perda'])
export type TipoMotivo = z.infer<typeof TipoMotivoEnum>

// =====================================================
// Schema do Motivo
// =====================================================

export const MotivoResultadoSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  nome: z.string().min(1).max(255),
  descricao: z.string().nullable().optional(),
  tipo: TipoMotivoEnum,
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6B7280'),
  padrao: z.boolean().default(false),
  ordem: z.number().default(0),
  ativo: z.boolean().default(true),
  criado_em: z.string().datetime(),
  criado_por: z.string().uuid().nullable().optional(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
})

export type MotivoResultado = z.infer<typeof MotivoResultadoSchema>

// =====================================================
// Schemas de Request
// =====================================================

export const CriarMotivoSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio').max(255),
  descricao: z.string().optional(),
  tipo: TipoMotivoEnum,
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser hexadecimal').optional(),
  ordem: z.number().optional(),
})

export type CriarMotivoPayload = z.infer<typeof CriarMotivoSchema>

export const AtualizarMotivoSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  descricao: z.string().nullable().optional(),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  ordem: z.number().optional(),
  ativo: z.boolean().optional(),
})

export type AtualizarMotivoPayload = z.infer<typeof AtualizarMotivoSchema>

export const ListarMotivosQuerySchema = z.object({
  tipo: TipoMotivoEnum.optional(),
  ativo: z.enum(['true', 'false']).optional(),
})

export type ListarMotivosQuery = z.infer<typeof ListarMotivosQuerySchema>

export const ReordenarMotivosSchema = z.object({
  tipo: TipoMotivoEnum,
  ordem: z.array(z.object({
    id: z.string().uuid(),
    ordem: z.number(),
  })),
})

export type ReordenarMotivosPayload = z.infer<typeof ReordenarMotivosSchema>

// =====================================================
// Response Types
// =====================================================

export const ListaMotivosResponseSchema = z.object({
  motivos: z.array(MotivoResultadoSchema),
  total: z.number(),
})

export type ListaMotivosResponse = z.infer<typeof ListaMotivosResponseSchema>
