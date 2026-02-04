/**
 * AIDEV-NOTE: Schemas Zod para Distribuicao de Oportunidades
 * Conforme PRD-07 - Modulo de Negocios (RF-06)
 *
 * Modos de distribuicao:
 * - manual: Admin atribui manualmente
 * - rodizio: Sistema distribui automaticamente entre membros ativos
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const ModoDistribuicaoEnum = z.enum(['manual', 'rodizio'])
export type ModoDistribuicao = z.infer<typeof ModoDistribuicaoEnum>

export const AcaoSlaEnum = z.enum(['manter_ultimo', 'retornar_admin', 'desatribuir'])
export type AcaoSla = z.infer<typeof AcaoSlaEnum>

// =====================================================
// Schema da Configuracao de Distribuicao
// =====================================================

export const ConfiguracaoDistribuicaoSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  funil_id: z.string().uuid(),

  modo: ModoDistribuicaoEnum.default('manual'),

  // Horario especifico para rodizio
  horario_especifico: z.boolean().default(false),
  horario_inicio: z.string().nullable().optional(), // HH:mm
  horario_fim: z.string().nullable().optional(),
  dias_semana: z.array(z.number().int().min(0).max(6)).default([1, 2, 3, 4, 5]), // 0=domingo

  // Opcoes
  pular_inativos: z.boolean().default(true),
  fallback_manual: z.boolean().default(true),

  // Controle de rodizio
  ultimo_usuario_id: z.string().uuid().nullable().optional(),
  posicao_rodizio: z.number().int().default(0),

  // SLA
  sla_ativo: z.boolean().default(false),
  sla_tempo_minutos: z.number().int().positive().default(30),
  sla_max_redistribuicoes: z.number().int().positive().default(3),
  sla_acao_limite: AcaoSlaEnum.default('manter_ultimo'),

  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
})

export type ConfiguracaoDistribuicao = z.infer<typeof ConfiguracaoDistribuicaoSchema>

// =====================================================
// Schemas de Request - Atualizar Configuracao
// =====================================================

export const AtualizarDistribuicaoSchema = z.object({
  modo: ModoDistribuicaoEnum.optional(),

  horario_especifico: z.boolean().optional(),
  horario_inicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato HH:mm').nullable().optional(),
  horario_fim: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato HH:mm').nullable().optional(),
  dias_semana: z.array(z.number().int().min(0).max(6)).optional(),

  pular_inativos: z.boolean().optional(),
  fallback_manual: z.boolean().optional(),

  sla_ativo: z.boolean().optional(),
  sla_tempo_minutos: z.number().int().positive().optional(),
  sla_max_redistribuicoes: z.number().int().positive().optional(),
  sla_acao_limite: AcaoSlaEnum.optional(),
})

export type AtualizarDistribuicaoPayload = z.infer<typeof AtualizarDistribuicaoSchema>

// =====================================================
// Historico de Distribuicao
// =====================================================

export const MotivoDistribuicaoEnum = z.enum(['criacao', 'rodizio', 'sla', 'manual', 'redistribuicao'])
export type MotivoDistribuicao = z.infer<typeof MotivoDistribuicaoEnum>

export const HistoricoDistribuicaoSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  oportunidade_id: z.string().uuid(),
  usuario_anterior_id: z.string().uuid().nullable(),
  usuario_novo_id: z.string().uuid().nullable(),
  motivo: MotivoDistribuicaoEnum,
  criado_em: z.string().datetime(),
})

export type HistoricoDistribuicao = z.infer<typeof HistoricoDistribuicaoSchema>

// =====================================================
// Response Types
// =====================================================

export const DistribuicaoComMembrosSchema = ConfiguracaoDistribuicaoSchema.extend({
  membros_ativos: z.array(
    z.object({
      usuario_id: z.string().uuid(),
      nome: z.string(),
      email: z.string(),
      avatar_url: z.string().nullable(),
      oportunidades_abertas: z.number(),
      ultima_atribuicao: z.string().datetime().nullable(),
    })
  ),
})

export type DistribuicaoComMembros = z.infer<typeof DistribuicaoComMembrosSchema>

// =====================================================
// Dias da Semana (para UI)
// =====================================================

export const DIAS_SEMANA = [
  { valor: 0, nome: 'Domingo', abrev: 'Dom' },
  { valor: 1, nome: 'Segunda', abrev: 'Seg' },
  { valor: 2, nome: 'Terca', abrev: 'Ter' },
  { valor: 3, nome: 'Quarta', abrev: 'Qua' },
  { valor: 4, nome: 'Quinta', abrev: 'Qui' },
  { valor: 5, nome: 'Sexta', abrev: 'Sex' },
  { valor: 6, nome: 'Sabado', abrev: 'Sab' },
] as const
