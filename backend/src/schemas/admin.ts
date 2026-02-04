import { z } from 'zod'

/**
 * AIDEV-NOTE: Schemas de validacao para API do Super Admin
 * Conforme PRD-14 - Painel Super Admin
 */

// =======================
// ORGANIZACOES (TENANTS)
// =======================

// Segmentos disponiveis
export const SegmentosEnum = z.enum([
  'marketing',
  'software',
  'saas',
  'ecommerce',
  'servicos',
  'educacao',
  'saude',
  'financeiro',
  'imobiliario',
  'varejo',
  'industria',
  'consultoria',
  'outro',
])

// Etapa 1: Dados da Empresa
export const CriarOrganizacaoEtapa1Schema = z.object({
  nome: z.string().min(2, 'Nome deve ter no minimo 2 caracteres').max(255),
  segmento: SegmentosEnum,
  website: z.string().url('URL invalida').optional().or(z.literal('')),
  telefone: z.string().optional(),
  email: z.string().email('Email invalido'),
  endereco: z.object({
    cep: z.string().optional(),
    logradouro: z.string().optional(),
    numero: z.string().optional(),
    complemento: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
  }).optional(),
})

// Etapa 2: Expectativas
export const CriarOrganizacaoEtapa2Schema = z.object({
  numero_usuarios: z.enum(['1-5', '6-10', '11-25', '26-50', '50+']),
  volume_leads_mes: z.enum(['menos_100', '100-500', '500-1000', 'mais_1000']),
  principal_objetivo: z.enum(['vendas', 'marketing', 'atendimento', 'todos']),
  como_conheceu: z.enum(['google', 'indicacao', 'redes_sociais', 'outro']).optional(),
  observacoes: z.string().max(1000).optional(),
})

// Etapa 3: Dados do Administrador (schema base sem refine para permitir merge)
export const CriarOrganizacaoEtapa3BaseSchema = z.object({
  admin_nome: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  admin_sobrenome: z.string().min(2, 'Sobrenome deve ter no minimo 2 caracteres'),
  admin_email: z.string().email('Email invalido'),
  admin_telefone: z.string().optional(),
  enviar_convite: z.boolean().default(true),
  senha_inicial: z.string().min(8, 'Senha deve ter no minimo 8 caracteres').optional(),
})

// Etapa 3 com validacao (para uso individual)
export const CriarOrganizacaoEtapa3Schema = CriarOrganizacaoEtapa3BaseSchema.refine((data) => {
  // Se nao enviar convite, senha e obrigatoria
  if (!data.enviar_convite && !data.senha_inicial) {
    return false
  }
  return true
}, {
  message: 'Senha inicial e obrigatoria quando nao enviar convite',
  path: ['senha_inicial'],
})

// Schema completo do Wizard (combinado com validacao no final)
export const CriarOrganizacaoSchema = CriarOrganizacaoEtapa1Schema
  .merge(CriarOrganizacaoEtapa2Schema)
  .merge(CriarOrganizacaoEtapa3BaseSchema)
  .refine((data) => {
    // Se nao enviar convite, senha e obrigatoria
    if (!data.enviar_convite && !data.senha_inicial) {
      return false
    }
    return true
  }, {
    message: 'Senha inicial e obrigatoria quando nao enviar convite',
    path: ['senha_inicial'],
  })

// Atualizar organizacao
export const AtualizarOrganizacaoSchema = z.object({
  nome: z.string().min(2).max(255).optional(),
  segmento: SegmentosEnum.optional(),
  website: z.string().url().optional().or(z.literal('')),
  telefone: z.string().optional(),
  email: z.string().email().optional(),
  endereco: z.object({
    cep: z.string().optional(),
    logradouro: z.string().optional(),
    numero: z.string().optional(),
    complemento: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
  }).optional(),
  status: z.enum(['ativa', 'suspensa', 'trial', 'cancelada']).optional(),
})

// Filtros de listagem
export const ListarOrganizacoesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  busca: z.string().optional(),
  status: z.enum(['ativa', 'suspensa', 'trial', 'cancelada', 'todas']).default('todas'),
  plano: z.string().uuid().optional(),
  segmento: SegmentosEnum.optional(),
  ordenar_por: z.enum(['nome', 'criado_em', 'plano']).default('criado_em'),
  ordem: z.enum(['asc', 'desc']).default('desc'),
})

// =======================
// PLANOS
// =======================

export const CriarPlanoSchema = z.object({
  nome: z.string().min(2).max(100),
  descricao: z.string().max(500).optional(),
  preco_mensal: z.number().nonnegative(),
  preco_anual: z.number().nonnegative().optional(),
  moeda: z.string().length(3).default('BRL'),
  limite_usuarios: z.number().int().positive(),
  limite_oportunidades: z.number().int().positive().nullable().optional(),
  limite_storage_mb: z.number().int().positive(),
  limite_contatos: z.number().int().positive().nullable().optional(),
  stripe_price_id_mensal: z.string().optional(),
  stripe_price_id_anual: z.string().optional(),
  ativo: z.boolean().default(true),
  visivel: z.boolean().default(true),
  ordem: z.number().int().nonnegative().default(0),
})

export const AtualizarPlanoSchema = CriarPlanoSchema.partial()

export const DefinirModulosPlanoSchema = z.object({
  modulos: z.array(z.object({
    modulo_id: z.string().uuid(),
    configuracoes: z.record(z.unknown()).optional(),
  })),
})

// =======================
// MODULOS
// =======================

export const AtualizarModulosOrganizacaoSchema = z.object({
  modulos: z.array(z.object({
    modulo_id: z.string().uuid(),
    ativo: z.boolean(),
    ordem: z.number().int().nonnegative().optional(),
    configuracoes: z.record(z.unknown()).optional(),
  })),
})

// =======================
// CONFIGURACOES GLOBAIS
// =======================

export const PlataformasEnum = z.enum([
  'meta',
  'google',
  'recaptcha',
  'stripe',
  'waha',
  'email_sistema',
])

export const AtualizarConfigGlobalSchema = z.object({
  configuracoes: z.record(z.unknown()),
})

// Schemas especificos por plataforma
export const ConfigMetaSchema = z.object({
  app_id: z.string().optional(),
  app_secret_encrypted: z.string().optional(),
  webhook_verify_token_encrypted: z.string().optional(),
  webhook_base_url: z.string().url().optional(),
  modo_sandbox: z.boolean().default(false),
})

export const ConfigGoogleSchema = z.object({
  client_id: z.string().optional(),
  client_secret_encrypted: z.string().optional(),
  redirect_uri: z.string().url().optional(),
  servicos: z.object({
    calendar: z.boolean().default(false),
    gmail: z.boolean().default(false),
  }).optional(),
})

export const ConfigRecaptchaSchema = z.object({
  site_key: z.string().optional(),
  secret_key_encrypted: z.string().optional(),
  score_threshold: z.number().min(0).max(1).default(0.5),
  ativo_globalmente: z.boolean().default(false),
})

export const ConfigStripeSchema = z.object({
  public_key: z.string().optional(),
  secret_key_encrypted: z.string().optional(),
  webhook_secret_encrypted: z.string().optional(),
  ambiente: z.enum(['test', 'live']).default('test'),
})

export const ConfigWahaSchema = z.object({
  api_url: z.string().url().optional(),
  api_key_encrypted: z.string().optional(),
  webhook_url: z.string().url().optional(),
})

export const ConfigEmailSistemaSchema = z.object({
  smtp_host: z.string().optional(),
  smtp_port: z.number().int().positive().default(587),
  smtp_user: z.string().optional(),
  smtp_pass_encrypted: z.string().optional(),
  from_email: z.string().email().optional(),
  from_name: z.string().default('CRM Renove'),
})

// =======================
// METRICAS
// =======================

export const MetricasPeriodoSchema = z.object({
  periodo: z.enum(['7d', '30d', '90d', '12m']).default('30d'),
})

// =======================
// IMPERSONACAO
// =======================

export const ImpersonarSchema = z.object({
  motivo: z.string().min(5, 'Motivo deve ter no minimo 5 caracteres').max(500),
})

// =======================
// TIPOS INFERIDOS
// =======================

export type CriarOrganizacao = z.infer<typeof CriarOrganizacaoSchema>
export type AtualizarOrganizacao = z.infer<typeof AtualizarOrganizacaoSchema>
export type ListarOrganizacoesQuery = z.infer<typeof ListarOrganizacoesQuerySchema>
export type CriarPlano = z.infer<typeof CriarPlanoSchema>
export type AtualizarPlano = z.infer<typeof AtualizarPlanoSchema>
export type DefinirModulosPlano = z.infer<typeof DefinirModulosPlanoSchema>
export type AtualizarModulosOrganizacao = z.infer<typeof AtualizarModulosOrganizacaoSchema>
export type AtualizarConfigGlobal = z.infer<typeof AtualizarConfigGlobalSchema>
export type Plataforma = z.infer<typeof PlataformasEnum>
export type MetricasPeriodo = z.infer<typeof MetricasPeriodoSchema>
export type Impersonar = z.infer<typeof ImpersonarSchema>
