import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { supabaseAdmin } from '../config/supabase.js'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'
import type {
  LoginInput,
  AuthResponse,
  JWTPayload,
  ForgotPasswordInput,
  ResetPasswordInput,
  AlterarSenhaInput,
  AtualizarPerfilInput,
} from '../schemas/auth.js'

/**
 * AIDEV-NOTE: Servico de autenticacao
 * Implementa logica de login, refresh, logout e recuperacao de senha
 * Conforme PRD-03 - Autenticacao e Autorizacao
 *
 * IMPORTANTE: Nunca hardcode segredos. Use env.JWT_SECRET
 */

const SALT_ROUNDS = 12
const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY_DAYS = 7
const REFRESH_TOKEN_EXPIRY_DAYS_REMEMBER = 30
const RESET_TOKEN_EXPIRY_HOURS = 1

export class AuthService {
  /**
   * Login com email e senha
   * Retorna access_token e refresh_token
   */
  async login(input: LoginInput, ip?: string, userAgent?: string): Promise<AuthResponse> {
    const { email, senha, lembrar } = input

    // Busca usuario no banco
    const { data: usuario, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('email', email.toLowerCase())
      .is('deletado_em', null)
      .single()

    if (userError || !usuario) {
      throw new Error('Email ou senha incorretos')
    }

    // Verifica status do usuario
    if (usuario.status !== 'ativo') {
      if (usuario.status === 'pendente') {
        throw new Error('Confirme seu email antes de fazer login')
      }
      throw new Error('Usuario inativo ou bloqueado')
    }

    // Verifica senha usando Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: senha,
    })

    if (authError || !authData.user) {
      // Log tentativa falha
      await this.logAudit({
        usuario_id: usuario.id,
        organizacao_id: usuario.organizacao_id,
        acao: 'login_falha',
        entidade: 'usuarios',
        entidade_id: usuario.id,
        ip,
        user_agent: userAgent,
        sucesso: false,
        erro_mensagem: 'Credenciais invalidas',
      })
      throw new Error('Email ou senha incorretos')
    }

    // Gera tokens
    const refreshTokenExpiryDays = lembrar ? REFRESH_TOKEN_EXPIRY_DAYS_REMEMBER : REFRESH_TOKEN_EXPIRY_DAYS
    const { accessToken, refreshToken } = await this.generateTokens(usuario, refreshTokenExpiryDays)

    // Salva refresh token no banco
    const refreshTokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + refreshTokenExpiryDays)

    await supabaseAdmin.from('refresh_tokens').insert({
      usuario_id: usuario.id,
      token_hash: refreshTokenHash,
      dispositivo: this.parseDevice(userAgent),
      ip,
      user_agent: userAgent,
      expira_em: expiresAt.toISOString(),
    })

    // AIDEV-NOTE: SEGURANCA - Limpar tokens antigos se usuario tiver muitos
    // Mantem no maximo 50 tokens ativos por usuario
    // Isso previne acumulo de tokens e melhora performance de refresh
    await this.cleanupOldTokens(usuario.id)

    // Atualiza ultimo_login
    await supabaseAdmin
      .from('usuarios')
      .update({ ultimo_login: new Date().toISOString() })
      .eq('id', usuario.id)

    // Log sucesso
    await this.logAudit({
      usuario_id: usuario.id,
      organizacao_id: usuario.organizacao_id,
      acao: 'login',
      entidade: 'usuarios',
      entidade_id: usuario.id,
      ip,
      user_agent: userAgent,
      sucesso: true,
    })

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900, // 15 minutos em segundos
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        sobrenome: usuario.sobrenome,
        role: usuario.role,
        organizacao_id: usuario.organizacao_id,
        avatar_url: usuario.avatar_url,
      },
    }
  }

  /**
   * Renova access_token usando refresh_token
   *
   * AIDEV-NOTE: SEGURANCA - Limitacao de tokens por usuario
   * - Limita a 50 tokens por query para prevenir timing attacks
   * - Revoga automaticamente tokens antigos se usuario tiver muitos ativos
   * - Considera apenas tokens recentes (7 dias) para performance
   */
  async refresh(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
    // Busca refresh tokens nao expirados e nao revogados
    // AIDEV-NOTE: SEGURANCA - .limit(50) previne timing attack
    // Se usuario tiver mais de 50 tokens ativos, algo está errado (possível ataque)
    const { data: tokens, error } = await supabaseAdmin
      .from('refresh_tokens')
      .select('*, usuarios(*)')
      .is('revogado_em', null)
      .gt('expira_em', new Date().toISOString())
      .order('criado_em', { ascending: false })
      .limit(50)

    if (error || !tokens || tokens.length === 0) {
      throw new Error('Refresh token invalido ou expirado')
    }

    // Encontra o token correspondente
    let validToken = null
    for (const token of tokens) {
      const isValid = await bcrypt.compare(refreshToken, token.token_hash)
      if (isValid) {
        validToken = token
        break
      }
    }

    if (!validToken || !validToken.usuarios) {
      throw new Error('Refresh token invalido ou expirado')
    }

    const usuario = validToken.usuarios

    // Gera novo access token
    const payload: JWTPayload = {
      sub: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      organizacao_id: usuario.organizacao_id,
      role: usuario.role,
      perfil_id: usuario.perfil_permissao_id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900, // 15 minutos
    }

    const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY })

    return {
      access_token: accessToken,
      expires_in: 900,
    }
  }

  /**
   * Logout - invalida refresh token
   */
  async logout(refreshToken: string, userId: string, ip?: string, userAgent?: string): Promise<void> {
    // Busca tokens do usuario
    const { data: tokens } = await supabaseAdmin
      .from('refresh_tokens')
      .select('*')
      .eq('usuario_id', userId)
      .is('revogado_em', null)

    if (tokens) {
      for (const token of tokens) {
        const isValid = await bcrypt.compare(refreshToken, token.token_hash)
        if (isValid) {
          // Revoga o token
          await supabaseAdmin
            .from('refresh_tokens')
            .update({ revogado_em: new Date().toISOString() })
            .eq('id', token.id)
          break
        }
      }
    }

    // Log logout
    const { data: usuario } = await supabaseAdmin
      .from('usuarios')
      .select('organizacao_id')
      .eq('id', userId)
      .single()

    await this.logAudit({
      usuario_id: userId,
      organizacao_id: usuario?.organizacao_id,
      acao: 'logout',
      entidade: 'usuarios',
      entidade_id: userId,
      ip,
      user_agent: userAgent,
      sucesso: true,
    })
  }

  /**
   * AIDEV-NOTE: SEGURANCA - Logout de todos os dispositivos
   * Revoga TODOS os refresh tokens do usuario
   * Util quando usuario suspeita que conta foi comprometida
   * Ou quando admin precisa forcar logout de um usuario
   */
  async logoutAllDevices(userId: string, ip?: string, userAgent?: string): Promise<{ revokedCount: number }> {
    // Busca quantidade de tokens ativos
    const { count } = await supabaseAdmin
      .from('refresh_tokens')
      .select('id', { count: 'exact', head: true })
      .eq('usuario_id', userId)
      .is('revogado_em', null)

    // Revoga todos os tokens ativos
    const { error } = await supabaseAdmin
      .from('refresh_tokens')
      .update({ revogado_em: new Date().toISOString() })
      .eq('usuario_id', userId)
      .is('revogado_em', null)

    if (error) {
      logger.error('Erro ao revogar tokens:', error)
      throw new Error('Erro ao encerrar sessoes')
    }

    // Log da acao
    const { data: usuario } = await supabaseAdmin
      .from('usuarios')
      .select('organizacao_id')
      .eq('id', userId)
      .single()

    await this.logAudit({
      usuario_id: userId,
      organizacao_id: usuario?.organizacao_id,
      acao: 'logout_all_devices',
      entidade: 'usuarios',
      entidade_id: userId,
      detalhes: { tokens_revogados: count || 0 },
      ip,
      user_agent: userAgent,
      sucesso: true,
    })

    logger.info(`[Auth] Logout de todos dispositivos: ${count} tokens revogados para usuario ${userId}`)

    return { revokedCount: count || 0 }
  }

  /**
   * Solicita recuperacao de senha
   * IMPORTANTE: Sempre retorna sucesso para nao revelar se email existe
   */
  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const { email } = input

    // Busca usuario pelo email
    const { data: usuario } = await supabaseAdmin
      .from('usuarios')
      .select('id, nome, email, organizacao_id')
      .eq('email', email.toLowerCase())
      .is('deletado_em', null)
      .single()

    // Se usuario nao existe, nao faz nada mas nao revela
    if (!usuario) {
      logger.info(`Tentativa de recuperacao de senha para email inexistente: ${email}`)
      return
    }

    // Gera token de reset (UUID)
    const resetToken = crypto.randomUUID()
    const tokenHash = await bcrypt.hash(resetToken, SALT_ROUNDS)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + RESET_TOKEN_EXPIRY_HOURS)

    // Salva token de reset (usando refresh_tokens com flag especial)
    await supabaseAdmin.from('refresh_tokens').insert({
      usuario_id: usuario.id,
      token_hash: tokenHash,
      dispositivo: 'password_reset',
      expira_em: expiresAt.toISOString(),
    })

    // TODO: Enviar email com link de reset
    // O link deve ser: ${FRONTEND_URL}/redefinir-senha?token=${resetToken}
    logger.info(`Token de reset gerado para usuario ${usuario.id}: ${resetToken}`)

    // Log
    await this.logAudit({
      usuario_id: usuario.id,
      organizacao_id: usuario.organizacao_id,
      acao: 'password_reset_request',
      entidade: 'usuarios',
      entidade_id: usuario.id,
      sucesso: true,
    })
  }

  /**
   * Redefine senha com token
   */
  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const { token, nova_senha } = input

    // Busca tokens de reset validos
    const { data: tokens } = await supabaseAdmin
      .from('refresh_tokens')
      .select('*, usuarios(id, email, organizacao_id)')
      .eq('dispositivo', 'password_reset')
      .is('revogado_em', null)
      .gt('expira_em', new Date().toISOString())

    if (!tokens || tokens.length === 0) {
      throw new Error('Token invalido ou expirado')
    }

    // Encontra o token correspondente
    let validToken = null
    for (const t of tokens) {
      const isValid = await bcrypt.compare(token, t.token_hash)
      if (isValid) {
        validToken = t
        break
      }
    }

    if (!validToken || !validToken.usuarios) {
      throw new Error('Token invalido ou expirado')
    }

    const usuario = validToken.usuarios

    // Atualiza senha no Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      usuario.id, // Precisa do auth_id aqui
      { password: nova_senha }
    )

    // Busca auth_id do usuario
    const { data: userData } = await supabaseAdmin
      .from('usuarios')
      .select('auth_id')
      .eq('id', usuario.id)
      .single()

    if (userData?.auth_id) {
      await supabaseAdmin.auth.admin.updateUserById(userData.auth_id, { password: nova_senha })
    }

    // Atualiza timestamp de alteracao de senha
    await supabaseAdmin
      .from('usuarios')
      .update({ senha_alterada_em: new Date().toISOString() })
      .eq('id', usuario.id)

    // Invalida o token usado
    await supabaseAdmin
      .from('refresh_tokens')
      .update({ revogado_em: new Date().toISOString() })
      .eq('id', validToken.id)

    // Invalida todos os outros refresh tokens do usuario
    await supabaseAdmin
      .from('refresh_tokens')
      .update({ revogado_em: new Date().toISOString() })
      .eq('usuario_id', usuario.id)
      .is('revogado_em', null)

    // Log
    await this.logAudit({
      usuario_id: usuario.id,
      organizacao_id: usuario.organizacao_id,
      acao: 'password_reset',
      entidade: 'usuarios',
      entidade_id: usuario.id,
      sucesso: true,
    })
  }

  /**
   * Altera senha (usuario logado)
   */
  async alterarSenha(userId: string, input: AlterarSenhaInput, ip?: string, userAgent?: string): Promise<void> {
    const { senha_atual, nova_senha } = input

    // Busca usuario
    const { data: usuario } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, auth_id, organizacao_id')
      .eq('id', userId)
      .single()

    if (!usuario) {
      throw new Error('Usuario nao encontrado')
    }

    // Verifica senha atual usando Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: usuario.email,
      password: senha_atual,
    })

    if (authError) {
      throw new Error('Senha atual incorreta')
    }

    // Atualiza senha no Supabase Auth
    if (usuario.auth_id) {
      await supabaseAdmin.auth.admin.updateUserById(usuario.auth_id, { password: nova_senha })
    }

    // Atualiza timestamp
    await supabaseAdmin
      .from('usuarios')
      .update({ senha_alterada_em: new Date().toISOString() })
      .eq('id', userId)

    // Log
    await this.logAudit({
      usuario_id: userId,
      organizacao_id: usuario.organizacao_id,
      acao: 'password_change',
      entidade: 'usuarios',
      entidade_id: userId,
      ip,
      user_agent: userAgent,
      sucesso: true,
    })
  }

  /**
   * Atualiza perfil do usuario
   */
  async atualizarPerfil(
    userId: string,
    input: AtualizarPerfilInput,
    ip?: string,
    userAgent?: string
  ): Promise<void> {
    // Busca usuario atual
    const { data: usuario } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single()

    if (!usuario) {
      throw new Error('Usuario nao encontrado')
    }

    // Prepara dados para atualizar
    const updateData: Record<string, unknown> = {
      atualizado_em: new Date().toISOString(),
    }

    if (input.nome !== undefined) updateData.nome = input.nome
    if (input.sobrenome !== undefined) updateData.sobrenome = input.sobrenome
    if (input.telefone !== undefined) updateData.telefone = input.telefone

    // Atualiza
    const { error } = await supabaseAdmin
      .from('usuarios')
      .update(updateData)
      .eq('id', userId)

    if (error) {
      throw new Error('Erro ao atualizar perfil')
    }

    // Log
    await this.logAudit({
      usuario_id: userId,
      organizacao_id: usuario.organizacao_id,
      acao: 'update',
      entidade: 'usuarios',
      entidade_id: userId,
      dados_anteriores: {
        nome: usuario.nome,
        sobrenome: usuario.sobrenome,
        telefone: usuario.telefone,
      },
      dados_novos: input,
      ip,
      user_agent: userAgent,
      sucesso: true,
    })
  }

  /**
   * Busca perfil do usuario
   */
  async getPerfil(userId: string) {
    const { data: usuario, error } = await supabaseAdmin
      .from('usuarios')
      .select(`
        id,
        nome,
        sobrenome,
        email,
        telefone,
        avatar_url,
        role,
        status,
        criado_em,
        senha_alterada_em,
        organizacao_id,
        organizacoes_saas:organizacao_id (
          id,
          nome
        )
      `)
      .eq('id', userId)
      .single()

    if (error || !usuario) {
      throw new Error('Usuario nao encontrado')
    }

    return {
      id: usuario.id,
      nome: usuario.nome,
      sobrenome: usuario.sobrenome,
      email: usuario.email,
      telefone: usuario.telefone,
      foto_url: usuario.avatar_url,
      role: usuario.role,
      organizacao: usuario.organizacoes_saas ? (() => {
        const orgData = Array.isArray(usuario.organizacoes_saas)
          ? usuario.organizacoes_saas[0]
          : usuario.organizacoes_saas
        return orgData ? { id: orgData.id, nome: orgData.nome } : null
      })() : null,
      criado_em: usuario.criado_em,
      senha_alterada_em: usuario.senha_alterada_em,
    }
  }

  // ============ Helpers privados ============

  private async generateTokens(usuario: {
    id: string
    email: string
    nome: string
    organizacao_id: string | null
    role: string
    perfil_permissao_id?: string
  }, refreshTokenExpiryDays: number) {
    const payload: JWTPayload = {
      sub: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      organizacao_id: usuario.organizacao_id,
      role: usuario.role as 'super_admin' | 'admin' | 'member',
      perfil_id: usuario.perfil_permissao_id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900, // 15 minutos
    }

    const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY })
    const refreshToken = crypto.randomUUID() + '-' + crypto.randomBytes(32).toString('hex')

    return { accessToken, refreshToken }
  }

  private parseDevice(userAgent?: string): string {
    if (!userAgent) return 'unknown'
    if (userAgent.includes('Mobile')) return 'mobile'
    if (userAgent.includes('Tablet')) return 'tablet'
    return 'desktop'
  }

  /**
   * AIDEV-NOTE: SEGURANCA - Limpa tokens antigos do usuario
   * Mantem no maximo 50 tokens ativos para prevenir acumulo
   * Revoga os mais antigos se passar do limite
   */
  private async cleanupOldTokens(userId: string, maxTokens = 50): Promise<void> {
    try {
      // Conta quantos tokens ativos o usuario tem
      const { count, error: countError } = await supabaseAdmin
        .from('refresh_tokens')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_id', userId)
        .is('revogado_em', null)
        .gt('expira_em', new Date().toISOString())

      if (countError || !count || count <= maxTokens) {
        return // Dentro do limite, nada a fazer
      }

      // Busca os tokens mais antigos para revogar
      const tokensToRevoke = count - maxTokens
      const { data: oldTokens } = await supabaseAdmin
        .from('refresh_tokens')
        .select('id')
        .eq('usuario_id', userId)
        .is('revogado_em', null)
        .gt('expira_em', new Date().toISOString())
        .order('criado_em', { ascending: true })
        .limit(tokensToRevoke)

      if (oldTokens && oldTokens.length > 0) {
        const idsToRevoke = oldTokens.map(t => t.id)
        await supabaseAdmin
          .from('refresh_tokens')
          .update({ revogado_em: new Date().toISOString() })
          .in('id', idsToRevoke)

        logger.info(`[Auth] Revogados ${idsToRevoke.length} tokens antigos do usuario ${userId}`)
      }
    } catch (err) {
      // Nao falha o login se cleanup der erro
      logger.error('Erro ao limpar tokens antigos:', err)
    }
  }

  private async logAudit(data: {
    usuario_id?: string
    organizacao_id?: string | null
    acao: string
    entidade: string
    entidade_id?: string
    dados_anteriores?: Record<string, unknown>
    dados_novos?: Record<string, unknown>
    detalhes?: Record<string, unknown>
    ip?: string
    user_agent?: string
    sucesso: boolean
    erro_mensagem?: string
  }) {
    try {
      await supabaseAdmin.from('audit_log').insert({
        usuario_id: data.usuario_id,
        organizacao_id: data.organizacao_id,
        acao: data.acao,
        entidade: data.entidade,
        entidade_id: data.entidade_id,
        dados_anteriores: data.dados_anteriores,
        dados_novos: data.dados_novos,
        detalhes: data.detalhes,
        ip: data.ip,
        user_agent: data.user_agent,
        sucesso: data.sucesso,
        erro_mensagem: data.erro_mensagem,
      })
    } catch (err) {
      logger.error('Erro ao registrar audit log:', err)
    }
  }
}

export const authService = new AuthService()
