/**
 * AIDEV-NOTE: Schemas Zod para Campos Customizados
 * Conforme PRD-05 - Campos Personalizados
 *
 * 13 tipos de campo suportados:
 * texto, texto_longo, numero, decimal, data, data_hora, booleano,
 * select, multi_select, email, telefone, url, cpf, cnpj
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const EntidadeEnum = z.enum(['pessoa', 'empresa', 'oportunidade'])
export type Entidade = z.infer<typeof EntidadeEnum>

export const TipoCampoEnum = z.enum([
  'texto',
  'texto_longo',
  'numero',
  'decimal',
  'data',
  'data_hora',
  'booleano',
  'select',
  'multi_select',
  'email',
  'telefone',
  'url',
  'cpf',
  'cnpj',
])
export type TipoCampo = z.infer<typeof TipoCampoEnum>

// =====================================================
// Validacoes por tipo de campo
// =====================================================

export const ValidacoesTextoSchema = z.object({
  max_length: z.number().optional(),
  min_length: z.number().optional(),
  regex: z.string().optional(),
})

export const ValidacoesNumeroSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
})

export const ValidacoesDecimalSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  precision: z.number().optional(),
})

export const ValidacoesDataSchema = z.object({
  min_date: z.string().optional(),
  max_date: z.string().optional(),
})

export const ValidacoesSelectSchema = z.object({
  opcoes: z.array(z.string()).optional(),
})

export const ValidacoesSchema = z.union([
  ValidacoesTextoSchema,
  ValidacoesNumeroSchema,
  ValidacoesDecimalSchema,
  ValidacoesDataSchema,
  ValidacoesSelectSchema,
  z.object({}),
])

// =====================================================
// Schema do Campo Customizado
// =====================================================

export const CampoCustomizadoSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  nome: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  descricao: z.string().nullable().optional(),
  entidade: EntidadeEnum,
  tipo: TipoCampoEnum,
  obrigatorio: z.boolean().default(false),
  valor_padrao: z.string().nullable().optional(),
  placeholder: z.string().nullable().optional(),
  validacoes: ValidacoesSchema.default({}),
  opcoes: z.array(z.string()).default([]),
  ordem: z.number().default(0),
  sistema: z.boolean().default(false),
  ativo: z.boolean().default(true),
  criado_em: z.string().datetime(),
  criado_por: z.string().uuid().nullable().optional(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
})

export type CampoCustomizado = z.infer<typeof CampoCustomizadoSchema>

// =====================================================
// Schemas de Request
// =====================================================

export const CriarCampoSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio').max(255),
  descricao: z.string().optional(),
  entidade: EntidadeEnum,
  tipo: TipoCampoEnum,
  obrigatorio: z.boolean().optional().default(false),
  valor_padrao: z.string().optional(),
  placeholder: z.string().optional(),
  validacoes: ValidacoesSchema.optional().default({}),
  opcoes: z.array(z.string()).optional().default([]),
})

export type CriarCampoPayload = z.infer<typeof CriarCampoSchema>

export const AtualizarCampoSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  descricao: z.string().nullable().optional(),
  obrigatorio: z.boolean().optional(),
  valor_padrao: z.string().nullable().optional(),
  placeholder: z.string().nullable().optional(),
  validacoes: ValidacoesSchema.optional(),
  opcoes: z.array(z.string()).optional(),
  ativo: z.boolean().optional(),
})

export type AtualizarCampoPayload = z.infer<typeof AtualizarCampoSchema>

export const ListarCamposQuerySchema = z.object({
  entidade: EntidadeEnum.optional(),
  ativo: z.enum(['true', 'false']).optional(),
  incluir_sistema: z.enum(['true', 'false']).optional(),
})

export type ListarCamposQuery = z.infer<typeof ListarCamposQuerySchema>

export const OrdemItemSchema = z.object({
  id: z.string().uuid(),
  ordem: z.number().int(),
})

export const ReordenarCamposSchema = z.object({
  entidade: EntidadeEnum,
  ordem: z.array(OrdemItemSchema),
})

export type ReordenarCamposPayload = z.infer<typeof ReordenarCamposSchema>

// =====================================================
// Schema do Valor do Campo
// =====================================================

export const ValorCampoSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  campo_id: z.string().uuid(),
  entidade_tipo: EntidadeEnum,
  entidade_id: z.string().uuid(),
  valor_texto: z.string().nullable().optional(),
  valor_numero: z.number().nullable().optional(),
  valor_data: z.string().datetime().nullable().optional(),
  valor_booleano: z.boolean().nullable().optional(),
  valor_json: z.any().nullable().optional(),
  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
})

export type ValorCampo = z.infer<typeof ValorCampoSchema>

export const SalvarValorCampoSchema = z.object({
  campo_id: z.string().uuid(),
  entidade_tipo: EntidadeEnum,
  entidade_id: z.string().uuid(),
  valor: z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.null()]),
})

export type SalvarValorCampoPayload = z.infer<typeof SalvarValorCampoSchema>

// =====================================================
// Response Types
// =====================================================

export const ListaCamposResponseSchema = z.object({
  campos: z.array(CampoCustomizadoSchema),
  total: z.number(),
})

export type ListaCamposResponse = z.infer<typeof ListaCamposResponseSchema>
