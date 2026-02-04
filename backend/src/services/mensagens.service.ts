/**
 * AIDEV-NOTE: Service de Mensagens (PRD-09)
 *
 * Responsavel por:
 * - Listar mensagens de uma conversa
 * - Enviar mensagens (via WAHA ou Instagram)
 * - Processar mensagens recebidas (webhooks)
 * - Atualizar status de entrega (ACK)
 */

import { supabaseAdmin as supabase } from '../config/supabase'
import type { UserRole } from '../schemas/common'
import type {
  Mensagem,
  ListarMensagensQuery,
  ListarMensagensResponse,
  EnviarMensagemTexto,
  EnviarMensagemMedia,
  EnviarMensagemLocalizacao,
  EnviarMensagemContato,
  EnviarMensagemEnquete,
  ProcessarMensagemWebhook,
  AtualizarAck,
} from '../schemas/mensagens'
import conversasService from './conversas.service'
import wahaService from './waha.service'

class MensagensService {
  // =====================================================
  // Listagem
  // =====================================================

  /**
   * Lista mensagens de uma conversa com paginacao
   */
  async listar(
    conversaId: string,
    organizacaoId: string,
    usuarioId: string,
    role: UserRole,
    filtros: ListarMensagensQuery
  ): Promise<ListarMensagensResponse> {
    // Verifica permissao na conversa
    const conversa = await conversasService.buscarPorId(conversaId, organizacaoId, usuarioId, role)

    if (!conversa) {
      throw new Error('Conversa nao encontrada ou sem permissao')
    }

    const { page, limit, tipo, antes_de, depois_de, order_dir } = filtros
    const offset = (page - 1) * limit

    let query = supabase
      .from('mensagens')
      .select('*', { count: 'exact' })
      .eq('conversa_id', conversaId)
      .is('deletado_em', null)

    // Filtros
    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    if (antes_de) {
      query = query.lt('criado_em', antes_de)
    }

    if (depois_de) {
      query = query.gt('criado_em', depois_de)
    }

    // Ordenacao e paginacao
    query = query
      .order('criado_em', { ascending: order_dir === 'asc' })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Erro ao listar mensagens: ${error.message}`)
    }

    const total = count || 0

    return {
      mensagens: (data || []) as Mensagem[],
      total,
      page,
      limit,
      has_more: offset + limit < total,
    }
  }

  // =====================================================
  // Enviar Mensagens
  // =====================================================

  /**
   * Envia mensagem de texto
   */
  async enviarTexto(
    conversaId: string,
    organizacaoId: string,
    usuarioId: string,
    role: UserRole,
    dados: EnviarMensagemTexto
  ): Promise<Mensagem> {
    const conversa = await conversasService.buscarPorId(conversaId, organizacaoId, usuarioId, role)

    if (!conversa) {
      throw new Error('Conversa nao encontrada ou sem permissao')
    }

    // Envia via WAHA ou Instagram
    let messageId: string
    if (conversa.canal === 'whatsapp') {
      const response = await wahaService.enviarMensagem(organizacaoId, usuarioId, {
        to: conversa.chat_id,
        text: dados.texto,
      })
      messageId = response.message_id
    } else {
      // TODO: Implementar envio via Instagram
      throw new Error('Envio via Instagram ainda nao implementado')
    }

    // Salva no banco
    const mensagem = await this.salvarMensagem({
      organizacao_id: organizacaoId,
      conversa_id: conversaId,
      message_id: messageId,
      from_me: true,
      tipo: 'text',
      body: dados.texto,
      reply_to_message_id: dados.reply_to,
      ack: 1, // PENDING
    })

    // Atualiza contadores
    await conversasService.atualizarContadores(conversaId, 1, 0)

    return mensagem
  }

  /**
   * Envia mensagem com midia
   */
  async enviarMedia(
    conversaId: string,
    organizacaoId: string,
    usuarioId: string,
    role: UserRole,
    dados: EnviarMensagemMedia
  ): Promise<Mensagem> {
    const conversa = await conversasService.buscarPorId(conversaId, organizacaoId, usuarioId, role)

    if (!conversa) {
      throw new Error('Conversa nao encontrada ou sem permissao')
    }

    // Envia via WAHA
    let messageId: string
    if (conversa.canal === 'whatsapp') {
      const response = await wahaService.enviarMensagem(organizacaoId, usuarioId, {
        to: conversa.chat_id,
        media_url: dados.media_url,
        media_type: dados.tipo,
        caption: dados.caption,
      })
      messageId = response.message_id
    } else {
      throw new Error('Envio via Instagram ainda nao implementado')
    }

    // Salva no banco
    const mensagem = await this.salvarMensagem({
      organizacao_id: organizacaoId,
      conversa_id: conversaId,
      message_id: messageId,
      from_me: true,
      tipo: dados.tipo,
      caption: dados.caption,
      has_media: true,
      media_url: dados.media_url,
      media_filename: dados.filename,
      ack: 1,
    })

    await conversasService.atualizarContadores(conversaId, 1, 0)

    return mensagem
  }

  /**
   * Envia localizacao
   */
  async enviarLocalizacao(
    conversaId: string,
    organizacaoId: string,
    usuarioId: string,
    role: UserRole,
    dados: EnviarMensagemLocalizacao
  ): Promise<Mensagem> {
    const conversa = await conversasService.buscarPorId(conversaId, organizacaoId, usuarioId, role)

    if (!conversa) {
      throw new Error('Conversa nao encontrada ou sem permissao')
    }

    // TODO: Implementar envio de localizacao via WAHA
    const messageId = `loc_${Date.now()}`

    const mensagem = await this.salvarMensagem({
      organizacao_id: organizacaoId,
      conversa_id: conversaId,
      message_id: messageId,
      from_me: true,
      tipo: 'location',
      location_latitude: dados.latitude,
      location_longitude: dados.longitude,
      location_name: dados.nome,
      location_address: dados.endereco,
      ack: 1,
    })

    await conversasService.atualizarContadores(conversaId, 1, 0)

    return mensagem
  }

  /**
   * Envia contato (vCard)
   */
  async enviarContato(
    conversaId: string,
    organizacaoId: string,
    usuarioId: string,
    role: UserRole,
    dados: EnviarMensagemContato
  ): Promise<Mensagem> {
    const conversa = await conversasService.buscarPorId(conversaId, organizacaoId, usuarioId, role)

    if (!conversa) {
      throw new Error('Conversa nao encontrada ou sem permissao')
    }

    // TODO: Implementar envio de contato via WAHA
    const messageId = `contact_${Date.now()}`

    const mensagem = await this.salvarMensagem({
      organizacao_id: organizacaoId,
      conversa_id: conversaId,
      message_id: messageId,
      from_me: true,
      tipo: 'contact',
      vcard: dados.vcard,
      ack: 1,
    })

    await conversasService.atualizarContadores(conversaId, 1, 0)

    return mensagem
  }

  /**
   * Envia enquete
   */
  async enviarEnquete(
    conversaId: string,
    organizacaoId: string,
    usuarioId: string,
    role: UserRole,
    dados: EnviarMensagemEnquete
  ): Promise<Mensagem> {
    const conversa = await conversasService.buscarPorId(conversaId, organizacaoId, usuarioId, role)

    if (!conversa) {
      throw new Error('Conversa nao encontrada ou sem permissao')
    }

    // TODO: Implementar envio de enquete via WAHA
    const messageId = `poll_${Date.now()}`

    const mensagem = await this.salvarMensagem({
      organizacao_id: organizacaoId,
      conversa_id: conversaId,
      message_id: messageId,
      from_me: true,
      tipo: 'poll',
      poll_question: dados.pergunta,
      poll_options: dados.opcoes.map(opt => ({ text: opt, votes: 0 })),
      poll_allow_multiple: dados.permitir_multiplas,
      ack: 1,
    })

    await conversasService.atualizarContadores(conversaId, 1, 0)

    return mensagem
  }

  // =====================================================
  // Processar Mensagem Recebida (Webhooks)
  // =====================================================

  /**
   * Processa mensagem recebida via webhook
   * AIDEV-NOTE: Chamado pelos handlers de WAHA e Instagram
   */
  async processarMensagemRecebida(dados: ProcessarMensagemWebhook): Promise<Mensagem> {
    // Verifica se mensagem ja existe (deduplicacao)
    const { data: existente } = await supabase
      .from('mensagens')
      .select('id')
      .eq('organizacao_id', dados.organizacao_id)
      .eq('message_id', dados.message_id)
      .single()

    if (existente) {
      // Mensagem ja processada
      const { data } = await supabase
        .from('mensagens')
        .select('*')
        .eq('id', existente.id)
        .single()
      return data as Mensagem
    }

    // Salva nova mensagem
    const mensagem = await this.salvarMensagem(dados)

    // Atualiza contadores da conversa
    const incrementoNaoLidas = dados.from_me ? 0 : 1
    await conversasService.atualizarContadores(dados.conversa_id, 1, incrementoNaoLidas)

    // Reabre conversa se necessario
    if (!dados.from_me) {
      await conversasService.reabrirSeNecessario(dados.conversa_id)
    }

    return mensagem
  }

  // =====================================================
  // Atualizar ACK
  // =====================================================

  /**
   * Atualiza status de entrega da mensagem
   */
  async atualizarAck(dados: AtualizarAck): Promise<void> {
    const ackNames = ['ERROR', 'PENDING', 'SENT', 'DELIVERED', 'READ', 'PLAYED']

    await supabase
      .from('mensagens')
      .update({
        ack: dados.ack,
        ack_name: dados.ack_name || ackNames[dados.ack] || 'UNKNOWN',
      })
      .eq('message_id', dados.message_id)
  }

  /**
   * Processa reacao a mensagem
   */
  async processarReacao(
    organizacaoId: string,
    conversaId: string,
    messageId: string,
    emoji: string,
    reacaoMessageId: string
  ): Promise<Mensagem> {
    // Salva reacao como mensagem separada
    return this.salvarMensagem({
      organizacao_id: organizacaoId,
      conversa_id: conversaId,
      message_id: messageId,
      from_me: false,
      tipo: 'reaction',
      reaction_emoji: emoji,
      reaction_message_id: reacaoMessageId,
    })
  }

  // =====================================================
  // Utilitarios
  // =====================================================

  /**
   * Salva mensagem no banco
   */
  private async salvarMensagem(dados: Partial<ProcessarMensagemWebhook>): Promise<Mensagem> {
    const { data, error } = await supabase
      .from('mensagens')
      .insert({
        organizacao_id: dados.organizacao_id,
        conversa_id: dados.conversa_id,
        message_id: dados.message_id,
        from_me: dados.from_me ?? false,
        from_number: dados.from_number,
        to_number: dados.to_number,
        participant: dados.participant,
        tipo: dados.tipo || 'text',
        body: dados.body,
        caption: dados.caption,
        has_media: dados.has_media ?? false,
        media_url: dados.media_url,
        media_mimetype: dados.media_mimetype,
        media_filename: dados.media_filename,
        media_size: dados.media_size,
        media_duration: dados.media_duration,
        location_latitude: dados.location_latitude,
        location_longitude: dados.location_longitude,
        location_name: dados.location_name,
        location_address: dados.location_address,
        vcard: dados.vcard,
        poll_question: dados.poll_question,
        poll_options: dados.poll_options,
        poll_allow_multiple: dados.poll_allow_multiple,
        reaction_emoji: dados.reaction_emoji,
        reaction_message_id: dados.reaction_message_id,
        reply_to_message_id: dados.reply_to_message_id,
        ack: dados.ack ?? 0,
        timestamp_externo: dados.timestamp_externo,
        raw_data: dados.raw_data,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao salvar mensagem: ${error.message}`)
    }

    return data as Mensagem
  }
}

export default new MensagensService()
