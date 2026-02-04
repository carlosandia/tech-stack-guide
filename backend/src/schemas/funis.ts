/**
 * AIDEV-NOTE: Schemas Zod para Funis (Pipelines)
 * Conforme PRD-07 - Modulo de Negocios
 *
 * Funis sao pipelines de vendas configuráveis por tenant.
 * Cada funil tem etapas, campos, regras e membros associados.
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const CorHexSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser hexadecimal (#RRGGBB)')

// =====================================================
// Schema do Funil (Pipeline)
// =====================================================

export const FunilSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  nome: z.string().min(1).max(255),
  descricao: z.string().nullable().optional(),
  cor: CorHexSchema.default('#3B82F6'),
  exigir_motivo_resultado: z.boolean().default(true),
  arquivado: z.boolean().default(false),
  arquivado_em: z.string().datetime().nullable().optional(),
  ativo: z.boolean().default(true),
  criado_em: z.string().datetime(),
  criado_por: z.string().uuid().nullable().optional(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
})

export type Funil = z.infer<typeof FunilSchema>

// =====================================================
// Schemas de Request - Criar Funil
// =====================================================

export const CriarFunilSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio').max(255),
  descricao: z.string().optional(),
  cor: CorHexSchema.optional(),
  exigir_motivo_resultado: z.boolean().optional(),
  // Etapas iniciais opcionais
  etapas_iniciais: z
    .array(
      z.object({
        nome: z.string().min(1).max(255),
        tipo: z.enum(['entrada', 'normal', 'ganho', 'perda']),
        cor: CorHexSchema.optional(),
        probabilidade: z.number().int().min(0).max(100).optional(),
      })
    )
    .optional(),
})

export type CriarFunilPayload = z.infer<typeof CriarFunilSchema>

// =====================================================
// Schemas de Request - Atualizar Funil
// =====================================================

export const AtualizarFunilSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  descricao: z.string().nullable().optional(),
  cor: CorHexSchema.optional(),
  exigir_motivo_resultado: z.boolean().optional(),
  ativo: z.boolean().optional(),
})

export type AtualizarFunilPayload = z.infer<typeof AtualizarFunilSchema>

// =====================================================
// Schemas de Query - Listagem com Filtros
// =====================================================

export const ListarFunisQuerySchema = z.object({
  ativo: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  arquivado: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  busca: z.string().max(255).optional(),
  // Paginacao
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
})

export type ListarFunisQuery = z.infer<typeof ListarFunisQuerySchema>

// =====================================================
// Response Types
// =====================================================

export const ListaFunisResponseSchema = z.object({
  funis: z.array(FunilSchema),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  total_pages: z.number(),
})

export type ListaFunisResponse = z.infer<typeof ListaFunisResponseSchema>

// =====================================================
// Funil com Etapas (para detalhes)
// =====================================================

export const EtapaFunilResumoSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  tipo: z.enum(['entrada', 'normal', 'ganho', 'perda']),
  cor: z.string(),
  probabilidade: z.number(),
  ordem: z.number(),
  total_oportunidades: z.number().optional(),
  valor_total: z.number().optional(),
})

export type EtapaFunilResumo = z.infer<typeof EtapaFunilResumoSchema>

export const FunilComEtapasSchema = FunilSchema.extend({
  etapas: z.array(EtapaFunilResumoSchema),
  total_oportunidades: z.number().optional(),
  valor_total: z.number().optional(),
})

export type FunilComEtapas = z.infer<typeof FunilComEtapasSchema>

// =====================================================
// Funil Membro (vinculo usuario)
// =====================================================

export const FunilMembroSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  funil_id: z.string().uuid(),
  usuario_id: z.string().uuid(),
  ativo: z.boolean(),
  criado_em: z.string().datetime(),
})

export type FunilMembro = z.infer<typeof FunilMembroSchema>

export const VincularMembroSchema = z.object({
  usuario_id: z.string().uuid(),
})

export type VincularMembroPayload = z.infer<typeof VincularMembroSchema>

export const VincularMembrosLoteSchema = z.object({
  usuario_ids: z.array(z.string().uuid()).min(1),
})

export type VincularMembrosLotePayload = z.infer<typeof VincularMembrosLoteSchema>

// =====================================================
// Funil Campo (vinculo campo customizado)
// =====================================================

export const FunilCampoSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  funil_id: z.string().uuid(),
  campo_id: z.string().uuid(),
  obrigatorio: z.boolean(),
  visivel: z.boolean(),
  exibir_card: z.boolean(),
  ordem: z.number(),
  criado_em: z.string().datetime(),
})

export type FunilCampo = z.infer<typeof FunilCampoSchema>

export const VincularCampoSchema = z.object({
  campo_id: z.string().uuid(),
  obrigatorio: z.boolean().optional(),
  visivel: z.boolean().optional(),
  exibir_card: z.boolean().optional(),
  ordem: z.number().int().optional(),
})

export type VincularCampoPayload = z.infer<typeof VincularCampoSchema>

export const AtualizarVinculoCampoSchema = z.object({
  obrigatorio: z.boolean().optional(),
  visivel: z.boolean().optional(),
  exibir_card: z.boolean().optional(),
  ordem: z.number().int().optional(),
})

export type AtualizarVinculoCampoPayload = z.infer<typeof AtualizarVinculoCampoSchema>

// =====================================================
// Funil Regra (vinculo regra qualificacao)
// =====================================================

export const FunilRegraSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  funil_id: z.string().uuid(),
  regra_id: z.string().uuid(),
  ativo: z.boolean(),
  criado_em: z.string().datetime(),
})

export type FunilRegra = z.infer<typeof FunilRegraSchema>

export const VincularRegraSchema = z.object({
  regra_id: z.string().uuid(),
})

export type VincularRegraPayload = z.infer<typeof VincularRegraSchema>

// =====================================================
// Funil Motivo (vinculo motivo resultado)
// =====================================================

export const FunilMotivoSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  funil_id: z.string().uuid(),
  motivo_id: z.string().uuid(),
  ativo: z.boolean(),
  criado_em: z.string().datetime(),
})

export type FunilMotivo = z.infer<typeof FunilMotivoSchema>

export const VincularMotivoSchema = z.object({
  motivo_id: z.string().uuid(),
})

export type VincularMotivoPayload = z.infer<typeof VincularMotivoSchema>

// =====================================================
// Contadores para UI
// =====================================================

export const ContadoresFunisSchema = z.object({
  total: z.number(),
  ativas: z.number(),
  arquivadas: z.number(),
})

export type ContadoresFunis = z.infer<typeof ContadoresFunisSchema>
