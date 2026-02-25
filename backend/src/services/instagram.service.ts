/**
 * AIDEV-NOTE: Service para integracao Instagram Direct
 * Conforme PRD-08 - Secao 4. Instagram Direct
 *
 * NOTA: Requer Meta App com permissoes de Instagram (PRD-16)
 * Usa mesma autenticacao do Meta (conexoes_meta)
 */

import { supabaseAdmin as supabase } from '../config/supabase'
import { env } from '../config/env'
import { encrypt, decrypt } from '../utils/crypto'
import { withCircuitBreakerAndRetry } from '../utils/retry'
import type {
  ConexaoInstagram,
  StatusConexaoInstagram,
  ContaInstagram,
  ListarContasResponse,
  Conversa,
  Mensagem,
  EnviarMensagemInstagramResponse,
} from '../schemas/conexoes/instagram'
import conversasService from './conversas.service'
import mensagensService from './mensagens.service'
import type { TipoMensagem } from '../schemas/mensagens'

// Tipos internos para respostas de paginacao
interface ListarConversasServiceResponse {
  conversas: Conversa[]
  next_cursor?: string
}

interface ListarMensagensServiceResponse {
  mensagens: Mensagem[]
  next_cursor?: string
}

// =====================================================
// Constantes
// =====================================================

const META_GRAPH_URL = 'https://graph.facebook.com/v24.0'

// =====================================================
// Service
// =====================================================

class InstagramService {
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

    const separator = endpoint.includes('?') ? '&' : '?'
    const urlWithToken = `${url}${separator}access_token=${accessToken}`

    const response = await fetch(urlWithToken, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await response.json() as T & { error?: { message?: string } }

    if (!response.ok) {
      const errorMessage = (data as any).error?.message || 'Instagram API Error'
      throw new Error(`Instagram API: ${errorMessage}`)
    }

    return data as T
  }

  // =====================================================
  // Conexao (via Meta OAuth)
  // =====================================================

  /**
   * Busca contas Instagram conectadas via Meta
   * NOTA: Requer que o usuario ja tenha feito OAuth com Meta
   */
  async listarContasInstagram(organizacaoId: string): Promise<ListarContasResponse> {
    // Busca conexao Meta
    const { data: conexaoMeta } = await supabase
      .from('conexoes_meta')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .eq('status', 'active')
      .is('deletado_em', null)
      .single()

    if (!conexaoMeta) {
      throw new Error('Conecte-se ao Meta primeiro para acessar Instagram')
    }

    const accessToken = decrypt(conexaoMeta.access_token_encrypted)

    // Busca paginas com Instagram vinculado
    const pagesResponse = await withCircuitBreakerAndRetry('meta_graph', 'meta_api', async () => {
      return this.graphRequest<{ data: any[] }>(
        'GET',
        '/me/accounts?fields=id,name,instagram_business_account{id,name,username,profile_picture_url,followers_count}',
        accessToken
      )
    })

    const contas: ContaInstagram[] = []

    for (const page of pagesResponse.data) {
      if (page.instagram_business_account) {
        const ig = page.instagram_business_account
        contas.push({
          instagram_id: ig.id,
          username: ig.username,
          name: ig.name,
          profile_picture_url: ig.profile_picture_url,
          followers_count: ig.followers_count,
          page_id: page.id,
          page_name: page.name,
        })
      }
    }

    return { contas }
  }

  /**
   * Conecta conta Instagram
   */
  async conectarConta(
    organizacaoId: string,
    usuarioId: string,
    instagramId: string,
    pageId: string
  ): Promise<ConexaoInstagram> {
    // Busca conexao Meta e pagina
    const { data: conexaoMeta } = await supabase
      .from('conexoes_meta')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .eq('status', 'active')
      .is('deletado_em', null)
      .single()

    if (!conexaoMeta) {
      throw new Error('Conexao Meta nao encontrada')
    }

    // Busca ou cria pagina
    let { data: pagina } = await supabase
      .from('paginas_meta')
      .select('*')
      .eq('page_id', pageId)
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)
      .single()

    if (!pagina) {
      throw new Error('Pagina nao conectada. Selecione a pagina no Meta primeiro.')
    }

    const accessToken = decrypt(conexaoMeta.access_token_encrypted)

    // Busca detalhes da conta Instagram
    const igData = await withCircuitBreakerAndRetry('meta_graph', 'meta_api', async () => {
      return this.graphRequest<any>(
        'GET',
        `/${instagramId}?fields=id,name,username,profile_picture_url,followers_count,follows_count,media_count`,
        accessToken
      )
    })

    // Cria ou atualiza conexao
    const conexaoData = {
      pagina_meta_id: pagina.id,
      organizacao_id: organizacaoId,
      usuario_id: usuarioId,
      instagram_id: igData.id,
      username: igData.username,
      name: igData.name,
      profile_picture_url: igData.profile_picture_url,
      followers_count: igData.followers_count,
      follows_count: igData.follows_count,
      media_count: igData.media_count,
      status: 'active' as const,
      conectado_em: new Date().toISOString(),
    }

    // Verifica se ja existe
    const { data: existente } = await supabase
      .from('conexoes_instagram')
      .select('id')
      .eq('instagram_id', instagramId)
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)
      .single()

    let conexao: any

    if (existente) {
      const { data, error } = await supabase
        .from('conexoes_instagram')
        .update(conexaoData)
        .eq('id', existente.id)
        .select()
        .single()

      if (error) throw new Error(`Erro ao atualizar conexao: ${error.message}`)
      conexao = data
    } else {
      const { data, error } = await supabase
        .from('conexoes_instagram')
        .insert(conexaoData)
        .select()
        .single()

      if (error) throw new Error(`Erro ao criar conexao: ${error.message}`)
      conexao = data
    }

    return conexao as ConexaoInstagram
  }

  // =====================================================
  // Status e Desconexao
  // =====================================================

  /**
   * Obtem status da conexao Instagram
   */
  async obterStatus(
    organizacaoId: string,
    usuarioId: string
  ): Promise<StatusConexaoInstagram> {
    const { data: conexao } = await supabase
      .from('conexoes_instagram')
      .select('*')
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
      instagram_id: conexao.instagram_id,
      username: conexao.username,
      name: conexao.name,
      profile_picture_url: conexao.profile_picture_url,
      followers_count: conexao.followers_count,
      conectado_em: conexao.conectado_em,
      ultimo_sync: conexao.ultimo_sync,
    }
  }

  /**
   * Desconecta Instagram
   */
  async desconectar(
    organizacaoId: string,
    usuarioId: string
  ): Promise<void> {
    const { data: conexao } = await supabase
      .from('conexoes_instagram')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .is('deletado_em', null)
      .single()

    if (!conexao) {
      throw new Error('Conexao nao encontrada')
    }

    // Soft delete
    await supabase
      .from('conexoes_instagram')
      .update({ deletado_em: new Date().toISOString() })
      .eq('id', conexao.id)
  }

  // =====================================================
  // Mensagens Direct
  // =====================================================

  /**
   * Lista conversas do Instagram Direct
   */
  async listarConversas(
    organizacaoId: string,
    usuarioId: string,
    limit: number = 20,
    cursor?: string
  ): Promise<ListarConversasServiceResponse> {
    // Busca conexao
    const { data: conexao } = await supabase
      .from('conexoes_instagram')
      .select('*, paginas_meta(*, conexoes_meta(*))')
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .eq('status', 'active')
      .is('deletado_em', null)
      .single()

    if (!conexao) {
      throw new Error('Conexao Instagram nao encontrada')
    }

    const accessToken = decrypt(conexao.paginas_meta.page_access_token_encrypted)

    // Busca conversas
    let endpoint = `/${conexao.instagram_id}/conversations?fields=id,participants,updated_time,messages.limit(1){id,message,from,created_time}&limit=${limit}`
    if (cursor) {
      endpoint += `&after=${cursor}`
    }

    const response = await withCircuitBreakerAndRetry('meta_graph', 'meta_api', async () => {
      return this.graphRequest<{ data: any[]; paging?: { cursors?: { after?: string } } }>(
        'GET',
        endpoint,
        accessToken
      )
    })

    const conversas: Conversa[] = response.data.map(conv => ({
      id: conv.id,
      participants: conv.participants?.data || [],
      updated_time: conv.updated_time,
      last_message: conv.messages?.data?.[0] || null,
    }))

    return {
      conversas,
      next_cursor: response.paging?.cursors?.after,
    }
  }

  /**
   * Lista mensagens de uma conversa
   */
  async listarMensagens(
    organizacaoId: string,
    usuarioId: string,
    conversationId: string,
    limit: number = 50,
    cursor?: string
  ): Promise<ListarMensagensServiceResponse> {
    // Busca conexao
    const { data: conexao } = await supabase
      .from('conexoes_instagram')
      .select('*, paginas_meta(*, conexoes_meta(*))')
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .eq('status', 'active')
      .is('deletado_em', null)
      .single()

    if (!conexao) {
      throw new Error('Conexao Instagram nao encontrada')
    }

    const accessToken = decrypt(conexao.paginas_meta.page_access_token_encrypted)

    // Busca mensagens
    let endpoint = `/${conversationId}/messages?fields=id,message,from,created_time,attachments&limit=${limit}`
    if (cursor) {
      endpoint += `&after=${cursor}`
    }

    const response = await withCircuitBreakerAndRetry('meta_graph', 'meta_api', async () => {
      return this.graphRequest<{ data: any[]; paging?: { cursors?: { after?: string } } }>(
        'GET',
        endpoint,
        accessToken
      )
    })

    const mensagens: Mensagem[] = response.data.map(msg => ({
      id: msg.id,
      message: msg.message,
      from: msg.from,
      created_time: msg.created_time,
      attachments: msg.attachments?.data || [],
    }))

    return {
      mensagens,
      next_cursor: response.paging?.cursors?.after,
    }
  }

  /**
   * Envia mensagem via Instagram Direct
   */
  async enviarMensagem(
    organizacaoId: string,
    usuarioId: string,
    dados: any // EnviarMensagemInstagram - union type complexo
  ): Promise<EnviarMensagemInstagramResponse> {
    // Busca conexao
    const { data: conexao } = await supabase
      .from('conexoes_instagram')
      .select('*, paginas_meta(*, conexoes_meta(*))')
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .eq('status', 'active')
      .is('deletado_em', null)
      .single()

    if (!conexao) {
      throw new Error('Conexao Instagram nao encontrada')
    }

    const accessToken = decrypt(conexao.paginas_meta.page_access_token_encrypted)

    // Monta payload - o dados ja vem no formato correto do schema
    const payload = {
      recipient: { id: dados.recipient_id },
      message: dados.message,
    }

    // Envia mensagem
    const response = await withCircuitBreakerAndRetry('meta_graph', 'meta_api', async () => {
      return this.graphRequest<{ recipient_id: string; message_id: string }>(
        'POST',
        `/${conexao.instagram_id}/messages`,
        accessToken,
        payload
      )
    })

    // Atualiza estatisticas
    await supabase
      .from('conexoes_instagram')
      .update({
        total_mensagens_enviadas: (conexao.total_mensagens_enviadas || 0) + 1,
        ultima_mensagem_em: new Date().toISOString(),
      })
      .eq('id', conexao.id)

    return {
      message_id: response.message_id,
      recipient_id: response.recipient_id,
    }
  }

  // =====================================================
  // Webhook Handler
  // =====================================================

  /**
   * Processa webhook do Instagram
   * AIDEV-NOTE: Integra com PRD-09 - Modulo de Conversas
   */
  async processarWebhook(payload: any): Promise<void> {
    for (const entry of payload.entry || []) {
      const igId = entry.id

      // Mensagens recebidas
      for (const messaging of entry.messaging || []) {
        if (messaging.message) {
          await this.processarMensagemRecebida(igId, messaging)
        }
      }
    }
  }

  /**
   * Processa mensagem recebida do Instagram Direct
   */
  private async processarMensagemRecebida(igId: string, messaging: any): Promise<void> {
    const senderId = messaging.sender?.id
    const recipientId = messaging.recipient?.id
    const messageId = messaging.message?.mid
    const messageText = messaging.message?.text
    const timestamp = messaging.timestamp
    const attachments = messaging.message?.attachments || []

    // Determina se a mensagem foi enviada por nos (from_me)
    const fromMe = senderId === igId

    // Busca conexao pelo Instagram ID
    const { data: conexao } = await supabase
      .from('conexoes_instagram')
      .select('*, paginas_meta(*)')
      .eq('instagram_id', igId)
      .eq('status', 'active')
      .is('deletado_em', null)
      .single()

    if (!conexao) {
      console.warn(`Conexao Instagram nao encontrada para: ${igId}`)
      return
    }

    try {
      // Atualiza estatisticas
      const statUpdate: Record<string, any> = {
        ultima_mensagem_em: new Date().toISOString(),
      }
      if (!fromMe) {
        statUpdate.total_mensagens_recebidas = (conexao.total_mensagens_recebidas || 0) + 1
      }
      await supabase
        .from('conexoes_instagram')
        .update(statUpdate)
        .eq('id', conexao.id)

      // Chat ID no Instagram e o sender ID (quem enviou a mensagem)
      const chatId = fromMe ? recipientId : senderId

      // Determina o tipo de mensagem
      let tipoMensagem: TipoMensagem = 'text'
      let mediaUrl: string | undefined
      let mediaMimetype: string | undefined

      if (attachments.length > 0) {
        const attachment = attachments[0]
        const attachmentType = attachment.type

        if (attachmentType === 'image') tipoMensagem = 'image'
        else if (attachmentType === 'video') tipoMensagem = 'video'
        else if (attachmentType === 'audio') tipoMensagem = 'audio'
        else if (attachmentType === 'file') tipoMensagem = 'document'

        mediaUrl = attachment.payload?.url
      }

      // Busca ou cria contato pelo Instagram ID
      let contatoId: string | undefined

      if (!fromMe) {
        const { data: contato } = await supabase
          .from('contatos')
          .select('id')
          .eq('organizacao_id', conexao.organizacao_id)
          .eq('instagram_id', senderId)
          .is('deletado_em', null)
          .single()

        if (contato) {
          contatoId = contato.id
        } else {
          // Cria contato se nao existir
          const { data: novoContato } = await supabase
            .from('contatos')
            .insert({
              organizacao_id: conexao.organizacao_id,
              nome: `Instagram ${senderId.substring(0, 8)}`,
              instagram_id: senderId,
              origem: 'instagram',
            })
            .select('id')
            .single()

          contatoId = novoContato?.id
        }
      }

      // Busca ou cria conversa
      const conversa = await conversasService.buscarOuCriarPorChatId({
        organizacao_id: conexao.organizacao_id,
        chat_id: chatId,
        canal: 'instagram',
        conexao_instagram_id: conexao.id,
        contato_id: contatoId,
        usuario_id: conexao.usuario_id,
        tipo: 'individual',
      })

      // Processa a mensagem
      await mensagensService.processarMensagemRecebida({
        organizacao_id: conexao.organizacao_id,
        conversa_id: conversa.id,
        message_id: messageId,
        from_me: fromMe,
        from_number: senderId,
        to_number: recipientId,
        tipo: tipoMensagem,
        body: messageText,
        has_media: attachments.length > 0,
        media_url: mediaUrl,
        media_mimetype: mediaMimetype,
        ack: 3, // Instagram nao tem ACK granular, assume delivered
        timestamp_externo: timestamp,
        raw_data: messaging,
      })

      // Loga no webhook para debug
      await supabase.from('log_webhooks_conversas').insert({
        organizacao_id: conexao.organizacao_id,
        evento: 'message',
        canal: 'instagram',
        sessao: conexao.instagram_id,
        payload: messaging,
        processado: true,
        processado_em: new Date().toISOString(),
      })
    } catch (error) {
      // Loga erro
      await supabase.from('log_webhooks_conversas').insert({
        organizacao_id: conexao.organizacao_id,
        evento: 'message',
        canal: 'instagram',
        sessao: igId,
        payload: messaging,
        processado: false,
        erro: error instanceof Error ? error.message : 'Erro desconhecido',
      })

      console.error('Erro ao processar mensagem Instagram:', error)
    }
  }
}

export default new InstagramService()
