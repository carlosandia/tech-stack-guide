/**
 * AIDEV-NOTE: Service para Webhooks Bidirecionais
 * Conforme PRD-05 - Webhooks de Entrada e Saida
 */

import { supabaseAdmin } from '../config/supabase'

const supabase = supabaseAdmin
import { randomBytes } from 'crypto'
import type {
  WebhookEntrada,
  WebhookSaida,
  WebhookSaidaLog,
  CriarWebhookEntradaPayload,
  AtualizarWebhookEntradaPayload,
  CriarWebhookSaidaPayload,
  AtualizarWebhookSaidaPayload,
  ListaWebhooksEntradaResponse,
  ListaWebhooksSaidaResponse,
  ListaLogsResponse,
  EventoWebhook,
} from '../schemas/webhooks'

// =====================================================
// WEBHOOKS DE ENTRADA
// =====================================================

export async function listarWebhooksEntrada(
  organizacaoId: string
): Promise<ListaWebhooksEntradaResponse> {
  const { data, error, count } = await supabase
    .from('webhooks_entrada')
    .select('*', { count: 'exact' })
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)
    .order('criado_em', { ascending: false })

  if (error) {
    throw new Error(`Erro ao listar webhooks de entrada: ${error.message}`)
  }

  return {
    webhooks: data as WebhookEntrada[],
    total: count || 0,
  }
}

export async function buscarWebhookEntrada(
  organizacaoId: string,
  webhookId: string
): Promise<WebhookEntrada | null> {
  const { data, error } = await supabase
    .from('webhooks_entrada')
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .eq('id', webhookId)
    .is('deletado_em', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar webhook de entrada: ${error.message}`)
  }

  return data as WebhookEntrada
}

export async function buscarWebhookEntradaPorToken(
  urlToken: string
): Promise<WebhookEntrada | null> {
  const { data, error } = await supabase
    .from('webhooks_entrada')
    .select('*')
    .eq('url_token', urlToken)
    .eq('ativo', true)
    .is('deletado_em', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar webhook: ${error.message}`)
  }

  return data as WebhookEntrada
}

export async function criarWebhookEntrada(
  organizacaoId: string,
  payload: CriarWebhookEntradaPayload,
  criadoPor?: string
): Promise<WebhookEntrada> {
  const urlToken = gerarToken(32)

  const { data, error } = await supabase
    .from('webhooks_entrada')
    .insert({
      organizacao_id: organizacaoId,
      ...payload,
      url_token: urlToken,
      criado_por: criadoPor,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar webhook de entrada: ${error.message}`)
  }

  return data as WebhookEntrada
}

export async function atualizarWebhookEntrada(
  organizacaoId: string,
  webhookId: string,
  payload: AtualizarWebhookEntradaPayload
): Promise<WebhookEntrada> {
  const { data, error } = await supabase
    .from('webhooks_entrada')
    .update({
      ...payload,
      atualizado_em: new Date().toISOString(),
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', webhookId)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar webhook de entrada: ${error.message}`)
  }

  return data as WebhookEntrada
}

export async function excluirWebhookEntrada(
  organizacaoId: string,
  webhookId: string
): Promise<void> {
  const { error } = await supabase
    .from('webhooks_entrada')
    .update({
      deletado_em: new Date().toISOString(),
      ativo: false,
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', webhookId)

  if (error) {
    throw new Error(`Erro ao excluir webhook de entrada: ${error.message}`)
  }
}

export async function regenerarTokenWebhookEntrada(
  organizacaoId: string,
  webhookId: string
): Promise<WebhookEntrada> {
  const novoToken = gerarToken(32)

  const { data, error } = await supabase
    .from('webhooks_entrada')
    .update({
      url_token: novoToken,
      atualizado_em: new Date().toISOString(),
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', webhookId)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao regenerar token: ${error.message}`)
  }

  return data as WebhookEntrada
}

export async function registrarRequestWebhookEntrada(
  webhookId: string
): Promise<void> {
  const { error } = await supabase
    .from('webhooks_entrada')
    .update({
      total_requests: supabase.rpc('increment_counter', { row_id: webhookId }),
      ultimo_request: new Date().toISOString(),
    })
    .eq('id', webhookId)

  if (error) {
    console.error('Erro ao registrar request do webhook:', error)
  }
}

// =====================================================
// WEBHOOKS DE SAIDA
// =====================================================

export async function listarWebhooksSaida(
  organizacaoId: string
): Promise<ListaWebhooksSaidaResponse> {
  const { data, error, count } = await supabase
    .from('webhooks_saida')
    .select('*', { count: 'exact' })
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)
    .order('criado_em', { ascending: false })

  if (error) {
    throw new Error(`Erro ao listar webhooks de saida: ${error.message}`)
  }

  return {
    webhooks: data as WebhookSaida[],
    total: count || 0,
  }
}

export async function buscarWebhookSaida(
  organizacaoId: string,
  webhookId: string
): Promise<WebhookSaida | null> {
  const { data, error } = await supabase
    .from('webhooks_saida')
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .eq('id', webhookId)
    .is('deletado_em', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar webhook de saida: ${error.message}`)
  }

  return data as WebhookSaida
}

export async function criarWebhookSaida(
  organizacaoId: string,
  payload: CriarWebhookSaidaPayload,
  criadoPor?: string
): Promise<WebhookSaida> {
  const { data, error } = await supabase
    .from('webhooks_saida')
    .insert({
      organizacao_id: organizacaoId,
      ...payload,
      criado_por: criadoPor,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar webhook de saida: ${error.message}`)
  }

  return data as WebhookSaida
}

export async function atualizarWebhookSaida(
  organizacaoId: string,
  webhookId: string,
  payload: AtualizarWebhookSaidaPayload
): Promise<WebhookSaida> {
  const { data, error } = await supabase
    .from('webhooks_saida')
    .update({
      ...payload,
      atualizado_em: new Date().toISOString(),
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', webhookId)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar webhook de saida: ${error.message}`)
  }

  return data as WebhookSaida
}

export async function excluirWebhookSaida(
  organizacaoId: string,
  webhookId: string
): Promise<void> {
  const { error } = await supabase
    .from('webhooks_saida')
    .update({
      deletado_em: new Date().toISOString(),
      ativo: false,
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', webhookId)

  if (error) {
    throw new Error(`Erro ao excluir webhook de saida: ${error.message}`)
  }
}

// =====================================================
// DISPARO DE WEBHOOKS
// =====================================================

export async function dispararWebhook(
  organizacaoId: string,
  evento: EventoWebhook,
  payload: Record<string, unknown>
): Promise<void> {
  // Buscar todos webhooks ativos que escutam este evento
  const { data: webhooks, error } = await supabase
    .from('webhooks_saida')
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .eq('ativo', true)
    .contains('eventos', [evento])
    .is('deletado_em', null)

  if (error) {
    console.error('Erro ao buscar webhooks para disparo:', error)
    return
  }

  if (!webhooks || webhooks.length === 0) {
    return
  }

  // Disparar para cada webhook
  for (const webhook of webhooks) {
    await enviarWebhook(webhook as WebhookSaida, evento, payload)
  }
}

async function enviarWebhook(
  webhook: WebhookSaida,
  evento: string,
  payload: Record<string, unknown>,
  tentativa = 1
): Promise<void> {
  const inicio = Date.now()

  try {
    // Montar headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': evento,
      'X-Webhook-Timestamp': new Date().toISOString(),
      ...webhook.headers_customizados,
    }

    // Adicionar autenticacao
    if (webhook.auth_tipo !== 'nenhum' && webhook.auth_valor) {
      switch (webhook.auth_tipo) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${webhook.auth_valor}`
          break
        case 'api_key':
          headers[webhook.auth_header || 'X-API-Key'] = webhook.auth_valor
          break
        case 'basic':
          headers['Authorization'] = `Basic ${Buffer.from(webhook.auth_valor).toString('base64')}`
          break
      }
    }

    // Fazer request
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        evento,
        dados: payload,
        timestamp: new Date().toISOString(),
      }),
    })

    const duracao = Date.now() - inicio
    const responseBody = await response.text()

    // Registrar log
    await registrarLogWebhook(webhook, evento, payload, {
      statusCode: response.status,
      responseBody,
      sucesso: response.ok,
      duracao,
      tentativa,
    })

    // Se falhou e retry esta ativo, tentar novamente
    if (!response.ok && webhook.retry_ativo && tentativa < webhook.max_tentativas) {
      const delay = Math.pow(2, tentativa) * 1000 // Backoff exponencial
      setTimeout(() => {
        enviarWebhook(webhook, evento, payload, tentativa + 1)
      }, delay)
    }
  } catch (error) {
    const duracao = Date.now() - inicio
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'

    // Registrar log de erro
    await registrarLogWebhook(webhook, evento, payload, {
      sucesso: false,
      erroMensagem: errorMessage,
      duracao,
      tentativa,
    })

    // Retry se permitido
    if (webhook.retry_ativo && tentativa < webhook.max_tentativas) {
      const delay = Math.pow(2, tentativa) * 1000
      setTimeout(() => {
        enviarWebhook(webhook, evento, payload, tentativa + 1)
      }, delay)
    }
  }
}

async function registrarLogWebhook(
  webhook: WebhookSaida,
  evento: string,
  payload: Record<string, unknown>,
  resultado: {
    statusCode?: number
    responseBody?: string
    sucesso: boolean
    erroMensagem?: string
    duracao: number
    tentativa: number
  }
): Promise<void> {
  const { error } = await supabase.from('webhooks_saida_logs').insert({
    organizacao_id: webhook.organizacao_id,
    webhook_id: webhook.id,
    evento,
    payload,
    status_code: resultado.statusCode,
    response_body: resultado.responseBody?.substring(0, 10000), // Limitar tamanho
    sucesso: resultado.sucesso,
    erro_mensagem: resultado.erroMensagem,
    duracao_ms: resultado.duracao,
    tentativa: resultado.tentativa,
  })

  if (error) {
    console.error('Erro ao registrar log de webhook:', error)
  }
}

// =====================================================
// LOGS DE WEBHOOK SAIDA
// =====================================================

export async function listarLogsWebhook(
  organizacaoId: string,
  webhookId: string,
  filtros?: {
    evento?: string
    sucesso?: boolean
    page?: number
    limit?: number
  }
): Promise<ListaLogsResponse> {
  const { evento, sucesso, page = 1, limit = 20 } = filtros || {}
  const offset = (page - 1) * limit

  let query = supabase
    .from('webhooks_saida_logs')
    .select('*', { count: 'exact' })
    .eq('organizacao_id', organizacaoId)
    .eq('webhook_id', webhookId)

  if (evento) {
    query = query.eq('evento', evento)
  }

  if (sucesso !== undefined) {
    query = query.eq('sucesso', sucesso)
  }

  const { data, error, count } = await query
    .order('criado_em', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`Erro ao listar logs: ${error.message}`)
  }

  return {
    logs: data as WebhookSaidaLog[],
    total: count || 0,
    page,
    total_paginas: Math.ceil((count || 0) / limit),
  }
}

// =====================================================
// TESTAR WEBHOOK
// =====================================================

export async function testarWebhook(
  organizacaoId: string,
  webhookId: string
): Promise<{ sucesso: boolean; statusCode?: number; mensagem: string; duracao: number }> {
  const webhook = await buscarWebhookSaida(organizacaoId, webhookId)

  if (!webhook) {
    throw new Error('Webhook nao encontrado')
  }

  const inicio = Date.now()

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': 'test',
      'X-Webhook-Timestamp': new Date().toISOString(),
      ...webhook.headers_customizados,
    }

    if (webhook.auth_tipo !== 'nenhum' && webhook.auth_valor) {
      switch (webhook.auth_tipo) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${webhook.auth_valor}`
          break
        case 'api_key':
          headers[webhook.auth_header || 'X-API-Key'] = webhook.auth_valor
          break
        case 'basic':
          headers['Authorization'] = `Basic ${Buffer.from(webhook.auth_valor).toString('base64')}`
          break
      }
    }

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        evento: 'test',
        dados: { mensagem: 'Teste de webhook do CRM Renove' },
        timestamp: new Date().toISOString(),
      }),
    })

    const duracao = Date.now() - inicio

    return {
      sucesso: response.ok,
      statusCode: response.status,
      mensagem: response.ok ? 'Webhook respondeu com sucesso' : `Webhook retornou status ${response.status}`,
      duracao,
    }
  } catch (error) {
    const duracao = Date.now() - inicio
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'

    return {
      sucesso: false,
      mensagem: `Erro ao conectar: ${errorMessage}`,
      duracao,
    }
  }
}

// =====================================================
// Helpers
// =====================================================

function gerarToken(tamanho: number): string {
  return randomBytes(tamanho).toString('hex')
}

export default {
  // Entrada
  listarWebhooksEntrada,
  buscarWebhookEntrada,
  buscarWebhookEntradaPorToken,
  criarWebhookEntrada,
  atualizarWebhookEntrada,
  excluirWebhookEntrada,
  regenerarTokenWebhookEntrada,
  registrarRequestWebhookEntrada,
  // Saida
  listarWebhooksSaida,
  buscarWebhookSaida,
  criarWebhookSaida,
  atualizarWebhookSaida,
  excluirWebhookSaida,
  dispararWebhook,
  listarLogsWebhook,
  testarWebhook,
}
