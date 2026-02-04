import { api } from '@/lib/api'

/**
 * AIDEV-NOTE: Servico de API de autenticacao
 * Comunica com o backend Express
 * Conforme PRD-03 - Autenticacao e Autorizacao
 */

export interface LoginRequest {
  email: string
  senha: string
  lembrar?: boolean
}

export interface LoginResponse {
  success: boolean
  data: {
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
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  nova_senha: string
  confirmar_senha: string
}

export interface PerfilResponse {
  success: boolean
  data: {
    id: string
    nome: string
    sobrenome?: string
    email: string
    telefone?: string
    foto_url?: string
    role: 'super_admin' | 'admin' | 'member'
    organizacao: {
      id: string
      nome: string
    } | null
    criado_em: string
    senha_alterada_em?: string
  }
}

export const authApi = {
  /**
   * Login com email e senha
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/v1/auth/login', data)
    return response.data
  },

  /**
   * Refresh token
   */
  async refresh(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
    const response = await api.post<{ success: boolean; data: { access_token: string; expires_in: number } }>(
      '/v1/auth/refresh',
      { refresh_token: refreshToken }
    )
    return response.data.data
  },

  /**
   * Logout
   */
  async logout(refreshToken?: string): Promise<void> {
    await api.post('/v1/auth/logout', { refresh_token: refreshToken })
  },

  /**
   * Solicitar recuperacao de senha
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await api.post('/v1/auth/forgot-password', data)
  },

  /**
   * Redefinir senha com token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await api.post('/v1/auth/reset-password', data)
  },

  /**
   * Obter perfil do usuario logado
   */
  async getPerfil(): Promise<PerfilResponse> {
    const response = await api.get<PerfilResponse>('/v1/auth/perfil')
    return response.data
  },

  /**
   * Atualizar perfil
   */
  async atualizarPerfil(data: { nome?: string; sobrenome?: string; telefone?: string }): Promise<void> {
    await api.patch('/v1/auth/perfil', data)
  },

  /**
   * Alterar senha
   */
  async alterarSenha(data: { senha_atual: string; nova_senha: string; confirmar_senha: string }): Promise<void> {
    await api.post('/v1/auth/perfil/senha', data)
  },
}
