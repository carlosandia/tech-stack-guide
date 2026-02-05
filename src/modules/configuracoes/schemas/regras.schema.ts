/**
 * AIDEV-NOTE: Schema Zod para formulário de Regras de Qualificação (MQL)
 * Conforme PRD-05 - Regras de Qualificação
 */

import { z } from 'zod'

export const operadorOptions = [
  { value: 'igual', label: 'Igual a' },
  { value: 'diferente', label: 'Diferente de' },
  { value: 'contem', label: 'Contém' },
  { value: 'nao_contem', label: 'Não contém' },
  { value: 'maior_que', label: 'Maior que' },
  { value: 'menor_que', label: 'Menor que' },
  { value: 'maior_igual', label: 'Maior ou igual' },
  { value: 'menor_igual', label: 'Menor ou igual' },
  { value: 'vazio', label: 'Está vazio' },
  { value: 'nao_vazio', label: 'Não está vazio' },
] as const

export const regraFormSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255, 'Máximo 255 caracteres'),
  descricao: z.string().optional(),
  campo_id: z.string().uuid('Selecione um campo'),
  operador: z.enum([
    'igual', 'diferente', 'contem', 'nao_contem',
    'maior_que', 'menor_que', 'maior_igual', 'menor_igual',
    'vazio', 'nao_vazio',
  ], { required_error: 'Selecione um operador' }),
  valor: z.string().optional(),
  valores: z.array(z.string()).optional(),
})

export type RegraFormData = z.infer<typeof regraFormSchema>
