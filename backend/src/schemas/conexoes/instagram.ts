/**
 * AIDEV-NOTE: Schemas Zod para Instagram Direct
 * Conforme PRD-08 - Secao 7. Instagram Direct
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const StatusInstagramEnum = z.enum(['active', 'expired', 'revoked', 'error'])
export type StatusInstagram = z.infer<typeof StatusInstagramEnum>

export const AccountTypeEnum = z.enum(['BUSINESS', 'CREATOR'])
export type AccountType = z.infer<typeof AccountTypeEnum>

export const TokenTypeEnum = z.enum(['short_lived', 'long_lived'])
export type TokenType = z.infer<typeof TokenTypeEnum>

// =====================================================
// Schema da Conexao Instagram
// =====================================================

export const ConexaoInstagramSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  usuario_id: z.string().uuid(),
  instagram_user_id: z.string(),
  instagram_username: z.string().nullable().optional(),
  instagram_name: z.string().nullable().optional(),
  profile_picture_url: z.string().nullable().optional(),
  account_type: AccountTypeEnum.nullable().optional(),
  access_token_encrypted: z.string(),
  token_type: TokenTypeEnum.default('long_lived'),
  token_expires_at: z.string().datetime().nullable().optional(),
  permissions: z.array(z.string()).default([
    'instagram_business_basic',
    'instagram_business_manage_messages'
  ]),
  webhook_subscribed: z.boolean().default(false),
  total_mensagens_recebidas: z.number().default(0),
  total_mensagens_enviadas: z.number().default(0),
  ultima_mensagem_em: z.string().datetime().nullable().optional(),
  status: StatusInstagramEnum,
  ultimo_sync: z.string().datetime().nullable().optional(),
  ultimo_erro: z.string().nullable().optional(),
  conectado_em: z.string().datetime().nullable().optional(),
  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
})

export type ConexaoInstagram = z.infer<typeof ConexaoInstagramSchema>

// =====================================================
// Response Schemas
// =====================================================

export const AuthUrlInstagramResponseSchema = z.object({
  url: z.string().url(),
  state: z.string(),
})

export type AuthUrlInstagramResponse = z.infer<typeof AuthUrlInstagramResponseSchema>

export const CallbackInstagramSchema = z.object({
  code: z.string(),
  state: z.string(),
})

export type CallbackInstagram = z.infer<typeof CallbackInstagramSchema>

export const StatusInstagramResponseSchema = z.object({
  id: z.string().uuid().optional(),
  conectado: z.boolean(),
  status: StatusInstagramEnum.optional(),
  instagram_user_id: z.string().nullable().optional(),
  instagram_username: z.string().nullable().optional(),
  instagram_name: z.string().nullable().optional(),
  profile_picture_url: z.string().nullable().optional(),
  account_type: AccountTypeEnum.nullable().optional(),
  token_expires_at: z.string().datetime().nullable().optional(),
  dias_ate_expirar: z.number().nullable().optional(),
  permissions: z.array(z.string()).optional(),
  total_mensagens_recebidas: z.number().optional(),
  total_mensagens_enviadas: z.number().optional(),
  ultima_mensagem_em: z.string().datetime().nullable().optional(),
  conectado_em: z.string().datetime().nullable().optional(),
})

export type StatusInstagramResponse = z.infer<typeof StatusInstagramResponseSchema>

// =====================================================
// Mensagem Schemas
// =====================================================

export const EnviarMensagemInstagramSchema = z.object({
  recipient_id: z.string(), // IGSID do destinatario
  message: z.union([
    // Mensagem de texto
    z.object({
      text: z.string(),
    }),
    // Mensagem com anexo
    z.object({
      attachment: z.object({
        type: z.enum(['image', 'video', 'audio', 'file']),
        payload: z.object({
          url: z.string().url(),
        }),
      }),
    }),
    // Resposta rapida
    z.object({
      text: z.string(),
      quick_replies: z.array(z.object({
        content_type: z.literal('text'),
        title: z.string(),
        payload: z.string(),
      })),
    }),
  ]),
})

export type EnviarMensagemInstagram = z.infer<typeof EnviarMensagemInstagramSchema>

export const EnviarMensagemInstagramResponseSchema = z.object({
  message_id: z.string(),
  recipient_id: z.string().optional(),
})

export type EnviarMensagemInstagramResponse = z.infer<typeof EnviarMensagemInstagramResponseSchema>

// =====================================================
// Conversa Schemas
// =====================================================

export const ConversaInstagramSchema = z.object({
  id: z.string(),
  participant_id: z.string(), // IGSID do participante
  participant_username: z.string().optional(),
  participant_name: z.string().optional(),
  participant_profile_pic: z.string().optional(),
  ultima_mensagem: z.string().optional(),
  ultima_mensagem_em: z.string().datetime().optional(),
  nao_lidas: z.number().default(0),
  janela_expira_em: z.string().datetime().optional(), // 24h window
})

export type ConversaInstagram = z.infer<typeof ConversaInstagramSchema>

export const ListarConversasResponseSchema = z.object({
  conversas: z.array(ConversaInstagramSchema),
  paging: z.object({
    cursors: z.object({
      before: z.string().optional(),
      after: z.string().optional(),
    }).optional(),
    next: z.string().optional(),
    previous: z.string().optional(),
  }).optional(),
})

export type ListarConversasResponse = z.infer<typeof ListarConversasResponseSchema>

export const MensagemInstagramSchema = z.object({
  id: z.string(),
  from: z.object({
    id: z.string(),
    username: z.string().optional(),
  }),
  to: z.object({
    id: z.string(),
  }),
  message: z.string().optional(),
  attachments: z.array(z.object({
    type: z.string(),
    payload: z.object({
      url: z.string(),
    }),
  })).optional(),
  created_time: z.string().datetime(),
  is_echo: z.boolean().optional(), // Se foi enviada por nos
})

export type MensagemInstagram = z.infer<typeof MensagemInstagramSchema>

export const ListarMensagensResponseSchema = z.object({
  mensagens: z.array(MensagemInstagramSchema),
  paging: z.object({
    cursors: z.object({
      before: z.string().optional(),
      after: z.string().optional(),
    }).optional(),
    next: z.string().optional(),
    previous: z.string().optional(),
  }).optional(),
})

export type ListarMensagensResponse = z.infer<typeof ListarMensagensResponseSchema>

// =====================================================
// Webhook Schemas
// =====================================================

export const WebhookInstagramPayloadSchema = z.object({
  object: z.literal('instagram'),
  entry: z.array(z.object({
    id: z.string(), // Page ID
    time: z.number(),
    messaging: z.array(z.object({
      sender: z.object({
        id: z.string(), // IGSID remetente
      }),
      recipient: z.object({
        id: z.string(), // IGSID destinatario
      }),
      timestamp: z.number(),
      message: z.object({
        mid: z.string(),
        text: z.string().optional(),
        attachments: z.array(z.object({
          type: z.string(),
          payload: z.object({
            url: z.string(),
          }),
        })).optional(),
        quick_reply: z.object({
          payload: z.string(),
        }).optional(),
        is_echo: z.boolean().optional(),
      }).optional(),
      postback: z.object({
        mid: z.string(),
        title: z.string(),
        payload: z.string(),
      }).optional(),
    })),
  })),
})

export type WebhookInstagramPayload = z.infer<typeof WebhookInstagramPayloadSchema>

// =====================================================
// Refresh Token Schema
// =====================================================

export const RefreshTokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(), // segundos
})

export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>

// =====================================================
// Tipos adicionais para Service
// =====================================================

export const StatusConexaoInstagramSchema = z.object({
  id: z.string().uuid().optional(),
  conectado: z.boolean(),
  status: StatusInstagramEnum.optional(),
  instagram_id: z.string().optional(),
  username: z.string().optional(),
  name: z.string().optional(),
  profile_picture_url: z.string().optional(),
  followers_count: z.number().optional(),
  conectado_em: z.string().optional(),
  ultimo_sync: z.string().optional(),
})

export type StatusConexaoInstagram = z.infer<typeof StatusConexaoInstagramSchema>

export const ContaInstagramSchema = z.object({
  instagram_id: z.string(),
  username: z.string(),
  name: z.string().optional(),
  profile_picture_url: z.string().optional(),
  followers_count: z.number().optional(),
  page_id: z.string(),
  page_name: z.string(),
})

export type ContaInstagram = z.infer<typeof ContaInstagramSchema>

export const ListarContasResponseSchema = z.object({
  contas: z.array(ContaInstagramSchema),
})

export type ListarContasResponse = z.infer<typeof ListarContasResponseSchema>

export const ConversaSchema = z.object({
  id: z.string(),
  participants: z.array(z.any()),
  updated_time: z.string().optional(),
  last_message: z.any().optional(),
})

export type Conversa = z.infer<typeof ConversaSchema>

export const MensagemSchema = z.object({
  id: z.string(),
  message: z.string().optional(),
  from: z.any(),
  created_time: z.string(),
  attachments: z.array(z.any()).optional(),
})

export type Mensagem = z.infer<typeof MensagemSchema>

export const ConectarContaInstagramSchema = z.object({
  instagram_id: z.string(),
  page_id: z.string(),
})

export type ConectarContaInstagram = z.infer<typeof ConectarContaInstagramSchema>
