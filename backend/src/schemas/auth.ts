import { z } from 'zod'

/**
 * AIDEV-NOTE: Schemas de autenticacao
 * Validacao de inputs para endpoints de auth
 * Conforme PRD-03 - Autenticacao e Autorizacao
 */

// Schema de login
export const LoginSchema = z.object({
  email: z.string().email('Email invalido'),
  senha: z.string().min(1, 'Senha obrigatoria'),
  lembrar: z.boolean().optional().default(false), // Lembrar por 30 dias
})

// Schema de refresh token
export const RefreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token obrigatorio'),
})

// Schema de recuperacao de senha
export const ForgotPasswordSchema = z.object({
  email: z.string().email('Email invalido'),
})

// AIDEV-NOTE: SEGURANCA - Regex para validacao de senha forte
// Exige: minimo 8 chars, 1 maiuscula, 1 numero, 1 caractere especial
// Isso segue as melhores praticas de seguranca OWASP
const senhaForteRegex = {
  maiuscula: /[A-Z]/,
  numero: /[0-9]/,
  especial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/,
}

// Schema de redefinicao de senha
export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token obrigatorio'),
  nova_senha: z
    .string()
    .min(8, 'Minimo 8 caracteres')
    .regex(senhaForteRegex.maiuscula, 'Deve conter pelo menos 1 letra maiuscula')
    .regex(senhaForteRegex.numero, 'Deve conter pelo menos 1 numero')
    .regex(senhaForteRegex.especial, 'Deve conter pelo menos 1 caractere especial (!@#$%^&*...)'),
  confirmar_senha: z.string(),
}).refine(data => data.nova_senha === data.confirmar_senha, {
  message: 'Senhas nao conferem',
  path: ['confirmar_senha'],
})

// Schema de alteracao de senha (usuario logado)
export const AlterarSenhaSchema = z.object({
  senha_atual: z.string().min(1, 'Senha atual obrigatoria'),
  nova_senha: z
    .string()
    .min(8, 'Minimo 8 caracteres')
    .regex(senhaForteRegex.maiuscula, 'Deve conter pelo menos 1 letra maiuscula')
    .regex(senhaForteRegex.numero, 'Deve conter pelo menos 1 numero')
    .regex(senhaForteRegex.especial, 'Deve conter pelo menos 1 caractere especial (!@#$%^&*...)'),
  confirmar_senha: z.string(),
}).refine(data => data.nova_senha === data.confirmar_senha, {
  message: 'Senhas nao conferem',
  path: ['confirmar_senha'],
})

// Schema de atualizacao de perfil
export const AtualizarPerfilSchema = z.object({
  nome: z.string().min(2, 'Minimo 2 caracteres').max(100, 'Maximo 100 caracteres').optional(),
  sobrenome: z.string().min(2, 'Minimo 2 caracteres').max(100, 'Maximo 100 caracteres').optional(),
  telefone: z
    .string()
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Formato invalido: (XX) XXXXX-XXXX')
    .nullable()
    .optional(),
})

// Tipos derivados
export type LoginInput = z.infer<typeof LoginSchema>
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>
export type AlterarSenhaInput = z.infer<typeof AlterarSenhaSchema>
export type AtualizarPerfilInput = z.infer<typeof AtualizarPerfilSchema>

// Response types
export interface AuthResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  usuario: {
    id: string
    email: string
    nome: string
    sobrenome?: string
    role: 'super_admin' | 'admin' | 'member'
    organizacao_id: string | null
    avatar_url?: string
  }
}

export interface JWTPayload {
  sub: string           // user_id
  email: string
  nome: string
  organizacao_id: string | null
  role: 'super_admin' | 'admin' | 'member'
  perfil_id?: string    // para members
  iat: number           // issued at
  exp: number           // expiration
}
