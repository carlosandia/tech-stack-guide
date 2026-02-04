/**
 * AIDEV-NOTE: Schemas Zod para Templates de Tarefas
 * Conforme PRD-05 - Templates de Tarefas
 *
 * 6 tipos de tarefa:
 * ligacao, email, reuniao, whatsapp, visita, outro
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const TipoTarefaEnum = z.enum(['ligacao', 'email', 'reuniao', 'whatsapp', 'visita', 'outro'])
export type TipoTarefa = z.infer<typeof TipoTarefaEnum>

export const CanalTarefaEnum = z.enum(['whatsapp', 'instagram', 'email', 'telefone'])
export type CanalTarefa = z.infer<typeof CanalTarefaEnum>

export const PrioridadeTarefaEnum = z.enum(['baixa', 'media', 'alta', 'urgente'])
export type PrioridadeTarefa = z.infer<typeof PrioridadeTarefaEnum>

// =====================================================
// Schema do Template de Tarefa
// =====================================================

export const TarefaTemplateSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  titulo: z.string().min(1).max(255),
  descricao: z.string().nullable().optional(),
  tipo: TipoTarefaEnum,
  canal: CanalTarefaEnum.nullable().optional(),
  prioridade: PrioridadeTarefaEnum.default('media'),
  dias_prazo: z.number().nonnegative().default(1),
  ativo: z.boolean().default(true),
  criado_em: z.string().datetime(),
  criado_por: z.string().uuid().nullable().optional(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
})

export type TarefaTemplate = z.infer<typeof TarefaTemplateSchema>

// =====================================================
// Schemas de Request
// =====================================================

export const CriarTarefaTemplateSchema = z.object({
  titulo: z.string().min(1, 'Titulo e obrigatorio').max(255),
  descricao: z.string().optional(),
  tipo: TipoTarefaEnum,
  canal: CanalTarefaEnum.optional(),
  prioridade: PrioridadeTarefaEnum.optional().default('media'),
  dias_prazo: z.number().nonnegative('Dias deve ser positivo').optional().default(1),
})

export type CriarTarefaTemplatePayload = z.infer<typeof CriarTarefaTemplateSchema>

export const AtualizarTarefaTemplateSchema = z.object({
  titulo: z.string().min(1).max(255).optional(),
  descricao: z.string().nullable().optional(),
  tipo: TipoTarefaEnum.optional(),
  canal: CanalTarefaEnum.nullable().optional(),
  prioridade: PrioridadeTarefaEnum.optional(),
  dias_prazo: z.number().nonnegative().optional(),
  ativo: z.boolean().optional(),
})

export type AtualizarTarefaTemplatePayload = z.infer<typeof AtualizarTarefaTemplateSchema>

export const ListarTarefasTemplatesQuerySchema = z.object({
  tipo: TipoTarefaEnum.optional(),
  ativo: z.enum(['true', 'false']).optional(),
})

export type ListarTarefasTemplatesQuery = z.infer<typeof ListarTarefasTemplatesQuerySchema>

// =====================================================
// Response Types
// =====================================================

export const ListaTarefasTemplatesResponseSchema = z.object({
  templates: z.array(TarefaTemplateSchema),
  total: z.number(),
})

export type ListaTarefasTemplatesResponse = z.infer<typeof ListaTarefasTemplatesResponseSchema>
