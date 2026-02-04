/**
 * AIDEV-NOTE: Schemas Zod para Etapas de Funil
 * Conforme PRD-07 - Modulo de Negocios
 *
 * Etapas sao as colunas do Kanban dentro de cada Pipeline.
 * Tipos: entrada (Novos Negocios), normal, ganho (Closed Won), perda (Closed Lost)
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const TipoEtapaFunilEnum = z.enum(['entrada', 'normal', 'ganho', 'perda'])
export type TipoEtapaFunil = z.infer<typeof TipoEtapaFunilEnum>

export const CorHexSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser hexadecimal (#RRGGBB)')

// =====================================================
// Schema da Etapa de Funil
// =====================================================

export const EtapaFunilSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  funil_id: z.string().uuid(),
  nome: z.string().min(1).max(255),
  descricao: z.string().nullable().optional(),
  tipo: TipoEtapaFunilEnum,
  cor: CorHexSchema.default('#6B7280'),
  probabilidade: z.number().int().min(0).max(100).default(0),
  ordem: z.number().int().default(0),
  ativo: z.boolean().default(true),
  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
})

export type EtapaFunil = z.infer<typeof EtapaFunilSchema>

// =====================================================
// Schemas de Request - Criar Etapa
// =====================================================

export const CriarEtapaFunilSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio').max(255),
  descricao: z.string().optional(),
  tipo: TipoEtapaFunilEnum.default('normal'),
  cor: CorHexSchema.optional(),
  probabilidade: z.number().int().min(0).max(100).optional(),
  ordem: z.number().int().optional(),
})

export type CriarEtapaFunilPayload = z.infer<typeof CriarEtapaFunilSchema>

// =====================================================
// Schemas de Request - Atualizar Etapa
// =====================================================

export const AtualizarEtapaFunilSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  descricao: z.string().nullable().optional(),
  tipo: TipoEtapaFunilEnum.optional(),
  cor: CorHexSchema.optional(),
  probabilidade: z.number().int().min(0).max(100).optional(),
  ativo: z.boolean().optional(),
})

export type AtualizarEtapaFunilPayload = z.infer<typeof AtualizarEtapaFunilSchema>

// =====================================================
// Schemas de Request - Reordenar Etapas
// =====================================================

export const ReordenarEtapasSchema = z.object({
  etapas: z
    .array(
      z.object({
        id: z.string().uuid(),
        ordem: z.number().int().min(0),
      })
    )
    .min(1, 'Informe pelo menos uma etapa'),
})

export type ReordenarEtapasPayload = z.infer<typeof ReordenarEtapasSchema>

// =====================================================
// Response Types
// =====================================================

export const ListaEtapasFunilResponseSchema = z.object({
  etapas: z.array(EtapaFunilSchema),
  total: z.number(),
})

export type ListaEtapasFunilResponse = z.infer<typeof ListaEtapasFunilResponseSchema>

// =====================================================
// Etapa com Estatisticas (para Kanban)
// =====================================================

export const EtapaFunilComEstatsSchema = EtapaFunilSchema.extend({
  total_oportunidades: z.number(),
  valor_total: z.number(),
  valor_medio: z.number(),
})

export type EtapaFunilComEstats = z.infer<typeof EtapaFunilComEstatsSchema>

// =====================================================
// Vinculo Etapa-Tarefa (tarefas automaticas)
// =====================================================

export const EtapaTarefaSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  etapa_funil_id: z.string().uuid(),
  tarefa_template_id: z.string().uuid(),
  ativo: z.boolean(),
  ordem: z.number(),
  criado_em: z.string().datetime(),
})

export type EtapaTarefa = z.infer<typeof EtapaTarefaSchema>

export const VincularTarefaEtapaSchema = z.object({
  tarefa_template_id: z.string().uuid(),
  ordem: z.number().int().optional(),
})

export type VincularTarefaEtapaPayload = z.infer<typeof VincularTarefaEtapaSchema>

// =====================================================
// Cores Predefinidas para UI (PRD-07)
// =====================================================

export const CORES_ETAPAS = [
  '#22C55E', // Verde (ganho)
  '#3B82F6', // Azul
  '#EAB308', // Amarelo
  '#A855F7', // Roxo
  '#EF4444', // Vermelho (perda)
  '#F97316', // Laranja
  '#06B6D4', // Ciano
  '#EC4899', // Rosa
  '#6B7280', // Cinza (padrao)
  '#84CC16', // Lima
] as const

export type CorEtapa = (typeof CORES_ETAPAS)[number]

// =====================================================
// Probabilidades Padrao por Tipo
// =====================================================

export const PROBABILIDADES_PADRAO: Record<TipoEtapaFunil, number> = {
  entrada: 10,
  normal: 50,
  ganho: 100,
  perda: 0,
}
