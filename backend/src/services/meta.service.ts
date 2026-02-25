/**
 * AIDEV-NOTE: Service para integracao Meta (Facebook/Instagram)
 * Conforme PRD-08 - Secoes 2, 3, 4 (Lead Ads, CAPI, Custom Audiences)
 *
 * NOTA: Requer Meta App configurado no developers.facebook.com (PRD-16)
 * - META_APP_ID
 * - META_APP_SECRET
 */

import { supabaseAdmin as supabase } from '../config/supabase'
import { env } from '../config/env'
import { encrypt, decrypt, generateState, sha256, generateIdempotencyKey } from '../utils/crypto'
import { withCircuitBreakerAndRetry } from '../utils/retry'
import type {
  ConexaoMeta,
  StatusConexaoMeta,
  PaginaMeta,
  ListarPaginasResponse,
  FormularioLeadAds,
  ConfigCapi,
  EventoCapiPayload,
  EnviarEventoCapiResponse,
  CustomAudience,
  CriarCustomAudience,
  AdicionarMembrosAudience,
} from '../schemas/conexoes/meta'

// =====================================================
// Constantes
// =====================================================

const META_GRAPH_URL = 'https://graph.facebook.com/v24.0'

const META_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_ads',
  'leads_retrieval',
  'ads_management',
  'ads_read',
  'business_management',
].join(',')

// =====================================================
// Tipos Internos
// =====================================================

interface MetaConfig {
  appId: string
  appSecret: string
  redirectUri: string
}

interface MetaTokenResponse {
  access_token?: string
  expires_in?: number
  error?: { message?: string }
}

// =====================================================
// Service
// =====================================================

class MetaService {
  private config: MetaConfig | null = null

  constructor() {
    this.loadConfig()
  }

  private loadConfig(): void {
    const appId = env.META_APP_ID || process.env.META_APP_ID
    const appSecret = env.META_APP_SECRET || process.env.META_APP_SECRET
    const redirectUri = env.META_REDIRECT_URI || process.env.META_REDIRECT_URI || `${env.API_URL}/api/v1/conexoes/meta/callback`

    if (appId && appSecret) {
      this.config = { appId, appSecret, redirectUri }
    }
  }

  /**
   * Verifica se Meta esta configurado
   */
  isConfigured(): boolean {
    return this.config !== null
  }

  /**
   * Faz requisicao para Graph API
   */
  private async graphRequest<T>(
    method: string,
    endpoint: string,
    accessToken: string,
    body?: any
  ): Promise<T> {
    const url = `${META_GRAPH_URL}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Adiciona token na URL ou header
    const separator = endpoint.includes('?') ? '&' : '?'
    const urlWithToken = `${url}${separator}access_token=${accessToken}`

    const response = await fetch(urlWithToken, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await response.json() as T & { error?: { message?: string } }

    if (!response.ok) {
      const errorMessage = (data as any).error?.message || 'Meta API Error'
      throw new Error(`Meta API: ${errorMessage}`)
    }

    return data as T
  }

  // =====================================================
  // OAuth Flow
  // =====================================================

  /**
   * Gera URL de autorizacao OAuth
   */
  async gerarAuthUrl(organizacaoId: string): Promise<{ url: string; state: string }> {
    if (!this.config) {
      throw new Error('Meta nao configurado. Configure META_APP_ID e META_APP_SECRET')
    }

    const state = generateState()
    const stateData = Buffer.from(JSON.stringify({
      organizacao_id: organizacaoId,
      nonce: state,
    })).toString('base64')

    const url = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${this.config.appId}` +
      `&redirect_uri=${encodeURIComponent(this.config.redirectUri)}` +
      `&scope=${META_SCOPES}` +
      `&state=${stateData}` +
      `&response_type=code`

    return { url, state: stateData }
  }

  /**
   * Processa callback OAuth
   */
  async processarCallback(code: string, state: string): Promise<ConexaoMeta> {
    if (!this.config) {
      throw new Error('Meta nao configurado')
    }

    // Decodifica state
    let stateData: { organizacao_id: string; nonce: string }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch {
      throw new Error('State invalido')
    }

    // Troca code por access_token
    const tokenUrl = `${META_GRAPH_URL}/oauth/access_token?` +
      `client_id=${this.config.appId}` +
      `&redirect_uri=${encodeURIComponent(this.config.redirectUri)}` +
      `&client_secret=${this.config.appSecret}` +
      `&code=${code}`

    const tokenResponse = await fetch(tokenUrl)
    const tokenData = await tokenResponse.json() as MetaTokenResponse

    if (!tokenData.access_token) {
      throw new Error('Nao foi possivel obter access_token')
    }

    // Obtem token de longa duracao
    const longLivedUrl = `${META_GRAPH_URL}/oauth/access_token?` +
      `grant_type=fb_exchange_token` +
      `&client_id=${this.config.appId}` +
      `&client_secret=${this.config.appSecret}` +
      `&fb_exchange_token=${tokenData.access_token}`

    const longLivedResponse = await fetch(longLivedUrl)
    const longLivedData = await longLivedResponse.json() as MetaTokenResponse

    const accessToken = longLivedData.access_token || tokenData.access_token
    const expiresIn = longLivedData.expires_in || tokenData.expires_in

    // Obtem informacoes do usuario
    const userInfo = await this.graphRequest<{ id: string; name: string }>('GET', '/me', accessToken)

    // Cria ou atualiza conexao
    const conexaoData = {
      organizacao_id: stateData.organizacao_id,
      access_token_encrypted: encrypt(accessToken),
      token_expires_at: expiresIn
        ? new Date(Date.now() + expiresIn * 1000).toISOString()
        : null,
      meta_user_id: userInfo.id,
      meta_user_name: userInfo.name,
      status: 'active' as const,
      conectado_em: new Date().toISOString(),
    }

    // Verifica se ja existe
    const { data: existente } = await supabase
      .from('conexoes_meta')
      .select('id')
      .eq('organizacao_id', stateData.organizacao_id)
      .is('deletado_em', null)
      .single()

    let conexao: any

    if (existente) {
      const { data, error } = await supabase
        .from('conexoes_meta')
        .update(conexaoData)
        .eq('id', existente.id)
        .select()
        .single()

      if (error) throw new Error(`Erro ao atualizar conexao: ${error.message}`)
      conexao = data
    } else {
      const { data, error } = await supabase
        .from('conexoes_meta')
        .insert(conexaoData)
        .select()
        .single()

      if (error) throw new Error(`Erro ao criar conexao: ${error.message}`)
      conexao = data
    }

    // AIDEV-NOTE: Verificar escopos do token pós-OAuth para detectar permissões pendentes
    // Tokens gerados antes de uma permissão ser aprovada no App Review não a incluem
    try {
      const permissionsData = await this.graphRequest<{ data: Array<{ permission: string; status: string }> }>(
        'GET', '/me/permissions', accessToken
      )
      const granted = (permissionsData.data || [])
        .filter((p) => p.status === 'granted')
        .map((p) => p.permission)

      const REQUIRED = ['leads_retrieval', 'pages_show_list']
      const missing = REQUIRED.filter((s) => !granted.includes(s))

      if (missing.length > 0) {
        console.warn('[meta] Token sem escopos obrigatórios:', missing)
        await supabase
          .from('conexoes_meta')
          .update({ ultimo_erro: `Permissões pendentes no token: ${missing.join(', ')}. Reconecte o Meta após aprovação do App Review.` })
          .eq('id', conexao.id)
      } else {
        // Limpa erro anterior se todos os escopos estão presentes
        await supabase
          .from('conexoes_meta')
          .update({ ultimo_erro: null })
          .eq('id', conexao.id)
      }
    } catch (e) {
      console.warn('[meta] Não foi possível verificar escopos do token:', e)
    }

    return conexao as ConexaoMeta
  }

  // =====================================================
  // Status e Desconexao
  // =====================================================

  /**
   * Obtem status da conexao Meta
   */
  async obterStatus(organizacaoId: string): Promise<StatusConexaoMeta> {
    const { data: conexao } = await supabase
      .from('conexoes_meta')
      .select('id, status, meta_user_name, meta_user_email, meta_user_id, conectado_em, ultimo_sync, ultimo_erro, paginas_meta(id, page_id, page_name, page_category, status, instagram_business_id)')
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)
      .single()

    if (!conexao) {
      return { conectado: false }
    }

    return {
      id: conexao.id,
      conectado: conexao.status === 'active',
      status: conexao.status,
      meta_user_name: conexao.meta_user_name,
      paginas_conectadas: conexao.paginas_meta?.length || 0,
      conectado_em: conexao.conectado_em,
      ultimo_sync: conexao.ultimo_sync,
    }
  }

  /**
   * Desconecta Meta
   */
  async desconectar(organizacaoId: string): Promise<void> {
    const { data: conexao } = await supabase
      .from('conexoes_meta')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)
      .single()

    if (!conexao) {
      throw new Error('Conexao nao encontrada')
    }

    // Soft delete de todas as entidades relacionadas
    const now = new Date().toISOString()

    await Promise.all([
      supabase.from('conexoes_meta').update({ deletado_em: now }).eq('id', conexao.id),
      supabase.from('paginas_meta').update({ deletado_em: now }).eq('conexao_meta_id', conexao.id),
      supabase.from('formularios_lead_ads').update({ deletado_em: now }).eq('organizacao_id', organizacaoId),
      supabase.from('config_conversions_api').update({ deletado_em: now }).eq('organizacao_id', organizacaoId),
      supabase.from('custom_audiences_meta').update({ deletado_em: now }).eq('organizacao_id', organizacaoId),
    ])
  }

  // =====================================================
  // Paginas
  // =====================================================

  /**
   * Lista paginas do usuario
   */
  async listarPaginas(organizacaoId: string): Promise<ListarPaginasResponse> {
    const { data: conexao } = await supabase
      .from('conexoes_meta')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .eq('status', 'active')
      .is('deletado_em', null)
      .single()

    if (!conexao) {
      throw new Error('Conexao Meta nao encontrada ou inativa')
    }

    const accessToken = decrypt(conexao.access_token_encrypted)

    const response = await withCircuitBreakerAndRetry('meta_graph', 'meta_api', async () => {
      return this.graphRequest<{ data: any[] }>(
        'GET',
        '/me/accounts?fields=id,name,access_token,category,tasks,picture',
        accessToken
      )
    })

    const paginas: PaginaMeta[] = response.data.map(page => ({
      page_id: page.id,
      page_name: page.name,
      page_category: page.category,
      page_picture: page.picture?.data?.url,
      has_lead_access: page.tasks?.includes('ADVERTISE') || false,
    }))

    return { paginas }
  }

  /**
   * Seleciona/conecta uma pagina
   */
  async selecionarPagina(
    organizacaoId: string,
    pageId: string
  ): Promise<PaginaMeta> {
    const { data: conexao } = await supabase
      .from('conexoes_meta')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .eq('status', 'active')
      .is('deletado_em', null)
      .single()

    if (!conexao) {
      throw new Error('Conexao Meta nao encontrada')
    }

    const accessToken = decrypt(conexao.access_token_encrypted)

    // Obtem detalhes da pagina
    const pageData = await withCircuitBreakerAndRetry('meta_graph', 'meta_api', async () => {
      return this.graphRequest<any>(
        'GET',
        `/${pageId}?fields=id,name,access_token,category,picture`,
        accessToken
      )
    })

    // Salva pagina
    const paginaData = {
      conexao_meta_id: conexao.id,
      organizacao_id: organizacaoId,
      page_id: pageData.id,
      page_name: pageData.name,
      page_category: pageData.category,
      page_picture: pageData.picture?.data?.url,
      page_access_token_encrypted: encrypt(pageData.access_token),
      status: 'active' as const,
      conectado_em: new Date().toISOString(),
    }

    // Verifica se ja existe
    const { data: existente } = await supabase
      .from('paginas_meta')
      .select('id')
      .eq('page_id', pageId)
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)
      .single()

    let pagina: any

    if (existente) {
      const { data, error } = await supabase
        .from('paginas_meta')
        .update(paginaData)
        .eq('id', existente.id)
        .select()
        .single()

      if (error) throw new Error(`Erro ao atualizar pagina: ${error.message}`)
      pagina = data
    } else {
      const { data, error } = await supabase
        .from('paginas_meta')
        .insert(paginaData)
        .select()
        .single()

      if (error) throw new Error(`Erro ao salvar pagina: ${error.message}`)
      pagina = data
    }

    return pagina as PaginaMeta
  }

  // =====================================================
  // Lead Ads
  // =====================================================

  /**
   * Lista formularios de Lead Ads de uma pagina
   */
  async listarFormularios(
    organizacaoId: string,
    pageId: string
  ): Promise<{ formularios: FormularioLeadAds[] }> {
    const { data: pagina } = await supabase
      .from('paginas_meta')
      .select('*')
      .eq('page_id', pageId)
      .eq('organizacao_id', organizacaoId)
      .eq('status', 'active')
      .is('deletado_em', null)
      .single()

    if (!pagina) {
      throw new Error('Pagina nao encontrada ou inativa')
    }

    const accessToken = decrypt(pagina.page_access_token_encrypted)

    const response = await withCircuitBreakerAndRetry('meta_graph', 'meta_api', async () => {
      return this.graphRequest<{ data: any[] }>(
        'GET',
        `/${pageId}/leadgen_forms?fields=id,name,status,leads_count,created_time`,
        accessToken
      )
    })

    const formularios: FormularioLeadAds[] = response.data.map(form => ({
      form_id: form.id,
      form_name: form.name,
      form_status: form.status,
      leads_count: form.leads_count,
      created_time: form.created_time,
    }))

    return { formularios }
  }

  /**
   * Cria mapeamento de formulario para funil
   */
  async criarMapeamentoFormulario(
    organizacaoId: string,
    pageId: string,
    formId: string,
    funilId: string,
    mapeamentoCampos: Record<string, string>
  ): Promise<FormularioLeadAds> {
    const { data: pagina } = await supabase
      .from('paginas_meta')
      .select('*')
      .eq('page_id', pageId)
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)
      .single()

    if (!pagina) {
      throw new Error('Pagina nao encontrada')
    }

    // Obtem detalhes do formulario
    const accessToken = decrypt(pagina.page_access_token_encrypted)

    const formData = await withCircuitBreakerAndRetry('meta_graph', 'meta_api', async () => {
      return this.graphRequest<any>(
        'GET',
        `/${formId}?fields=id,name,status,questions`,
        accessToken
      )
    })

    // Salva mapeamento
    const { data, error } = await supabase
      .from('formularios_lead_ads')
      .insert({
        pagina_meta_id: pagina.id,
        organizacao_id: organizacaoId,
        form_id: formId,
        form_name: formData.name,
        form_status: formData.status,
        funil_id: funilId,
        mapeamento_campos: mapeamentoCampos,
        campos_formulario: formData.questions || [],
        ativo: true,
      })
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar mapeamento: ${error.message}`)

    return data as FormularioLeadAds
  }

  // =====================================================
  // Conversions API (CAPI)
  // =====================================================

  /**
   * Configura Conversions API
   */
  async configurarCapi(
    organizacaoId: string,
    pixelId: string,
    accessToken: string
  ): Promise<ConfigCapi> {
    // Valida token testando acesso ao pixel
    const tokenEncrypted = encrypt(accessToken)

    const testResponse = await withCircuitBreakerAndRetry('meta_capi', 'meta_capi_send', async () => {
      return this.graphRequest<any>(
        'GET',
        `/${pixelId}?fields=id,name`,
        accessToken
      )
    })

    const configData = {
      organizacao_id: organizacaoId,
      pixel_id: pixelId,
      pixel_name: testResponse.name,
      access_token_encrypted: tokenEncrypted,
      test_event_code: `TEST_${Date.now()}`,
      ativo: true,
      configurado_em: new Date().toISOString(),
    }

    // Verifica se ja existe
    const { data: existente } = await supabase
      .from('config_conversions_api')
      .select('id')
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)
      .single()

    let config: any

    if (existente) {
      const { data, error } = await supabase
        .from('config_conversions_api')
        .update(configData)
        .eq('id', existente.id)
        .select()
        .single()

      if (error) throw new Error(`Erro ao atualizar config CAPI: ${error.message}`)
      config = data
    } else {
      const { data, error } = await supabase
        .from('config_conversions_api')
        .insert(configData)
        .select()
        .single()

      if (error) throw new Error(`Erro ao criar config CAPI: ${error.message}`)
      config = data
    }

    return config as ConfigCapi
  }

  /**
   * Envia evento para Conversions API
   */
  async enviarEventoCapi(
    organizacaoId: string,
    evento: EventoCapiPayload
  ): Promise<EnviarEventoCapiResponse> {
    const { data: config } = await supabase
      .from('config_conversions_api')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .eq('ativo', true)
      .single()

    if (!config) {
      throw new Error('Conversions API nao configurada')
    }

    const accessToken = decrypt(config.access_token_encrypted)

    // Prepara dados do usuario (hash SHA256 conforme CAPI)
    const userData: Record<string, string> = {}

    if (evento.user_data?.email) {
      userData.em = sha256(evento.user_data.email.toLowerCase().trim())
    }
    if (evento.user_data?.phone) {
      userData.ph = sha256(evento.user_data.phone.replace(/\D/g, ''))
    }
    if (evento.user_data?.first_name) {
      userData.fn = sha256(evento.user_data.first_name.toLowerCase().trim())
    }
    if (evento.user_data?.last_name) {
      userData.ln = sha256(evento.user_data.last_name.toLowerCase().trim())
    }
    if (evento.user_data?.city) {
      userData.ct = sha256(evento.user_data.city.toLowerCase().replace(/\s/g, ''))
    }
    if (evento.user_data?.state) {
      userData.st = sha256(evento.user_data.state.toLowerCase())
    }
    if (evento.user_data?.country) {
      userData.country = sha256(evento.user_data.country.toLowerCase())
    }
    if (evento.user_data?.external_id) {
      userData.external_id = sha256(evento.user_data.external_id)
    }
    if (evento.user_data?.client_ip_address) {
      userData.client_ip_address = evento.user_data.client_ip_address
    }
    if (evento.user_data?.client_user_agent) {
      userData.client_user_agent = evento.user_data.client_user_agent
    }
    if (evento.user_data?.fbc) {
      userData.fbc = evento.user_data.fbc
    }
    if (evento.user_data?.fbp) {
      userData.fbp = evento.user_data.fbp
    }

    // Monta payload do evento
    const eventPayload = {
      event_name: evento.event_name,
      event_time: evento.event_time || Math.floor(Date.now() / 1000),
      action_source: evento.action_source || 'system_generated',
      event_id: evento.event_id || generateIdempotencyKey(),
      event_source_url: evento.event_source_url,
      user_data: userData,
      custom_data: evento.custom_data,
    }

    const payload = {
      data: [eventPayload],
      ...(config.test_event_code ? { test_event_code: config.test_event_code } : {}),
    }

    let response: any
    try {
      response = await withCircuitBreakerAndRetry('meta_capi', 'meta_capi_send', async () => {
        return this.graphRequest<any>(
          'POST',
          `/${config.pixel_id}/events`,
          accessToken,
          payload
        )
      })
    } catch (error) {
      const erroMsg = error instanceof Error ? error.message : 'Unknown error'

      await supabase.from('log_conversions_api').insert({
        config_id: config.id,
        organizacao_id: organizacaoId,
        fbrq_event_id: eventPayload.event_id,
        event_name: evento.event_name,
        event_time: new Date().toISOString(),
        payload_resumo: eventPayload,
        response_body: JSON.stringify({ error: erroMsg }),
        status: 'error',
      })

      throw error
    }

    // Log do evento
    await supabase.from('log_conversions_api').insert({
      config_id: config.id,
      organizacao_id: organizacaoId,
      fbrq_event_id: eventPayload.event_id,
      event_name: evento.event_name,
      event_time: new Date().toISOString(),
      payload_resumo: eventPayload,
      response_body: JSON.stringify(response),
      status: 'success',
    })

    // Atualiza estatisticas
    await supabase
      .from('config_conversions_api')
      .update({
        total_eventos_enviados: (config.total_eventos_enviados || 0) + 1,
        total_eventos_sucesso: (config.total_eventos_sucesso || 0) + 1,
        ultimo_evento_enviado: new Date().toISOString(),
      })
      .eq('id', config.id)

    return {
      event_id: eventPayload.event_id,
      events_received: response.events_received,
      fbtrace_id: response.fbtrace_id,
    }
  }

  // =====================================================
  // CAPI Fire-and-Forget Helper
  // =====================================================

  /**
   * AIDEV-NOTE: Fire-and-forget — falha de CAPI nunca bloqueia operações de negócio.
   * Verifica se o evento está habilitado na config do tenant antes de disparar.
   */
  async dispararEventoSeHabilitado(
    organizacaoId: string,
    tipoEvento: 'lead' | 'schedule' | 'mql' | 'won' | 'lost',
    evento: Partial<EventoCapiPayload>
  ): Promise<void> {
    try {
      const { data: config } = await supabase
        .from('config_conversions_api')
        .select('eventos_habilitados, ativo')
        .eq('organizacao_id', organizacaoId)
        .eq('ativo', true)
        .single()

      if (!config) return
      if (!config.eventos_habilitados?.[tipoEvento]) return

      const eventNames: Record<string, string> = {
        lead: 'Lead',
        schedule: 'Schedule',
        mql: 'CompleteRegistration',
        won: 'Purchase',
        lost: 'Other',
      }

      await this.enviarEventoCapi(organizacaoId, {
        event_name: eventNames[tipoEvento],
        action_source: 'system_generated',
        ...evento,
      } as EventoCapiPayload)
    } catch (error) {
      console.error(`[CAPI] Falha ao disparar evento '${tipoEvento}':`, error instanceof Error ? error.message : error)
    }
  }

  // =====================================================
  // Custom Audiences
  // =====================================================

  /**
   * Lista Custom Audiences
   */
  async listarAudiences(organizacaoId: string): Promise<{ audiences: CustomAudience[] }> {
    const { data: audiences, error } = await supabase
      .from('custom_audiences_meta')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)
      .order('criado_em', { ascending: false })

    if (error) throw new Error(`Erro ao listar audiences: ${error.message}`)

    return { audiences: audiences as CustomAudience[] }
  }

  /**
   * Cria Custom Audience
   */
  async criarAudience(
    organizacaoId: string,
    dados: CriarCustomAudience
  ): Promise<CustomAudience> {
    const { data: conexao } = await supabase
      .from('conexoes_meta')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .eq('status', 'active')
      .is('deletado_em', null)
      .single()

    if (!conexao) {
      throw new Error('Conexao Meta nao encontrada')
    }

    const accessToken = decrypt(conexao.access_token_encrypted)

    // Cria audience no Meta
    const response = await withCircuitBreakerAndRetry('meta_graph', 'meta_api', async () => {
      return this.graphRequest<{ id: string }>(
        'POST',
        `/${dados.ad_account_id}/customaudiences`,
        accessToken,
        {
          name: dados.audience_name,
          subtype: 'CUSTOM',
          customer_file_source: 'USER_PROVIDED_ONLY',
        }
      )
    })

    // Salva no banco
    const { data, error } = await supabase
      .from('custom_audiences_meta')
      .insert({
        conexao_meta_id: conexao.id,
        organizacao_id: organizacaoId,
        audience_id: response.id,
        audience_name: dados.audience_name,
        ad_account_id: dados.ad_account_id,
        tipo_sincronizacao: dados.tipo_sincronizacao || 'evento',
        evento_gatilho: dados.evento_gatilho,
        total_usuarios: 0,
        ativo: true,
      })
      .select()
      .single()

    if (error) throw new Error(`Erro ao salvar audience: ${error.message}`)

    return data as CustomAudience
  }

  /**
   * Adiciona membros a Custom Audience
   */
  async adicionarMembrosAudience(
    organizacaoId: string,
    audienceId: string,
    dados: AdicionarMembrosAudience
  ): Promise<{ num_received: number }> {
    const { data: audience } = await supabase
      .from('custom_audiences_meta')
      .select('*, conexoes_meta(*)')
      .eq('audience_id', audienceId)
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)
      .single()

    if (!audience) {
      throw new Error('Audience nao encontrada')
    }

    const accessToken = decrypt(audience.conexoes_meta.access_token_encrypted)

    // Prepara dados dos membros (hash SHA256)
    const schema = dados.schema || ['EMAIL', 'PHONE']
    const data = dados.members.map(member => {
      const row: string[] = []
      if (schema.includes('EMAIL') && member.email) {
        row.push(sha256(member.email.toLowerCase().trim()))
      }
      if (schema.includes('PHONE') && member.phone) {
        row.push(sha256(member.phone.replace(/\D/g, '')))
      }
      if (schema.includes('FN') && member.first_name) {
        row.push(sha256(member.first_name.toLowerCase().trim()))
      }
      if (schema.includes('LN') && member.last_name) {
        row.push(sha256(member.last_name.toLowerCase().trim()))
      }
      if (schema.includes('EXTERN_ID') && member.external_id) {
        row.push(sha256(member.external_id))
      }
      return row
    })

    const response = await withCircuitBreakerAndRetry('meta_graph', 'meta_api', async () => {
      return this.graphRequest<{ num_received: number }>(
        'POST',
        `/${audienceId}/users`,
        accessToken,
        {
          payload: {
            schema,
            data,
          },
        }
      )
    })

    // Atualiza total de membros
    await supabase
      .from('custom_audiences_meta')
      .update({
        total_membros: (audience.total_membros || 0) + response.num_received,
        ultimo_sync: new Date().toISOString(),
      })
      .eq('id', audience.id)

    // Salva membros localmente
    for (const member of dados.members) {
      await supabase.from('custom_audience_membros').insert({
        audience_id: audience.id,
        organizacao_id: organizacaoId,
        contato_id: member.contato_id,
        email_hash: member.email ? sha256(member.email.toLowerCase().trim()) : null,
        phone_hash: member.phone ? sha256(member.phone.replace(/\D/g, '')) : null,
        status: 'synced',
        sincronizado_em: new Date().toISOString(),
      })
    }

    return response
  }

  /**
   * Remove Custom Audience
   */
  async removerAudience(
    organizacaoId: string,
    audienceId: string
  ): Promise<void> {
    const { data: audience } = await supabase
      .from('custom_audiences_meta')
      .select('*, conexoes_meta(*)')
      .eq('audience_id', audienceId)
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)
      .single()

    if (!audience) {
      throw new Error('Audience nao encontrada')
    }

    const accessToken = decrypt(audience.conexoes_meta.access_token_encrypted)

    // Remove no Meta
    await withCircuitBreakerAndRetry('meta_graph', 'meta_api', async () => {
      return this.graphRequest<any>(
        'DELETE',
        `/${audienceId}`,
        accessToken
      )
    })

    // Soft delete local
    const now = new Date().toISOString()
    await Promise.all([
      supabase.from('custom_audiences_meta').update({ deletado_em: now }).eq('id', audience.id),
      supabase.from('custom_audience_membros').update({ deletado_em: now }).eq('audience_id', audience.id),
    ])
  }

  // =====================================================
  // Webhook Handler (Lead Ads)
  // =====================================================

  /**
   * Processa webhook de Lead Ads
   */
  async processarWebhookLeadAds(
    payload: any
  ): Promise<void> {
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === 'leadgen') {
          const leadgenId = change.value.leadgen_id
          const formId = change.value.form_id
          const pageId = change.value.page_id

          // Busca mapeamento
          const { data: mapeamento } = await supabase
            .from('formularios_lead_ads')
            .select('*, paginas_meta(*)')
            .eq('form_id', formId)
            .eq('ativo', true)
            .is('deletado_em', null)
            .single()

          if (!mapeamento) {
            console.warn(`Mapeamento nao encontrado para form ${formId}`)
            continue
          }

          // Busca dados do lead
          const accessToken = decrypt(mapeamento.paginas_meta.page_access_token_encrypted)

          const leadData = await withCircuitBreakerAndRetry('meta_graph', 'meta_api', async () => {
            return this.graphRequest<any>(
              'GET',
              `/${leadgenId}?fields=id,created_time,field_data`,
              accessToken
            )
          })

          // Converte field_data para objeto
          const leadFields: Record<string, string> = {}
          for (const field of leadData.field_data || []) {
            leadFields[field.name] = field.values?.[0] || ''
          }

          // Mapeia campos para criar contato/oportunidade
          const camposMapeados: Record<string, string> = {}
          for (const [campoForm, campoCrm] of Object.entries(mapeamento.mapeamento_campos)) {
            camposMapeados[campoCrm as string] = leadFields[campoForm] || ''
          }

          // TODO: Criar contato e oportunidade no funil
          // Isso sera implementado junto com PRD-06 e PRD-07
          console.log('Lead recebido:', {
            leadgenId,
            formId,
            pageId,
            campos: camposMapeados,
            funilId: mapeamento.funil_id,
          })

          // Atualiza estatisticas
          await supabase
            .from('formularios_lead_ads')
            .update({
              total_leads_recebidos: (mapeamento.total_leads_recebidos || 0) + 1,
              ultimo_lead_em: new Date().toISOString(),
            })
            .eq('id', mapeamento.id)
        }
      }
    }
  }
}

export default new MetaService()
