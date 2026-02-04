/**
 * AIDEV-NOTE: Service para Integracoes OAuth
 * Conforme PRD-05 - Conexoes com Plataformas Externas
 *
 * Plataformas: WhatsApp WAHA, Meta, Google, Email SMTP
 */

import { supabaseAdmin } from '../config/supabase'

const supabase = supabaseAdmin
import type {
  Integracao,
  ConectarIntegracaoPayload,
  ListaIntegracoesResponse,
  PlataformaIntegracao,
} from '../schemas/integracoes'

// AIDEV-NOTE: Tipos internos para criar/atualizar integracoes
// Esses tipos incluem campos de token que nao vem do request HTTP
interface CriarIntegracaoPayloadInterno extends ConectarIntegracaoPayload {
  access_token?: string
  refresh_token?: string
  token_expira_em?: string
  conta_nome?: string
  conta_id?: string
}

interface AtualizarIntegracaoPayloadInterno {
  access_token?: string
  refresh_token?: string
  token_expira_em?: string
  conta_nome?: string
  conta_id?: string
  ativa?: boolean
  status?: string
  ultimo_erro?: string
}

// =====================================================
// Listar Integracoes
// =====================================================

export async function listarIntegracoes(
  organizacaoId: string,
  filtros?: {
    plataforma?: PlataformaIntegracao
    ativa?: boolean
  }
): Promise<ListaIntegracoesResponse> {
  const { plataforma, ativa } = filtros || {}

  let query = supabase
    .from('integracoes')
    .select('*', { count: 'exact' })
    .eq('organizacao_id', organizacaoId)

  if (plataforma) {
    query = query.eq('plataforma', plataforma)
  }

  // AIDEV-NOTE: Campo ativa nao existe na tabela - usar status
  if (ativa !== undefined) {
    query = query.eq('status', ativa ? 'conectado' : 'desconectado')
  }

  const { data, error, count } = await query.order('criado_em', { ascending: false })

  if (error) {
    throw new Error(`Erro ao listar integracoes: ${error.message}`)
  }

  // Ocultar dados sensiveis
  const integracoesSanitizadas = (data || []).map(sanitizarIntegracao)

  return {
    integracoes: integracoesSanitizadas as Integracao[],
    total: count || 0,
  }
}

// =====================================================
// Buscar Integracao por ID
// =====================================================

export async function buscarIntegracao(
  organizacaoId: string,
  integracaoId: string
): Promise<Integracao | null> {
  const { data, error } = await supabase
    .from('integracoes')
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .eq('id', integracaoId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar integracao: ${error.message}`)
  }

  return sanitizarIntegracao(data) as Integracao
}

// =====================================================
// Buscar Integracao por Plataforma
// =====================================================

export async function buscarIntegracaoPorPlataforma(
  organizacaoId: string,
  plataforma: PlataformaIntegracao
): Promise<Integracao | null> {
  // AIDEV-NOTE: Usar status ao inves de ativa (campo nao existe na tabela)
  const { data, error } = await supabase
    .from('integracoes')
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .eq('plataforma', plataforma)
    .eq('status', 'conectado')
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar integracao: ${error.message}`)
  }

  return data as Integracao
}

// =====================================================
// Criar Integracao
// =====================================================

export async function criarIntegracao(
  organizacaoId: string,
  payload: CriarIntegracaoPayloadInterno,
  criadoPor?: string
): Promise<Integracao> {
  // Verificar se ja existe integracao ativa para a plataforma
  const existente = await buscarIntegracaoPorPlataforma(organizacaoId, payload.plataforma)

  if (existente) {
    throw new Error(`Ja existe uma integracao ativa com ${payload.plataforma}`)
  }

  const { data, error } = await supabase
    .from('integracoes')
    .insert({
      organizacao_id: organizacaoId,
      ...payload,
      criado_por: criadoPor,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar integracao: ${error.message}`)
  }

  return sanitizarIntegracao(data) as Integracao
}

// =====================================================
// Atualizar Integracao
// =====================================================

export async function atualizarIntegracao(
  organizacaoId: string,
  integracaoId: string,
  payload: AtualizarIntegracaoPayloadInterno
): Promise<Integracao> {
  const { data, error } = await supabase
    .from('integracoes')
    .update({
      ...payload,
      atualizado_em: new Date().toISOString(),
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', integracaoId)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar integracao: ${error.message}`)
  }

  return sanitizarIntegracao(data) as Integracao
}

// =====================================================
// Desconectar Integracao (Soft Delete)
// =====================================================

export async function desconectarIntegracao(
  organizacaoId: string,
  integracaoId: string
): Promise<void> {
  // AIDEV-NOTE: Usar status 'desconectado' ao inves de deletado_em/ativa
  const { error } = await supabase
    .from('integracoes')
    .update({
      status: 'desconectado',
      access_token: null,
      refresh_token: null,
      atualizado_em: new Date().toISOString(),
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', integracaoId)

  if (error) {
    throw new Error(`Erro ao desconectar integracao: ${error.message}`)
  }
}

// =====================================================
// Gerar URL de Autenticacao OAuth
// =====================================================

export function gerarUrlAutenticacao(
  plataforma: PlataformaIntegracao,
  organizacaoId: string,
  redirectUri: string
): string {
  const state = Buffer.from(
    JSON.stringify({ organizacaoId, plataforma, timestamp: Date.now() })
  ).toString('base64')

  switch (plataforma) {
    case 'google':
      return gerarUrlGoogle(state, redirectUri)
    case 'meta_ads':
      return gerarUrlMeta(state, redirectUri)
    default:
      throw new Error(`Plataforma ${plataforma} nao suporta OAuth`)
  }
}

function gerarUrlGoogle(state: string, redirectUri: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID nao configurado')

  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email',
  ].join(' ')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    state,
    access_type: 'offline',
    prompt: 'consent',
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

function gerarUrlMeta(state: string, redirectUri: string): string {
  const appId = process.env.META_APP_ID
  if (!appId) throw new Error('META_APP_ID nao configurado')

  const scopes = [
    'pages_messaging',
    'pages_read_engagement',
    'pages_manage_metadata',
    'instagram_basic',
    'instagram_manage_messages',
  ].join(',')

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: scopes,
    state,
    response_type: 'code',
  })

  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`
}

// =====================================================
// Processar Callback OAuth
// =====================================================

export async function processarCallbackOAuth(
  plataforma: PlataformaIntegracao,
  code: string,
  state: string,
  redirectUri: string
): Promise<Integracao> {
  // Decodificar state
  const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
  const { organizacaoId } = stateData

  // Trocar code por tokens
  const tokens = await trocarCodePorTokens(plataforma, code, redirectUri)

  // Buscar informacoes da conta
  const contaInfo = await buscarInfoConta(plataforma, tokens.access_token)

  // Criar ou atualizar integracao
  const existente = await buscarIntegracaoPorPlataforma(organizacaoId, plataforma)

  if (existente) {
    return atualizarIntegracao(organizacaoId, existente.id, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expira_em: tokens.expires_at,
      conta_nome: contaInfo.nome,
      conta_id: contaInfo.id,
      ativa: true,
    })
  }

  return criarIntegracao(organizacaoId, {
    plataforma,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expira_em: tokens.expires_at,
    conta_nome: contaInfo.nome,
    conta_id: contaInfo.id,
  })
}

async function trocarCodePorTokens(
  plataforma: PlataformaIntegracao,
  code: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token?: string; expires_at?: string }> {
  // AIDEV-NOTE: Implementar chamadas reais para cada provedor
  // Por ora, retorna estrutura de exemplo
  console.log(`Trocando code por tokens para ${plataforma}`, { code, redirectUri })

  return {
    access_token: 'token_placeholder',
    refresh_token: 'refresh_placeholder',
    expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
  }
}

async function buscarInfoConta(
  plataforma: PlataformaIntegracao,
  accessToken: string
): Promise<{ id: string; nome: string }> {
  // AIDEV-NOTE: Implementar chamadas reais para cada provedor
  console.log(`Buscando info da conta para ${plataforma}`, { accessToken })

  return {
    id: 'conta_id_placeholder',
    nome: 'Conta Conectada',
  }
}

// =====================================================
// Sincronizar Integracao
// =====================================================

export async function sincronizarIntegracao(
  organizacaoId: string,
  integracaoId: string
): Promise<{ sucesso: boolean; mensagem: string }> {
  const integracao = await buscarIntegracao(organizacaoId, integracaoId)

  if (!integracao) {
    throw new Error('Integracao nao encontrada')
  }

  // AIDEV-NOTE: Usar status ao inves de ativa (campo nao existe na tabela)
  if (integracao.status !== 'conectado') {
    throw new Error('Integracao inativa')
  }

  // AIDEV-NOTE: Implementar sincronizacao real por plataforma
  // Atualizar timestamp de ultima sincronizacao
  await supabase
    .from('integracoes')
    .update({ ultima_sincronizacao: new Date().toISOString() })
    .eq('id', integracaoId)

  return {
    sucesso: true,
    mensagem: 'Sincronizacao iniciada com sucesso',
  }
}

// =====================================================
// Helpers
// =====================================================

function sanitizarIntegracao(integracao: Record<string, unknown>): Record<string, unknown> {
  // Ocultar tokens e dados sensiveis na resposta
  const { access_token, refresh_token, ...rest } = integracao
  return {
    ...rest,
    tem_token: !!access_token,
    tem_refresh: !!refresh_token,
  }
}

export default {
  listarIntegracoes,
  buscarIntegracao,
  buscarIntegracaoPorPlataforma,
  criarIntegracao,
  atualizarIntegracao,
  desconectarIntegracao,
  gerarUrlAutenticacao,
  processarCallbackOAuth,
  sincronizarIntegracao,
}
