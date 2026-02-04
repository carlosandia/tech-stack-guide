/**
 * AIDEV-NOTE: Schemas Zod para mensagens prontas (PRD-09)
 * Quick replies / templates de resposta rapida
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const TipoMensagemProntaEnum = z.enum(['pessoal', 'global'])
export type TipoMensagemPronta = z.infer<typeof TipoMensagemProntaEnum>

// =====================================================
// Schema Principal
// =====================================================

export const MensagemProntaSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  usuario_id: z.string().uuid().nullable().optional(),

  atalho: z.string().regex(/^[a-z0-9_]+$/, 'Atalho deve conter apenas letras minusculas, numeros e underscore'),
  titulo: z.string().min(1).max(100),
  conteudo: z.string().min(1),

  tipo: TipoMensagemProntaEnum,
  ativo: z.boolean().default(true),
  vezes_usado: z.number().default(0),

  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
})

export type MensagemPronta = z.infer<typeof MensagemProntaSchema>

// =====================================================
// Query Schemas
// =====================================================

export const ListarMensagensProntasQuerySchema = z.object({
  // Filtros
  tipo: TipoMensagemProntaEnum.optional(),
  ativo: z.coerce.boolean().optional(),
  busca: z.string().optional(),

  // Paginacao
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
})

export type ListarMensagensProntasQuery = z.infer<typeof ListarMensagensProntasQuerySchema>

// =====================================================
// Response Schemas
// =====================================================

export const ListarMensagensProntasResponseSchema = z.object({
  mensagens_prontas: z.array(MensagemProntaSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export type ListarMensagensProntasResponse = z.infer<typeof ListarMensagensProntasResponseSchema>

// =====================================================
// Body Schemas (Request)
// =====================================================

export const CriarMensagemProntaSchema = z.object({
  atalho: z.string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9_]+$/, 'Atalho deve conter apenas letras minusculas, numeros e underscore'),
  titulo: z.string().min(1).max(100),
  conteudo: z.string().min(1),
  tipo: TipoMensagemProntaEnum.default('pessoal'),
})

export type CriarMensagemPronta = z.infer<typeof CriarMensagemProntaSchema>

export const AtualizarMensagemProntaSchema = z.object({
  atalho: z.string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9_]+$/, 'Atalho deve conter apenas letras minusculas, numeros e underscore')
    .optional(),
  titulo: z.string().min(1).max(100).optional(),
  conteudo: z.string().min(1).optional(),
  ativo: z.boolean().optional(),
})

export type AtualizarMensagemPronta = z.infer<typeof AtualizarMensagemProntaSchema>
