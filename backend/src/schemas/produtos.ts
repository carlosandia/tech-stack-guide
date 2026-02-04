/**
 * AIDEV-NOTE: Schemas Zod para Produtos e Categorias
 * Conforme PRD-05 - Catalogo de Produtos
 *
 * Suporta:
 * - Produtos com preco e unidade
 * - Produtos recorrentes (MRR)
 * - Categorias para agrupamento
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const MoedaEnum = z.enum(['BRL', 'USD', 'EUR'])
export type Moeda = z.infer<typeof MoedaEnum>

export const UnidadeEnum = z.enum(['un', 'kg', 'hora', 'dia', 'mes', 'ano'])
export type Unidade = z.infer<typeof UnidadeEnum>

export const PeriodoRecorrenciaEnum = z.enum(['mensal', 'trimestral', 'semestral', 'anual'])
export type PeriodoRecorrencia = z.infer<typeof PeriodoRecorrenciaEnum>

// =====================================================
// Schema da Categoria
// =====================================================

export const CategoriaSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  nome: z.string().min(1).max(255),
  descricao: z.string().nullable().optional(),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6B7280'),
  ordem: z.number().default(0),
  ativo: z.boolean().default(true),
  criado_em: z.string().datetime(),
  criado_por: z.string().uuid().nullable().optional(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
})

export type Categoria = z.infer<typeof CategoriaSchema>

// =====================================================
// Schemas de Request - Categoria
// =====================================================

export const CriarCategoriaSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio').max(255),
  descricao: z.string().optional(),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser hexadecimal').optional(),
  ordem: z.number().optional(),
})

export type CriarCategoriaPayload = z.infer<typeof CriarCategoriaSchema>

export const AtualizarCategoriaSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  descricao: z.string().nullable().optional(),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  ordem: z.number().optional(),
  ativo: z.boolean().optional(),
})

export type AtualizarCategoriaPayload = z.infer<typeof AtualizarCategoriaSchema>

// =====================================================
// Schema do Produto
// =====================================================

export const ProdutoSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  categoria_id: z.string().uuid().nullable().optional(),
  nome: z.string().min(1).max(255),
  descricao: z.string().nullable().optional(),
  sku: z.string().max(100).nullable().optional(),
  preco: z.number().nonnegative().default(0),
  moeda: MoedaEnum.default('BRL'),
  unidade: UnidadeEnum.default('un'),
  recorrente: z.boolean().default(false),
  periodo_recorrencia: PeriodoRecorrenciaEnum.nullable().optional(),
  ativo: z.boolean().default(true),
  criado_em: z.string().datetime(),
  criado_por: z.string().uuid().nullable().optional(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
  // Relacionamentos
  categoria: CategoriaSchema.nullable().optional(),
})

export type Produto = z.infer<typeof ProdutoSchema>

// =====================================================
// Schemas de Request - Produto
// =====================================================

export const CriarProdutoSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio').max(255),
  descricao: z.string().optional(),
  sku: z.string().max(100).optional(),
  preco: z.number().nonnegative('Preco deve ser positivo').default(0),
  moeda: MoedaEnum.optional().default('BRL'),
  unidade: UnidadeEnum.optional().default('un'),
  recorrente: z.boolean().optional().default(false),
  periodo_recorrencia: PeriodoRecorrenciaEnum.optional(),
  categoria_id: z.string().uuid().optional(),
})

export type CriarProdutoPayload = z.infer<typeof CriarProdutoSchema>

export const AtualizarProdutoSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  descricao: z.string().nullable().optional(),
  sku: z.string().max(100).nullable().optional(),
  preco: z.number().nonnegative().optional(),
  moeda: MoedaEnum.optional(),
  unidade: UnidadeEnum.optional(),
  recorrente: z.boolean().optional(),
  periodo_recorrencia: PeriodoRecorrenciaEnum.nullable().optional(),
  categoria_id: z.string().uuid().nullable().optional(),
  ativo: z.boolean().optional(),
})

export type AtualizarProdutoPayload = z.infer<typeof AtualizarProdutoSchema>

export const ListarProdutosQuerySchema = z.object({
  categoria_id: z.string().uuid().optional(),
  ativo: z.enum(['true', 'false']).optional(),
  recorrente: z.enum(['true', 'false']).optional(),
  busca: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
})

export type ListarProdutosQuery = z.infer<typeof ListarProdutosQuerySchema>

// =====================================================
// Response Types
// =====================================================

export const ListaCategoriasResponseSchema = z.object({
  categorias: z.array(CategoriaSchema),
  total: z.number(),
})

export type ListaCategoriasResponse = z.infer<typeof ListaCategoriasResponseSchema>

export const ListaProdutosResponseSchema = z.object({
  produtos: z.array(ProdutoSchema),
  total: z.number(),
  page: z.number(),
  total_paginas: z.number(),
})

export type ListaProdutosResponse = z.infer<typeof ListaProdutosResponseSchema>
