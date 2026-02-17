/**
 * AIDEV-NOTE: Schema Zod para formulário de Templates de Tarefas
 * Conforme PRD-05 - Templates de Tarefas
 * 6 tipos: ligacao, email, reuniao, whatsapp, visita, outro
 */

import { z } from 'zod'

export const tipoTarefaOptions = [
  { value: 'ligacao', label: 'Ligação', icon: 'Phone' },
  { value: 'email', label: 'E-mail', icon: 'Mail' },
  { value: 'reuniao', label: 'Reunião', icon: 'Calendar' },
  { value: 'whatsapp', label: 'WhatsApp', icon: 'MessageCircle' },
  { value: 'visita', label: 'Visita', icon: 'MapPin' },
  { value: 'outro', label: 'Outro', icon: 'CheckSquare' },
] as const

export const canalTarefaOptions = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'email', label: 'E-mail' },
  { value: 'telefone', label: 'Telefone' },
] as const

export const prioridadeTarefaOptions = [
  { value: 'baixa', label: 'Baixa', cor: '#22C55E' },
  { value: 'media', label: 'Média', cor: '#F59E0B' },
  { value: 'alta', label: 'Alta', cor: '#F97316' },
  { value: 'urgente', label: 'Urgente', cor: '#EF4444' },
] as const

export const modoTarefaOptions = [
  { value: 'comum', label: 'Tarefa Comum', descricao: 'Tarefa padrão sem envio de mensagem' },
  { value: 'cadencia', label: 'Cadência Comercial', descricao: 'Tarefa com mensagem pré-configurada para envio' },
] as const

export const tarefaTemplateFormSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório').max(255, 'Máximo 255 caracteres'),
  descricao: z.string().optional(),
  tipo: z.enum(['ligacao', 'email', 'reuniao', 'whatsapp', 'visita', 'outro'], {
    required_error: 'Tipo é obrigatório',
  }),
  canal: z.enum(['whatsapp', 'instagram', 'email', 'telefone']).optional().nullable(),
  prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']).default('media'),
  dias_prazo: z.number().min(0, 'Prazo deve ser positivo').default(1),
  modo: z.enum(['comum', 'cadencia']).default('comum'),
  assunto_email: z.string().max(500).optional().nullable(),
  corpo_mensagem: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.modo === 'cadencia') {
    if (data.tipo !== 'email' && data.tipo !== 'whatsapp') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Cadência só permite tipo E-mail ou WhatsApp', path: ['tipo'] })
    }
    if (!data.corpo_mensagem || data.corpo_mensagem.trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Mensagem é obrigatória para cadência', path: ['corpo_mensagem'] })
    }
    if (data.tipo === 'email' && (!data.assunto_email || data.assunto_email.trim() === '')) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Assunto é obrigatório para e-mail', path: ['assunto_email'] })
    }
  }
})

export type TarefaTemplateFormData = z.infer<typeof tarefaTemplateFormSchema>
