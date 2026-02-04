/**
 * AIDEV-NOTE: Service de Notas de Contato (PRD-09)
 *
 * Notas privadas vinculadas a contatos
 * Podem estar associadas a uma conversa especifica
 */

import { supabaseAdmin as supabase } from '../config/supabase'
import type { UserRole } from '../schemas/common'
import type {
  NotaContato,
  NotaContatoComAutor,
  ListarNotasContatoQuery,
  ListarNotasContatoResponse,
  CriarNotaContato,
  AtualizarNotaContato,
} from '../schemas/notas-contato'

class NotasContatoService {
  // =====================================================
  // Listagem
  // =====================================================

  /**
   * Lista notas de um contato
   */
  async listar(
    contatoId: string,
    organizacaoId: string,
    usuarioId: string,
    role: UserRole,
    filtros: ListarNotasContatoQuery
  ): Promise<ListarNotasContatoResponse> {
    const { page, limit } = filtros
    const offset = (page - 1) * limit

    let query = supabase
      .from('notas_contato')
      .select(
        `
        *,
        autor:usuarios!usuario_id (
          id,
          nome,
          email
        )
      `,
        { count: 'exact' }
      )
      .eq('contato_id', contatoId)
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)

    // Member so ve suas proprias notas
    if (role === 'member') {
      query = query.eq('usuario_id', usuarioId)
    }

    // Ordenacao e paginacao
    query = query
      .order('criado_em', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Erro ao listar notas: ${error.message}`)
    }

    return {
      notas: (data || []) as NotaContatoComAutor[],
      total: count || 0,
      page,
      limit,
    }
  }

  /**
   * Busca nota por ID
   */
  async buscarPorId(
    id: string,
    organizacaoId: string,
    usuarioId: string,
    role: UserRole
  ): Promise<NotaContatoComAutor | null> {
    let query = supabase
      .from('notas_contato')
      .select(
        `
        *,
        autor:usuarios!usuario_id (
          id,
          nome,
          email
        )
      `
      )
      .eq('id', id)
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)

    // Member so ve suas proprias notas
    if (role === 'member') {
      query = query.eq('usuario_id', usuarioId)
    }

    const { data, error } = await query.single()

    if (error) {
      return null
    }

    return data as NotaContatoComAutor
  }

  // =====================================================
  // CRUD
  // =====================================================

  /**
   * Cria nova nota
   */
  async criar(
    organizacaoId: string,
    contatoId: string,
    usuarioId: string,
    dados: CriarNotaContato
  ): Promise<NotaContato> {
    // Verifica se o contato existe e pertence ao tenant
    const { data: contato, error: contatoError } = await supabase
      .from('contatos')
      .select('id')
      .eq('id', contatoId)
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)
      .single()

    if (contatoError || !contato) {
      throw new Error('Contato nao encontrado')
    }

    // Se tiver conversa_id, verifica se existe
    if (dados.conversa_id) {
      const { data: conversa, error: conversaError } = await supabase
        .from('conversas')
        .select('id')
        .eq('id', dados.conversa_id)
        .eq('organizacao_id', organizacaoId)
        .is('deletado_em', null)
        .single()

      if (conversaError || !conversa) {
        throw new Error('Conversa nao encontrada')
      }
    }

    const { data, error } = await supabase
      .from('notas_contato')
      .insert({
        organizacao_id: organizacaoId,
        contato_id: contatoId,
        usuario_id: usuarioId,
        conteudo: dados.conteudo,
        conversa_id: dados.conversa_id,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar nota: ${error.message}`)
    }

    return data as NotaContato
  }

  /**
   * Atualiza nota
   */
  async atualizar(
    id: string,
    organizacaoId: string,
    usuarioId: string,
    role: UserRole,
    dados: AtualizarNotaContato
  ): Promise<NotaContato> {
    // Verifica se existe e tem permissao
    const existente = await this.buscarPorId(id, organizacaoId, usuarioId, role)

    if (!existente) {
      throw new Error('Nota nao encontrada ou sem permissao')
    }

    // Somente o autor pode editar a nota
    if (existente.usuario_id !== usuarioId) {
      throw new Error('Somente o autor pode editar esta nota')
    }

    const { data, error } = await supabase
      .from('notas_contato')
      .update({
        conteudo: dados.conteudo,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar nota: ${error.message}`)
    }

    return data as NotaContato
  }

  /**
   * Exclui nota (soft delete)
   */
  async excluir(
    id: string,
    organizacaoId: string,
    usuarioId: string,
    role: UserRole
  ): Promise<void> {
    // Verifica se existe e tem permissao
    const existente = await this.buscarPorId(id, organizacaoId, usuarioId, role)

    if (!existente) {
      throw new Error('Nota nao encontrada ou sem permissao')
    }

    // Somente o autor ou admin pode excluir
    if (role !== 'admin' && existente.usuario_id !== usuarioId) {
      throw new Error('Sem permissao para excluir esta nota')
    }

    const { error } = await supabase
      .from('notas_contato')
      .update({ deletado_em: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao excluir nota: ${error.message}`)
    }
  }
}

export default new NotasContatoService()
