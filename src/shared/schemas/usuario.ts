import { z } from 'zod'
import { UUIDSchema, UserRoleSchema, TimestampsSchema } from './common'

/**
 * AIDEV-NOTE: Schema de usuarios do sistema
 * Usuarios pertencem a uma organizacao (exceto super_admin)
 * Role define permissoes e acesso
 */

// Status do usuario
export const UsuarioStatusSchema = z.enum([
  'ativo',
  'inativo',
  'pendente', // aguardando confirmacao de email
  'bloqueado',
])

// Schema principal do usuario
export const UsuarioSchema = z.object({
  id: UUIDSchema,
  organizacao_id: UUIDSchema.nullable(), // null para super_admin
  auth_id: UUIDSchema, // referencia ao auth.users do Supabase

  nome: z.string().min(1).max(255),
  sobrenome: z.string().max(255).optional(),
  email: z.string().email(),
  telefone: z.string().optional(),
  avatar_url: z.string().url().optional(),

  role: UserRoleSchema,
  status: UsuarioStatusSchema,

  // Configuracoes
  notificacoes_email: z.boolean().default(true),
  notificacoes_push: z.boolean().default(true),

  // Ultimo acesso
  ultimo_login: z.string().datetime().optional(),

  // Timestamps
  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
})

// Schema para criar usuario (Admin ou Member)
export const CreateUsuarioSchema = z.object({
  organizacao_id: UUIDSchema,
  nome: z.string().min(1).max(255),
  sobrenome: z.string().max(255).optional(),
  email: z.string().email(),
  telefone: z.string().optional(),
  role: z.enum(['admin', 'member']), // super_admin nao pode ser criado via API
  senha: z.string().min(8).max(128),
})

// Schema para atualizar usuario
export const UpdateUsuarioSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  sobrenome: z.string().max(255).optional(),
  telefone: z.string().optional(),
  avatar_url: z.string().url().optional(),
  notificacoes_email: z.boolean().optional(),
  notificacoes_push: z.boolean().optional(),
  status: UsuarioStatusSchema.optional(),
})

// Tipos derivados
export type Usuario = z.infer<typeof UsuarioSchema>
export type CreateUsuario = z.infer<typeof CreateUsuarioSchema>
export type UpdateUsuario = z.infer<typeof UpdateUsuarioSchema>
export type UsuarioStatus = z.infer<typeof UsuarioStatusSchema>
