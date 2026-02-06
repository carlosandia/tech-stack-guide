/**
 * AIDEV-NOTE: Service para integracao Google (Calendar + Gmail OAuth)
 * Conforme PRD-08 - Secoes 5.2 e 6
 *
 * NOTA: Requer Google Cloud Project configurado (PRD-16)
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 */

import { google, calendar_v3 } from 'googleapis'
import { supabaseAdmin as supabase } from '../config/supabase'
import { env } from '../config/env'
import { encrypt, decrypt, generateState } from '../utils/crypto'
import { withCircuitBreakerAndRetry } from '../utils/retry'
import type {
  ConexaoGoogle,
  AuthUrlResponse,
  StatusGoogleResponse,
  Calendario,
  ListarCalendariosResponse,
  SelecionarCalendario,
  CriarEventoGoogle,
  EventoGoogleResponse,
  AtualizarConfigGoogle,
} from '../schemas/conexoes/google'

// =====================================================
// Tipos Internos
// =====================================================

interface GoogleConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

interface OAuthTokens {
  access_token: string
  refresh_token?: string
  expiry_date?: number
}

// =====================================================
// Service
// =====================================================

class GoogleService {
  private config: GoogleConfig | null = null
  private oauth2Client: any = null

  // Scopes para Calendar
  private static readonly CALENDAR_SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ]

  // Scopes para Gmail
  private static readonly GMAIL_SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email',
  ]

  constructor() {
    this.loadConfig()
  }

  private loadConfig(): void {
    const clientId = env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
    const clientSecret = env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI || `${env.API_URL}/api/v1/conexoes/google/callback`

    if (clientId && clientSecret) {
      this.config = { clientId, clientSecret, redirectUri }
      this.oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      )
    }
  }

  /**
   * Verifica se Google esta configurado
   */
  isConfigured(): boolean {
    return this.config !== null
  }

  /**
   * Cria cliente OAuth2 com tokens do usuario
   */
  private async getAuthenticatedClient(conexao: any): Promise<any> {
    if (!this.oauth2Client) {
      throw new Error('Google nao configurado')
    }

    const accessToken = decrypt(conexao.access_token_encrypted)
    const refreshToken = conexao.refresh_token_encrypted
      ? decrypt(conexao.refresh_token_encrypted)
      : undefined

    const oauth2 = new google.auth.OAuth2(
      this.config!.clientId,
      this.config!.clientSecret,
      this.config!.redirectUri
    )

    oauth2.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: conexao.token_expires_at
        ? new Date(conexao.token_expires_at).getTime()
        : undefined,
    })

    // Configura refresh automatico
    oauth2.on('tokens', async (tokens: OAuthTokens) => {
      if (tokens.access_token) {
        await supabase
          .from('conexoes_google')
          .update({
            access_token_encrypted: encrypt(tokens.access_token),
            token_expires_at: tokens.expiry_date
              ? new Date(tokens.expiry_date).toISOString()
              : null,
          })
          .eq('id', conexao.id)
      }
    })

    return oauth2
  }

  // =====================================================
  // OAuth Flow
  // =====================================================

  /**
   * Gera URL de autorizacao OAuth
   */
  async gerarAuthUrl(
    organizacaoId: string,
    usuarioId: string,
    tipo: 'calendar' | 'gmail' = 'calendar'
  ): Promise<AuthUrlResponse> {
    if (!this.oauth2Client) {
      throw new Error('Google nao configurado. Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET')
    }

    const state = generateState()

    // Salva state temporariamente (pode usar Redis ou tabela)
    // Por simplicidade, vamos incluir no state
    const stateData = Buffer.from(JSON.stringify({
      organizacao_id: organizacaoId,
      usuario_id: usuarioId,
      tipo,
      nonce: state,
    })).toString('base64')

    const scopes = tipo === 'calendar'
      ? GoogleService.CALENDAR_SCOPES
      : GoogleService.GMAIL_SCOPES

    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: stateData,
      prompt: 'consent', // Forca consentimento para obter refresh_token
    })

    return { url, state: stateData }
  }

  /**
   * Processa callback OAuth
   */
  async processarCallback(
    code: string,
    state: string
  ): Promise<ConexaoGoogle> {
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
      access_token_encrypted: encrypt(tokens.access_token),
      refresh_token_encrypted: tokens.refresh_token
        ? encrypt(tokens.refresh_token)
        : null,
      token_expires_at: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
      google_user_id: userInfo.data.id,
      google_user_email: userInfo.data.email,
      google_user_name: userInfo.data.name,
      status: 'active' as const,
      conectado_em: new Date().toISOString(),
    }

    // Verifica se ja existe
    const { data: existente } = await supabase
      .from('conexoes_google')
      .select('id')
      .eq('organizacao_id', stateData.organizacao_id)
      .eq('usuario_id', stateData.usuario_id)
      .is('deletado_em', null)
      .single()

    let conexao: any

    if (existente) {
      const { data, error } = await supabase
        .from('conexoes_google')
        .update(conexaoData)
        .eq('id', existente.id)
        .select()
        .single()

      if (error) throw new Error(`Erro ao atualizar conexao: ${error.message}`)
      conexao = data
    } else {
      const { data, error } = await supabase
        .from('conexoes_google')
        .insert(conexaoData)
        .select()
        .single()

      if (error) throw new Error(`Erro ao criar conexao: ${error.message}`)
      conexao = data
    }

    return conexao as ConexaoGoogle
  }

  // =====================================================
  // Status e Desconexao
  // =====================================================

  /**
   * Obtem status da conexao Google
   */
  async obterStatus(
    organizacaoId: string,
    usuarioId: string
  ): Promise<StatusGoogleResponse> {
    const { data: conexao } = await supabase
      .from('conexoes_google')
      .select('id, status, google_user_email, google_user_name, google_user_id, calendar_id, calendar_name, criar_google_meet, sincronizar_eventos, conectado_em, ultimo_sync, ultimo_erro')
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
      status: conexao.status,
      google_user_email: conexao.google_user_email,
      google_user_name: conexao.google_user_name,
      calendar_id: conexao.calendar_id,
      calendar_name: conexao.calendar_name,
      criar_google_meet: conexao.criar_google_meet,
      conectado_em: conexao.conectado_em,
      ultimo_sync: conexao.ultimo_sync,
    }
  }

  /**
   * Desconecta Google
   */
  async desconectar(
    organizacaoId: string,
    usuarioId: string
  ): Promise<void> {
    const { data: conexao } = await supabase
      .from('conexoes_google')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .is('deletado_em', null)
      .single()

    if (!conexao) {
      throw new Error('Conexao nao encontrada')
    }

    // Revoga token no Google
    if (this.isConfigured()) {
      try {
        const accessToken = decrypt(conexao.access_token_encrypted)
        await this.oauth2Client.revokeToken(accessToken)
      } catch (e) {
        console.warn('Erro ao revogar token Google:', e)
      }
    }

    // Soft delete
    await supabase
      .from('conexoes_google')
      .update({ deletado_em: new Date().toISOString() })
      .eq('id', conexao.id)
  }

  // =====================================================
  // Calendar Operations
  // =====================================================

  /**
   * Lista calendarios do usuario
   */
  async listarCalendarios(
    organizacaoId: string,
    usuarioId: string
  ): Promise<ListarCalendariosResponse> {
    const { data: conexao } = await supabase
      .from('conexoes_google')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .eq('status', 'active')
      .is('deletado_em', null)
      .single()

    if (!conexao) {
      throw new Error('Conexao Google nao encontrada ou inativa')
    }

    const auth = await this.getAuthenticatedClient(conexao)
    const calendar = google.calendar({ version: 'v3', auth })

    const response = await withCircuitBreakerAndRetry('google_calendar', 'google_calendar_create', async () => {
      return calendar.calendarList.list()
    })

    const calendarios: Calendario[] = (response.data.items || []).map(cal => ({
      id: cal.id!,
      summary: cal.summary || 'Sem nome',
      description: cal.description || undefined,
      primary: cal.primary || false,
      accessRole: cal.accessRole || undefined,
    }))

    return { calendarios }
  }

  /**
   * Seleciona calendario padrao
   */
  async selecionarCalendario(
    organizacaoId: string,
    usuarioId: string,
    dados: SelecionarCalendario
  ): Promise<void> {
    await supabase
      .from('conexoes_google')
      .update({
        calendar_id: dados.calendar_id,
        calendar_name: dados.calendar_name,
      })
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .is('deletado_em', null)
  }

  /**
   * Cria evento no Google Calendar
   */
  async criarEvento(
    organizacaoId: string,
    usuarioId: string,
    dados: CriarEventoGoogle
  ): Promise<EventoGoogleResponse> {
    const { data: conexao } = await supabase
      .from('conexoes_google')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .eq('status', 'active')
      .is('deletado_em', null)
      .single()

    if (!conexao) {
      throw new Error('Conexao Google nao encontrada ou inativa')
    }

    if (!conexao.calendar_id) {
      throw new Error('Nenhum calendario selecionado')
    }

    const auth = await this.getAuthenticatedClient(conexao)
    const calendar = google.calendar({ version: 'v3', auth })

    const eventData: calendar_v3.Schema$Event = {
      summary: dados.summary,
      description: dados.description,
      start: {
        dateTime: dados.start,
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: dados.end,
        timeZone: 'America/Sao_Paulo',
      },
      attendees: dados.attendees?.map(a => ({
        email: a.email,
        displayName: a.displayName,
      })),
      location: dados.location,
      reminders: dados.reminders,
    }

    // Adiciona Google Meet se solicitado
    if (dados.add_google_meet && conexao.criar_google_meet) {
      eventData.conferenceData = {
        createRequest: {
          requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      }
    }

    const response = await withCircuitBreakerAndRetry('google_calendar', 'google_calendar_create', async () => {
      return calendar.events.insert({
        calendarId: conexao.calendar_id,
        requestBody: eventData,
        conferenceDataVersion: dados.add_google_meet ? 1 : 0,
        sendUpdates: dados.attendees?.length ? 'all' : 'none',
      })
    })

    const event = response.data

    // Atualiza reuniao no CRM se fornecido meeting_id
    if (dados.meeting_id) {
      await supabase
        .from('reunioes_oportunidades')
        .update({
          google_event_id: event.id,
          google_meet_link: event.conferenceData?.entryPoints?.[0]?.uri || null,
        })
        .eq('id', dados.meeting_id)
    }

    return {
      event_id: event.id!,
      html_link: event.htmlLink!,
      google_meet_link: event.conferenceData?.entryPoints?.[0]?.uri || null,
      status: event.status || 'confirmed',
    }
  }

  /**
   * Atualiza evento no Google Calendar
   */
  async atualizarEvento(
    organizacaoId: string,
    usuarioId: string,
    eventId: string,
    dados: Partial<CriarEventoGoogle>
  ): Promise<EventoGoogleResponse> {
    const { data: conexao } = await supabase
      .from('conexoes_google')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .eq('status', 'active')
      .is('deletado_em', null)
      .single()

    if (!conexao) {
      throw new Error('Conexao Google nao encontrada ou inativa')
    }

    const auth = await this.getAuthenticatedClient(conexao)
    const calendar = google.calendar({ version: 'v3', auth })

    const eventData: calendar_v3.Schema$Event = {}

    if (dados.summary) eventData.summary = dados.summary
    if (dados.description) eventData.description = dados.description
    if (dados.start) eventData.start = { dateTime: dados.start, timeZone: 'America/Sao_Paulo' }
    if (dados.end) eventData.end = { dateTime: dados.end, timeZone: 'America/Sao_Paulo' }
    if (dados.location) eventData.location = dados.location
    if (dados.attendees) {
      eventData.attendees = dados.attendees.map(a => ({
        email: a.email,
        displayName: a.displayName,
      }))
    }

    const response = await withCircuitBreakerAndRetry('google_calendar', 'google_calendar_create', async () => {
      return calendar.events.patch({
        calendarId: conexao.calendar_id,
        eventId,
        requestBody: eventData,
        sendUpdates: 'all',
      })
    })

    const event = response.data

    return {
      event_id: event.id!,
      html_link: event.htmlLink!,
      google_meet_link: event.conferenceData?.entryPoints?.[0]?.uri || null,
      status: event.status || 'confirmed',
    }
  }

  /**
   * Cancela evento no Google Calendar
   */
  async cancelarEvento(
    organizacaoId: string,
    usuarioId: string,
    eventId: string
  ): Promise<void> {
    const { data: conexao } = await supabase
      .from('conexoes_google')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .eq('status', 'active')
      .is('deletado_em', null)
      .single()

    if (!conexao) {
      throw new Error('Conexao Google nao encontrada ou inativa')
    }

    const auth = await this.getAuthenticatedClient(conexao)
    const calendar = google.calendar({ version: 'v3', auth })

    await withCircuitBreakerAndRetry('google_calendar', 'google_calendar_create', async () => {
      return calendar.events.delete({
        calendarId: conexao.calendar_id,
        eventId,
        sendUpdates: 'all',
      })
    })
  }

  // =====================================================
  // Configuracoes
  // =====================================================

  /**
   * Atualiza configuracoes da conexao
   */
  async atualizarConfig(
    organizacaoId: string,
    usuarioId: string,
    config: AtualizarConfigGoogle
  ): Promise<void> {
    await supabase
      .from('conexoes_google')
      .update(config)
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .is('deletado_em', null)
  }
}

export default new GoogleService()
