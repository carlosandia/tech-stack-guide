/**
 * AIDEV-NOTE: Schemas Zod para o modulo de Conversas (PRD-09)
 * Inclui schemas para conversas, listagem e alteracao de status
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const CanalConversaEnum = z.enum(['whatsapp', 'instagram'])
export type CanalConversa = z.infer<typeof CanalConversaEnum>

export const TipoConversaEnum = z.enum(['individual', 'grupo', 'canal'])
export type TipoConversa = z.infer<typeof TipoConversaEnum>

export const StatusConversaEnum = z.enum(['aberta', 'pendente', 'fechada'])
export type StatusConversa = z.infer<typeof StatusConversaEnum>

// =====================================================
// Schema Principal
// =====================================================

export const ConversaSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  contato_id: z.string().uuid(),
  usuario_id: z.string().uuid(),
  sessao_whatsapp_id: z.string().uuid().nullable().optional(),
  conexao_instagram_id: z.string().uuid().nullable().optional(),

  chat_id: z.string(),
  canal: CanalConversaEnum,
  tipo: TipoConversaEnum,
  nome: z.string().nullable().optional(),
  foto_url: z.string().nullable().optional(),

  status: StatusConversaEnum,
  total_mensagens: z.number().default(0),
  mensagens_nao_lidas: z.number().default(0),

  ultima_mensagem_em: z.string().datetime().nullable().optional(),
  primeira_mensagem_em: z.string().datetime().nullable().optional(),
  status_alterado_em: z.string().datetime().nullable().optional(),

  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
})

export type Conversa = z.infer<typeof ConversaSchema>

// =====================================================
// Schema com Contato (para listagem)
// =====================================================

export const ConversaComContatoSchema = ConversaSchema.extend({
  contato: z.object({
    id: z.string().uuid(),
    nome: z.string(),
    email: z.string().nullable().optional(),
    telefone: z.string().nullable().optional(),
    foto_url: z.string().nullable().optional(),
  }).optional(),
  ultima_mensagem: z.object({
    id: z.string().uuid(),
    tipo: z.string(),
    body: z.string().nullable().optional(),
    from_me: z.boolean(),
    criado_em: z.string().datetime(),
  }).nullable().optional(),
})

export type ConversaComContato = z.infer<typeof ConversaComContatoSchema>

// =====================================================
// Query Schemas
// =====================================================

export const ListarConversasQuerySchema = z.object({
  // Filtros
  canal: CanalConversaEnum.optional(),
  status: StatusConversaEnum.optional(),
  busca: z.string().optional(),

  // Paginacao
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),

  // Ordenacao
  order_by: z.enum(['ultima_mensagem_em', 'criado_em', 'mensagens_nao_lidas']).default('ultima_mensagem_em'),
  order_dir: z.enum(['asc', 'desc']).default('desc'),
})

export type ListarConversasQuery = z.infer<typeof ListarConversasQuerySchema>

// =====================================================
// Response Schemas
// =====================================================

export const ListarConversasResponseSchema = z.object({
  conversas: z.array(ConversaComContatoSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  total_pages: z.number(),
})

export type ListarConversasResponse = z.infer<typeof ListarConversasResponseSchema>

// =====================================================
// Body Schemas (Request)
// =====================================================

export const CriarConversaSchema = z.object({
  contato_id: z.string().uuid().optional(),
  telefone: z.string().optional(),
  canal: CanalConversaEnum,
  mensagem_inicial: z.string().min(1),
})

export type CriarConversa = z.infer<typeof CriarConversaSchema>

export const AlterarStatusConversaSchema = z.object({
  status: StatusConversaEnum,
})

export type AlterarStatusConversa = z.infer<typeof AlterarStatusConversaSchema>

// =====================================================
// Schema Interno (para webhooks)
// =====================================================

export const BuscarOuCriarConversaSchema = z.object({
  organizacao_id: z.string().uuid(),
  chat_id: z.string(),
  canal: CanalConversaEnum,
  tipo: TipoConversaEnum.default('individual'),
  sessao_whatsapp_id: z.string().uuid().optional(),
  conexao_instagram_id: z.string().uuid().optional(),
  contato_id: z.string().uuid().optional(),
  usuario_id: z.string().uuid(),
  nome: z.string().optional(),
  foto_url: z.string().optional(),
})

export type BuscarOuCriarConversa = z.infer<typeof BuscarOuCriarConversaSchema>
