/**
 * AIDEV-NOTE: Service de Notificacoes (PRD-15)
 *
 * Sistema generico de notificacoes - reutilizavel por outros modulos
 *
 * Responsabilidades:
 * - Listar notificacoes do usuario (paginado)
 * - Contar nao lidas
 * - Marcar como lida
 * - Marcar todas como lidas
 * - Criar notificacao (interno, via service role)
 *
 * O Supabase Realtime esta habilitado na tabela notificacoes
 * para que o frontend receba novos eventos em tempo real
 */

import { supabaseAdmin } from '../config/supabase.js'
import { logger } from '../utils/logger.js'
import type { CriarNotificacao } from '../schemas/notificacoes.js'

class NotificacoesService {
  /**
   * Listar notificacoes do usuario (mais recentes primeiro)
   */
  async listar(usuarioId: string, limit: number = 10) {
    const { data, error, count } = await supabaseAdmin
      .from('notificacoes')
      .select('*', { count: 'exact' })
      .eq('usuario_id', usuarioId)
      .order('criado_em', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('Erro ao listar notificacoes:', error)
      throw new Error('Erro ao listar notificacoes')
    }

    return {
      notificacoes: data || [],
      total: count || 0,
    }
  }

  /**
   * Contar notificacoes nao lidas
   */
  async contarNaoLidas(usuarioId: string): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('notificacoes')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', usuarioId)
      .eq('lida', false)

    if (error) {
      logger.error('Erro ao contar notificacoes:', error)
      throw new Error('Erro ao contar notificacoes')
    }

    return count || 0
  }

  /**
   * Marcar notificacao como lida
   */
  async marcarComoLida(id: string, usuarioId: string) {
    const { error } = await supabaseAdmin
      .from('notificacoes')
      .update({
        lida: true,
        lida_em: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('usuario_id', usuarioId)

    if (error) {
      logger.error('Erro ao marcar notificacao como lida:', error)
      throw new Error('Erro ao marcar notificacao como lida')
    }

    return { success: true }
  }

  /**
   * Marcar todas as notificacoes como lidas
   */
  async marcarTodasComoLidas(usuarioId: string) {
    const { error } = await supabaseAdmin
      .from('notificacoes')
      .update({
        lida: true,
        lida_em: new Date().toISOString(),
      })
      .eq('usuario_id', usuarioId)
      .eq('lida', false)

    if (error) {
      logger.error('Erro ao marcar todas notificacoes como lidas:', error)
      throw new Error('Erro ao marcar notificacoes como lidas')
    }

    return { success: true }
  }

  /**
   * Criar notificacao (uso interno - service role)
   * Usado por outros services para notificar usuarios
   */
  async criar(dados: CriarNotificacao) {
    const { data, error } = await supabaseAdmin
      .from('notificacoes')
      .insert({
        usuario_id: dados.usuario_id,
        tipo: dados.tipo,
        titulo: dados.titulo,
        mensagem: dados.mensagem || null,
        link: dados.link || null,
        referencia_tipo: dados.referencia_tipo || null,
        referencia_id: dados.referencia_id || null,
        lida: false,
      })
      .select('id, tipo, titulo, criado_em')
      .single()

    if (error) {
      logger.error('Erro ao criar notificacao:', error)
      throw new Error('Erro ao criar notificacao')
    }

    logger.info(`Notificacao criada: ${data.id} para usuario ${dados.usuario_id}`)
    return data
  }
}

export const notificacoesService = new NotificacoesService()
export default notificacoesService
