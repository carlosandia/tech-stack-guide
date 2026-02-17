/**
 * AIDEV-NOTE: Service para integracao WhatsApp via WAHA
 * Conforme PRD-08 - Secao 1. WhatsApp via WAHA Plus
 *
 * NOTA: A instalacao do WAHA no servidor sera documentada no PRD-16
 * Este service esta preparado mas depende do WAHA_URL e WAHA_API_KEY
 */

import { supabaseAdmin as supabase } from '../config/supabase'
import { env } from '../config/env'
import { withCircuitBreakerAndRetry } from '../utils/retry'
import type {
  SessaoWhatsApp,
  StatusWhatsApp,
  IniciarSessaoResponse,
  QrCodeResponse,
  StatusWhatsAppResponse,
  WahaWebhookPayload,
  EnviarMensagemWhatsApp,
  EnviarMensagemResponse,
} from '../schemas/conexoes/whatsapp'
import conversasService from './conversas.service'
import mensagensService from './mensagens.service'
import type { TipoMensagem } from '../schemas/mensagens'

// =====================================================
// Tipos Internos
// =====================================================

interface WahaConfig {
  url: string
  apiKey: string
}

// =====================================================
// Service
// =====================================================

class WahaService {
  private config: WahaConfig | null = null

  constructor() {
    this.loadConfig()
  }

  private loadConfig(): void {
    const url = env.WAHA_URL || process.env.WAHA_URL
    const apiKey = env.WAHA_API_KEY || process.env.WAHA_API_KEY

    if (url && apiKey) {
      this.config = { url, apiKey }
    }
  }

  /**
   * Verifica se WAHA esta configurado
   */
  isConfigured(): boolean {
    return this.config !== null
  }

  /**
   * Gera o nome da sessao WAHA
   */
  private generateSessionName(organizacaoId: string, usuarioId: string): string {
    // Formato: wpp-{org_id_short}-{user_id_short}
    const orgShort = organizacaoId.substring(0, 8)
    const userShort = usuarioId.substring(0, 8)
    return `wpp-${orgShort}-${userShort}`
  }

  /**
   * Faz requisicao para WAHA API
   */
  private async wahaRequest<T>(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<T> {
    if (!this.config) {
      throw new Error('WAHA nao configurado. Configure WAHA_URL e WAHA_API_KEY')
    }

    const url = `${this.config.url}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.config.apiKey) {
      headers['X-Api-Key'] = this.config.apiKey
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`WAHA API Error: ${response.status} - ${errorText}`)
    }

    return response.json() as T
  }

  // =====================================================
  // Operacoes de Sessao
  // =====================================================

  /**
   * Inicia uma nova sessao WhatsApp
   */
  async iniciarSessao(
    organizacaoId: string,
    usuarioId: string
  ): Promise<IniciarSessaoResponse> {
    const sessionName = this.generateSessionName(organizacaoId, usuarioId)

    // Verifica se ja existe sessao
    const { data: existente } = await supabase
      .from('sessoes_whatsapp')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .is('deletado_em', null)
      .single()

    if (existente && existente.status === 'connected') {
      return {
        id: existente.id,
        session_name: existente.session_name,
        status: existente.status as StatusWhatsApp,
        message: 'Sessao ja esta conectada',
      }
    }

    // Cria sessao no WAHA (se configurado)
    if (this.isConfigured()) {
      await withCircuitBreakerAndRetry('waha', 'whatsapp_send', async () => {
        await this.wahaRequest('POST', '/api/sessions', {
          name: sessionName,
          config: {
            webhooks: [
              {
                url: `${env.API_URL}/webhooks/waha/${organizacaoId}`,
                events: ['message', 'message.ack', 'session.status'],
              }
            ]
          }
        })
      })
    }

    // Cria ou atualiza registro no banco
    const sessionData = {
      organizacao_id: organizacaoId,
      usuario_id: usuarioId,
      session_name: sessionName,
      status: 'qr_pending' as StatusWhatsApp,
      ultimo_qr_gerado: new Date().toISOString(),
      webhook_url: `${env.API_URL || ''}/webhooks/waha/${organizacaoId}`,
    }

    let sessaoId: string

    if (existente) {
      const { data, error } = await supabase
        .from('sessoes_whatsapp')
        .update(sessionData)
        .eq('id', existente.id)
        .select()
        .single()

      if (error) throw new Error(`Erro ao atualizar sessao: ${error.message}`)
      sessaoId = data.id
    } else {
      const { data, error } = await supabase
        .from('sessoes_whatsapp')
        .insert(sessionData)
        .select()
        .single()

      if (error) throw new Error(`Erro ao criar sessao: ${error.message}`)
      sessaoId = data.id
    }

    return {
      id: sessaoId,
      session_name: sessionName,
      status: 'qr_pending',
      message: 'Sessao criada. Solicite o QR Code para continuar.',
    }
  }

  /**
   * Obtem o QR Code para conexao
   */
  async obterQrCode(
    organizacaoId: string,
    usuarioId: string
  ): Promise<QrCodeResponse> {
    // Busca sessao
    const { data: sessao, error } = await supabase
      .from('sessoes_whatsapp')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .is('deletado_em', null)
      .single()

    if (error || !sessao) {
      throw new Error('Sessao nao encontrada. Inicie uma nova sessao primeiro.')
    }

    if (sessao.status === 'connected') {
      return {
        qr_code: '',
        expires_in: 0,
        status: 'connected',
      }
    }

    // Busca QR Code no WAHA
    if (this.isConfigured()) {
      const qrResponse = await withCircuitBreakerAndRetry('waha', 'whatsapp_send', async () => {
        return this.wahaRequest<{ value: string }>('GET', `/api/${sessao.session_name}/auth/qr`)
      })

      // Atualiza timestamp do QR
      await supabase
        .from('sessoes_whatsapp')
        .update({ ultimo_qr_gerado: new Date().toISOString() })
        .eq('id', sessao.id)

      return {
        qr_code: qrResponse.value,
        expires_in: 60, // QR Code expira em 60 segundos
        status: sessao.status as StatusWhatsApp,
      }
    }

    // Se WAHA nao configurado, retorna placeholder
    return {
      qr_code: 'data:image/png;base64,PLACEHOLDER_QR_CODE',
      expires_in: 60,
      status: sessao.status as StatusWhatsApp,
    }
  }

  /**
   * Obtem o status da conexao
   */
  async obterStatus(
    organizacaoId: string,
    usuarioId: string
  ): Promise<StatusWhatsAppResponse> {
    const { data: sessao } = await supabase
      .from('sessoes_whatsapp')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .is('deletado_em', null)
      .single()

    if (!sessao) {
      return {
        status: 'disconnected',
      }
    }

    return {
      id: sessao.id,
      status: sessao.status as StatusWhatsApp,
      phone_number: sessao.phone_number,
      phone_name: sessao.phone_name,
      conectado_em: sessao.conectado_em,
      ultima_mensagem_em: sessao.ultima_mensagem_em,
    }
  }

  /**
   * Desconecta a sessao WhatsApp
   */
  async desconectar(
    organizacaoId: string,
    usuarioId: string
  ): Promise<void> {
    const { data: sessao, error } = await supabase
      .from('sessoes_whatsapp')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .is('deletado_em', null)
      .single()

    if (error || !sessao) {
      throw new Error('Sessao nao encontrada')
    }

    // Desconecta no WAHA
    if (this.isConfigured()) {
      try {
        await this.wahaRequest('POST', `/api/${sessao.session_name}/logout`, {})
        await this.wahaRequest('DELETE', `/api/sessions/${sessao.session_name}`, {})
      } catch (e) {
        // Ignora erros ao desconectar no WAHA
        console.warn('Erro ao desconectar no WAHA:', e)
      }
    }

    // Atualiza status no banco
    await supabase
      .from('sessoes_whatsapp')
      .update({
        status: 'disconnected',
        desconectado_em: new Date().toISOString(),
      })
      .eq('id', sessao.id)
  }

  // =====================================================
  // Webhook Handler
  // =====================================================

  /**
   * Processa webhook do WAHA
   */
  async processarWebhook(
    organizacaoId: string,
    payload: WahaWebhookPayload
  ): Promise<void> {
    const sessionName = payload.session

    // Busca sessao
    const { data: sessao } = await supabase
      .from('sessoes_whatsapp')
      .select('*')
      .eq('session_name', sessionName)
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)
      .single()

    if (!sessao) {
      console.warn(`Sessao nao encontrada para webhook: ${sessionName}`)
      return
    }

    switch (payload.event) {
      case 'session.status':
        await this.handleSessionStatus(sessao, payload.payload as { status: string })
        break

      case 'message':
        await this.handleMessage(sessao, payload.payload as any)
        break

      case 'message.ack':
        await this.handleMessageAck(sessao, payload.payload as any)
        break

      case 'message.reaction':
        await this.handleMessageReaction(sessao, payload.payload as any)
        break

      default:
        console.log(`Evento WAHA nao tratado: ${payload.event}`)
    }
  }

  private async handleSessionStatus(
    sessao: any,
    payload: { status: string }
  ): Promise<void> {
    const wahaStatus = payload.status.toUpperCase()
    let novoStatus: StatusWhatsApp = 'disconnected'

    switch (wahaStatus) {
      case 'CONNECTED':
      case 'WORKING':
        novoStatus = 'connected'
        break
      case 'QR':
      case 'SCAN_QR_CODE':
        novoStatus = 'qr_pending'
        break
      case 'STARTING':
      case 'INITIALIZING':
        novoStatus = 'connecting'
        break
      case 'FAILED':
      case 'STOPPED':
        novoStatus = 'failed'
        break
      default:
        novoStatus = 'disconnected'
    }

    const updateData: Record<string, any> = { status: novoStatus }

    if (novoStatus === 'connected') {
      updateData.conectado_em = new Date().toISOString()
    } else if (novoStatus === 'disconnected' || novoStatus === 'failed') {
      updateData.desconectado_em = new Date().toISOString()
    }

    await supabase
      .from('sessoes_whatsapp')
      .update(updateData)
      .eq('id', sessao.id)
  }

  /**
   * Processa ACK (status de entrega) da mensagem
   */
  private async handleMessageAck(sessao: any, payload: any): Promise<void> {
    const messageId = payload.id || payload.key?.id
    const ack = payload.ack

    if (!messageId) return

    try {
      await mensagensService.atualizarAck({
        message_id: messageId,
        ack,
      })
    } catch (error) {
      console.error('Erro ao atualizar ACK:', error)
    }
  }

  /**
   * Processa reacao a mensagem
   */
  private async handleMessageReaction(sessao: any, payload: any): Promise<void> {
    const reactionMessageId = payload.reactionMessage?.key?.id
    const emoji = payload.text || payload.reaction
    const fromMe = payload.fromMe === true || payload.reactionMessage?.key?.fromMe === true

    if (!reactionMessageId || !emoji) return

    try {
      // Busca a mensagem original para pegar a conversa
      const { data: mensagemOriginal } = await supabase
        .from('mensagens')
        .select('conversa_id')
        .eq('message_id', reactionMessageId)
        .single()

      if (mensagemOriginal) {
        await mensagensService.processarReacao(
          sessao.organizacao_id,
          mensagemOriginal.conversa_id,
          payload.id || `reaction_${Date.now()}`,
          emoji,
          reactionMessageId,
          fromMe
        )
      }
    } catch (error) {
      console.error('Erro ao processar reacao:', error)
    }
  }

  /**
   * Processa mensagem recebida via webhook WAHA
   * AIDEV-NOTE: Integra com PRD-09 - Modulo de Conversas
   */
  private async handleMessage(sessao: any, payload: any): Promise<void> {
    const isInbound = !payload.fromMe

    // Atualiza estatisticas da sessao
    const statUpdate: Record<string, any> = {
      ultima_mensagem_em: new Date().toISOString(),
    }
    if (isInbound) {
      statUpdate.total_mensagens_recebidas = (sessao.total_mensagens_recebidas || 0) + 1
    }
    await supabase
      .from('sessoes_whatsapp')
      .update(statUpdate)
      .eq('id', sessao.id)

    // Extrai dados da mensagem WAHA
    const chatId = payload.from || payload.chatId
    const fromNumber = payload.from?.replace('@c.us', '').replace('@g.us', '')

    // Determina o tipo de mensagem
    let tipoMensagem: TipoMensagem = 'text'
    if (payload.hasMedia) {
      if (payload.type === 'image') tipoMensagem = 'image'
      else if (payload.type === 'video') tipoMensagem = 'video'
      else if (payload.type === 'audio' || payload.type === 'ptt') tipoMensagem = 'audio'
      else if (payload.type === 'document') tipoMensagem = 'document'
      else if (payload.type === 'sticker') tipoMensagem = 'sticker'
    } else if (payload.type === 'location') {
      tipoMensagem = 'location'
    } else if (payload.type === 'contact' || payload.type === 'vcard') {
      tipoMensagem = 'contact'
    } else if (payload.type === 'poll') {
      tipoMensagem = 'poll'
    }

    try {
      // Busca ou cria contato pelo numero
      let contatoId: string | undefined

      if (fromNumber && isInbound) {
        // Busca contato existente pelo telefone
        const { data: contato } = await supabase
          .from('contatos')
          .select('id')
          .eq('organizacao_id', sessao.organizacao_id)
          .eq('telefone', fromNumber)
          .is('deletado_em', null)
          .single()

        if (contato) {
          contatoId = contato.id
        } else {
          // Cria contato se nao existir
          const { data: novoContato } = await supabase
            .from('contatos')
            .insert({
              organizacao_id: sessao.organizacao_id,
              nome: payload.notifyName || fromNumber,
              telefone: fromNumber,
              origem: 'whatsapp',
            })
            .select('id')
            .single()

          contatoId = novoContato?.id
        }
      }

      // Busca ou cria conversa
      const conversa = await conversasService.buscarOuCriarPorChatId({
        organizacao_id: sessao.organizacao_id,
        chat_id: chatId,
        canal: 'whatsapp',
        sessao_whatsapp_id: sessao.id,
        contato_id: contatoId,
        usuario_id: sessao.usuario_id,
        nome: payload.notifyName,
        tipo: chatId.includes('@g.us') ? 'grupo' : 'individual',
      })

      // Processa a mensagem
      await mensagensService.processarMensagemRecebida({
        organizacao_id: sessao.organizacao_id,
        conversa_id: conversa.id,
        message_id: payload.id || payload.key?.id || `waha_${Date.now()}`,
        from_me: payload.fromMe || false,
        from_number: fromNumber,
        to_number: payload.to?.replace('@c.us', '').replace('@g.us', ''),
        participant: payload.participant?.replace('@c.us', ''),
        tipo: tipoMensagem,
        body: payload.body || payload.text,
        caption: payload.caption,
        has_media: payload.hasMedia || false,
        media_url: payload.mediaUrl,
        media_mimetype: payload.mimetype,
        media_filename: payload.filename,
        media_size: payload.filesize,
        media_duration: payload.duration,
        location_latitude: payload.location?.latitude,
        location_longitude: payload.location?.longitude,
        location_name: payload.location?.name,
        location_address: payload.location?.address,
        vcard: payload.vCards?.[0],
        poll_question: payload.poll?.question,
        poll_options: payload.poll?.options?.map((opt: string) => ({ text: opt, votes: 0 })),
        poll_allow_multiple: payload.poll?.allowMultipleAnswers,
        ack: payload.ack ?? 1,
        timestamp_externo: payload.timestamp,
        raw_data: payload,
      })

      // Loga no webhook para debug
      await supabase.from('log_webhooks_conversas').insert({
        organizacao_id: sessao.organizacao_id,
        evento: 'message',
        canal: 'whatsapp',
        sessao: sessao.session_name,
        payload,
        processado: true,
        processado_em: new Date().toISOString(),
      })
    } catch (error) {
      // Loga erro
      await supabase.from('log_webhooks_conversas').insert({
        organizacao_id: sessao.organizacao_id,
        evento: 'message',
        canal: 'whatsapp',
        sessao: sessao.session_name,
        payload,
        processado: false,
        erro: error instanceof Error ? error.message : 'Erro desconhecido',
      })

      console.error('Erro ao processar mensagem WAHA:', error)
    }
  }

  // =====================================================
  // Enviar Mensagem
  // =====================================================

  /**
   * Envia mensagem via WhatsApp
   */
  async enviarMensagem(
    organizacaoId: string,
    usuarioId: string,
    mensagem: EnviarMensagemWhatsApp
  ): Promise<EnviarMensagemResponse> {
    const { data: sessao, error } = await supabase
      .from('sessoes_whatsapp')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .eq('status', 'connected')
      .is('deletado_em', null)
      .single()

    if (error || !sessao) {
      throw new Error('Sessao WhatsApp nao conectada')
    }

    if (!this.isConfigured()) {
      throw new Error('WAHA nao configurado')
    }

    // Formata numero de destino
    const chatId = mensagem.to.includes('@c.us')
      ? mensagem.to
      : `${mensagem.to.replace(/\D/g, '')}@c.us`

    // Envia mensagem via WAHA
    const response = await withCircuitBreakerAndRetry('waha', 'whatsapp_send', async () => {
      if (mensagem.media_url) {
        // Envia midia
        return this.wahaRequest<{ id: string }>('POST', `/api/${sessao.session_name}/sendMediaFromUrl`, {
          chatId,
          url: mensagem.media_url,
          caption: mensagem.caption || mensagem.text,
        })
      } else {
        // Envia texto
        return this.wahaRequest<{ id: string }>('POST', `/api/${sessao.session_name}/sendText`, {
          chatId,
          text: mensagem.text,
        })
      }
    })

    // Atualiza estatisticas
    await supabase
      .from('sessoes_whatsapp')
      .update({
        total_mensagens_enviadas: (sessao.total_mensagens_enviadas || 0) + 1,
        ultima_mensagem_em: new Date().toISOString(),
      })
      .eq('id', sessao.id)

    return {
      message_id: response.id,
      status: 'sent',
    }
  }

  // =====================================================
  // Operacoes Administrativas
  // =====================================================

  /**
   * Lista todas as sessoes de uma organizacao (Admin)
   */
  async listarSessoes(organizacaoId: string): Promise<SessaoWhatsApp[]> {
    const { data, error } = await supabase
      .from('sessoes_whatsapp')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)
      .order('criado_em', { ascending: false })

    if (error) throw new Error(`Erro ao listar sessoes: ${error.message}`)
    return data as SessaoWhatsApp[]
  }
}

export default new WahaService()
