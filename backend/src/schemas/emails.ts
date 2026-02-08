import { z } from 'zod'

/**
 * AIDEV-NOTE: Schemas Zod para o modulo Caixa de Entrada de Email (PRD-11)
 * Validacao de entrada para todas as rotas de email
 */

// =====================================================
// Enums
// =====================================================

export const PastaEmailSchema = z.enum(['inbox', 'sent', 'drafts', 'archived', 'trash'])
export type PastaEmail = z.infer<typeof PastaEmailSchema>

export const TipoRascunhoSchema = z.enum(['novo', 'resposta', 'encaminhar'])
export type TipoRascunho = z.infer<typeof TipoRascunhoSchema>

export const TipoTrackingSchema = z.enum(['enviado', 'entregue', 'aberto', 'clicado'])
export type TipoTracking = z.infer<typeof TipoTrackingSchema>

export const StatusSyncSchema = z.enum(['pendente', 'sincronizando', 'ok', 'erro'])
export type StatusSync = z.infer<typeof StatusSyncSchema>

// =====================================================
// Query Schemas
// =====================================================

export const ListarEmailsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  pasta: PastaEmailSchema.default('inbox'),
  lido: z.coerce.boolean().optional(),
  favorito: z.coerce.boolean().optional(),
  tem_anexos: z.coerce.boolean().optional(),
  contato_id: z.string().uuid().optional(),
  busca: z.string().min(1).max(200).optional(),
  data_inicio: z.string().datetime().optional(),
  data_fim: z.string().datetime().optional(),
  conexao_email_id: z.string().uuid().optional(),
})
export type ListarEmailsQuery = z.infer<typeof ListarEmailsQuerySchema>

// =====================================================
// Mutation Schemas
// =====================================================

export const AtualizarEmailSchema = z.object({
  lido: z.boolean().optional(),
  favorito: z.boolean().optional(),
  pasta: PastaEmailSchema.optional(),
  contato_id: z.string().uuid().nullable().optional(),
  oportunidade_id: z.string().uuid().nullable().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'Pelo menos um campo deve ser informado',
})
export type AtualizarEmail = z.infer<typeof AtualizarEmailSchema>

export const AcaoLoteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  acao: z.enum(['marcar_lido', 'marcar_nao_lido', 'arquivar', 'mover_lixeira', 'favoritar', 'desfavoritar', 'restaurar']),
})
export type AcaoLote = z.infer<typeof AcaoLoteSchema>

export const EnviarEmailSchema = z.object({
  para_email: z.string().email(),
  cc_email: z.string().optional(),
  bcc_email: z.string().optional(),
  assunto: z.string().min(1).max(500),
  corpo_html: z.string().min(1),
  conexao_email_id: z.string().uuid().optional(),
})
export type EnviarEmailPayload = z.infer<typeof EnviarEmailSchema>

export const ResponderEmailSchema = z.object({
  corpo_html: z.string().min(1),
  cc_email: z.string().optional(),
  bcc_email: z.string().optional(),
})
export type ResponderEmailPayload = z.infer<typeof ResponderEmailSchema>

export const EncaminharEmailSchema = z.object({
  para_email: z.string().email(),
  cc_email: z.string().optional(),
  bcc_email: z.string().optional(),
  corpo_html: z.string().optional(),
})
export type EncaminharEmailPayload = z.infer<typeof EncaminharEmailSchema>

// =====================================================
// Rascunho Schemas
// =====================================================

export const CriarRascunhoSchema = z.object({
  id: z.string().uuid().optional(),
  tipo: TipoRascunhoSchema.default('novo'),
  email_original_id: z.string().uuid().optional(),
  para_email: z.string().optional(),
  cc_email: z.string().optional(),
  bcc_email: z.string().optional(),
  assunto: z.string().optional(),
  corpo_html: z.string().optional(),
  anexos_temp: z.any().optional(),
})
export type CriarRascunho = z.infer<typeof CriarRascunhoSchema>

// =====================================================
// Assinatura Schemas
// =====================================================

export const SalvarAssinaturaSchema = z.object({
  assinatura_html: z.string().nullable(),
  incluir_em_respostas: z.boolean().default(true),
  incluir_em_novos: z.boolean().default(true),
})
export type SalvarAssinatura = z.infer<typeof SalvarAssinaturaSchema>
