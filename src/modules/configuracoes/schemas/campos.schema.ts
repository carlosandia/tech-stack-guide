/**
 * AIDEV-NOTE: Schemas Zod para validação de formulários de Campos Personalizados
 * Frontend - mensagens em PT-BR
 */

import { z } from 'zod'

export const entidadeOptions = [
  { value: 'pessoa', label: 'Pessoas' },
  { value: 'empresa', label: 'Empresas' },
  { value: 'oportunidade', label: 'Oportunidades' },
] as const

export const tipoCampoOptions = [
  { value: 'texto', label: 'Texto' },
  { value: 'texto_longo', label: 'Texto Longo' },
  { value: 'numero', label: 'Número' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'data', label: 'Data' },
  { value: 'data_hora', label: 'Data e Hora' },
  { value: 'booleano', label: 'Sim/Não' },
  { value: 'select', label: 'Lista Suspensa' },
  { value: 'multi_select', label: 'Múltipla Escolha' },
  { value: 'email', label: 'Email' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'url', label: 'URL' },
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
] as const

export const criarCampoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255, 'Máximo 255 caracteres'),
  descricao: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  entidade: z.enum(['pessoa', 'empresa', 'oportunidade'], {
    required_error: 'Selecione uma entidade',
  }),
  tipo: z.enum([
    'texto', 'texto_longo', 'numero', 'decimal', 'data', 'data_hora',
    'booleano', 'select', 'multi_select', 'email', 'telefone', 'url', 'cpf', 'cnpj',
  ], {
    required_error: 'Selecione um tipo',
  }),
  obrigatorio: z.boolean().optional().default(false),
  valor_padrao: z.string().optional().or(z.literal('')),
  placeholder: z.string().max(255).optional().or(z.literal('')),
  opcoes: z.array(z.string()).optional().default([]),
})

export type CriarCampoFormData = z.infer<typeof criarCampoSchema>

export const atualizarCampoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255).optional(),
  descricao: z.string().max(500).optional().or(z.literal('')).nullable(),
  obrigatorio: z.boolean().optional(),
  valor_padrao: z.string().optional().or(z.literal('')).nullable(),
  placeholder: z.string().max(255).optional().or(z.literal('')).nullable(),
  opcoes: z.array(z.string()).optional(),
  ativo: z.boolean().optional(),
})

export type AtualizarCampoFormData = z.infer<typeof atualizarCampoSchema>
