/**
 * AIDEV-NOTE: Service para Webhooks de Formularios (Etapa 4)
 * Inclui disparo com retry e logging
 */

import { supabaseAdmin } from '../config/supabase.js'
import type {
  WebhookFormulario,
  CriarWebhookFormularioPayload,
  AtualizarWebhookFormularioPayload,
} from '../schemas/formularios.js'

const supabase = supabaseAdmin

async function verificarFormulario(organizacaoId: string, formularioId: string): Promise<any> {
  const { data, error } = await supabase
    .from('formularios')
    .select('id')
    .eq('organizacao_id', organizacaoId)
    .eq('id', formularioId)
    .is('deletado_em', null)
    .single()
  if (error || !data) throw new Error('Formulario nao encontrado')
  return data
}

// =====================================================
// CRUD WEBHOOKS
// =====================================================

export async function listarWebhooks(
  organizacaoId: string,
  formularioId: string
): Promise<WebhookFormulario[]> {
  await verificarFormulario(organizacaoId, formularioId)

  const { data, error } = await supabase
    .from('webhooks_formularios')
    .select('*')
    .eq('formulario_id', formularioId)
    .eq('organizacao_id', organizacaoId)
    .order('criado_em', { ascending: false })

  if (error) throw new Error(`Erro ao listar webhooks: ${error.message}`)
  return data as WebhookFormulario[]
}

export async function criarWebhook(
  organizacaoId: string,
  formularioId: string,
  payload: CriarWebhookFormularioPayload
): Promise<WebhookFormulario> {
  await verificarFormulario(organizacaoId, formularioId)

  const { data, error } = await supabase
    .from('webhooks_formularios')
    .insert({
      formulario_id: formularioId,
      organizacao_id: organizacaoId,
      ...payload,
    })
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar webhook: ${error.message}`)
  return data as WebhookFormulario
}

export async function atualizarWebhook(
  organizacaoId: string,
  formularioId: string,
  webhookId: string,
  payload: AtualizarWebhookFormularioPayload
): Promise<WebhookFormulario> {
  await verificarFormulario(organizacaoId, formularioId)

  const { data, error } = await supabase
    .from('webhooks_formularios')
    .update({ ...payload, atualizado_em: new Date().toISOString() })
    .eq('id', webhookId)
    .eq('organizacao_id', organizacaoId)
    .select()
    .single()

  if (error) throw new Error(`Erro ao atualizar webhook: ${error.message}`)
  return data as WebhookFormulario
}

export async function excluirWebhook(
  organizacaoId: string,
  formularioId: string,
  webhookId: string
): Promise<void> {
  await verificarFormulario(organizacaoId, formularioId)

  const { error } = await supabase
    .from('webhooks_formularios')
    .delete()
    .eq('id', webhookId)
    .eq('organizacao_id', organizacaoId)

  if (error) throw new Error(`Erro ao excluir webhook: ${error.message}`)
}

// =====================================================
// DISPARO DE WEBHOOK COM RETRY
// =====================================================

export async function dispararWebhooksFormulario(
  formularioId: string,
  submissaoId: string,
  dadosSubmissao: Record<string, unknown>,
  metadados?: Record<string, unknown>
): Promise<void> {
  const { data: webhooks } = await supabase
    .from('webhooks_formularios')
    .select('*')
    .eq('formulario_id', formularioId)
    .eq('ativo', true)

  if (!webhooks || webhooks.length === 0) return

  for (const webhook of webhooks) {
    await dispararWebhookComRetry(webhook as WebhookFormulario, submissaoId, dadosSubmissao, metadados)
  }
}

async function dispararWebhookComRetry(
  webhook: WebhookFormulario,
  submissaoId: string,
  dados: Record<string, unknown>,
  metadados?: Record<string, unknown>,
  tentativa: number = 1
): Promise<void> {
  const body = construirPayload(webhook, dados, metadados)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(webhook.headers_customizados as Record<string, string> || {}),
  }

  const inicio = Date.now()
  let logId: string | null = null

  try {
    // Registrar log
    const { data: log } = await supabase
      .from('logs_webhooks_formularios')
      .insert({
        webhook_id: webhook.id,
        submissao_id: submissaoId,
        request_url: webhook.url_webhook,
        request_metodo: webhook.metodo_http,
        request_headers: headers,
        request_body: JSON.stringify(body),
        status: 'pendente',
        contagem_retry: tentativa - 1,
      })
      .select('id')
      .single()

    logId = log?.id || null

    const response = await fetch(webhook.url_webhook, {
      method: webhook.metodo_http || 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    })

    const tempoMs = Date.now() - inicio
    const responseBody = await response.text().catch(() => '')

    // Atualizar log
    if (logId) {
      await supabase
        .from('logs_webhooks_formularios')
        .update({
          response_status_code: response.status,
          response_body: responseBody.substring(0, 5000),
          response_tempo_ms: tempoMs,
          status: response.ok ? 'sucesso' : 'falhou',
          concluido_em: new Date().toISOString(),
        })
        .eq('id', logId)
    }

    // Atualizar contadores do webhook
    if (response.ok) {
      await supabase
        .from('webhooks_formularios')
        .update({
          ultimo_disparo_em: new Date().toISOString(),
          ultimo_status_code: response.status,
          ultimo_erro: null,
          contagem_sucesso: webhook.contagem_sucesso + 1,
        })
        .eq('id', webhook.id)
    } else {
      throw new Error(`HTTP ${response.status}: ${responseBody.substring(0, 200)}`)
    }
  } catch (err) {
    const tempoMs = Date.now() - inicio
    const mensagemErro = err instanceof Error ? err.message : 'Erro desconhecido'

    if (logId) {
      await supabase
        .from('logs_webhooks_formularios')
        .update({
          response_tempo_ms: tempoMs,
          status: tentativa < webhook.max_tentativas ? 'retry' : 'falhou',
          mensagem_erro: mensagemErro,
          concluido_em: new Date().toISOString(),
        })
        .eq('id', logId)
    }

    // Atualizar webhook
    await supabase
      .from('webhooks_formularios')
      .update({
        ultimo_disparo_em: new Date().toISOString(),
        ultimo_erro: mensagemErro,
        contagem_falha: webhook.contagem_falha + 1,
      })
      .eq('id', webhook.id)

    // Retry com backoff exponencial
    if (webhook.retry_ativo && tentativa < webhook.max_tentativas) {
      const atraso = webhook.atraso_retry_segundos * Math.pow(2, tentativa - 1) * 1000
      setTimeout(() => {
        dispararWebhookComRetry(webhook, submissaoId, dados, metadados, tentativa + 1)
      }, atraso)
    }
  }
}

function construirPayload(
  webhook: WebhookFormulario,
  dados: Record<string, unknown>,
  metadados?: Record<string, unknown>
): Record<string, unknown> {
  let payload: Record<string, unknown> = {}

  // Aplicar mapeamento de campos
  const mapeamento = webhook.mapeamento_campos as Record<string, string> | null
  if (mapeamento && Object.keys(mapeamento).length > 0) {
    for (const [campoOriginal, campoDestino] of Object.entries(mapeamento)) {
      if (dados[campoOriginal] !== undefined) {
        payload[campoDestino] = dados[campoOriginal]
      }
    }
  } else {
    payload = { ...dados }
  }

  if (webhook.incluir_metadados && metadados) {
    payload._metadados = metadados
  }

  return payload
}

// =====================================================
// TESTAR WEBHOOK
// =====================================================

export async function testarWebhook(
  organizacaoId: string,
  formularioId: string,
  webhookId: string
): Promise<{ sucesso: boolean; status_code?: number; tempo_ms: number; erro?: string }> {
  await verificarFormulario(organizacaoId, formularioId)

  const { data: webhook, error } = await supabase
    .from('webhooks_formularios')
    .select('*')
    .eq('id', webhookId)
    .eq('organizacao_id', organizacaoId)
    .single()

  if (error || !webhook) throw new Error('Webhook nao encontrado')

  const dadosTeste = {
    _teste: true,
    formulario_id: formularioId,
    timestamp: new Date().toISOString(),
    dados: { nome: 'Teste', email: 'teste@exemplo.com' },
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(webhook.headers_customizados as Record<string, string> || {}),
  }

  const inicio = Date.now()

  try {
    const response = await fetch(webhook.url_webhook, {
      method: webhook.metodo_http || 'POST',
      headers,
      body: JSON.stringify(dadosTeste),
      signal: AbortSignal.timeout(15000),
    })

    const tempoMs = Date.now() - inicio

    return {
      sucesso: response.ok,
      status_code: response.status,
      tempo_ms: tempoMs,
    }
  } catch (err) {
    return {
      sucesso: false,
      tempo_ms: Date.now() - inicio,
      erro: err instanceof Error ? err.message : 'Erro desconhecido',
    }
  }
}

// =====================================================
// LOGS
// =====================================================

export async function listarLogsWebhook(
  organizacaoId: string,
  formularioId: string,
  webhookId: string
): Promise<any[]> {
  await verificarFormulario(organizacaoId, formularioId)

  const { data, error } = await supabase
    .from('logs_webhooks_formularios')
    .select('*')
    .eq('webhook_id', webhookId)
    .order('disparado_em', { ascending: false })
    .limit(50)

  if (error) throw new Error(`Erro ao listar logs: ${error.message}`)
  return data || []
}

export default {
  listarWebhooks,
  criarWebhook,
  atualizarWebhook,
  excluirWebhook,
  dispararWebhooksFormulario,
  testarWebhook,
  listarLogsWebhook,
}
