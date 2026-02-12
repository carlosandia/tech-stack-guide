/**
 * AIDEV-NOTE: Schemas Zod para Segmentos de Contatos
 * Conforme PRD-06 - Sistema de Segmentacao
 *
 * Segmentos sao tags coloridas para categorizar contatos (pessoas).
 * Relacao N:N via tabela contatos_segmentos.
 */

import { z } from 'zod'

// =====================================================
// Schema do Segmento
// =====================================================

export const SegmentoSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  nome: z.string().min(1).max(100),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser hexadecimal (#RRGGBB)'),
  descricao: z.string().nullable().optional(),
  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
})

export type Segmento = z.infer<typeof SegmentoSchema>

// =====================================================
// Schemas de Request - Criar Segmento
// =====================================================

export const CriarSegmentoSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio').max(100),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser hexadecimal (#RRGGBB)'),
  descricao: z.string().optional(),
})

export type CriarSegmentoPayload = {
  nome: string
  cor: string
  descricao?: string
}

// =====================================================
// Schemas de Request - Atualizar Segmento
// =====================================================

export const AtualizarSegmentoSchema = z.object({
  nome: z.string().min(1).max(100).optional(),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  descricao: z.string().nullable().optional(),
})

export type AtualizarSegmentoPayload = z.infer<typeof AtualizarSegmentoSchema>

// =====================================================
// Schema do Vinculo Contato-Segmento
// =====================================================

export const ContatoSegmentoSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(), // AIDEV-NOTE: Obrigatorio para isolamento de tenant
  contato_id: z.string().uuid(),
  segmento_id: z.string().uuid(),
  criado_em: z.string().datetime(),
})

export type ContatoSegmento = z.infer<typeof ContatoSegmentoSchema>

// =====================================================
// Schemas de Request - Vincular Segmentos
// =====================================================

export const VincularSegmentosSchema = z.object({
  segmento_ids: z.array(z.string().uuid()).min(1, 'Selecione pelo menos um segmento'),
})

export type VincularSegmentosPayload = z.infer<typeof VincularSegmentosSchema>

// =====================================================
// Response Types
// =====================================================

export const ListaSegmentosResponseSchema = z.object({
  segmentos: z.array(SegmentoSchema),
  total: z.number(),
})

export type ListaSegmentosResponse = z.infer<typeof ListaSegmentosResponseSchema>

export const SegmentoComContagemSchema = SegmentoSchema.extend({
  total_contatos: z.number(),
})

export type SegmentoComContagem = z.infer<typeof SegmentoComContagemSchema>

// =====================================================
// Cores Predefinidas para UI
// =====================================================

export const CORES_SEGMENTOS = [
  '#22C55E', // Verde
  '#3B82F6', // Azul
  '#EAB308', // Amarelo
  '#A855F7', // Roxo
  '#EF4444', // Vermelho
  '#F97316', // Laranja
  '#06B6D4', // Ciano
  '#EC4899', // Rosa
  '#6B7280', // Cinza
  '#84CC16', // Lima
] as const

export type CorSegmento = (typeof CORES_SEGMENTOS)[number]
