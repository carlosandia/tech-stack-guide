/**
 * AIDEV-NOTE: Schemas Zod para Produtos e Categorias (Frontend)
 * Conforme PRD-05 e backend/src/schemas/produtos.ts
 */

import { z } from 'zod'

// =====================================================
// Enums e Options
// =====================================================

export const moedaOptions = [
  { value: 'BRL', label: 'R$ (BRL)' },
  { value: 'USD', label: '$ (USD)' },
  { value: 'EUR', label: '€ (EUR)' },
] as const

export const unidadeOptions = [
  { value: 'un', label: 'Unidade' },
  { value: 'kg', label: 'Quilograma' },
  { value: 'hora', label: 'Hora' },
  { value: 'dia', label: 'Dia' },
  { value: 'mes', label: 'Mês' },
  { value: 'ano', label: 'Ano' },
] as const

export const periodoRecorrenciaOptions = [
  { value: 'mensal', label: 'Mensal' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
] as const

// =====================================================
// Schema - Criar Produto
// =====================================================

export const criarProdutoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  descricao: z.string().optional(),
  sku: z.string().max(100, 'SKU muito longo').optional(),
  preco: z.number().nonnegative('Preço deve ser positivo').default(0),
  moeda: z.enum(['BRL', 'USD', 'EUR']).default('BRL'),
  unidade: z.enum(['un', 'kg', 'hora', 'dia', 'mes', 'ano']).default('un'),
  recorrente: z.boolean().default(false),
  periodo_recorrencia: z.enum(['mensal', 'trimestral', 'semestral', 'anual']).optional().nullable(),
  categoria_id: z.string().uuid().optional().nullable(),
})

export type CriarProdutoFormData = z.infer<typeof criarProdutoSchema>

// =====================================================
// Schema - Criar Categoria
// =====================================================

export const criarCategoriaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  descricao: z.string().optional(),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser hexadecimal').optional(),
})

export type CriarCategoriaFormData = z.infer<typeof criarCategoriaSchema>
