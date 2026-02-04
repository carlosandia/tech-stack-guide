/**
 * AIDEV-NOTE: Schemas Zod para notas de contato (PRD-09)
 * Notas privadas vinculadas a contatos
 */

import { z } from 'zod'

// =====================================================
// Schema Principal
// =====================================================

export const NotaContatoSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  contato_id: z.string().uuid(),
  usuario_id: z.string().uuid(),

  conteudo: z.string(),
  conversa_id: z.string().uuid().nullable().optional(),

  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
})

export type NotaContato = z.infer<typeof NotaContatoSchema>

// =====================================================
// Schema com Autor (para listagem)
// =====================================================

export const NotaContatoComAutorSchema = NotaContatoSchema.extend({
  autor: z.object({
    id: z.string().uuid(),
    nome: z.string(),
    email: z.string().optional(),
  }).optional(),
})

export type NotaContatoComAutor = z.infer<typeof NotaContatoComAutorSchema>

// =====================================================
// Query Schemas
// =====================================================

export const ListarNotasContatoQuerySchema = z.object({
  // Paginacao
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

export type ListarNotasContatoQuery = z.infer<typeof ListarNotasContatoQuerySchema>

// =====================================================
// Response Schemas
// =====================================================

export const ListarNotasContatoResponseSchema = z.object({
  notas: z.array(NotaContatoComAutorSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export type ListarNotasContatoResponse = z.infer<typeof ListarNotasContatoResponseSchema>

// =====================================================
// Body Schemas (Request)
// =====================================================

export const CriarNotaContatoSchema = z.object({
  conteudo: z.string().min(1),
  conversa_id: z.string().uuid().optional(),
})

export type CriarNotaContato = z.infer<typeof CriarNotaContatoSchema>

export const AtualizarNotaContatoSchema = z.object({
  conteudo: z.string().min(1),
})

export type AtualizarNotaContato = z.infer<typeof AtualizarNotaContatoSchema>
