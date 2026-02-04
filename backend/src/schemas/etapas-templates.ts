/**
 * AIDEV-NOTE: Schemas Zod para Templates de Etapas
 * Conforme PRD-05 - Templates de Etapas do Funil
 *
 * 4 tipos de etapa:
 * entrada, normal, ganho, perda
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const TipoEtapaEnum = z.enum(['entrada', 'normal', 'ganho', 'perda'])
export type TipoEtapa = z.infer<typeof TipoEtapaEnum>

// =====================================================
// Schema do Template de Etapa
// =====================================================

export const EtapaTemplateSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  nome: z.string().min(1).max(255),
  descricao: z.string().nullable().optional(),
  tipo: TipoEtapaEnum,
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6B7280'),
  probabilidade: z.number().min(0).max(100).default(0),
  sistema: z.boolean().default(false),
  ordem: z.number().default(0),
  ativo: z.boolean().default(true),
  criado_em: z.string().datetime(),
  criado_por: z.string().uuid().nullable().optional(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
})

export type EtapaTemplate = z.infer<typeof EtapaTemplateSchema>

// =====================================================
// Schemas de Request
// =====================================================

export const CriarEtapaTemplateSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio').max(255),
  descricao: z.string().optional(),
  tipo: TipoEtapaEnum,
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser hexadecimal').optional(),
  probabilidade: z.number().min(0).max(100).optional().default(0),
  ordem: z.number().optional(),
  tarefas_ids: z.array(z.string().uuid()).optional(),
})

export type CriarEtapaTemplatePayload = z.infer<typeof CriarEtapaTemplateSchema>

export const AtualizarEtapaTemplateSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  descricao: z.string().nullable().optional(),
  tipo: TipoEtapaEnum.optional(),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  probabilidade: z.number().min(0).max(100).optional(),
  ordem: z.number().optional(),
  ativo: z.boolean().optional(),
  tarefas_ids: z.array(z.string().uuid()).optional(),
})

export type AtualizarEtapaTemplatePayload = z.infer<typeof AtualizarEtapaTemplateSchema>

export const ListarEtapasTemplatesQuerySchema = z.object({
  tipo: TipoEtapaEnum.optional(),
  ativo: z.enum(['true', 'false']).optional(),
})

export type ListarEtapasTemplatesQuery = z.infer<typeof ListarEtapasTemplatesQuerySchema>

// =====================================================
// Schema do Vinculo Etapa-Tarefa
// =====================================================

export const EtapaTarefaSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  etapa_template_id: z.string().uuid(),
  tarefa_template_id: z.string().uuid(),
  criar_automaticamente: z.boolean().default(true),
  ordem: z.number().default(0),
  criado_em: z.string().datetime(),
})

export type EtapaTarefa = z.infer<typeof EtapaTarefaSchema>

export const VincularTarefaEtapaSchema = z.object({
  tarefa_template_id: z.string().uuid(),
  criar_automaticamente: z.boolean().optional().default(true),
  ordem: z.number().optional(),
})

export type VincularTarefaEtapaPayload = z.infer<typeof VincularTarefaEtapaSchema>

// =====================================================
// Response Types
// =====================================================

export const ListaEtapasTemplatesResponseSchema = z.object({
  templates: z.array(EtapaTemplateSchema),
  total: z.number(),
})

export type ListaEtapasTemplatesResponse = z.infer<typeof ListaEtapasTemplatesResponseSchema>

export const EtapaComTarefasSchema = EtapaTemplateSchema.extend({
  tarefas: z.array(z.object({
    id: z.string().uuid(),
    tarefa_template_id: z.string().uuid(),
    titulo: z.string(),
    tipo: z.string(),
    criar_automaticamente: z.boolean(),
    ordem: z.number(),
  })).optional(),
})

export type EtapaComTarefas = z.infer<typeof EtapaComTarefasSchema>

// Alias para compatibilidade
export type EtapaTemplateComTarefas = EtapaComTarefas

export const ReordenarEtapasSchema = z.object({
  ordem: z.array(z.object({
    id: z.string().uuid(),
    ordem: z.number(),
  })),
})

export type ReordenarEtapasPayload = z.infer<typeof ReordenarEtapasSchema>
