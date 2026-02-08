/**
 * AIDEV-NOTE: API Supabase para Notificacoes (PRD-15)
 * Acesso direto via RLS (usuario_id = auth.uid())
 */

import { supabase } from '@/lib/supabase'

export interface Notificacao {
  id: string
  usuario_id: string
  tipo: string
  titulo: string
  mensagem: string | null
  link: string | null
  referencia_tipo: string | null
  referencia_id: string | null
  lida: boolean
  lida_em: string | null
  criado_em: string
}

export const notificacoesApi = {
  /**
   * Listar notificacoes do usuario logado
   */
  async listar(usuarioId: string, limit = 5): Promise<Notificacao[]> {
    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('criado_em', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data || []) as Notificacao[]
  },

  /**
   * Contar notificacoes nao lidas
   */
  async contarNaoLidas(usuarioId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notificacoes')
      .select('id', { count: 'exact', head: true })
      .eq('usuario_id', usuarioId)
      .eq('lida', false)

    if (error) throw error
    return count || 0
  },

  /**
   * Marcar notificacao como lida
   */
  async marcarComoLida(notificacaoId: string) {
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true, lida_em: new Date().toISOString() })
      .eq('id', notificacaoId)

    if (error) throw error
  },

  /**
   * Marcar todas como lidas
   */
  async marcarTodasComoLidas(usuarioId: string) {
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true, lida_em: new Date().toISOString() })
      .eq('usuario_id', usuarioId)
      .eq('lida', false)

    if (error) throw error
  },
}
