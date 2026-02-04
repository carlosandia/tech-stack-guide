/**
 * AIDEV-NOTE: Schemas Zod para Meta Ads (Lead Ads, CAPI, Audiences)
 * Conforme PRD-08 - Secoes 2, 3 e 4
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const StatusMetaEnum = z.enum(['active', 'expired', 'revoked'])
export type StatusMeta = z.infer<typeof StatusMetaEnum>

export const EventoCapiEnum = z.enum(['lead', 'schedule', 'mql', 'won', 'lost'])
export type EventoCapi = z.infer<typeof EventoCapiEnum>

export const TipoSincronizacaoEnum = z.enum(['evento', 'manual'])
export type TipoSincronizacao = z.infer<typeof TipoSincronizacaoEnum>

export const EventoGatilhoEnum = z.enum(['lead', 'mql', 'schedule', 'won', 'lost'])
export type EventoGatilho = z.infer<typeof EventoGatilhoEnum>

// =====================================================
// Conexao Meta Schema
// =====================================================

export const ConexaoMetaSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  access_token_encrypted: z.string(),
  refresh_token_encrypted: z.string().nullable().optional(),
  token_expires_at: z.string().datetime().nullable().optional(),
  meta_user_id: z.string().nullable().optional(),
  meta_user_name: z.string().nullable().optional(),
  meta_user_email: z.string().nullable().optional(),
  status: StatusMetaEnum,
  ultimo_sync: z.string().datetime().nullable().optional(),
  ultimo_erro: z.string().nullable().optional(),
  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
})

export type ConexaoMeta = z.infer<typeof ConexaoMetaSchema>

// =====================================================
// Response Schemas
// =====================================================

export const StatusMetaResponseSchema = z.object({
  id: z.string().uuid().optional(),
  conectado: z.boolean(),
  status: StatusMetaEnum.optional(),
  meta_user_id: z.string().nullable().optional(),
  meta_user_name: z.string().nullable().optional(),
  meta_user_email: z.string().nullable().optional(),
  ultimo_sync: z.string().datetime().nullable().optional(),
})

export type StatusMetaResponse = z.infer<typeof StatusMetaResponseSchema>

export const AuthUrlMetaResponseSchema = z.object({
  url: z.string().url(),
  state: z.string(),
})

export type AuthUrlMetaResponse = z.infer<typeof AuthUrlMetaResponseSchema>

export const CallbackMetaSchema = z.object({
  code: z.string(),
  state: z.string(),
})

export type CallbackMeta = z.infer<typeof CallbackMetaSchema>

// =====================================================
// Paginas Meta Schemas
// =====================================================

export const PaginaMetaSchema = z.object({
  id: z.string().uuid(),
  conexao_id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  page_id: z.string(),
  page_name: z.string().nullable().optional(),
  page_access_token_encrypted: z.string().nullable().optional(),
  leads_retrieval: z.boolean().default(false),
  pages_manage_ads: z.boolean().default(false),
  ativo: z.boolean().default(true),
  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
})

export type PaginaMeta = z.infer<typeof PaginaMetaSchema>

export const ListarPaginasResponseSchema = z.object({
  paginas: z.array(z.object({
    page_id: z.string(),
    page_name: z.string(),
    access_token: z.string().optional(), // Nao expor
    can_post: z.boolean().optional(),
    tasks: z.array(z.string()).optional(),
  })),
})

export type ListarPaginasResponse = z.infer<typeof ListarPaginasResponseSchema>

export const SelecionarPaginaSchema = z.object({
  page_id: z.string(),
  page_name: z.string().optional(),
})

export type SelecionarPagina = z.infer<typeof SelecionarPaginaSchema>

// =====================================================
// Formularios Lead Ads Schemas
// =====================================================

export const FormularioLeadAdsSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  pagina_id: z.string().uuid(),
  form_id: z.string(),
  form_name: z.string().nullable().optional(),
  funil_id: z.string().uuid().nullable().optional(),
  etapa_destino_id: z.string().uuid().nullable().optional(),
  owner_id: z.string().uuid().nullable().optional(),
  mapeamento_campos: z.record(z.string()).default({}),
  criar_oportunidade: z.boolean().default(true),
  tags_automaticas: z.array(z.string()).default([]),
  notificar_owner: z.boolean().default(true),
  total_leads_recebidos: z.number().default(0),
  ultimo_lead_recebido: z.string().datetime().nullable().optional(),
  ativo: z.boolean().default(true),
  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
})

export type FormularioLeadAds = z.infer<typeof FormularioLeadAdsSchema>

export const ListarFormulariosResponseSchema = z.object({
  formularios: z.array(z.object({
    form_id: z.string(),
    form_name: z.string(),
    status: z.string(),
    created_time: z.string().optional(),
    leads_count: z.number().optional(),
  })),
})

export type ListarFormulariosResponse = z.infer<typeof ListarFormulariosResponseSchema>

export const CriarMapeamentoLeadAdsSchema = z.object({
  pagina_id: z.string().uuid(),
  form_id: z.string(),
  form_name: z.string().optional(),
  funil_id: z.string().uuid(),
  etapa_destino_id: z.string().uuid(),
  owner_id: z.string().uuid().nullable().optional(),
  mapeamento_campos: z.record(z.string()), // form_field -> campo_crm
  criar_oportunidade: z.boolean().default(true),
  tags_automaticas: z.array(z.string()).optional(),
  notificar_owner: z.boolean().default(true),
})

export type CriarMapeamentoLeadAds = z.infer<typeof CriarMapeamentoLeadAdsSchema>

export const AtualizarMapeamentoLeadAdsSchema = CriarMapeamentoLeadAdsSchema.partial()

export type AtualizarMapeamentoLeadAds = z.infer<typeof AtualizarMapeamentoLeadAdsSchema>

// =====================================================
// Conversions API (CAPI) Schemas
// =====================================================

export const ConfigCapiSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  pixel_id: z.string(),
  access_token_encrypted: z.string(),
  eventos_habilitados: z.object({
    lead: z.boolean().default(true),
    schedule: z.boolean().default(true),
    mql: z.boolean().default(true),
    won: z.boolean().default(true),
    lost: z.boolean().default(true),
  }),
  config_eventos: z.object({
    won: z.object({
      enviar_valor: z.boolean().default(true),
    }).optional(),
  }).optional(),
  ativo: z.boolean().default(false),
  ultimo_teste: z.string().datetime().nullable().optional(),
  ultimo_teste_sucesso: z.boolean().nullable().optional(),
  total_eventos_enviados: z.number().default(0),
  total_eventos_sucesso: z.number().default(0),
  ultimo_evento_enviado: z.string().datetime().nullable().optional(),
  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
})

export type ConfigCapi = z.infer<typeof ConfigCapiSchema>

export const CriarConfigCapiSchema = z.object({
  pixel_id: z.string(),
  access_token: z.string(),
  eventos_habilitados: z.object({
    lead: z.boolean().default(true),
    schedule: z.boolean().default(true),
    mql: z.boolean().default(true),
    won: z.boolean().default(true),
    lost: z.boolean().default(true),
  }).optional(),
  config_eventos: z.object({
    won: z.object({
      enviar_valor: z.boolean().default(true),
    }).optional(),
  }).optional(),
  ativo: z.boolean().default(false),
})

export type CriarConfigCapi = z.infer<typeof CriarConfigCapiSchema>

export const AtualizarConfigCapiSchema = CriarConfigCapiSchema.partial()

export type AtualizarConfigCapi = z.infer<typeof AtualizarConfigCapiSchema>

export const TestarCapiResponseSchema = z.object({
  success: z.boolean(),
  event_id: z.string().optional(),
  message: z.string(),
})

export type TestarCapiResponse = z.infer<typeof TestarCapiResponseSchema>

export const LogCapiSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  config_id: z.string().uuid().nullable().optional(),
  event_name: z.string(),
  event_time: z.string().datetime(),
  entidade_tipo: z.string().nullable().optional(),
  entidade_id: z.string().uuid().nullable().optional(),
  payload_resumo: z.record(z.any()).nullable().optional(),
  status: z.enum(['sent', 'failed', 'pending']),
  response_code: z.number().nullable().optional(),
  response_body: z.string().nullable().optional(),
  fbrq_event_id: z.string().nullable().optional(),
  criado_em: z.string().datetime(),
})

export type LogCapi = z.infer<typeof LogCapiSchema>

// =====================================================
// Custom Audiences Schemas
// =====================================================

export const CustomAudienceSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  conexao_meta_id: z.string().uuid().nullable().optional(),
  audience_id: z.string(),
  audience_name: z.string(),
  ad_account_id: z.string(),
  tipo_sincronizacao: TipoSincronizacaoEnum,
  evento_gatilho: EventoGatilhoEnum.nullable().optional(),
  total_usuarios: z.number().default(0),
  ultimo_sync: z.string().datetime().nullable().optional(),
  ultimo_sync_sucesso: z.boolean().nullable().optional(),
  ativo: z.boolean().default(true),
  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
})

export type CustomAudience = z.infer<typeof CustomAudienceSchema>

export const CriarCustomAudienceSchema = z.object({
  audience_name: z.string(),
  ad_account_id: z.string(),
  tipo_sincronizacao: TipoSincronizacaoEnum.default('evento'),
  evento_gatilho: EventoGatilhoEnum.optional(),
})

export type CriarCustomAudience = z.infer<typeof CriarCustomAudienceSchema>

export const AtualizarCustomAudienceSchema = z.object({
  audience_name: z.string().optional(),
  tipo_sincronizacao: TipoSincronizacaoEnum.optional(),
  evento_gatilho: EventoGatilhoEnum.nullable().optional(),
  ativo: z.boolean().optional(),
})

export type AtualizarCustomAudience = z.infer<typeof AtualizarCustomAudienceSchema>

export const AudienceMembroSchema = z.object({
  id: z.string().uuid(),
  audience_id: z.string().uuid(),
  contato_id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  email_hash: z.string().nullable().optional(),
  phone_hash: z.string().nullable().optional(),
  sincronizado: z.boolean().default(false),
  sincronizado_em: z.string().datetime().nullable().optional(),
  erro_sincronizacao: z.string().nullable().optional(),
  criado_em: z.string().datetime(),
})

export type AudienceMembro = z.infer<typeof AudienceMembroSchema>

// =====================================================
// Webhook Lead Ads Schema
// =====================================================

export const WebhookLeadAdsPayloadSchema = z.object({
  object: z.string(),
  entry: z.array(z.object({
    id: z.string(),
    time: z.number(),
    changes: z.array(z.object({
      field: z.string(),
      value: z.object({
        form_id: z.string(),
        leadgen_id: z.string(),
        page_id: z.string(),
        created_time: z.number(),
      }),
    })),
  })),
})

export type WebhookLeadAdsPayload = z.infer<typeof WebhookLeadAdsPayloadSchema>

// =====================================================
// Request Schemas adicionais (para routes)
// =====================================================

export const CriarMapeamentoFormularioSchema = z.object({
  page_id: z.string(),
  form_id: z.string(),
  funil_id: z.string().uuid(),
  mapeamento_campos: z.record(z.string()),
})

export type CriarMapeamentoFormulario = z.infer<typeof CriarMapeamentoFormularioSchema>

export const ConfigurarCapiSchema = z.object({
  pixel_id: z.string(),
  access_token: z.string(),
})

export type ConfigurarCapi = z.infer<typeof ConfigurarCapiSchema>

export const EventoCapiPayloadSchema = z.object({
  event_name: z.string(),
  event_time: z.number().optional(),
  event_id: z.string().optional(),
  action_source: z.enum(['website', 'app', 'phone_call', 'chat', 'email', 'physical_store', 'system_generated', 'other']).optional(),
  event_source_url: z.string().optional(),
  user_data: z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    external_id: z.string().optional(),
    client_ip_address: z.string().optional(),
    client_user_agent: z.string().optional(),
    fbc: z.string().optional(),
    fbp: z.string().optional(),
  }).optional(),
  custom_data: z.record(z.any()).optional(),
})

export type EventoCapiPayload = z.infer<typeof EventoCapiPayloadSchema>

export const EnviarEventoCapiResponseSchema = z.object({
  event_id: z.string(),
  events_received: z.number().optional(),
  fbtrace_id: z.string().optional(),
})

export type EnviarEventoCapiResponse = z.infer<typeof EnviarEventoCapiResponseSchema>

export const AdicionarMembrosAudienceSchema = z.object({
  schema: z.array(z.string()).optional(),
  members: z.array(z.object({
    contato_id: z.string().uuid().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    external_id: z.string().optional(),
  })),
})

export type AdicionarMembrosAudience = z.infer<typeof AdicionarMembrosAudienceSchema>

export const StatusConexaoMetaSchema = z.object({
  id: z.string().uuid().optional(),
  conectado: z.boolean(),
  status: StatusMetaEnum.optional(),
  meta_user_name: z.string().optional(),
  paginas_conectadas: z.number().optional(),
  conectado_em: z.string().optional(),
  ultimo_sync: z.string().optional(),
})

export type StatusConexaoMeta = z.infer<typeof StatusConexaoMetaSchema>
