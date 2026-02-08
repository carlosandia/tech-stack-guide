/**
 * AIDEV-NOTE: API Supabase para Feedbacks (PRD-15)
 * Acesso direto ao Supabase via RLS - sem backend Express
 */

import { supabase } from '@/lib/supabase'

export type TipoFeedback = 'bug' | 'sugestao' | 'duvida'
export type StatusFeedback = 'aberto' | 'resolvido'

export interface Feedback {
  id: string
  organizacao_id: string
  usuario_id: string
  tipo: TipoFeedback
  descricao: string
  status: StatusFeedback
  resolvido_em: string | null
  resolvido_por: string | null
  criado_em: string
  atualizado_em: string
  deletado_em: string | null
}

export interface FeedbackComDetalhes extends Feedback {
  organizacao: { id: string; nome: string }
  usuario: { id: string; nome: string; email: string; role: string }
  resolvido_por_usuario: { id: string; nome: string } | null
}

export interface ListarFeedbacksFiltros {
  empresa_id?: string
  tipo?: TipoFeedback
  status?: StatusFeedback
  busca?: string
  page: number
  limit: number
}

export interface ListarFeedbacksResponse {
  feedbacks: FeedbackComDetalhes[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export const feedbackApi = {
  /**
   * Criar feedback (Admin/Member)
   */
  async criar(dados: {
    organizacao_id: string
    usuario_id: string
    tipo: TipoFeedback
    descricao: string
  }) {
    const { data, error } = await supabase
      .from('feedbacks')
      .insert({
        organizacao_id: dados.organizacao_id,
        usuario_id: dados.usuario_id,
        tipo: dados.tipo,
        descricao: dados.descricao,
        status: 'aberto',
      })
      .select('id, tipo, descricao, status, criado_em')
      .single()

    if (error) throw error
    return data
  },

  /**
   * Listar feedbacks com joins (Super Admin)
   */
  async listarAdmin(filtros: ListarFeedbacksFiltros): Promise<ListarFeedbacksResponse> {
    const { empresa_id, tipo, status, busca, page, limit } = filtros
    const offset = (page - 1) * limit

    let query = supabase
      .from('feedbacks')
      .select(`
        *,
        organizacao:organizacoes_saas!feedbacks_organizacao_id_fkey(id, nome),
        usuario:usuarios!feedbacks_usuario_id_fkey(id, nome, email, role),
        resolvido_por_usuario:usuarios!feedbacks_resolvido_por_fkey(id, nome)
      `, { count: 'exact' })
      .is('deletado_em', null)
      .order('criado_em', { ascending: false })

    if (empresa_id) query = query.eq('organizacao_id', empresa_id)
    if (tipo) query = query.eq('tipo', tipo)
    if (status) query = query.eq('status', status)
    if (busca) query = query.ilike('descricao', `%${busca}%`)

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    const total = count || 0
    return {
      feedbacks: (data || []) as unknown as FeedbackComDetalhes[],
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    }
  },

  /**
   * Resolver feedback (Super Admin)
   * 1. Update status
   * 2. Criar notificacao para o usuario original
   */
  async resolver(feedbackId: string, resolvidoPor: string) {
    // Buscar feedback para obter usuario_id e descricao
    const { data: feedback, error: fetchError } = await supabase
      .from('feedbacks')
      .select('usuario_id, descricao, status')
      .eq('id', feedbackId)
      .single()

    if (fetchError) throw fetchError
    if (!feedback) throw new Error('Feedback não encontrado')
    if (feedback.status === 'resolvido') throw new Error('Feedback já está resolvido')

    // Update status
    const { error: updateError } = await supabase
      .from('feedbacks')
      .update({
        status: 'resolvido',
        resolvido_em: new Date().toISOString(),
        resolvido_por: resolvidoPor,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', feedbackId)

    if (updateError) throw updateError

    // Criar notificacao para o usuario original
    const descResumida = feedback.descricao.length > 50
      ? feedback.descricao.substring(0, 47) + '...'
      : feedback.descricao

    await supabase.from('notificacoes').insert({
      usuario_id: feedback.usuario_id,
      tipo: 'feedback_resolvido',
      titulo: 'Seu feedback foi resolvido',
      mensagem: descResumida,
      referencia_tipo: 'feedback',
      referencia_id: feedbackId,
    })

    return { id: feedbackId, status: 'resolvido' as const }
  },
}
