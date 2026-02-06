/**
 * AIDEV-NOTE: Schema Zod para formulário de Templates de Etapas
 * Conforme PRD-05 - Templates de Etapas do Funil
 * 4 tipos: entrada, normal, ganho, perda
 */

import { z } from 'zod'

export const tipoEtapaOptions = [
  { value: 'entrada', label: 'Entrada', descricao: 'Oportunidades novas entram aqui' },
  { value: 'normal', label: 'Personalizado', descricao: 'Etapa intermediária personalizada' },
  { value: 'ganho', label: 'Ganho', descricao: 'Marca oportunidade como ganha' },
  { value: 'perda', label: 'Perda', descricao: 'Marca oportunidade como perdida' },
] as const

export const coresEtapaDefault = [
  '#3B82F6', // Azul
  '#F59E0B', // Amarelo
  '#F97316', // Laranja
  '#8B5CF6', // Roxo
  '#22C55E', // Verde
  '#EF4444', // Vermelho
  '#06B6D4', // Cyan
  '#EC4899', // Rosa
  '#6B7280', // Cinza
] as const

export const etapaTemplateFormSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255, 'Máximo 255 caracteres'),
  descricao: z.string().optional(),
  tipo: z.enum(['entrada', 'normal', 'ganho', 'perda'], {
    required_error: 'Tipo é obrigatório',
  }),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser hexadecimal').default('#6B7280'),
  probabilidade: z.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%').default(0),
  tarefas_ids: z.array(z.string().uuid()).optional(),
})

export type EtapaTemplateFormData = z.infer<typeof etapaTemplateFormSchema>
