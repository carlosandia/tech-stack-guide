/**
 * AIDEV-NOTE: Schemas Zod para Regras de Qualificacao e Config Cards
 * Conforme PRD-05 - Regras MQL e Personalizacao de Cards
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const OperadorRegraEnum = z.enum([
  'igual',
  'diferente',
  'contem',
  'nao_contem',
  'maior_que',
  'menor_que',
  'maior_igual',
  'menor_igual',
  'vazio',
  'nao_vazio',
])
export type OperadorRegra = z.infer<typeof OperadorRegraEnum>

// =====================================================
// Schema da Regra de Qualificacao
// =====================================================

export const RegraQualificacaoSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  nome: z.string().min(1).max(255),
  descricao: z.string().nullable().optional(),
  campo_id: z.string().uuid().nullable().optional(),
  operador: OperadorRegraEnum,
  valor: z.string().nullable().optional(),
  valores: z.array(z.string()).default([]),
  ativo: z.boolean().default(true),
  ordem: z.number().default(0),
  criado_em: z.string().datetime(),
  criado_por: z.string().uuid().nullable().optional(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
})

export type RegraQualificacao = z.infer<typeof RegraQualificacaoSchema>

// =====================================================
// Schemas de Request - Regra
// =====================================================

export const CriarRegraSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio').max(255),
  descricao: z.string().optional(),
  campo_id: z.string().uuid(),
  operador: OperadorRegraEnum,
  valor: z.string().optional(),
  valores: z.array(z.string()).optional().default([]),
  ordem: z.number().optional(),
})

export type CriarRegraPayload = z.infer<typeof CriarRegraSchema>

export const AtualizarRegraSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  descricao: z.string().nullable().optional(),
  campo_id: z.string().uuid().optional(),
  operador: OperadorRegraEnum.optional(),
  valor: z.string().nullable().optional(),
  valores: z.array(z.string()).optional(),
  ativo: z.boolean().optional(),
  ordem: z.number().optional(),
})

export type AtualizarRegraPayload = z.infer<typeof AtualizarRegraSchema>

export const ListarRegrasQuerySchema = z.object({
  ativo: z.enum(['true', 'false']).optional(),
})

export type ListarRegrasQuery = z.infer<typeof ListarRegrasQuerySchema>

// =====================================================
// Schema de Configuracao de Cards
// =====================================================

export const ConfiguracaoCardSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  funil_id: z.string().uuid().nullable().optional(),
  campos_visiveis: z.array(z.string()).default([
    'valor', 'contato', 'empresa', 'owner', 'previsao_fechamento', 'tarefas_pendentes', 'tags'
  ]),
  campos_customizados_visiveis: z.array(z.string().uuid()).default([]),
  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
})

export type ConfiguracaoCard = z.infer<typeof ConfiguracaoCardSchema>

// =====================================================
// Schemas de Request - Config Card
// =====================================================

export const AtualizarConfigCardSchema = z.object({
  funil_id: z.string().uuid().nullable().optional(),
  campos_visiveis: z.array(z.string()),
  campos_customizados_visiveis: z.array(z.string().uuid()).optional().default([]),
})

export type AtualizarConfigCardPayload = z.infer<typeof AtualizarConfigCardSchema>

// =====================================================
// Response Types
// =====================================================

export const ListaRegrasResponseSchema = z.object({
  regras: z.array(RegraQualificacaoSchema),
  total: z.number(),
})

export type ListaRegrasResponse = z.infer<typeof ListaRegrasResponseSchema>

export const ReordenarRegrasSchema = z.object({
  prioridades: z.array(z.object({
    id: z.string().uuid(),
    prioridade: z.number().int(),
  })),
})

export type ReordenarRegrasPayload = z.infer<typeof ReordenarRegrasSchema>
