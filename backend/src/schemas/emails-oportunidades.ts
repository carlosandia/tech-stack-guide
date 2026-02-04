/**
 * AIDEV-NOTE: Schemas Zod para Emails de Oportunidades
 * Conforme PRD-07 - Modal de Detalhes
 *
 * Emails sao registros de comunicacao por email vinculados a oportunidades.
 * Podem ser enviados pelo sistema ou sincronizados de integracao.
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const DirecaoEmailEnum = z.enum(['enviado', 'recebido'])
export type DirecaoEmail = z.infer<typeof DirecaoEmailEnum>

export const StatusEmailEnum = z.enum(['rascunho', 'enviado', 'entregue', 'aberto', 'clicado', 'erro'])
export type StatusEmail = z.infer<typeof StatusEmailEnum>

// =====================================================
// Schema do Email
// =====================================================

export const EmailOportunidadeSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  oportunidade_id: z.string().uuid(),
  usuario_id: z.string().uuid().nullable().optional(), // null se recebido

  direcao: DirecaoEmailEnum,
  status: StatusEmailEnum.default('enviado'),

  de: z.string().email(),
  para: z.array(z.string().email()),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),

  assunto: z.string().max(500),
  corpo_html: z.string(),
  corpo_texto: z.string().nullable().optional(),

  // Tracking
  aberto_em: z.string().datetime().nullable().optional(),
  clicado_em: z.string().datetime().nullable().optional(),
  total_aberturas: z.number().int().default(0),
  total_cliques: z.number().int().default(0),

  // Referencia externa (integracao)
  message_id: z.string().nullable().optional(),
  thread_id: z.string().nullable().optional(),

  // Erro
  erro_mensagem: z.string().nullable().optional(),

  criado_em: z.string().datetime(),
  enviado_em: z.string().datetime().nullable().optional(),
  deletado_em: z.string().datetime().nullable().optional(),
})

export type EmailOportunidade = z.infer<typeof EmailOportunidadeSchema>

// =====================================================
// Schemas de Request - Enviar Email
// =====================================================

export const EnviarEmailSchema = z.object({
  para: z.array(z.string().email()).min(1, 'Informe pelo menos um destinatario'),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  assunto: z.string().min(1, 'Assunto e obrigatorio').max(500),
  corpo_html: z.string().min(1, 'Corpo do email e obrigatorio'),
  corpo_texto: z.string().optional(),
})

export type EnviarEmailPayload = z.infer<typeof EnviarEmailSchema>

// =====================================================
// Schemas de Request - Salvar Rascunho
// =====================================================

export const SalvarRascunhoEmailSchema = z.object({
  para: z.array(z.string().email()).optional(),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  assunto: z.string().max(500).optional(),
  corpo_html: z.string().optional(),
  corpo_texto: z.string().optional(),
})

export type SalvarRascunhoEmailPayload = z.infer<typeof SalvarRascunhoEmailSchema>

// =====================================================
// Response Types
// =====================================================

export const EmailComUsuarioSchema = EmailOportunidadeSchema.extend({
  usuario: z
    .object({
      id: z.string().uuid(),
      nome: z.string(),
      email: z.string().email(),
    })
    .nullable(),
})

export type EmailComUsuario = z.infer<typeof EmailComUsuarioSchema>

export const ListaEmailsResponseSchema = z.object({
  emails: z.array(EmailComUsuarioSchema),
  total: z.number(),
  total_enviados: z.number(),
  total_recebidos: z.number(),
})

export type ListaEmailsResponse = z.infer<typeof ListaEmailsResponseSchema>

// =====================================================
// Schemas de Query - Listagem
// =====================================================

export const ListarEmailsQuerySchema = z.object({
  direcao: DirecaoEmailEnum.optional(),
  status: StatusEmailEnum.optional(),
  busca: z.string().max(255).optional(), // Busca no assunto ou corpo

  // Ordenacao
  ordenar_por: z.enum(['criado_em', 'enviado_em']).default('criado_em'),
  ordem: z.enum(['asc', 'desc']).default('desc'),

  // Paginacao
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(50).default(20),
})

export type ListarEmailsQuery = z.infer<typeof ListarEmailsQuerySchema>
