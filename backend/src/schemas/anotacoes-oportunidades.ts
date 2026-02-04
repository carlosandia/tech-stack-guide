/**
 * AIDEV-NOTE: Schemas Zod para Anotacoes de Oportunidades
 * Conforme PRD-07 - Modal de Detalhes
 *
 * Anotacoes podem ser texto ou audio (transcricao).
 * Vinculadas a oportunidades para registro de interacoes.
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const TipoAnotacaoEnum = z.enum(['texto', 'audio'])
export type TipoAnotacao = z.infer<typeof TipoAnotacaoEnum>

// =====================================================
// Schema da Anotacao
// =====================================================

export const AnotacaoOportunidadeSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  oportunidade_id: z.string().uuid(),
  usuario_id: z.string().uuid(),
  tipo: TipoAnotacaoEnum,
  conteudo: z.string(),
  audio_url: z.string().url().nullable().optional(),
  duracao_segundos: z.number().int().nonnegative().nullable().optional(),
  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
})

export type AnotacaoOportunidade = z.infer<typeof AnotacaoOportunidadeSchema>

// =====================================================
// Schemas de Request - Criar Anotacao Texto
// =====================================================

export const CriarAnotacaoTextoSchema = z.object({
  conteudo: z.string().min(1, 'Conteudo e obrigatorio').max(10000),
})

export type CriarAnotacaoTextoPayload = z.infer<typeof CriarAnotacaoTextoSchema>

// =====================================================
// Schemas de Request - Criar Anotacao Audio
// =====================================================

export const CriarAnotacaoAudioSchema = z.object({
  audio_url: z.string().url(),
  duracao_segundos: z.number().int().positive(),
  transcricao: z.string().optional(), // Pode vir da API de transcricao
})

export type CriarAnotacaoAudioPayload = z.infer<typeof CriarAnotacaoAudioSchema>

// =====================================================
// Schemas de Request - Atualizar Anotacao
// =====================================================

export const AtualizarAnotacaoSchema = z.object({
  conteudo: z.string().min(1).max(10000),
})

export type AtualizarAnotacaoPayload = z.infer<typeof AtualizarAnotacaoSchema>

// =====================================================
// Response Types
// =====================================================

export const AnotacaoComUsuarioSchema = AnotacaoOportunidadeSchema.extend({
  usuario: z.object({
    id: z.string().uuid(),
    nome: z.string(),
    avatar_url: z.string().nullable(),
  }),
})

export type AnotacaoComUsuario = z.infer<typeof AnotacaoComUsuarioSchema>

export const ListaAnotacoesResponseSchema = z.object({
  anotacoes: z.array(AnotacaoComUsuarioSchema),
  total: z.number(),
})

export type ListaAnotacoesResponse = z.infer<typeof ListaAnotacoesResponseSchema>
