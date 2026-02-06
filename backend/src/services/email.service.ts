/**
 * AIDEV-NOTE: Service para integracao Email (Gmail OAuth + SMTP Manual)
 * Conforme PRD-08 - Secao 6. Email Pessoal
 *
 * Suporta:
 * - Gmail OAuth (requer Google Cloud Project)
 * - SMTP Manual com auto-deteccao de provedor
 */

import { google } from 'googleapis'
import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { supabaseAdmin as supabase } from '../config/supabase'
import { env } from '../config/env'
import { encrypt, decrypt, generateState } from '../utils/crypto'
import { withCircuitBreakerAndRetry } from '../utils/retry'
import {
  SMTP_PROVIDERS,
  type ConexaoEmail,
  type StatusEmailResponse,
  type ConfigurarSmtp,
  type TestarSmtpResponse,
  type DetectarSmtpResponse,
  type EnviarEmail,
  type EnviarEmailResponse,
} from '../schemas/conexoes/email'

// =====================================================
// Tipos Internos
// =====================================================

interface GoogleConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

// =====================================================
// Service
// =====================================================

class EmailService {
  private googleConfig: GoogleConfig | null = null
  private oauth2Client: any = null

  // Scopes para Gmail
  private static readonly GMAIL_SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ]

  constructor() {
    this.loadConfig()
  }

  private loadConfig(): void {
    const clientId = env.GOOGLE_CLIENT_ID
    const clientSecret = env.GOOGLE_CLIENT_SECRET
    const redirectUri = `${env.API_URL}/api/v1/conexoes/email/google/callback`

    if (clientId && clientSecret) {
      this.googleConfig = { clientId, clientSecret, redirectUri }
      this.oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      )
    }
  }

  /**
   * Verifica se Gmail OAuth esta configurado
   */
  isGmailConfigured(): boolean {
    return this.googleConfig !== null
  }

  // =====================================================
  // Gmail OAuth Flow
  // =====================================================

  /**
   * Gera URL de autorizacao Gmail OAuth
   */
  async gerarGmailAuthUrl(
    organizacaoId: string,
    usuarioId: string
  ): Promise<{ url: string; state: string }> {
    if (!this.oauth2Client) {
      throw new Error('Google nao configurado. Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET')
    }

    const state = generateState()
    const stateData = Buffer.from(JSON.stringify({
      organizacao_id: organizacaoId,
      usuario_id: usuarioId,
      tipo: 'gmail',
      nonce: state,
    })).toString('base64')

    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: EmailService.GMAIL_SCOPES,
      state: stateData,
      prompt: 'consent',
    })

    return { url, state: stateData }
  }

  /**
   * Processa callback Gmail OAuth
   */
  async processarGmailCallback(
    code: string,
    state: string
  ): Promise<ConexaoEmail> {
    if (!this.oauth2Client) {
      throw new Error('Google nao configurado')
    }

    // Decodifica state
    let stateData: {
      organizacao_id: string
      usuario_id: string
      tipo: string
      nonce: string
    }

    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch {
      throw new Error('State invalido')
    }

    // Troca code por tokens
    const { tokens } = await this.oauth2Client.getToken(code)

    if (!tokens.access_token) {
      throw new Error('Nao foi possivel obter access_token')
    }

    // Obtem informacoes do usuario
    this.oauth2Client.setCredentials(tokens)
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client })
    const userInfo = await oauth2.userinfo.get()

    // Cria ou atualiza conexao
    const conexaoData = {
      organizacao_id: stateData.organizacao_id,
      usuario_id: stateData.usuario_id,
      tipo: 'gmail_oauth' as const,
      email: userInfo.data.email!,
      nome_remetente: userInfo.data.name,
      google_user_id: userInfo.data.id,
      access_token_encrypted: encrypt(tokens.access_token),
      refresh_token_encrypted: tokens.refresh_token
        ? encrypt(tokens.refresh_token)
        : null,
      token_expires_at: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
      status: 'active' as const,
      conectado_em: new Date().toISOString(),
    }

    // Verifica se ja existe
    const { data: existente } = await supabase
      .from('conexoes_email')
      .select('id')
      .eq('organizacao_id', stateData.organizacao_id)
      .eq('usuario_id', stateData.usuario_id)
      .is('deletado_em', null)
      .single()

    let conexao: any

    if (existente) {
      const { data, error } = await supabase
        .from('conexoes_email')
        .update(conexaoData)
        .eq('id', existente.id)
        .select()
        .single()

      if (error) throw new Error(`Erro ao atualizar conexao: ${error.message}`)
      conexao = data
    } else {
      const { data, error } = await supabase
        .from('conexoes_email')
        .insert(conexaoData)
        .select()
        .single()

      if (error) throw new Error(`Erro ao criar conexao: ${error.message}`)
      conexao = data
    }

    return conexao as ConexaoEmail
  }

  // =====================================================
  // SMTP Manual
  // =====================================================

  /**
   * Auto-detecta configuracoes SMTP pelo dominio do email
   */
  detectarSmtp(email: string): DetectarSmtpResponse {
    const domain = email.split('@')[1]?.toLowerCase()

    if (!domain) {
      return {
        detected: false,
      }
    }

    // Procura provedor conhecido
    const provider = SMTP_PROVIDERS.find(p =>
      p.domains.includes(domain) || p.domains.some(d => domain.endsWith(d))
    )

    if (provider) {
      return {
        detected: true,
        provider: provider.name,
        smtp_host: provider.host,
        smtp_port: provider.port,
        smtp_tls: provider.tls,
        requires_app_password: provider.requires_app_password,
        help_url: provider.help_url,
      }
    }

    // Tenta detectar padrao comum
    return {
      detected: false,
      smtp_host: `smtp.${domain}`,
      smtp_port: 587,
      smtp_tls: true,
    }
  }

  /**
   * Testa conexao SMTP
   */
  async testarSmtp(config: ConfigurarSmtp): Promise<TestarSmtpResponse> {
    try {
      // Detecta configuracao se nao fornecida
      const detected = this.detectarSmtp(config.email!)
      const host = config.smtp_host || detected.smtp_host || ''
      const port = config.smtp_port || detected.smtp_port || 587
      const tls = config.smtp_tls ?? detected.smtp_tls ?? true

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: tls && port === 465,
        auth: {
          user: config.email,
          pass: config.senha,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
      })

      // Testa conexao
      await transporter.verify()

      return {
        success: true,
        message: 'Conexao SMTP estabelecida com sucesso',
      }
    } catch (error: any) {
      let message = 'Erro ao conectar SMTP'

      if (error.code === 'EAUTH') {
        message = 'Credenciais invalidas. Verifique usuario e senha.'
      } else if (error.code === 'ECONNREFUSED') {
        message = 'Conexao recusada. Verifique host e porta.'
      } else if (error.code === 'ETIMEDOUT') {
        message = 'Timeout. Verifique se a porta esta correta e acessivel.'
      } else if (error.message) {
        message = error.message
      }

      return {
        success: false,
        message,
        error: error.code || 'UNKNOWN',
      }
    }
  }

  /**
   * Salva configuracao SMTP
   */
  async salvarSmtp(
    organizacaoId: string,
    usuarioId: string,
    config: ConfigurarSmtp
  ): Promise<ConexaoEmail> {
    // Testa antes de salvar
    const teste = await this.testarSmtp(config)
    if (!teste.success) {
      throw new Error(teste.message)
    }

    // Detecta configuracao
    const detected = this.detectarSmtp(config.email!)

    const conexaoData = {
      organizacao_id: organizacaoId,
      usuario_id: usuarioId,
      tipo: 'smtp_manual' as const,
      email: config.email!,
      nome_remetente: config.nome_remetente || config.email!.split('@')[0],
      smtp_host: config.smtp_host || detected.smtp_host,
      smtp_port: config.smtp_port || detected.smtp_port,
      smtp_user: config.email,
      smtp_pass_encrypted: encrypt(config.senha!),
      smtp_tls: config.smtp_tls ?? detected.smtp_tls ?? true,
      smtp_auto_detected: !config.smtp_host,
      status: 'active' as const,
      conectado_em: new Date().toISOString(),
    }

    // Verifica se ja existe
    const { data: existente } = await supabase
      .from('conexoes_email')
      .select('id')
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .is('deletado_em', null)
      .single()

    let conexao: any

    if (existente) {
      const { data, error } = await supabase
        .from('conexoes_email')
        .update(conexaoData)
        .eq('id', existente.id)
        .select()
        .single()

      if (error) throw new Error(`Erro ao atualizar conexao: ${error.message}`)
      conexao = data
    } else {
      const { data, error } = await supabase
        .from('conexoes_email')
        .insert(conexaoData)
        .select()
        .single()

      if (error) throw new Error(`Erro ao criar conexao: ${error.message}`)
      conexao = data
    }

    return conexao as ConexaoEmail
  }

  // =====================================================
  // Status e Desconexao
  // =====================================================

  /**
   * Obtem status da conexao email
   */
  async obterStatus(
    organizacaoId: string,
    usuarioId: string
  ): Promise<StatusEmailResponse> {
    const { data: conexao } = await supabase
      .from('conexoes_email')
      .select('id, tipo, status, email, nome_remetente, smtp_host, smtp_port, smtp_tls, smtp_user, smtp_auto_detected, conectado_em, ultimo_envio, total_emails_enviados, ultimo_erro')
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .is('deletado_em', null)
      .single()

    if (!conexao) {
      return { conectado: false }
    }

    return {
      id: conexao.id,
      conectado: conexao.status === 'active',
      tipo: conexao.tipo,
      status: conexao.status,
      email: conexao.email,
      nome_remetente: conexao.nome_remetente,
      smtp_host: conexao.smtp_host,
      smtp_auto_detected: conexao.smtp_auto_detected,
      conectado_em: conexao.conectado_em,
      ultimo_envio: conexao.ultimo_envio,
      total_emails_enviados: conexao.total_emails_enviados,
    }
  }

  /**
   * Desconecta email
   */
  async desconectar(
    organizacaoId: string,
    usuarioId: string
  ): Promise<void> {
    const { data: conexao } = await supabase
      .from('conexoes_email')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .is('deletado_em', null)
      .single()

    if (!conexao) {
      throw new Error('Conexao nao encontrada')
    }

    // Revoga token no Google se for Gmail
    if (conexao.tipo === 'gmail_oauth' && this.isGmailConfigured() && conexao.access_token_encrypted) {
      try {
        const accessToken = decrypt(conexao.access_token_encrypted)
        await this.oauth2Client.revokeToken(accessToken)
      } catch (e) {
        console.warn('Erro ao revogar token Gmail:', e)
      }
    }

    // Soft delete
    await supabase
      .from('conexoes_email')
      .update({ deletado_em: new Date().toISOString() })
      .eq('id', conexao.id)
  }

  // =====================================================
  // Enviar Email
  // =====================================================

  /**
   * Cria transporter para a conexao
   */
  private async criarTransporter(conexao: any): Promise<Transporter> {
    if (conexao.tipo === 'gmail_oauth') {
      // Gmail OAuth
      const accessToken = decrypt(conexao.access_token_encrypted)
      const refreshToken = conexao.refresh_token_encrypted
        ? decrypt(conexao.refresh_token_encrypted)
        : undefined

      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: conexao.email,
          clientId: this.googleConfig?.clientId,
          clientSecret: this.googleConfig?.clientSecret,
          refreshToken,
          accessToken,
        },
      })
    } else {
      // SMTP Manual
      const smtpPass = decrypt(conexao.smtp_pass_encrypted)

      return nodemailer.createTransport({
        host: conexao.smtp_host,
        port: conexao.smtp_port,
        secure: conexao.smtp_tls && conexao.smtp_port === 465,
        auth: {
          user: conexao.smtp_user || conexao.email,
          pass: smtpPass,
        },
      })
    }
  }

  /**
   * Envia email
   */
  async enviarEmail(
    organizacaoId: string,
    usuarioId: string,
    payload: EnviarEmail
  ): Promise<EnviarEmailResponse> {
    const { data: conexao, error } = await supabase
      .from('conexoes_email')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .eq('status', 'active')
      .is('deletado_em', null)
      .single()

    if (error || !conexao) {
      throw new Error('Conexao email nao encontrada ou inativa')
    }

    const transporter = await this.criarTransporter(conexao)

    const mailOptions: nodemailer.SendMailOptions = {
      from: `${conexao.nome_remetente || conexao.email} <${conexao.email}>`,
      to: payload.to,
      cc: payload.cc?.join(', '),
      bcc: payload.bcc?.join(', '),
      subject: payload.subject,
      text: payload.body_type === 'text' ? payload.body : undefined,
      html: payload.body_type === 'html' ? payload.body : undefined,
      replyTo: payload.reply_to,
      attachments: payload.attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.content_type,
        encoding: 'base64',
      })),
    }

    try {
      const result = await withCircuitBreakerAndRetry('email_smtp', 'email_send', async () => {
        return transporter.sendMail(mailOptions)
      })

      // Atualiza estatisticas
      await supabase
        .from('conexoes_email')
        .update({
          ultimo_envio: new Date().toISOString(),
          total_emails_enviados: (conexao.total_emails_enviados || 0) + 1,
        })
        .eq('id', conexao.id)

      return {
        success: true,
        message_id: result.messageId,
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Erro ao enviar email',
      }
    }
  }
}

export default new EmailService()
