/**
 * AIDEV-NOTE: Service de Feedbacks (PRD-15)
 *
 * Responsabilidades:
 * - Admin/Member: Criar feedback
 * - Super Admin: Listar, buscar, resolver feedbacks
 *
 * Ao resolver um feedback:
 * 1. Atualiza status para 'resolvido'
 * 2. Cria notificacao para o usuario original
 * 3. Registra acao no audit_log
 */

import { supabaseAdmin } from '../config/supabase.js'
import { logger } from '../utils/logger.js'
import type {
  CriarFeedback,
  ListarFeedbacksQuery,
  FeedbackComDetalhes,
} from '../schemas/feedbacks.js'
import notificacoesService from './notificacoes.service.js'

class FeedbacksService {
  /**
   * Criar feedback (Admin/Member)
   */
  async criar(
    organizacaoId: string,
    usuarioId: string,
    dados: CriarFeedback
  ) {
    const { data, error } = await supabaseAdmin
      .from('feedbacks')
      .insert({
        organizacao_id: organizacaoId,
        usuario_id: usuarioId,
        tipo: dados.tipo,
        descricao: dados.descricao,
        status: 'aberto',
      })
      .select('id, tipo, descricao, status, criado_em')
      .single()

    if (error) {
      logger.error('Erro ao criar feedback:', error)
      throw new Error('Erro ao criar feedback')
    }

    logger.info(`Feedback criado: ${data.id} por usuario ${usuarioId}`)
    return data
  }

  /**
   * Listar feedbacks com filtros (Super Admin)
   * Usa service role para bypass RLS
   */
  async listar(filtros: ListarFeedbacksQuery) {
    const { empresa_id, tipo, status, busca, page, limit } = filtros
    const offset = (page - 1) * limit

    // Query base com joins
    let query = supabaseAdmin
      .from('feedbacks')
      .select(`
        *,
        organizacao:organizacoes_saas!feedbacks_organizacao_id_fkey(id, nome),
        usuario:usuarios!feedbacks_usuario_id_fkey(id, nome, email, role),
        resolvido_por_usuario:usuarios!feedbacks_resolvido_por_fkey(id, nome)
      `, { count: 'exact' })
      .is('deletado_em', null)
      .order('criado_em', { ascending: false })

    // Filtros
    if (empresa_id) {
      query = query.eq('organizacao_id', empresa_id)
    }
    if (tipo) {
      query = query.eq('tipo', tipo)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (busca) {
      query = query.ilike('descricao', `%${busca}%`)
    }

    // Paginacao
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      logger.error('Erro ao listar feedbacks:', error)
      throw new Error('Erro ao listar feedbacks')
    }

    const total = count || 0
    const total_pages = Math.ceil(total / limit)

    return {
      feedbacks: data as FeedbackComDetalhes[],
      total,
      page,
      limit,
      total_pages,
    }
  }

  /**
   * Buscar feedback por ID (Super Admin)
   */
  async buscarPorId(id: string) {
    const { data, error } = await supabaseAdmin
      .from('feedbacks')
      .select(`
        *,
        organizacao:organizacoes_saas!feedbacks_organizacao_id_fkey(id, nome),
        usuario:usuarios!feedbacks_usuario_id_fkey(id, nome, email, role),
        resolvido_por_usuario:usuarios!feedbacks_resolvido_por_fkey(id, nome)
      `)
      .eq('id', id)
      .is('deletado_em', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      logger.error('Erro ao buscar feedback:', error)
      throw new Error('Erro ao buscar feedback')
    }

    return data as FeedbackComDetalhes
  }

  /**
   * Marcar feedback como resolvido (Super Admin)
   * Cria notificacao para o usuario original
   */
  async resolver(id: string, resolvidoPor: string) {
    // Buscar feedback atual
    const feedback = await this.buscarPorId(id)

    if (!feedback) {
      throw new Error('Feedback nao encontrado')
    }

    if (feedback.status === 'resolvido') {
      throw new Error('Feedback ja esta resolvido')
    }

    // Atualizar status
    const { error: updateError } = await supabaseAdmin
      .from('feedbacks')
      .update({
        status: 'resolvido',
        resolvido_em: new Date().toISOString(),
        resolvido_por: resolvidoPor,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      logger.error('Erro ao resolver feedback:', updateError)
      throw new Error('Erro ao resolver feedback')
    }

    // Criar notificacao para o usuario original
    const descricaoResumida = feedback.descricao.length > 50
      ? feedback.descricao.substring(0, 47) + '...'
      : feedback.descricao

    await notificacoesService.criar({
      usuario_id: feedback.usuario_id,
      tipo: 'feedback_resolvido',
      titulo: 'Seu feedback foi resolvido',
      mensagem: descricaoResumida,
      referencia_tipo: 'feedback',
      referencia_id: id,
    })

    // Registrar no audit_log
    await supabaseAdmin.from('audit_log').insert({
      usuario_id: resolvidoPor,
      organizacao_id: feedback.organizacao_id,
      acao: 'resolver_feedback',
      entidade: 'feedbacks',
      entidade_id: id,
      dados_anteriores: { status: 'aberto' },
      dados_novos: { status: 'resolvido' },
    })

    logger.info(`Feedback ${id} resolvido por ${resolvidoPor}`)

    return {
      id,
      status: 'resolvido',
      resolvido_em: new Date().toISOString(),
      resolvido_por: resolvidoPor,
    }
  }
}

export const feedbacksService = new FeedbacksService()
export default feedbacksService
