/**
 * AIDEV-NOTE: Schemas Zod para validação frontend de Formulários
 * Conforme PRD-17
 */

import { z } from 'zod'

export const TipoFormularioOptions = [
  { value: 'inline', label: 'Inline (Embutido)' },
  { value: 'popup', label: 'Popup' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'multi_step', label: 'Multi-step' },
] as const

export const StatusFormularioOptions = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'publicado', label: 'Publicado' },
  { value: 'arquivado', label: 'Arquivado' },
] as const

export const criarFormularioSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  tipo: z.enum(['inline', 'popup', 'newsletter', 'multi_step'], {
    required_error: 'Selecione o tipo do formulário',
  }),
  descricao: z.string().max(500).optional(),
})

export type CriarFormularioInput = z.infer<typeof criarFormularioSchema>
