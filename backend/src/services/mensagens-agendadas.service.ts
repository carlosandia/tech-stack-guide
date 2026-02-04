/**
 * AIDEV-NOTE: Service de Mensagens Agendadas (PRD-09)
 *
 * Mensagens programadas para envio futuro
 * Processadas por cron job
 */

import { supabaseAdmin as supabase } from '../config/supabase'
import type { UserRole } from '../schemas/common'
import type {
  MensagemAgendada,
  MensagemAgendadaComConversa,
  ListarMensagensAgendadasQuery,
  ListarMensagensAgendadasResponse,
  CriarMensagemAgendada,
} from '../schemas/mensagens-agendadas'
import mensagensService from './mensagens.service'
import conversasService from './conversas.service'

class MensagensAgendadasService {
  // =====================================================
  // Listagem
  // =====================================================

  /**
   * Lista mensagens agendadas do usuario
   */
  async listar(
    organizacaoId: string,
    usuarioId: string,
    role: UserRole,
    filtros: ListarMensagensAgendadasQuery
  ): Promise<ListarMensagensAgendadasResponse> {
    const { page, limit, status, conversa_id } = filtros
    const offset = (page - 1) * limit

    let query = supabase
      .from('mensagens_agendadas')
      .select(
        `
        *,
        conversa:conversas (
          id,
          canal,
          contato:contatos (
            id,
            nome
          )
        )
      `,
        { count: 'exact' }
      )
      .eq('organizacao_id', organizacaoId)

    // Member so ve suas proprias mensagens agendadas
    if (role === 'member') {
      query = query.eq('usuario_id', usuarioId)
    }

    // Filtros
    if (status) {
      query = query.eq('status', status)
    }

    if (conversa_id) {
      query = query.eq('conversa_id', conversa_id)
    }

    // Ordenacao e paginacao
    query = query
      .order('agendado_para', { ascending: true })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Erro ao listar mensagens agendadas: ${error.message}`)
    }

    return {
      mensagens_agendadas: (data || []) as MensagemAgendadaComConversa[],
      total: count || 0,
      page,
      limit,
    }
  }

  /**
   * Busca mensagem agendada por ID
   */
  async buscarPorId(
    id: string,
    organizacaoId: string,
    usuarioId: string,
    role: UserRole
  ): Promise<MensagemAgendadaComConversa | null> {
    let query = supabase
      .from('mensagens_agendadas')
      .select(
        `
        *,
        conversa:conversas (
          id,
          canal,
          contato:contatos (
            id,
            nome
          )
        )
      `
      )
      .eq('id', id)
      .eq('organizacao_id', organizacaoId)

    // Member so ve suas proprias
    if (role === 'member') {
      query = query.eq('usuario_id', usuarioId)
    }

    const { data, error } = await query.single()

    if (error) {
      return null
    }

    return data as MensagemAgendadaComConversa
  }

  // =====================================================
  // CRUD
  // =====================================================

  /**
   * Cria nova mensagem agendada
   */
  async criar(
    organizacaoId: string,
    usuarioId: string,
    role: UserRole,
    dados: CriarMensagemAgendada
  ): Promise<MensagemAgendada> {
    // Verifica se tem permissao na conversa
    const conversa = await conversasService.buscarPorId(
      dados.conversa_id,
      organizacaoId,
      usuarioId,
      role
    )

    if (!conversa) {
      throw new Error('Conversa nao encontrada ou sem permissao')
    }

    // Valida data de agendamento (deve ser no futuro)
    const agendadoPara = new Date(dados.agendado_para)
    if (agendadoPara <= new Date()) {
      throw new Error('Data de agendamento deve ser no futuro')
    }

    const { data, error } = await supabase
      .from('mensagens_agendadas')
      .insert({
        organizacao_id: organizacaoId,
        conversa_id: dados.conversa_id,
        usuario_id: usuarioId,
        tipo: dados.tipo,
        conteudo: dados.conteudo,
        media_url: dados.media_url,
        agendado_para: dados.agendado_para,
        timezone: dados.timezone,
        status: 'agendada',
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar mensagem agendada: ${error.message}`)
    }

    return data as MensagemAgendada
  }

  /**
   * Cancela mensagem agendada
   */
  async cancelar(
    id: string,
    organizacaoId: string,
    usuarioId: string,
    role: UserRole
  ): Promise<void> {
    // Verifica se existe e tem permissao
    const existente = await this.buscarPorId(id, organizacaoId, usuarioId, role)

    if (!existente) {
      throw new Error('Mensagem agendada nao encontrada ou sem permissao')
    }

    // Somente mensagens com status 'agendada' podem ser canceladas
    if (existente.status !== 'agendada') {
      throw new Error('Somente mensagens com status "agendada" podem ser canceladas')
    }

    // Somente o autor ou admin pode cancelar
    if (role !== 'admin' && existente.usuario_id !== usuarioId) {
      throw new Error('Sem permissao para cancelar esta mensagem')
    }

    const { error } = await supabase
      .from('mensagens_agendadas')
      .update({
        status: 'cancelada',
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao cancelar mensagem agendada: ${error.message}`)
    }
  }

  // =====================================================
  // Processamento (Cron Job)
  // =====================================================

  /**
   * Processa mensagens agendadas que devem ser enviadas
   * AIDEV-NOTE: Deve ser chamado por um cron job a cada minuto
   */
  async processarAgendadas(): Promise<{ processadas: number; erros: number }> {
    const agora = new Date().toISOString()

    // Busca mensagens pendentes de envio
    const { data: pendentes, error } = await supabase
      .from('mensagens_agendadas')
      .select(
        `
        *,
        conversa:conversas (
          id,
          canal,
          chat_id,
          usuario_id,
          organizacao_id
        )
      `
      )
      .eq('status', 'agendada')
      .lte('agendado_para', agora)
      .order('agendado_para', { ascending: true })
      .limit(100)

    if (error) {
      throw new Error(`Erro ao buscar mensagens agendadas: ${error.message}`)
    }

    let processadas = 0
    let erros = 0

    for (const agendada of pendentes || []) {
      try {
        // Envia a mensagem
        if (agendada.tipo === 'text') {
          await mensagensService.enviarTexto(
            agendada.conversa_id,
            agendada.organizacao_id,
            agendada.usuario_id,
            'admin', // Usa admin para garantir permissao
            { texto: agendada.conteudo }
          )
        } else {
          // Mensagem com midia
          await mensagensService.enviarMedia(
            agendada.conversa_id,
            agendada.organizacao_id,
            agendada.usuario_id,
            'admin',
            {
              tipo: agendada.tipo as 'image' | 'video' | 'audio' | 'document',
              media_url: agendada.media_url!,
              caption: agendada.conteudo,
            }
          )
        }

        // Marca como enviada
        await supabase
          .from('mensagens_agendadas')
          .update({
            status: 'enviada',
            enviada_em: new Date().toISOString(),
            atualizado_em: new Date().toISOString(),
          })
          .eq('id', agendada.id)

        processadas++
      } catch (err) {
        // Marca como falha
        await supabase
          .from('mensagens_agendadas')
          .update({
            status: 'falha',
            erro: err instanceof Error ? err.message : 'Erro desconhecido',
            atualizado_em: new Date().toISOString(),
          })
          .eq('id', agendada.id)

        erros++
      }
    }

    return { processadas, erros }
  }
}

export default new MensagensAgendadasService()
