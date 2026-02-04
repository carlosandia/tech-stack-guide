import { z } from 'zod'
import { UUIDSchema, TimestampsSchema } from './common'

/**
 * AIDEV-NOTE: Schema da tabela organizacoes_saas (Mundo SaaS)
 * Gerenciada exclusivamente pelo Super Admin
 * Representa os tenants do sistema
 */

// Status da organizacao
export const OrganizacaoStatusSchema = z.enum([
  'ativa',
  'suspensa',
  'cancelada',
  'trial',
])

// Plano de assinatura
export const PlanoSchema = z.enum([
  'trial',
  'starter',
  'professional',
  'enterprise',
])

// Schema principal da organizacao (tenant)
export const OrganizacaoSchema = z.object({
  id: UUIDSchema,
  nome: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  documento: z.string().optional(), // CNPJ ou CPF
  email_contato: z.string().email(),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  logo_url: z.string().url().optional(),

  // Configuracoes
  plano: PlanoSchema,
  status: OrganizacaoStatusSchema,
  limite_usuarios: z.number().int().positive().default(5),
  limite_contatos: z.number().int().positive().default(1000),

  // Trial
  trial_inicio: z.string().datetime().optional(),
  trial_fim: z.string().datetime().optional(),

  // Timestamps
  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
})

// Schema para criar organizacao
export const CreateOrganizacaoSchema = OrganizacaoSchema.omit({
  id: true,
  criado_em: true,
  atualizado_em: true,
  deletado_em: true,
}).extend({
  plano: PlanoSchema.default('trial'),
  status: OrganizacaoStatusSchema.default('trial'),
})

// Schema para atualizar organizacao
export const UpdateOrganizacaoSchema = CreateOrganizacaoSchema.partial()

// Tipos derivados
export type Organizacao = z.infer<typeof OrganizacaoSchema>
export type CreateOrganizacao = z.infer<typeof CreateOrganizacaoSchema>
export type UpdateOrganizacao = z.infer<typeof UpdateOrganizacaoSchema>
export type OrganizacaoStatus = z.infer<typeof OrganizacaoStatusSchema>
export type Plano = z.infer<typeof PlanoSchema>
